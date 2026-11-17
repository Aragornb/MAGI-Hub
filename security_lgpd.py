# Copyright 2026 Aragornb / MAGI-Hub. Licensed under the Apache License, Version 2.0.
"""NERV CENTRAL DOGMA // SEGURANÇA, LGPD & TRILHA DE AUDITORIA (DUE DILIGENCE)
Módulo responsável por:
- Mapeamento e anonimização de dados sensíveis (PII, chaves de API, cartões, registros clínicos/internos)
- Criptografia em repouso (AES-128-CBC/HMAC via Fernet) para dados sensíveis locais
- Gestão de termos de consentimento LGPD
- Middleware/rotina de Trilha de Auditoria (Audit Trail) em JSONL sem vazamento de credenciais
"""
import os
import re
import json
import time
import hmac
import hashlib
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from config import ARTIFACTS_DIR

logger = logging.getLogger("nerv.security")

try:
    from cryptography.fernet import Fernet
    HAS_CRYPTO = True
except ImportError:
    HAS_CRYPTO = False

AUDIT_LOG_PATH = ARTIFACTS_DIR / "audit_trail.jsonl"
CONSENT_FILE_PATH = ARTIFACTS_DIR / "lgpd_consent.json"
VAULT_KEY_PATH = ARTIFACTS_DIR / ".vault_master.key"

# Mapeamento explícito de campos sensíveis conforme diretrizes LGPD / Due Diligence
SENSITIVE_FIELD_NAMES = {
    "apikey", "api_key", "openaikey", "anthropickey", "geminikey", "grokkey", "deepseekkey",
    "customkey", "customkeys", "authorization", "token", "secret", "password", "senha",
    "webhooktoken", "cardnumber", "cvv", "cpf", "rg", "email", "phone", "telefone",
    "healthrecord", "therapyroutine", "patientname", "medicalnotes", "prontuario",
}

SENSITIVE_PATTERNS = [
    re.compile(r"sk-[A-Za-z0-9\-_]{16,}"),
    re.compile(r"AIza[0-9A-Za-z\-_]{20,}"),
    re.compile(r"xai-[A-Za-z0-9\-_]{16,}"),
    re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b"),  # CPF
    re.compile(r"\b(?:\d[ -]*?){13,16}\b"),        # Cartão de crédito
]


def _get_or_create_fernet() -> Optional[Any]:
    if not HAS_CRYPTO:
        return None
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    if VAULT_KEY_PATH.exists():
        key = VAULT_KEY_PATH.read_bytes().strip()
    else:
        key = Fernet.generate_key()
        VAULT_KEY_PATH.write_bytes(key)
        try:
            os.chmod(VAULT_KEY_PATH, 0o600)
        except OSError:
            pass
    return Fernet(key)


def encrypt_at_rest(plaintext: str) -> str:
    """Criptografa dados sensíveis em repouso usando Fernet (AES + HMAC)."""
    if not plaintext:
        return ""
    fernet = _get_or_create_fernet()
    if fernet is None:
        raise RuntimeError("Biblioteca cryptography indisponível para criptografia em repouso.")
    return fernet.encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt_at_rest(ciphertext: str) -> str:
    """Descriptografa dados armazenados em repouso."""
    if not ciphertext:
        return ""
    fernet = _get_or_create_fernet()
    if fernet is None:
        raise RuntimeError("Biblioteca cryptography indisponível para descriptografia.")
    return fernet.decrypt(ciphertext.encode("utf-8")).decode("utf-8")


def mask_string(value: str) -> str:
    """Anonimiza parcialmente strings sensíveis preservando apenas prefixo/sufixo seguros."""
    if not value:
        return ""
    clean = str(value).strip()
    if len(clean) <= 6:
        return "***REDACTED***"
    return f"{clean[:3]}***{clean[-2:]}"


