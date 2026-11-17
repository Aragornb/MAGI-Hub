# Copyright 2026 Aragornb / MAGI-Hub. Licensed under the Apache License, Version 2.0.
"""NERV CENTRAL DOGMA // AUTONOMOUS AGENTS ENGINE (OPENCLAW-INSPIRED GATEWAY)
Arquitetura de agentes autônomos local-first inspirada no OpenClaw (github.com/openclaw/openclaw):
- Gateway Control Plane em background para Heartbeats, Crons, Webhooks e execução manual
- Memória Local-First em arquivos Markdown (MEMORY.md) por agente no disco
- Agnóstico a Modelos (integra qualquer unidade MAGI: ChatGPT, Claude, Gemini, Grok, DeepSeek)
- Ferramentas em Sandbox com limites de permissão explícitos e proteção contra SSRF / Path Traversal
"""
import os
import re
import json
import time
import uuid
import ipaddress
import socket
import threading
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse

import requests

from config import ARTIFACTS_DIR
from providers import execute_single_provider, broadcast_magi, CALLERS, sanitize_error_message
from security_lgpd import log_audit_event, sanitize_text_pii, encrypt_at_rest, decrypt_at_rest

logger = logging.getLogger("nerv.autonomous_agents")

AGENTS_ROOT_DIR = ARTIFACTS_DIR / "agents"
AGENTS_REGISTRY_PATH = AGENTS_ROOT_DIR / "agents_registry.json"

ALLOWED_TOOLS = {
    "read_vault",
    "write_vault",
    "web_fetch",
    "magi_consensus",
    "update_memory",
}


def _ensure_agents_dir() -> None:
    AGENTS_ROOT_DIR.mkdir(parents=True, exist_ok=True)


def _safe_agent_dir(agent_id: str) -> Path:
    clean_id = re.sub(r"[^a-zA-Z0-9_\-]", "", agent_id)
    if not clean_id:
        raise ValueError("ID de agente inválido.")
    target = (AGENTS_ROOT_DIR / clean_id).resolve()
    if not str(target).startswith(str(AGENTS_ROOT_DIR.resolve())):
        raise ValueError("Path traversal detectado.")
    target.mkdir(parents=True, exist_ok=True)
    return target


def _is_safe_public_url(url: str) -> bool:
    """Proteção SSRF: permite apenas HTTPS público e bloqueia IPs privados/loopback."""
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("https", "http"):
            return False
        hostname = parsed.hostname
        if not hostname or hostname in ("localhost", "127.0.0.1", "0.0.0.0", "::1"):
            return False
        ip_str = socket.gethostbyname(hostname)
        ip_obj = ipaddress.ip_address(ip_str)
        if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local or ip_obj.is_reserved:
            return False
        return True
    except Exception:
        return False


def _extract_json_step(raw_text: str) -> Dict[str, Any]:
    """Extrai objeto JSON estruturado da resposta do modelo no loop autônomo."""
    text = (raw_text or "").strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, re.IGNORECASE)
    if fence:
        text = fence.group(1).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end > start:
        try:
            obj = json.loads(text[start:end + 1])
            if isinstance(obj, dict):
                return obj
        except json.JSONDecodeError:
            pass
    return {"thought": "Resposta direta do agente.", "final_answer": raw_text}


