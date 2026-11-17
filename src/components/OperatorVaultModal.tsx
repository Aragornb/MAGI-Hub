import React, { useState, useEffect } from 'react';
import {
  Shield,
  Key,
  Lock,
  CheckCircle,
  X,
  Eye,
  EyeOff,
  User,
  RotateCcw,
  ExternalLink,
  Zap,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { OperatorCredentials, MagiNodeId } from '../types/nerv';
import { playKeySound, playExecuteSound, playWarningSound } from '../utils/audio';

interface OperatorVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: OperatorCredentials;
  onSaveCredentials: (creds: OperatorCredentials) => void;
  serverKeysStatus: {
    gemini: boolean;
    chatgpt: boolean;
    claude: boolean;
    grok?: boolean;
    deepseek?: boolean;
  };
}

interface KeyTestState {
  testing: boolean;
  result?: {
    ok: boolean;
    message: string;
    modelChecked?: string;
  };
}

export const OperatorVaultModal: React.FC<OperatorVaultModalProps> = ({
  isOpen,
  onClose,
  credentials,
  onSaveCredentials,
  serverKeysStatus,
}) => {
  const [openaiKey, setOpenaiKey] = useState(credentials.openaiKey || '');
  const [anthropicKey, setAnthropicKey] = useState(credentials.anthropicKey || '');
  const [geminiKey, setGeminiKey] = useState(credentials.geminiKey || '');
  const [grokKey, setGrokKey] = useState(credentials.grokKey || '');
  const [deepseekKey, setDeepseekKey] = useState(credentials.deepseekKey || '');
  const [showKeys, setShowKeys] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Individual verification states
  const [testStates, setTestStates] = useState<Record<MagiNodeId, KeyTestState>>({
    chatgpt: { testing: false },
    claude: { testing: false },
    gemini: { testing: false },
    grok: { testing: false },
    deepseek: { testing: false },
  });

  useEffect(() => {
    setOpenaiKey(credentials.openaiKey || '');
    setAnthropicKey(credentials.anthropicKey || '');
    setGeminiKey(credentials.geminiKey || '');
    setGrokKey(credentials.grokKey || '');
    setDeepseekKey(credentials.deepseekKey || '');
  }, [credentials, isOpen]);

  if (!isOpen) return null;

  const handleTestKey = async (provider: MagiNodeId, apiKey: string) => {
    if (!apiKey.trim()) {
      playWarningSound();
      setTestStates((prev) => ({
        ...prev,
        [provider]: {
          testing: false,
          result: { ok: false, message: 'Insira uma chave antes de validar.' },
        },
      }));
      return;
    }

    playKeySound();
    setTestStates((prev) => ({
      ...prev,
      [provider]: { testing: true },
    }));

    try {
      const res = await fetch('/api/vault/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      setTestStates((prev) => ({
        ...prev,
        [provider]: { testing: false, result: data },
      }));

      if (data.ok) {
        playExecuteSound();
      } else {
        playWarningSound();
      }
    } catch {
      setTestStates((prev) => ({
        ...prev,
        [provider]: {
          testing: false,
          result: { ok: false, message: 'Erro ao conectar ao endpoint de validação.' },
        },
      }));
      playWarningSound();
    }
  };

  const handleClearAllKeys = () => {
    playKeySound();
    setOpenaiKey('');
    setAnthropicKey('');
    setGeminiKey('');
    setGrokKey('');
    setDeepseekKey('');
    setTestStates({
      chatgpt: { testing: false },
      claude: { testing: false },
      gemini: { testing: false },
      grok: { testing: false },
      deepseek: { testing: false },
    });
    onSaveCredentials({
      ...credentials,
      openaiKey: '',
      anthropicKey: '',
      geminiKey: '',
      grokKey: '',
      deepseekKey: '',
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    playExecuteSound();
    onSaveCredentials({
      ...credentials,
      openaiKey: openaiKey.trim(),
      anthropicKey: anthropicKey.trim(),
      geminiKey: geminiKey.trim(),
      grokKey: grokKey.trim(),
      deepseekKey: deepseekKey.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const nodeConfigs: {
    id: MagiNodeId;
    unitName: string;
    label: string;
    color: string;
    value: string;
    setValue: (val: string) => void;
    placeholder: string;
    linkUrl: string;
    serverHasKey: boolean;
  }[] = [
    {
      id: 'gemini',
      unitName: 'UNIT-02',
      label: 'GOOGLE GEMINI API (RECOMENDADO / GRÁTIS)',
      color: '#00ff66',
      value: geminiKey,
      setValue: setGeminiKey,
      placeholder: 'Chave do Google AI Studio (AIzaSy...)',
      linkUrl: 'https://aistudio.google.com/app/apikey',
      serverHasKey: serverKeysStatus.gemini,
    },
    {
      id: 'chatgpt',
      unitName: 'UNIT-00',
      label: 'OPENAI API (CHATGPT - GPT-4o)',
      color: '#ff7a00',
      value: openaiKey,
      setValue: setOpenaiKey,
      placeholder: 'sk-proj-...',
      linkUrl: 'https://platform.openai.com/api-keys',
      serverHasKey: serverKeysStatus.chatgpt,
    },
    {
      id: 'claude',
      unitName: 'UNIT-01',
      label: 'ANTHROPIC API (CLAUDE 3.5 SONNET)',
      color: '#e08545',
      value: anthropicKey,
      setValue: setAnthropicKey,
      placeholder: 'sk-ant-...',
      linkUrl: 'https://console.anthropic.com/settings/keys',
      serverHasKey: serverKeysStatus.claude,
    },
    {
      id: 'grok',
      unitName: 'UNIT-03',
      label: 'XAI API (GROK-2)',
      color: '#ff3366',
      value: grokKey,
      setValue: setGrokKey,
      placeholder: 'xai-...',
      linkUrl: 'https://console.x.ai',
      serverHasKey: Boolean(serverKeysStatus.grok),
    },
    {
      id: 'deepseek',
      unitName: 'UNIT-04',
      label: 'DEEPSEEK API (DEEPSEEK-V3 / REASONER)',
      color: '#00f0ff',
      value: deepseekKey,
      setValue: setDeepseekKey,
      placeholder: 'sk-...',
      linkUrl: 'https://platform.deepseek.com/api_keys',
      serverHasKey: Boolean(serverKeysStatus.deepseek),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xs select-none">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#0d0a07] border-2 border-[#ff7a00] shadow-[0_0_40px_rgba(255,122,0,0.3)] font-mono flex flex-col scrollbar-thin">
        {/* Top Hazard Warning Stripe */}
        <div className="h-2 hazard-stripes w-full border-b border-black shrink-0" />

        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#2d1f14] bg-[#140e08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-[#ff7a00]" />
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-[#ffca8a] tracking-wider">
                COFRE DE CHAVES DE API // PROTOCOLO BYOK (BRING YOUR OWN KEY)
              </h2>
              <p className="text-[9px] sm:text-[10px] text-[#7a5a3a]">
                NERV PROTOCOL A-17 // CRIPTOGRAFIA LOCAL CLIENT-SIDE & ZERO-KNOWLEDGE PROXY
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#8a6845] hover:text-[#ff2233] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4">
          {/* Zero-Knowledge Security Notice */}
          <div className="p-3 border border-[#00ff66]/40 bg-[#00ff66]/5 rounded text-[11px] text-[#a0dfb5] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#00ff66]">
              <ShieldCheck className="w-4 h-4" />
              <span>GARANTIA DE SEGURANÇA E PRIVACIDADE ZERO-KNOWLEDGE</span>
            </div>
            <p className="leading-relaxed">
              Suas chaves de API são armazenadas com <strong>criptografia Web Crypto AES-GCM (256-bit)</strong>{' '}
              exclusivamente no seu navegador. Nenhuma chave é persistida de forma permanente em banco de dados
              central, mitigando riscos de vazamento.
            </p>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[10px] text-[#7a5a3a] uppercase font-bold">
              Configuração e Validação por Provedor:
            </span>
            <button
              type="button"
              onClick={() => setShowKeys(!showKeys)}
              className="text-[11px] text-[#ff7a00] hover:underline flex items-center gap-1 cursor-pointer"
            >
              {showKeys ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{showKeys ? 'Ocultar Chaves' : 'Mostrar Chaves'}</span>
            </button>
          </div>

          {/* Node Keys List with Real-time Ping */}
          <div className="space-y-3.5">
            {nodeConfigs.map((node) => {
              const testState = testStates[node.id];
              const isOperant = Boolean(node.value || node.serverHasKey);

              return (
                <div
                  key={node.id}
                  className="p-3 border border-[#2d1e12] bg-[#070503] rounded space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-1.5 py-0.5 text-[9px] font-bold rounded"
                        style={{
                          backgroundColor: `${node.color}20`,
                          color: node.color,
                          border: `1px solid ${node.color}60`,
                        }}
                      >
                        {node.unitName}
                      </span>
                      <label className="font-bold text-[#ffca8a] text-[11px]">{node.label}</label>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={node.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[9px] text-[#8a6a4a] hover:text-[#ffca8a] flex items-center gap-0.5 transition-colors underline"
                      >
                        <span>OBTER CHAVE</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 border ${
                          isOperant
                            ? 'border-[#4dff9a] text-[#4dff9a] bg-[#4dff9a]/10'
                            : 'border-[#ff2233] text-[#ff2233] bg-[#ff2233]/10'
                        }`}
                      >
                        {isOperant ? 'CONECTADO' : 'AUSENTE'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type={showKeys ? 'text' : 'password'}
                      value={node.value}
                      onChange={(e) => node.setValue(e.target.value)}
                      placeholder={node.placeholder}
                      className="flex-1 p-2 bg-[#020202] border border-[#3a2515] focus:border-[#ff7a00] text-white text-xs outline-none font-mono rounded"
                    />
                    <button
                      type="button"
                      onClick={() => handleTestKey(node.id, node.value)}
                      disabled={testState.testing || !node.value.trim()}
                      className="px-3 py-1.5 bg-[#ff7a00]/20 border border-[#ff7a00] text-[#ffca8a] hover:bg-[#ff7a00] hover:text-black font-bold text-[10px] disabled:opacity-30 disabled:pointer-events-none transition-colors rounded flex items-center gap-1"
                    >
                      {testState.testing ? (
                        <>
                          <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span>TESTANDO</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3 h-3" />
                          <span>TESTAR</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Verification result snippet */}
                  {testState.result && (
                    <div
                      className={`text-[10px] p-2 border rounded flex items-start gap-1.5 ${
                        testState.result.ok
                          ? 'border-[#00ff66]/50 bg-[#00ff66]/10 text-[#00ff66]'
                          : 'border-[#ff3333]/50 bg-[#ff3333]/10 text-[#ff6666]'
                      }`}
                    >
                      {testState.result.ok ? (
                        <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold">{testState.result.message}</span>
                        {testState.result.modelChecked && (
                          <span className="block opacity-75">
                            Modelo: {testState.result.modelChecked}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Success Banner */}
          {savedSuccess && (
            <div className="p-3 bg-[#4dff9a]/10 border border-[#4dff9a] text-[#4dff9a] text-xs flex items-center gap-2 rounded">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>
                CREDENCIAIS CIFRADAS LOCALMENTE COM SUCESSO // AMBIENTE DE EXECUÇÃO ATUALIZADO.
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 border-t border-[#2d1f14] flex flex-col sm:flex-row justify-between items-center gap-3">
            <button
              type="button"
              onClick={handleClearAllKeys}
              className="text-xs text-[#ff3333] hover:text-[#ff6666] flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>REMOVER TODAS AS CHAVES</span>
            </button>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 border border-[#3a2515] text-[#8a6845] hover:text-[#ffca8a] text-xs cursor-pointer rounded"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-5 py-2 bg-[#ff7a00] hover:bg-[#ff9433] text-black font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(255,122,0,0.4)] rounded"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>SALVAR E SINCRONIZAR</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