def sanitize_text_pii(text: str) -> str:
    """Remove padrões de credenciais, CPF e números de cartão de textos livres."""
    if not text:
        return ""
    result = str(text)
    for pattern in SENSITIVE_PATTERNS:
        result = pattern.sub("[REDACTED_SENSITIVE]", result)
    return result


def redact_sensitive_dict(data: Any, depth: int = 0) -> Any:
    """Percorre estruturas JSON/dict mascarando atributos sensíveis mapeados na LGPD."""
    if depth > 6:
        return "[TRUNCATED]"
    if isinstance(data, dict):
        sanitized: Dict[str, Any] = {}
        for k, v in data.items():
            key_norm = str(k).lower().replace("-", "").replace("_", "")
            if key_norm in SENSITIVE_FIELD_NAMES or "key" in key_norm or "secret" in key_norm or "token" in key_norm:
                sanitized[k] = "[REDACTED]" if v else ""
            else:
                sanitized[k] = redact_sensitive_dict(v, depth + 1)
        return sanitized
    if isinstance(data, list):
        return [redact_sensitive_dict(item, depth + 1) for item in data[:20]]
    if isinstance(data, str):
        return sanitize_text_pii(data[:300])
    return data


def anonymize_ip(ip_addr: Optional[str]) -> str:
    """Anonimiza endereço IP via hash HMAC truncado (LGPD Art. 12)."""
    if not ip_addr:
        return "anon-local"
    digest = hmac.new(b"magi-hub-lgpd-salt", ip_addr.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"op-{digest[:12]}"


def log_audit_event(
    action: str,
    route: str,
    method: str,
    status_code: int,
    actor_ip: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> None:
    """Registra evento na Trilha de Auditoria (Audit Trail) em formato JSONL seguro."""
    try:
        ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
        entry = {
            "timestamp": int(time.time() * 1000),
            "isoTime": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "action": action,
            "route": route,
            "method": method,
            "statusCode": status_code,
            "actor": anonymize_ip(actor_ip),
            "details": redact_sensitive_dict(details or {}),
        }
        with open(AUDIT_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception as exc:
        logger.warning("Falha ao gravar trilha de auditoria: %s", exc)


def get_recent_audit_logs(limit: int = 50) -> List[Dict[str, Any]]:
    """Retorna os últimos eventos da trilha de auditoria."""
    if not AUDIT_LOG_PATH.exists():
        return []
    try:
        lines = AUDIT_LOG_PATH.read_text(encoding="utf-8").splitlines()
        entries = []
        for line in lines[-limit:]:
            if line.strip():
                entries.append(json.loads(line))
        entries.reverse()
        return entries
    except Exception as exc:
        logger.warning("Falha ao ler trilha de auditoria: %s", exc)
        return []


def get_lgpd_consent() -> Dict[str, Any]:
    """Lê o registro de consentimento LGPD do operador."""
    if not CONSENT_FILE_PATH.exists():
        return {
            "accepted": False,
            "consentVersion": "2026.1-LGPD",
            "acceptedAt": None,
            "purposes": [],
        }
    try:
        return json.loads(CONSENT_FILE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {
            "accepted": False,
            "consentVersion": "2026.1-LGPD",
            "acceptedAt": None,
            "purposes": [],
        }


def save_lgpd_consent(accepted: bool, purposes: List[str], actor_ip: Optional[str] = None) -> Dict[str, Any]:
    """Persiste o termo de aceite LGPD vinculado às finalidades de tratamento."""
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    record = {
        "accepted": bool(accepted),
        "consentVersion": "2026.1-LGPD",
        "acceptedAt": int(time.time() * 1000) if accepted else None,
        "purposes": purposes,
        "actorHash": anonymize_ip(actor_ip),
    }
    CONSENT_FILE_PATH.write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8")
    log_audit_event(
        action="LGPD_CONSENT_UPDATE",
        route="/api/lgpd/consent",
        method="POST",
        status_code=200,
        actor_ip=actor_ip,
        details={"accepted": accepted, "purposes": purposes},
    )
    return record