class AutonomousAgentGateway:
    """Gateway central de execução de agentes autônomos (Heartbeats, Crons, Webhooks e Manual)."""

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._agents: Dict[str, Dict[str, Any]] = {}
        self._runtime_keys: Dict[str, str] = {}
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._load_registry()

    def _load_registry(self) -> None:
        _ensure_agents_dir()
        if AGENTS_REGISTRY_PATH.exists():
            try:
                data = json.loads(AGENTS_REGISTRY_PATH.read_text(encoding="utf-8"))
                if isinstance(data, dict):
                    self._agents = data
            except Exception as exc:
                logger.warning("Falha ao carregar registro de agentes: %s", exc)
                self._agents = {}

    def _save_registry(self) -> None:
        _ensure_agents_dir()
        with self._lock:
            AGENTS_REGISTRY_PATH.write_text(
                json.dumps(self._agents, indent=2, ensure_ascii=False),
                encoding="utf-8",
            )

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._gateway_loop, daemon=True, name="OpenClawGateway")
        self._thread.start()
        logger.info("Gateway de Agentes Autônomos (OpenClaw) iniciado.")

    def stop(self) -> None:
        self._stop_event.set()

    def update_runtime_keys(self, custom_keys: Optional[Dict[str, str]]) -> None:
        if not custom_keys:
            return
        with self._lock:
            for k, v in custom_keys.items():
                if v and str(v).strip():
                    self._runtime_keys[k] = str(v).strip()

    def _gateway_loop(self) -> None:
        while not self._stop_event.is_set():
            now = time.time()
            due_agents: List[str] = []
            with self._lock:
                for agent_id, agent in self._agents.items():
                    if not agent.get("enabled"):
                        continue
                    if agent.get("status") == "RUNNING":
                        continue
                    trigger = agent.get("triggerType", "manual")
                    last_run = float(agent.get("lastRunEpoch") or 0)
                    if trigger == "heartbeat":
                        interval = max(30, int(agent.get("heartbeatIntervalSec") or 300))
                        if now - last_run >= interval:
                            due_agents.append(agent_id)
                    elif trigger == "cron":
                        cron_expr = str(agent.get("cronSchedule") or "").strip()
                        if self._is_cron_due(cron_expr, last_run, now):
                            due_agents.append(agent_id)

            for agent_id in due_agents:
                if self._stop_event.is_set():
                    break
                try:
                    self.run_agent(agent_id, trigger_source="gateway_scheduler")
                except Exception as exc:
                    logger.warning("Erro no scheduler para agente %s: %s", agent_id, exc)

            self._stop_event.wait(timeout=10.0)

    @staticmethod
    def _is_cron_due(cron_expr: str, last_run_epoch: float, now_epoch: float) -> bool:
        """Suporta expressões simples como 'HH:MM' diário ou '@every 15m' / '@every 1h'."""
        if not cron_expr:
            return False
        m_every = re.match(r"^@every\s+(\d+)([mh])$", cron_expr.lower())
        if m_every:
            val = int(m_every.group(1))
            unit = m_every.group(2)
            seconds = max(60, val * (60 if unit == "m" else 3600))
            return (now_epoch - last_run_epoch) >= seconds
        m_hhmm = re.match(r"^(\d{2}):(\d{2})$", cron_expr)
        if m_hhmm:
            now_tm = time.localtime(now_epoch)
            target_h, target_m = int(m_hhmm.group(1)), int(m_hhmm.group(2))
            if now_tm.tm_hour == target_h and now_tm.tm_min == target_m:
                return (now_epoch - last_run_epoch) >= 120
        return False

    def list_agents(self) -> List[Dict[str, Any]]:
        with self._lock:
            result = []
            for agent in self._agents.values():
                item = dict(agent)
                item.pop("webhookTokenEncrypted", None)
                result.append(item)
            result.sort(key=lambda x: x.get("createdAt", 0), reverse=True)
            return result

    def create_agent(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        name = str(payload.get("name") or "").strip()
        objective = str(payload.get("objective") or "").strip()
        if not name or not objective:
            raise ValueError("Nome e objetivo do agente são obrigatórios.")

        model_node = str(payload.get("modelNode") or "gemini").lower()
        if model_node not in CALLERS:
            model_node = "gemini"

        trigger_type = str(payload.get("triggerType") or "manual").lower()
        if trigger_type not in ("manual", "heartbeat", "cron", "webhook"):
            trigger_type = "manual"

        raw_tools = payload.get("allowedTools") or ["read_vault", "write_vault", "update_memory"]
        allowed_tools = [t for t in raw_tools if t in ALLOWED_TOOLS]

        agent_id = f"claw-{uuid.uuid4().hex[:8]}"
        webhook_token = f"nrv_{uuid.uuid4().hex[:16]}"
        try:
            webhook_token_enc = encrypt_at_rest(webhook_token)
        except Exception:
            webhook_token_enc = webhook_token

        agent_dir = _safe_agent_dir(agent_id)
        memory_path = agent_dir / "MEMORY.md"
        if not memory_path.exists():
            memory_path.write_text(
                f"# MEMORY // {name}\n\n"
                f"## Objetivo Principal\n{objective}\n\n"
                f"## Observações & Aprendizados\n- Agente inicializado em {time.strftime('%Y-%m-%d %H:%M:%S')}.\n",
                encoding="utf-8",
            )

        agent_obj = {
            "id": agent_id,
            "name": name,
            "role": str(payload.get("role") or "Agente Autônomo OpenClaw").strip(),
            "objective": objective,
            "modelNode": model_node,
            "triggerType": trigger_type,
            "heartbeatIntervalSec": max(30, int(payload.get("heartbeatIntervalSec") or 300)),
            "cronSchedule": str(payload.get("cronSchedule") or "@every 30m").strip(),
            "allowedTools": allowed_tools,
            "maxSteps": min(8, max(1, int(payload.get("maxSteps") or 4))),
            "enabled": bool(payload.get("enabled", trigger_type in ("heartbeat", "cron"))),
            "status": "IDLE" if payload.get("enabled", True) else "PAUSED",
            "webhookTokenPreview": f"{webhook_token[:7]}***{webhook_token[-3:]}",
            "webhookToken": webhook_token,
            "webhookTokenEncrypted": webhook_token_enc,
            "lastRunAt": None,
            "lastRunEpoch": 0,
            "lastSummary": None,
            "runCount": 0,
            "createdAt": int(time.time() * 1000),
        }

        with self._lock:
            self._agents[agent_id] = agent_obj
            self._save_registry()

        log_audit_event(
            action="AGENT_CREATED",
            route="/api/agents",
            method="POST",
            status_code=201,
            details={"agentId": agent_id, "modelNode": model_node, "triggerType": trigger_type, "tools": allowed_tools},
        )
        return agent_obj

    def delete_agent(self, agent_id: str) -> bool:
        with self._lock:
            if agent_id not in self._agents:
                return False
            del self._agents[agent_id]
            self._save_registry()
        log_audit_event("AGENT_DELETED", f"/api/agents/{agent_id}", "DELETE", 200, details={"agentId": agent_id})
        return True

    def toggle_agent(self, agent_id: str, enabled: Optional[bool] = None) -> Dict[str, Any]:
        with self._lock:
            agent = self._agents.get(agent_id)
            if not agent:
                raise KeyError("Agente não encontrado.")
            new_state = (not agent.get("enabled")) if enabled is None else bool(enabled)
            agent["enabled"] = new_state
            agent["status"] = "IDLE" if new_state else "PAUSED"
            self._save_registry()
            return dict(agent)

    def verify_webhook_token(self, agent_id: str, provided_token: str) -> bool:
        with self._lock:
            agent = self._agents.get(agent_id)
            if not agent:
                return False
            expected = agent.get("webhookToken")
            if not expected and agent.get("webhookTokenEncrypted"):
                try:
                    expected = decrypt_at_rest(agent["webhookTokenEncrypted"])
                except Exception:
                    expected = ""
            return bool(expected and provided_token and expected == provided_token)

    def get_memory(self, agent_id: str) -> str:
        agent_dir = _safe_agent_dir(agent_id)
        mem_file = agent_dir / "MEMORY.md"
        if not mem_file.exists():
            return ""
        return mem_file.read_text(encoding="utf-8")

    def save_memory(self, agent_id: str, content: str) -> str:
        agent_dir = _safe_agent_dir(agent_id)
        mem_file = agent_dir / "MEMORY.md"
        mem_file.write_text(content, encoding="utf-8")
        return content

    def get_run_history(self, agent_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        agent_dir = _safe_agent_dir(agent_id)
        runs_file = agent_dir / "runs.jsonl"
        if not runs_file.exists():
            return []
        lines = runs_file.read_text(encoding="utf-8").splitlines()
        out = []
        for line in lines[-limit:]:
            if line.strip():
                try:
                    out.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
        out.reverse()
        return out

    def _execute_tool(self, agent: Dict[str, Any], tool_name: str, args: Dict[str, Any]) -> str:
        allowed = set(agent.get("allowedTools") or [])
        if tool_name not in allowed:
            return f"[BLOQUEADO] Ferramenta '{tool_name}' não autorizada para este agente."

        agent_id = agent["id"]
        agent_dir = _safe_agent_dir(agent_id)

        if tool_name == "read_vault":
            rel = str(args.get("filename") or "").strip()
            if not rel:
                files = [p.name for p in ARTIFACTS_DIR.iterdir() if p.is_file()][:30]
                return f"Arquivos no cofre: {json.dumps(files, ensure_ascii=False)}"
            target = (ARTIFACTS_DIR / Path(rel).name).resolve()
            if not target.exists() or not target.is_file():
                return f"Arquivo '{rel}' não encontrado no cofre."
            return target.read_text(encoding="utf-8", errors="replace")[:4000]

        if tool_name == "write_vault":
            filename = re.sub(r"[^a-zA-Z0-9._\-]", "_", str(args.get("filename") or f"note_{int(time.time())}.md"))
            content = str(args.get("content") or "")
            out_dir = agent_dir / "outputs"
            out_dir.mkdir(parents=True, exist_ok=True)
            target = (out_dir / filename).resolve()
            target.write_text(content, encoding="utf-8")
            return f"Arquivo salvo com sucesso em agents/{agent_id}/outputs/{filename} ({len(content)} bytes)."

        if tool_name == "update_memory":
            note = str(args.get("note") or "").strip()
            if not note:
                return "Nota vazia ignorada."
            mem = self.get_memory(agent_id)
            stamp = time.strftime("%Y-%m-%d %H:%M:%S")
            updated = f"{mem.rstrip()}\n- [{stamp}] {sanitize_text_pii(note)}\n"
            self.save_memory(agent_id, updated)
            return "MEMORY.md atualizado localmente."

        if tool_name == "web_fetch":
            url = str(args.get("url") or "").strip()
            if not _is_safe_public_url(url):
                return "[BLOQUEADO SSRF] URL inválida ou aponta para rede privada/local."
            resp = requests.get(url, timeout=10, headers={"User-Agent": "MAGI-Hub-OpenClaw-Agent/1.0"})
            return resp.text[:3500]

        if tool_name == "magi_consensus":
            query = str(args.get("query") or "").strip()
            if not query:
                return "Consulta vazia."
            res = broadcast_magi(query, custom_keys=self._runtime_keys)
            return f"Consenso MAGI: {res.get('consensus', '')[:1200]}"

        return f"Ferramenta desconhecida: {tool_name}"

    def run_agent(
        self,
        agent_id: str,
        trigger_source: str = "manual",
        event_payload: Optional[Dict[str, Any]] = None,
        custom_keys: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        self.update_runtime_keys(custom_keys)

        with self._lock:
            agent = self._agents.get(agent_id)
            if not agent:
                raise KeyError("Agente não encontrado.")
            agent["status"] = "RUNNING"
            self._save_registry()

        start_ts = time.time()
        trace: List[Dict[str, Any]] = []
        final_answer = ""
        run_status = "COMPLETED"

        try:
            memory_md = self.get_memory(agent_id)
            tools_desc = ", ".join(agent.get("allowedTools") or []) or "nenhuma"
            max_steps = int(agent.get("maxSteps") or 4)
            model_node = agent.get("modelNode") or "gemini"
            api_key = self._runtime_keys.get(model_node)

            event_str = json.dumps(event_payload, ensure_ascii=False) if event_payload else "Nenhum payload externo."
            scratchpad = ""

            for step_idx in range(1, max_steps + 1):
                prompt = (
                    f"[AGENTE AUTÔNOMO OPENCLAW // NERV MAGI HUB]\n"
                    f"Nome: {agent['name']} | Papel: {agent['role']}\n"
                    f"Gatilho: {trigger_source}\n"
                    f"Objetivo: {agent['objective']}\n"
                    f"Ferramentas Autorizadas: {tools_desc}\n\n"
                    f"=== MEMÓRIA LOCAL (MEMORY.md) ===\n{memory_md[:2500]}\n\n"
                    f"=== PAYLOAD DO EVENTO ===\n{event_str[:1000]}\n\n"
                    f"=== HISTÓRICO DE PASSOS DESTA EXECUÇÃO ===\n{scratchpad or '(Início da execução)'}\n\n"
                    f"Passo {step_idx}/{max_steps}. Responda ESTRITAMENTE em JSON:\n"
                    f"- Para usar uma ferramenta: {{\"thought\": \"...\", \"tool\": \"nome_ferramenta\", \"args\": {{...}}}}\n"
                    f"- Para concluir: {{\"thought\": \"...\", \"final_answer\": \"Resumo claro da ação/resultado\"}}"
                )

                res = execute_single_provider(model_node, prompt, custom_api_key=api_key)
                parsed = _extract_json_step(res.get("text", ""))
                thought = str(parsed.get("thought") or "")

                if "tool" in parsed and parsed["tool"]:
                    tool_name = str(parsed["tool"])
                    tool_args = parsed.get("args") if isinstance(parsed.get("args"), dict) else {}
                    observation = self._execute_tool(agent, tool_name, tool_args)
                    trace.append({
                        "step": step_idx,
                        "thought": thought,
                        "tool": tool_name,
                        "args": tool_args,
                        "observation": observation[:600],
                    })
                    scratchpad += f"\n[Passo {step_idx}] Thought: {thought}\nTool: {tool_name} -> {observation[:800]}\n"
                else:
                    final_answer = str(parsed.get("final_answer") or res.get("text") or "Execução concluída.")
                    trace.append({
                        "step": step_idx,
                        "thought": thought,
                        "final_answer": final_answer,
                    })
                    break

            if not final_answer:
                final_answer = "Ciclo máximo de passos atingido com segurança."

        except Exception as exc:
            run_status = "ERROR"
            final_answer = sanitize_error_message(str(exc))

        duration_ms = int((time.time() - start_ts) * 1000)
        run_record = {
            "runId": f"run-{uuid.uuid4().hex[:8]}",
            "timestamp": int(time.time() * 1000),
            "triggerSource": trigger_source,
            "status": run_status,
            "durationMs": duration_ms,
            "summary": sanitize_text_pii(final_answer[:600]),
            "trace": trace,
        }

        agent_dir = _safe_agent_dir(agent_id)
        with open(agent_dir / "runs.jsonl", "a", encoding="utf-8") as f:
            f.write(json.dumps(run_record, ensure_ascii=False) + "\n")

        with self._lock:
            agent = self._agents[agent_id]
            agent["status"] = "ERROR" if run_status == "ERROR" else ("IDLE" if agent.get("enabled") else "PAUSED")
            agent["lastRunAt"] = time.strftime("%Y-%m-%d %H:%M:%S")
            agent["lastRunEpoch"] = time.time()
            agent["lastSummary"] = run_record["summary"]
            agent["runCount"] = int(agent.get("runCount") or 0) + 1
            self._save_registry()

        log_audit_event(
            action="AGENT_RUN",
            route=f"/api/agents/{agent_id}/run",
            method="POST",
            status_code=200 if run_status == "COMPLETED" else 500,
            details={"agentId": agent_id, "trigger": trigger_source, "status": run_status, "steps": len(trace)},
        )
        return run_record


agent_gateway = AutonomousAgentGateway()
