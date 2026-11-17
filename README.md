# MAGI-Hub // NERV Tactical AI & Autonomous Agent Console

Plataforma local-first de orquestração multi-IA (ChatGPT, Claude, Gemini, Grok e DeepSeek) com **Agentes Autônomos inspirados no OpenClaw**, governança **LGPD**, trilha de auditoria e conformidade de acessibilidade **WCAG 2.2 (AA)**.

## Recursos Principais

- **Matriz Multi-IA MAGI (UNIT-00 a UNIT-04):** Disparo conjunto, consenso e workflows táticos (`/mtask`, `/otask`, `/pipe`).
- **OpenClaw-Inspired Autonomous Agents (`autonomous_agents.py`):**
  - **Gateway Background Scheduler:** Execução orientada a eventos com **Heartbeats**, **Crons** (`@every 30m`, `HH:MM`), **Webhooks** (`/api/agents/<id>/webhook`) e execução manual.
  - **Memória Local-First (`MEMORY.md`):** Cada agente mantém sua memória estruturada em Markdown no disco local.
  - **Model-Agnostic:** Escolha qualquer unidade MAGI para conduzir o raciocínio do agente.
  - **Sandbox de Ferramentas:** Permissões granulares (`read_vault`, `write_vault`, `update_memory`, `magi_consensus`, `web_fetch` com proteção anti-SSRF e anti-path-traversal).
- **Segurança, LGPD & Due Diligence (`security_lgpd.py`):**
  - Anonimização e mascaramento automático de credenciais/PII nos logs.
  - Criptografia em repouso (Fernet/AES+HMAC) para segredos locais.
  - Gestão de termo de consentimento LGPD (`/api/lgpd/consent`) e Trilha de Auditoria em JSONL (`/api/audit/logs`).
  - Script de seeding puramente sintético (`scripts/seed_synthetic_data.py`).
- **Acessibilidade WCAG 2.2 (AA) & Licenciamento:**
  - `lang="pt-BR"`, foco visível por teclado (`:focus-visible`), contraste >= 4.5:1, alvos de toque mínimos (`24x24px`), `aria-label` e modal de **Créditos Open-Source & Disclaimers**.

## Execução Local

```bash
# 1. Frontend
npm install
npm run build
npm run lint
npm run check:licenses

# 2. Backend Python
pip install -r requirements.txt
python server.py
```

## Licença

Distribuído sob a licença **Apache License 2.0** (`LICENSE`).
