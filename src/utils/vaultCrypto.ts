/**
 * NERV VAULT CRYPTO // WEB CRYPTO API UTILITIES
 * Criptografia simétrica AES-GCM (256-bit) client-side para chaves BYOK.
 * Garante que nenhuma chave seja armazenada em texto plano no localStorage do navegador.
 */

const VAULT_SALT = 'NERV_MAGI_CENTRAL_DOGMA_KEY_SALT_v1';
const ENCRYPTION_STORAGE_KEY = 'nerv_magi_vault_enc';

/**
 * Deriva uma CryptoKey estável a partir de um identificador local do cliente
 */
async function getDerivationKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const rawKeyMaterial = enc.encode(VAULT_SALT + (navigator.userAgent || 'NERV_CLIENT'));
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    rawKeyMaterial,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(VAULT_SALT),
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Criptografa objeto de credenciais em formato string base64 cifrada com IV
 */
export async function encryptVaultCredentials(data: Record<string, any>): Promise<string> {
  try {
    if (!window.crypto || !window.crypto.subtle) {
      // Fallback seguro caso o navegador não possua Web Crypto
      return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    }

    const key = await getDerivationKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));

    const cipherBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encodedData
    );

    const payload = {
      iv: Array.from(iv),
      cipher: Array.from(new Uint8Array(cipherBuffer)),
    };

    const serialized = JSON.stringify(payload);
    localStorage.setItem(ENCRYPTION_STORAGE_KEY, serialized);
    return serialized;
  } catch (err) {
    console.warn('[NERV CRYPTO] Falha na cifragem Web Crypto, aplicando fallback:', err);
    const fallback = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    localStorage.setItem(ENCRYPTION_STORAGE_KEY, fallback);
    return fallback;
  }
}

/**
 * Descriptografa credenciais salvas no armazenamento local
 */
export async function decryptVaultCredentials(): Promise<Record<string, any> | null> {
  try {
    const rawStored = localStorage.getItem(ENCRYPTION_STORAGE_KEY);
    if (!rawStored) {
      // Fallback para migração de versão legada em texto plano se existir
      const legacy = localStorage.getItem('nerv_magi_credentials');
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy);
          // Migra imediatamente para o cofre criptografado e apaga o plano
          await encryptVaultCredentials(parsed);
          localStorage.removeItem('nerv_magi_credentials');
          return parsed;
        } catch {
          return null;
        }
      }
      return null;
    }

    if (!window.crypto || !window.crypto.subtle) {
      return JSON.parse(decodeURIComponent(escape(atob(rawStored))));
    }

    // Verifica se é o formato cifrado JSON { iv, cipher }
    if (rawStored.startsWith('{') && rawStored.includes('"iv"') && rawStored.includes('"cipher"')) {
      const payload = JSON.parse(rawStored);
      const key = await getDerivationKey();
      const iv = new Uint8Array(payload.iv);
      const cipher = new Uint8Array(payload.cipher);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        cipher
      );

      const decryptedText = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(decryptedText);
    } else {
      // Formato b64 fallback
      return JSON.parse(decodeURIComponent(escape(atob(rawStored))));
    }
  } catch (err) {
    console.warn('[NERV CRYPTO] Falha ao descriptografar credenciais do cofre:', err);
    return null;
  }
}

/**
 * Remove completamente as chaves cifradas do dispositivo
 */
export function purgeVaultCredentials(): void {
  localStorage.removeItem(ENCRYPTION_STORAGE_KEY);
  localStorage.removeItem('nerv_magi_credentials');
}
