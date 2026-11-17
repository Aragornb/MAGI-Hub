# Copyright 2026 Aragornb / MAGI-Hub. Licensed under the Apache License, Version 2.0.
"""Script de Seeding de Dados Sintéticos (LGPD / Due Diligence).
Popula o ambiente de desenvolvimento/protótipo com agentes autônomos e registros
puramente sintéticos, sem qualquer dado pessoal real ou conexão a bancos de produção.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from autonomous_agents import agent_gateway
from security_lgpd import save_lgpd_consent


SYNTHETIC_AGENTS = [
    {
        "name": "Sentinel-Vault-Monitor",
        "role": "Monitoramento de Cofre Local (Sintético)",
        "objective": "Inspecionar arquivos do cofre local e gerar resumo diário em Markdown no MEMORY.md.",
        "modelNode": "gemini",
        "triggerType": "heartbeat",
        "heartbeatIntervalSec": 600,
        "allowedTools": ["read_vault", "write_vault", "update_memory"],
        "maxSteps": 3,
        "enabled": False,
    },
    {
        "name": "MAGI-Daily-Briefing",
        "role": "Sintetizador Multi-IA (Sintético)",
        "objective": "Consultar o consenso das unidades MAGI sobre prioridades técnicas e registrar relatório.",
        "modelNode": "claude",
        "triggerType": "cron",
        "cronSchedule": "@every 60m",
        "allowedTools": ["magi_consensus", "write_vault", "update_memory"],
        "maxSteps": 3,
        "enabled": False,
    },
]


def main() -> None:
    existing_names = {a["name"] for a in agent_gateway.list_agents()}
    created = 0
    for item in SYNTHETIC_AGENTS:
        if item["name"] not in existing_names:
            agent_gateway.create_agent(item)
            created += 1
    save_lgpd_consent(
        accepted=True,
        purposes=["ai_orchestration", "local_vault_storage", "autonomous_agents_execution", "audit_logging"],
        actor_ip="127.0.0.1-synthetic-seed",
    )
    print(f"[SEED SINTÉTICO] {created} agentes sintéticos criados. Consentimento de protótipo registrado.")


if __name__ == "__main__":
    main()
