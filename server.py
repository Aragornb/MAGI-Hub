# Copyright 2026 Aragornb / MAGI-Hub. Licensed under the Apache License, Version 2.0.
"""NERV CENTRAL DOGMA // MAGI SUPERCOMPUTER SYSTEM
Servidor Central Python com suporte a Executável Desktop e Navegador Local.
Integração simultânea de IAs: ChatGPT, Claude, Gemini, Grok e DeepSeek.
"""
import os
import sys

# Redireciona stdout e stderr quando em modo windowed (sem console/cmd)
if sys.stdout is None:
    sys.stdout = open(os.devnull, "w", encoding="utf-8")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w", encoding="utf-8")

import time
import socket
import webbrowser
import threading
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory, Response

# Determine base directory (supporting PyInstaller onefile/onedir bundles)
if getattr(sys, "frozen", False):
    BASE_DIR = Path(getattr(sys, "_MEIPASS", sys.executable)).resolve()
    if not (BASE_DIR / "dist").exists() and (Path(sys.executable).parent / "dist").exists():
        BASE_DIR = Path(sys.executable).parent.resolve()
else:
    BASE_DIR = Path(__file__).parent.resolve()

from config import (
    PORT as CONFIG_PORT,
    HOST,
    ARTIFACTS_DIR,
    DIST_DIR as CFG_DIST_DIR,
)
from artifacts_manager import artifacts_manager
from providers import (
    call_gemini,
    call_chatgpt,
    call_claude,
    call_grok,
    call_deepseek,
    execute_single_provider,
    broadcast_magi,
    node_usage_tracker,
    sanitize_error_message,
    verify_provider_key,
)
from orchestrator import (
    plan_workflow_decomposition,
    execute_mtask_workflow,
    execute_otask_workflow,
    execute_pipe_workflow,
    retry_single_otask_step,
    DEFAULT_ORCHESTRATOR_TIMEOUT,
    WORKFLOW_CACHE,
)
from security_lgpd import (
    log_audit_event,
    get_recent_audit_logs,
    get_lgpd_consent,
    save_lgpd_consent,
)
from autonomous_agents import agent_gateway

# Resolve dist directory
DIST_DIR = BASE_DIR / "dist"
if not DIST_DIR.exists():
    DIST_DIR = CFG_DIST_DIR

app = Flask(__name__, static_folder=str(DIST_DIR / "assets"), static_url_path="/assets")

CRITICAL_AUDIT_PREFIXES = (
    "/api/vault/",
    "/api/agents",
    "/api/orchestrator/",
    "/api/clear-all",
    "/api/subscription/",
    "/api/lgpd/",
    "/api/system/",
)

@app.after_request
def audit_critical_routes(response):
    try:
        path = request.path or ""
        if request.method in ("POST", "PUT", "DELETE") and any(path.startswith(p) for p in CRITICAL_AUDIT_PREFIXES):
            payload = request.get_json(silent=True) if request.is_json else None
            log_audit_event(
                action=f"HTTP_{request.method}",
                route=path,
                method=request.method,
                status_code=response.status_code,
                actor_ip=request.remote_addr,
                details=payload if isinstance(payload, dict) else {},
            )
    except Exception:
        pass
    return response

def find_available_port(preferred: int = 3000) -> int:
    for port in (preferred, 3001, 5057, 8080, 0):
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            s.bind(("127.0.0.1", port))
            return s.getsockname()[1]
        except OSError:
            continue
        finally:
            s.close()
    return 3000

# ----------------- STATIC FRONTEND ROUTES -----------------

@app.route("/")
def serve_index():
    if DIST_DIR.exists() and (DIST_DIR / "index.html").exists():
        return send_from_directory(str(DIST_DIR), "index.html")
    return (
        "<html><head><title>NERV MAGI HUB</title></head><body style='background:#070504;color:#ff7a00;font-family:monospace;padding:30px;'>"
        "<h1>[NERV CENTRAL DOGMA]</h1>"
        "<p>Compilação da interface não encontrada na pasta 'dist'. Execute 'npm run build' primeiro.</p>"
        "</body></html>"
    ), 404

@app.route("/<path:path>")
def serve_static(path: str):
    target = DIST_DIR / path
    if target.exists() and target.is_file():
        return send_from_directory(str(DIST_DIR), path)
    # SPA routing fallback
    if (DIST_DIR / "index.html").exists():
        return send_from_directory(str(DIST_DIR), "index.html")
    return ("Arquivo não encontrado", 404)

# ----------------- MAGI API ROUTES -----------------

@app.route("/api/ping", methods=["GET"])
def api_ping():
    return jsonify({
        "ok": True,
        "nervStatus": "NORMAL // MAGI DELIBERATION GRID READY (PYTHON CORE)",
        "keys": {
            "gemini": bool(os.environ.get("GEMINI_API_KEY")),
            "chatgpt": bool(os.environ.get("OPENAI_API_KEY")),
            "claude": bool(os.environ.get("ANTHROPIC_API_KEY")),
            "grok": bool(os.environ.get("GROK_API_KEY") or os.environ.get("XAI_API_KEY")),
            "deepseek": bool(os.environ.get("DEEPSEEK_API_KEY")),
        },
        "totalFilesGenerated": len(artifacts_manager.file_registry),
        "timestamp": int(time.time() * 1000),
    })

@app.route("/api/magi/usage", methods=["GET", "POST"])
@app.route("/api/usage", methods=["GET", "POST"])
def api_usage():
    custom_keys = {}
    if request.is_json:
        data = request.get_json(silent=True) or {}
        custom_keys = data.get("customKeys", {})

    nodes_info = [
        {
            "nodeId": "chatgpt",
            "nodeName": "UNIT-00",
            "realPlatform": "ChatGPT (GPT-4o)",
            "hasServerKey": bool(os.environ.get("OPENAI_API_KEY")),
            "hasVaultKey": bool((custom_keys.get("chatgpt") or "").strip()),
        },
        {
            "nodeId": "claude",
            "nodeName": "UNIT-01",
            "realPlatform": "Claude (Claude 3.5 Sonnet)",
            "hasServerKey": bool(os.environ.get("ANTHROPIC_API_KEY")),
            "hasVaultKey": bool((custom_keys.get("claude") or "").strip()),
        },
        {
            "nodeId": "gemini",
            "nodeName": "UNIT-02",
            "realPlatform": "Gemini (Gemini 3.8 Flash)",
            "hasServerKey": bool(os.environ.get("GEMINI_API_KEY")),
            "hasVaultKey": bool((custom_keys.get("gemini") or "").strip()),
        },
        {
            "nodeId": "grok",
            "nodeName": "UNIT-03",
            "realPlatform": "Grok (xAI Grok-2)",
            "hasServerKey": bool(os.environ.get("GROK_API_KEY") or os.environ.get("XAI_API_KEY")),
            "hasVaultKey": bool((custom_keys.get("grok") or "").strip()),
        },
        {
            "nodeId": "deepseek",
            "nodeName": "UNIT-04",
            "realPlatform": "DeepSeek (DeepSeek V3)",
            "hasServerKey": bool(os.environ.get("DEEPSEEK_API_KEY")),
            "hasVaultKey": bool((custom_keys.get("deepseek") or "").strip()),
        },
    ]

    quota_limit_tokens = 1_000_000
    usage_list = []

    for info in nodes_info:
        node_id = info["nodeId"]
        is_operant = info["hasServerKey"] or info["hasVaultKey"]
        tracker = node_usage_tracker[node_id]
        key_source = "vault" if info["hasVaultKey"] else "server" if info["hasServerKey"] else "missing"

        if not is_operant:
            usage_list.append({
                "nodeId": node_id,
                "nodeName": info["nodeName"],
                "realPlatform": info["realPlatform"],
                "isOperant": False,
                "availablePercent": 0.0,
                "requestsCount": tracker.requests_count,
                "tokensUsed": tracker.tokens_used,
                "quotaLimitTokens": quota_limit_tokens,
                "syncRate": 0.0,
                "status": "BLOQUEADO",
                "keySource": "missing",
                "latencyMs": 0,
            })
        else:
            available_tokens = max(0, quota_limit_tokens - tracker.tokens_used)
            available_percent = round(max(0.0, min(100.0, (available_tokens / quota_limit_tokens) * 100)), 1)
            sync_rate = round(99.1 + (tracker.requests_count % 5) * 0.15, 1)

            usage_list.append({
                "nodeId": node_id,
                "nodeName": info["nodeName"],
                "realPlatform": info["realPlatform"],
                "isOperant": True,
                "availablePercent": available_percent,
                "requestsCount": tracker.requests_count,
                "tokensUsed": tracker.tokens_used,
                "quotaLimitTokens": quota_limit_tokens,
                "syncRate": sync_rate,
                "status": "OPERACIONAL",
                "keySource": key_source,
                "latencyMs": tracker.last_latency_ms or 210,
            })

    return jsonify({
        "ok": True,
        "timestamp": int(time.time() * 1000),
        "usage": usage_list,
    })

# Single node query endpoints
@app.route("/api/ask/<provider>", methods=["POST"])
def api_ask_single(provider: str):
    data = request.get_json(silent=True) or {}
    prompt = (data.get("prompt") or "").strip()
    if not prompt:
        return jsonify({"error": f"Diretiva vazia enviada para {provider.upper()}"}), 400

    custom_api_key = data.get("customApiKey")
    custom_keys = data.get("customKeys") or {}
    history = data.get("history") or []
    angel_context = data.get("angelContext")

    try:
        res = execute_single_provider(provider, prompt, custom_api_key, history, angel_context, custom_keys=custom_keys)
        return jsonify(res)
    except Exception as err:
        clean_err = sanitize_error_message(str(err), [custom_api_key] if custom_api_key else None)
        return jsonify({"error": clean_err}), 500

# Simultaneous broadcast to active nodes
@app.route("/api/magi/broadcast", methods=["POST"])
def api_broadcast():
    data = request.get_json(silent=True) or {}
    prompt = (data.get("prompt") or "").strip()
    if not prompt:
        return jsonify({"error": "Diretiva vazia"}), 400

    active_nodes = data.get("activeNodes") or ["chatgpt", "claude", "gemini", "grok", "deepseek"]
    custom_keys = data.get("customKeys") or {}
    angel_context = data.get("angelContext")

    try:
        result = broadcast_magi(prompt, active_nodes, custom_keys, angel_context)
        return jsonify(result)
    except Exception as err:
        sensitive = list(custom_keys.values()) if custom_keys else []
        clean_err = sanitize_error_message(str(err), sensitive)
        return jsonify({"error": clean_err}), 500

# ----------------- AI ORCHESTRATOR & WORKFLOW ROUTES -----------------

@app.route("/api/orchestrator/plan", methods=["POST"])
def api_orchestrator_plan():
    data = request.get_json(silent=True) or {}
    prompt = (data.get("prompt") or "").strip()
    workflow_type = (data.get("workflowType") or "otask").strip().lower()
    orchestrator_node = data.get("orchestratorNode") or "claude"
    custom_keys = data.get("customKeys") or {}
    angel_context = data.get("angelContext")
    timeout_seconds = int(data.get("timeoutSeconds") or DEFAULT_ORCHESTRATOR_TIMEOUT)

    if not prompt:
        return jsonify({"error": "Diretiva vazia enviada para o orquestrador"}), 400

    try:
        plan = plan_workflow_decomposition(
            prompt=prompt,
            workflow_type=workflow_type,
            orchestrator_node=orchestrator_node,
            custom_keys=custom_keys,
            angel_context=angel_context,
            timeout_seconds=timeout_seconds,
        )
        return jsonify({"ok": True, "plan": plan})
    except Exception as err:
        sensitive = list(custom_keys.values()) if custom_keys else []
        clean_err = sanitize_error_message(str(err), sensitive)
        return jsonify({"error": clean_err}), 500

@app.route("/api/orchestrator/execute-mtask", methods=["POST"])
def api_orchestrator_execute_mtask():
    data = request.get_json(silent=True) or {}
    prompt = (data.get("prompt") or "").strip()
    active_nodes = data.get("activeNodes") or ["chatgpt", "claude", "gemini", "grok", "deepseek"]
    orchestrator_node = data.get("orchestratorNode") or "claude"
    custom_keys = data.get("customKeys") or {}
    angel_context = data.get("angelContext")
    timeout_seconds = int(data.get("timeoutSeconds") or DEFAULT_ORCHESTRATOR_TIMEOUT)

    if not prompt:
        return jsonify({"error": "Diretiva vazia para /mtask"}), 400

    try:
        result = execute_mtask_workflow(
            prompt=prompt,
            active_nodes=active_nodes,
            orchestrator_node=orchestrator_node,
            custom_keys=custom_keys,
            angel_context=angel_context,
            timeout_seconds=timeout_seconds,
        )
        return jsonify({"ok": True, "result": result})
    except Exception as err:
        sensitive = list(custom_keys.values()) if custom_keys else []
        clean_err = sanitize_error_message(str(err), sensitive)
        return jsonify({"error": clean_err}), 500

@app.route("/api/orchestrator/execute-otask", methods=["POST"])
def api_orchestrator_execute_otask():
    data = request.get_json(silent=True) or {}
    plan = data.get("plan")
    custom_keys = data.get("customKeys") or {}
    angel_context = data.get("angelContext")
    timeout_seconds = int(data.get("timeoutSeconds") or DEFAULT_ORCHESTRATOR_TIMEOUT)

    if not plan or not plan.get("steps"):
        return jsonify({"error": "Plano de tarefas inválido ou sem etapas"}), 400

    try:
        result_plan = execute_otask_workflow(
            plan=plan,
            custom_keys=custom_keys,
            angel_context=angel_context,
            timeout_seconds=timeout_seconds,
        )
        return jsonify({"ok": True, "plan": result_plan})
    except Exception as err:
        sensitive = list(custom_keys.values()) if custom_keys else []
        clean_err = sanitize_error_message(str(err), sensitive)
        return jsonify({"error": clean_err}), 500

@app.route("/api/orchestrator/execute-pipe", methods=["POST"])
def api_orchestrator_execute_pipe():
    data = request.get_json(silent=True) or {}
    plan = data.get("plan")
    start_from_step_id = data.get("startFromStepId")
    custom_keys = data.get("customKeys") or {}
    angel_context = data.get("angelContext")
    timeout_seconds = int(data.get("timeoutSeconds") or DEFAULT_ORCHESTRATOR_TIMEOUT)

    if not plan or not plan.get("steps"):
        return jsonify({"error": "Plano de pipeline inválido ou sem etapas"}), 400

    try:
        result_plan = execute_pipe_workflow(
            plan=plan,
            start_from_step_id=start_from_step_id,
            custom_keys=custom_keys,
            angel_context=angel_context,
            timeout_seconds=timeout_seconds,
        )
        return jsonify({"ok": True, "plan": result_plan})
    except Exception as err:
        sensitive = list(custom_keys.values()) if custom_keys else []
        clean_err = sanitize_error_message(str(err), sensitive)
        return jsonify({"error": clean_err}), 500

@app.route("/api/orchestrator/retry-step", methods=["POST"])
def api_orchestrator_retry_step():
    data = request.get_json(silent=True) or {}
    workflow_id = data.get("workflowId")
    step_id = data.get("stepId")
    assigned_node = data.get("assignedNode")
    custom_keys = data.get("customKeys") or {}
    angel_context = data.get("angelContext")
    timeout_seconds = int(data.get("timeoutSeconds") or DEFAULT_ORCHESTRATOR_TIMEOUT)

    if not workflow_id or not step_id:
        return jsonify({"error": "workflowId e stepId são obrigatórios para repetição"}), 400

    try:
        retry_res = retry_single_otask_step(
            workflow_id=workflow_id,
            step_id=step_id,
            assigned_node=assigned_node,
            custom_keys=custom_keys,
            angel_context=angel_context,
            timeout_seconds=timeout_seconds,
        )
        return jsonify({"ok": True, **retry_res})
    except Exception as err:
        sensitive = list(custom_keys.values()) if custom_keys else []
        clean_err = sanitize_error_message(str(err), sensitive)
        return jsonify({"error": clean_err}), 500

@app.route("/api/orchestrator/retry-pipe", methods=["POST"])
def api_orchestrator_retry_pipe():
    data = request.get_json(silent=True) or {}
    workflow_id = data.get("workflowId")
    from_step_id = data.get("fromStepId")
    custom_keys = data.get("customKeys") or {}
    angel_context = data.get("angelContext")
    timeout_seconds = int(data.get("timeoutSeconds") or DEFAULT_ORCHESTRATOR_TIMEOUT)

    plan = WORKFLOW_CACHE.get(workflow_id) or data.get("plan")
    if not plan:
        return jsonify({"error": f"Workflow {workflow_id} não localizado para retry"}), 404

    try:
        result_plan = execute_pipe_workflow(
            plan=plan,
            start_from_step_id=from_step_id,
            custom_keys=custom_keys,
            angel_context=angel_context,
            timeout_seconds=timeout_seconds,
        )
        return jsonify({"ok": True, "plan": result_plan})
    except Exception as err:
        sensitive = list(custom_keys.values()) if custom_keys else []
        clean_err = sanitize_error_message(str(err), sensitive)
        return jsonify({"error": clean_err}), 500

@app.route("/api/orchestrator/workflow/<workflow_id>", methods=["GET"])
def api_orchestrator_get_workflow(workflow_id: str):
    plan = WORKFLOW_CACHE.get(workflow_id)
    if not plan:
        return jsonify({"error": "Workflow não encontrado"}), 404
    return jsonify({"ok": True, "plan": plan})

# File Management
@app.route("/api/files", methods=["GET"])
def api_get_files():
    files = artifacts_manager.get_all_files()
    return jsonify({
        "files": files,
        "count": len(files),
    })

@app.route("/api/files/<file_id>/download", methods=["GET"])
def api_download_file(file_id: str):
    file_obj = artifacts_manager.get_file_by_id(file_id)
    if not file_obj:
        return Response("Arquivo não encontrado no cofre da NERV", status=404)

    target_format = request.args.get("as") or request.args.get("format")

    # Mapeamento de extensões para MIME types
    mime_map = {
        "pdf": "application/pdf",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "doc": "application/msword",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "xls": "application/vnd.ms-excel",
        "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "ppt": "application/vnd.ms-powerpoint",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "txt": "text/plain; charset=utf-8",
        "py": "text/x-python; charset=utf-8",
        "ts": "text/plain; charset=utf-8",
        "js": "text/javascript; charset=utf-8",
        "html": "text/html; charset=utf-8",
        "json": "application/json; charset=utf-8",
    }

    # Se o arquivo for uma imagem
    if file_obj.language == "image" or file_obj.name.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".gif")):
        img_bytes = None
        if file_obj.content.startswith("/api/vault/image/"):
            img_rel = file_obj.content.replace("/api/vault/image/", "").strip()
            disk_target = ARTIFACTS_DIR / img_rel
            if disk_target.exists():
                img_bytes = disk_target.read_bytes()
        elif file_obj.content.startswith("data:image/"):
            try:
                import base64
                _, b64_part = file_obj.content.split(",", 1)
                img_bytes = base64.b64decode(b64_part)
            except Exception as e:
                print(f"[DOWNLOAD ERROR] Falha ao decodificar base64: {e}")
        elif file_obj.content.startswith("http"):
            try:
                import requests
                r = requests.get(file_obj.content, timeout=30)
                if r.ok:
                    img_bytes = r.content
            except Exception as e:
                print(f"[DOWNLOAD ERROR] Falha ao baixar imagem: {e}")

        if img_bytes:
            # Se pediu conversão de formato de imagem (ex: jpg ou png)
            if target_format and target_format.lower() in ("jpg", "jpeg", "png"):
                try:
                    from Extensions.image_converter import convert_or_generate_image
                    img_bytes = convert_or_generate_image(img_bytes, target_format=target_format)
                    out_name = f"{Path(file_obj.name).stem}.{target_format.lower()}"
                    mime = "image/jpeg" if target_format.lower() in ("jpg", "jpeg") else "image/png"
                    return Response(
                        img_bytes,
                        mimetype=mime,
                        headers={"Content-Disposition": f'attachment; filename="{out_name}"'},
                    )
                except Exception as e:
                    print(f"[IMAGE CONVERT ERROR] {e}")

            mime = "image/jpeg" if file_obj.name.lower().endswith((".jpg", ".jpeg")) else "image/png"
            return Response(
                img_bytes,
                mimetype=mime,
                headers={"Content-Disposition": f'attachment; filename="{file_obj.name}"'},
            )

    # Se o arquivo foi convertido e está no disco do cofre (/api/vault/file/...)
    if file_obj.content.startswith("/api/vault/file/"):
        file_rel = file_obj.content.replace("/api/vault/file/", "").strip()
        disk_target = ARTIFACTS_DIR / file_rel
        if disk_target.exists():
            ext = Path(file_obj.name).suffix.lstrip(".").lower()
            mime = mime_map.get(ext, "application/octet-stream")
            return Response(
                disk_target.read_bytes(),
                mimetype=mime,
                headers={"Content-Disposition": f'attachment; filename="{file_obj.name}"'},
            )

    # Se for solicitada conversão sob demanda via parâmetro target_format (?as=pdf, etc.)
    if target_format:
        try:
            from Extensions import generate_file_by_extension
            raw_text = file_obj.source_code or file_obj.content
            conv_bytes, mime = generate_file_by_extension(
                content=raw_text,
                extension=target_format,
                title=file_obj.name,
            )
            out_name = f"{Path(file_obj.name).stem}.{target_format.lower().lstrip('.')}"
            return Response(
                conv_bytes,
                mimetype=mime,
                headers={"Content-Disposition": f'attachment; filename="{out_name}"'},
            )
        except Exception as conv_err:
            print(f"[DOWNLOAD CONVERSION ERROR] {conv_err}")

    # Fallback texto puro
    ext = Path(file_obj.name).suffix.lstrip(".").lower()
    mime = mime_map.get(ext, "text/plain; charset=utf-8")
    return Response(
        file_obj.content.encode("utf-8") if isinstance(file_obj.content, str) else file_obj.content,
        mimetype=mime,
        headers={"Content-Disposition": f'attachment; filename="{file_obj.name}"'},
    )

@app.route("/api/files/save-dialog", methods=["POST"])
def api_files_save_dialog():
    """Abre o diálogo nativo do Windows Explorer para o operador escolher exatamente onde salvar o arquivo."""
    try:
        import base64
        import requests
        from Extensions.file_generator import file_generator
        from Extensions import SUPPORTED_EXTENSIONS, generate_file_by_extension

        data = request.get_json(silent=True) or {}
        file_id = data.get("file_id")
        suggested_name = data.get("name") or "nerv_documento"
        content = data.get("content")
        b64_content = data.get("base64")
        target_format = data.get("extension") or data.get("format")

        file_bytes = None

        # 1. Se veio base64 explícito
        if b64_content:
            try:
                if "," in b64_content:
                    b64_content = b64_content.split(",", 1)[1]
                file_bytes = base64.b64decode(b64_content)
            except Exception:
                pass

        # 2. Se veio file_id do cofre
        if not file_bytes and file_id:
            file_obj = artifacts_manager.get_file_by_id(file_id)
            if file_obj:
                suggested_name = suggested_name or file_obj.name
                # Se for arquivo do disco
                if file_obj.content.startswith("/api/vault/file/"):
                    f_rel = file_obj.content.replace("/api/vault/file/", "").strip()
                    p = ARTIFACTS_DIR / f_rel
                    if p.exists():
                        file_bytes = p.read_bytes()
                elif file_obj.content.startswith("/api/vault/image/"):
                    img_rel = file_obj.content.replace("/api/vault/image/", "").strip()
                    p = ARTIFACTS_DIR / img_rel
                    if p.exists():
                        file_bytes = p.read_bytes()
                elif file_obj.content.startswith("data:"):
                    _, b64_part = file_obj.content.split(",", 1)
                    file_bytes = base64.b64decode(b64_part)
                elif file_obj.content.startswith("http"):
                    r = requests.get(file_obj.content, timeout=25)
                    if r.ok:
                        file_bytes = r.content
                else:
                    file_bytes = file_obj.content.encode("utf-8")

        # 3. Se veio content direto
        if not file_bytes and content:
            if isinstance(content, str):
                if content.startswith("/api/vault/file/"):
                    f_rel = content.replace("/api/vault/file/", "").strip()
                    p = ARTIFACTS_DIR / f_rel
                    if p.exists():
                        file_bytes = p.read_bytes()
                elif content.startswith("/api/vault/image/"):
                    img_rel = content.replace("/api/vault/image/", "").strip()
                    p = ARTIFACTS_DIR / img_rel
                    if p.exists():
                        file_bytes = p.read_bytes()
                elif content.startswith("data:"):
                    _, b64_part = content.split(",", 1)
                    file_bytes = base64.b64decode(b64_part)
                elif content.startswith("http"):
                    r = requests.get(content, timeout=25)
                    if r.ok:
                        file_bytes = r.content
                else:
                    file_bytes = content.encode("utf-8")

        if not file_bytes:
            return jsonify({"ok": False, "error": "Conteúdo ou arquivo não encontrado para salvar."}), 400

        # Se solicitada conversão de formato (ex: .pdf, .docx, .xlsx, .pptx)
        if target_format and target_format.lower().lstrip(".") in SUPPORTED_EXTENSIONS:
            try:
                conv_content = content or file_bytes
                if isinstance(conv_content, str) and conv_content.startswith(("http", "/api/", "data:")):
                    conv_content = file_bytes
                file_bytes, _ = generate_file_by_extension(
                    content=conv_content,
                    extension=target_format,
                    title=suggested_name,
                )
                clean_stem = Path(suggested_name).stem
                suggested_name = f"{clean_stem}.{target_format.lower().lstrip('.')}"
            except Exception as conv_err:
                print(f"[SAVE DIALOG CONVERSION ERROR] {conv_err}")

        ext = Path(suggested_name).suffix.lstrip(".") or "txt"
        saved_path = file_generator.open_native_save_dialog(
            file_bytes=file_bytes,
            default_name=suggested_name,
            extension=ext,
        )

        if saved_path:
            return jsonify({
                "ok": True,
                "saved_path": saved_path,
                "message": f"Arquivo salvo com sucesso em: {saved_path}",
            })
        return jsonify({
            "ok": False,
            "cancelled": True,
            "message": "Operação cancelada pelo operador.",
        })
    except Exception as e:
        print(f"[SAVE DIALOG ERROR] {e}")
        return jsonify({"ok": False, "error": str(e)}), 500

@app.route("/api/extensions/generate", methods=["POST"])
def api_extensions_generate():
    """Gera um arquivo físico a partir de conteúdo e extensão via NERV Extensions."""
    data = request.get_json(silent=True) or {}
    content = data.get("content") or ""
    ext = data.get("extension") or "pdf"
    title = data.get("title") or "nerv_documento"

    try:
        from Extensions.file_generator import file_generator
        from artifacts_manager import GeneratedFile

        result = file_generator.generate(
            content=content,
            extension=ext,
            filename=data.get("filename"),
            title=title,
        )

        file_id = f"ext-{ext}-{int(time.time() * 1000)}"
        file_item = GeneratedFile(
            file_id=file_id,
            provider="extensions",
            provider_name=f"NERV EXTENSIONS ({ext.upper()})",
            name=result["name"],
            language=result["extension"],
            content=f"/api/vault/file/{result['name']}",
            size=result["size"],
            timestamp=int(time.time() * 1000),
            source_code=content if isinstance(content, str) else "",
            is_converted=True,
        )
        artifacts_manager.file_registry.insert(0, file_item)

        return jsonify({
            "ok": True,
            "file": {
                "id": file_id,
                "name": result["name"],
                "size": result["size"],
                "mime": result["mime"],
                "extension": result["extension"],
                "download_url": f"/api/files/{file_id}/download",
            }
        })
    except Exception as err:
        return jsonify({"ok": False, "error": str(err)}), 500

@app.route("/api/files/download-zip", methods=["GET"])
def api_download_zip():
    if not artifacts_manager.file_registry:
        return Response("Nenhum arquivo gerado no cofre ainda.", status=400)

    zip_bytes = artifacts_manager.create_zip_archive()
    return Response(
        zip_bytes,
        mimetype="application/zip",
        headers={"Content-Disposition": 'attachment; filename="nerv_magi_artifacts.zip"'},
    )

@app.route("/api/clear-all", methods=["POST"])
def api_clear_all():
    artifacts_manager.clear_all()
    for tracker in node_usage_tracker.values():
        tracker.requests_count = 0
        tracker.tokens_used = 0
        tracker.last_latency_ms = 0
    return jsonify({"ok": True, "message": "Histórico e arquivos do servidor limpos com sucesso."})

# ----------------- CREDENTIAL VAULT PERSISTENCE & PURGE (BYOK ZERO-KNOWLEDGE) -----------------

@app.route("/api/vault/verify-key", methods=["POST"])
def api_vault_verify_key():
    """Validação instantânea (Healthcheck Ping) da chave do provedor sem gastar tokens."""
    data = request.get_json(silent=True) or {}
    provider = data.get("provider")
    api_key = data.get("apiKey")
    if not provider or not api_key:
        return jsonify({"ok": False, "message": "Provedor e chave de API são obrigatórios para verificação."}), 400

    result = verify_provider_key(provider, api_key)
    return jsonify(result)

@app.route("/api/vault/save", methods=["POST"])
def api_vault_save():
    """Sincroniza credenciais para a sessão do servidor (BYOK).
    Conforme o parâmetro de segurança: Nenhuma chave é persistida em banco de dados.
    """
    data = request.get_json(silent=True) or {}
    keys = data.get("keys", {})
    persist_locally = data.get("persistLocally", False)

    key_map = {
        "chatgpt": "OPENAI_API_KEY",
        "claude": "ANTHROPIC_API_KEY",
        "gemini": "GEMINI_API_KEY",
        "grok": "GROK_API_KEY",
        "deepseek": "DEEPSEEK_API_KEY",
    }

    # Always update in volatile process environment (RAM) for the active session
    for prov, env_name in key_map.items():
        if prov in keys:
            val = (keys[prov] or "").strip()
            if val:
                os.environ[env_name] = val
            elif val == "":
                os.environ.pop(env_name, None)

    # Optional local file persistence ONLY when explicitly requested in local desktop mode
    if persist_locally:
        try:
            env_file = BASE_DIR / ".env"
            existing_lines = []
            if env_file.exists():
                existing_lines = env_file.read_text(encoding="utf-8").splitlines()

            current_vars = {}
            for line in existing_lines:
                line_s = line.strip()
                if line_s and not line_s.startswith("#") and "=" in line_s:
                    k, v = line_s.split("=", 1)
                    current_vars[k.strip()] = v.strip().strip('"').strip("'")

            for prov, env_name in key_map.items():
                if prov in keys:
                    val = (keys[prov] or "").strip()
                    if val:
                        current_vars[env_name] = val

            new_content = [
                "# NERV CENTRAL DOGMA // COFRE LOCAL (DESKTOP MODE)",
                "# Chaves trafegadas estritamente em ambiente de execução.",
                "",
            ]
            for env_name in key_map.values():
                val = current_vars.get(env_name, "")
                new_content.append(f'{env_name}="{val}"')

            new_content.extend([
                "",
                f'PORT={current_vars.get("PORT", "3000")}',
                f'HOST={current_vars.get("HOST", "127.0.0.1")}',
                "",
            ])
            env_file.write_text("\n".join(new_content), encoding="utf-8")
        except Exception:
            pass

    return jsonify({
        "ok": True,
        "message": "Protocolo BYOK: Chaves registradas em memória volátil de sessão para os nós ativos.",
        "status": {
            "chatgpt": bool(os.environ.get("OPENAI_API_KEY")),
            "claude": bool(os.environ.get("ANTHROPIC_API_KEY")),
            "gemini": bool(os.environ.get("GEMINI_API_KEY")),
            "grok": bool(os.environ.get("GROK_API_KEY") or os.environ.get("XAI_API_KEY")),
            "deepseek": bool(os.environ.get("DEEPSEEK_API_KEY")),
        }
    })

# ----------------- SAAS SUBSCRIPTION & GATEWAY RECURRENCE (R$ 10,00) -----------------

# In-memory subscription state
saas_state = {
    "status": "active",  # "active" | "grace_period" | "past_due" | "canceled"
    "planName": "MAGI PASS // SAAS",
    "monthlyPriceBrl": 10.00,
    "startedAt": int(time.time() * 1000) - (86400 * 15 * 1000),
    "currentPeriodEnd": int(time.time() * 1000) + (86400 * 15 * 1000),
    "gracePeriodEnd": None,
    "cardLast4": "4242",
    "cardBrand": "visa",
    "autoRenew": True,
}

@app.route("/api/subscription/status", methods=["GET"])
def api_subscription_status():
    """Consulta o status da assinatura SaaS recorrente de R$ 10,00."""
    now = int(time.time() * 1000)
    is_locked = False
    warning_message = None

    if saas_state["status"] == "active":
        is_locked = False
    elif saas_state["status"] == "grace_period":
        # 48h tolerance
        if saas_state.get("gracePeriodEnd") and now > saas_state["gracePeriodEnd"]:
            saas_state["status"] = "past_due"
            is_locked = True
        else:
            is_locked = False
            warning_message = "AVISO DE DUNNING: Falha na cobrança de R$ 10,00. Período de tolerância ativo (48h)."
    elif saas_state["status"] in ("past_due", "canceled", "unpaid"):
        is_locked = True

    return jsonify({
        "ok": True,
        "subscription": saas_state,
        "isLocked": is_locked,
        "warningMessage": warning_message,
    })

@app.route("/api/subscription/simulate-event", methods=["POST"])
def api_subscription_simulate_event():
    """Permite alternar/simular estados de assinatura (Webhook Stripe/Gateway)."""
    data = request.get_json(silent=True) or {}
    event = data.get("event")  # "payment_succeeded" | "payment_failed" | "canceled"

    now = int(time.time() * 1000)
    if event == "payment_succeeded":
        saas_state["status"] = "active"
        saas_state["gracePeriodEnd"] = None
        saas_state["currentPeriodEnd"] = now + (30 * 86400 * 1000)
    elif event == "payment_failed":
        saas_state["status"] = "grace_period"
        saas_state["gracePeriodEnd"] = now + (48 * 3600 * 1000) # 48h
    elif event == "lock_immediate":
        saas_state["status"] = "past_due"
        saas_state["gracePeriodEnd"] = now - 1000
    elif event == "canceled":
        saas_state["status"] = "canceled"
        saas_state["gracePeriodEnd"] = None

    return jsonify({
        "ok": True,
        "event": event,
        "subscription": saas_state,
    })

@app.route("/api/vault/purge", methods=["POST"])
def api_vault_purge():
    """Purga de emergência: Remove todas as chaves de API locais, zera contadores e limpa artefatos."""
    key_vars = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GEMINI_API_KEY", "GROK_API_KEY", "XAI_API_KEY", "DEEPSEEK_API_KEY"]
    for v in key_vars:
        if v in os.environ:
            del os.environ[v]

    env_file = BASE_DIR / ".env"
    if env_file.exists():
        try:
            env_file.unlink()
        except Exception:
            pass

    artifacts_manager.clear_all()
    for tracker in node_usage_tracker.values():
        tracker.requests_count = 0
        tracker.tokens_used = 0
        tracker.last_latency_ms = 0

    return jsonify({"ok": True, "message": "Purga de segurança executada. Todas as credenciais e dados locais foram destruídos."})

# ----------------- SYSTEM LIFECYCLE & APPLICATION EXIT -----------------

GLOBAL_DESKTOP_WINDOW = None
BROWSER_SUBPROCESS = None

@app.route("/api/system/exit", methods=["POST"])
def api_system_exit():
    """Encerra a aplicação NERV MAGI HUB, fecha janelas ativas e finaliza o processo."""
    def perform_shutdown():
        time.sleep(0.4)
        global GLOBAL_DESKTOP_WINDOW, BROWSER_SUBPROCESS
        if GLOBAL_DESKTOP_WINDOW:
            try:
                GLOBAL_DESKTOP_WINDOW.destroy()
            except Exception:
                pass
        if BROWSER_SUBPROCESS:
            try:
                BROWSER_SUBPROCESS.terminate()
            except Exception:
                pass
        # Cleanly exit main process
        os._exit(0)

    threading.Thread(target=perform_shutdown, daemon=True).start()
    return jsonify({
        "ok": True,
        "status": "TERMINATING",
        "message": "NERV MAGI HUB: Sessão encerrada. Desligando supercomputadores...",
    })

@app.route("/api/vault/image/<path:filename>", methods=["GET"])
def api_serve_vault_image(filename: str):
    """Serve imagens geradas diretamente do cofre local de arquivos NERV."""
    target = ARTIFACTS_DIR / filename
    if target.exists() and target.is_file():
        mime = "image/png"
        if filename.lower().endswith((".jpg", ".jpeg")):
            mime = "image/jpeg"
        elif filename.lower().endswith(".webp"):
            mime = "image/webp"
        return send_from_directory(str(ARTIFACTS_DIR), filename, mimetype=mime)
    return Response("Imagem não encontrada no cofre NERV", status=404)

@app.route("/api/vault/file/<path:filename>", methods=["GET"])
def api_serve_vault_file(filename: str):
    """Serve documentos e arquivos físicos gerados/convertidos diretamente do cofre NERV."""
    target = ARTIFACTS_DIR / filename
    if target.exists() and target.is_file():
        ext = target.suffix.lstrip(".").lower()
        mime_map = {
            "pdf": "application/pdf",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "doc": "application/msword",
            "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "xls": "application/vnd.ms-excel",
            "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "ppt": "application/vnd.ms-powerpoint",
            "png": "image/png",
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "txt": "text/plain; charset=utf-8",
        }
        mime = mime_map.get(ext, "application/octet-stream")
        return send_from_directory(str(ARTIFACTS_DIR), filename, mimetype=mime)
    return Response("Arquivo não encontrado no cofre NERV", status=404)

# ----------------- LGPD & AUDIT TRAIL ROUTES -----------------

@app.route("/api/lgpd/consent", methods=["GET"])
def api_get_lgpd_consent():
    return jsonify({"ok": True, "consent": get_lgpd_consent()})

@app.route("/api/lgpd/consent", methods=["POST"])
def api_save_lgpd_consent():
    data = request.get_json(silent=True) or {}
    accepted = bool(data.get("accepted", False))
    purposes = data.get("purposes") or [
        "ai_orchestration",
        "local_vault_storage",
        "autonomous_agents_execution",
        "audit_logging",
    ]
    record = save_lgpd_consent(accepted=accepted, purposes=purposes, actor_ip=request.remote_addr)
    return jsonify({"ok": True, "consent": record})

@app.route("/api/audit/logs", methods=["GET"])
def api_get_audit_logs():
    limit = min(200, max(1, int(request.args.get("limit", 50))))
    return jsonify({"ok": True, "logs": get_recent_audit_logs(limit=limit)})

# ----------------- AUTONOMOUS AGENTS (OPENCLAW GATEWAY) ROUTES -----------------

@app.route("/api/agents", methods=["GET"])
def api_list_agents():
    return jsonify({
        "ok": True,
        "gatewayStatus": "RUNNING",
        "agents": agent_gateway.list_agents(),
    })

@app.route("/api/agents", methods=["POST"])
def api_create_agent():
    data = request.get_json(silent=True) or {}
    if isinstance(data.get("customKeys"), dict):
        agent_gateway.update_runtime_keys(data["customKeys"])
    try:
        agent = agent_gateway.create_agent(data)
        return jsonify({"ok": True, "agent": agent}), 201
    except ValueError as err:
        return jsonify({"ok": False, "error": str(err)}), 400

@app.route("/api/agents/<agent_id>", methods=["DELETE"])
def api_delete_agent(agent_id: str):
    if agent_gateway.delete_agent(agent_id):
        return jsonify({"ok": True})
    return jsonify({"ok": False, "error": "Agente não encontrado."}), 404

@app.route("/api/agents/<agent_id>/toggle", methods=["POST"])
def api_toggle_agent(agent_id: str):
    data = request.get_json(silent=True) or {}
    try:
        agent = agent_gateway.toggle_agent(agent_id, enabled=data.get("enabled"))
        return jsonify({"ok": True, "agent": agent})
    except KeyError as err:
        return jsonify({"ok": False, "error": str(err)}), 404

@app.route("/api/agents/<agent_id>/run", methods=["POST"])
def api_run_agent(agent_id: str):
    data = request.get_json(silent=True) or {}
    custom_keys = data.get("customKeys") if isinstance(data.get("customKeys"), dict) else None
    event_payload = data.get("payload") if isinstance(data.get("payload"), dict) else None
    try:
        run_record = agent_gateway.run_agent(
            agent_id,
            trigger_source="manual",
            event_payload=event_payload,
            custom_keys=custom_keys,
        )
        return jsonify({"ok": True, "run": run_record})
    except KeyError as err:
        return jsonify({"ok": False, "error": str(err)}), 404

@app.route("/api/agents/<agent_id>/webhook", methods=["POST"])
def api_webhook_agent(agent_id: str):
    token = request.headers.get("X-Agent-Token") or request.args.get("token") or ""
    if not agent_gateway.verify_webhook_token(agent_id, token):
        return jsonify({"ok": False, "error": "Token de webhook inválido ou ausente."}), 401
    payload = request.get_json(silent=True) or {"raw": request.get_data(as_text=True)[:1000]}
    try:
        run_record = agent_gateway.run_agent(
            agent_id,
            trigger_source="webhook",
            event_payload=payload,
        )
        return jsonify({"ok": True, "run": run_record})
    except KeyError as err:
        return jsonify({"ok": False, "error": str(err)}), 404

@app.route("/api/agents/<agent_id>/memory", methods=["GET"])
def api_get_agent_memory(agent_id: str):
    try:
        return jsonify({
            "ok": True,
            "memory": agent_gateway.get_memory(agent_id),
            "runs": agent_gateway.get_run_history(agent_id),
        })
    except ValueError as err:
        return jsonify({"ok": False, "error": str(err)}), 400

@app.route("/api/agents/<agent_id>/memory", methods=["PUT"])
def api_save_agent_memory(agent_id: str):
    data = request.get_json(silent=True) or {}
    content = str(data.get("memory") or "")
    try:
        saved = agent_gateway.save_memory(agent_id, content)
        return jsonify({"ok": True, "memory": saved})
    except ValueError as err:
        return jsonify({"ok": False, "error": str(err)}), 400

# ----------------- MAIN LAUNCHER -----------------

def launch_desktop_window(url: str):
    """Abre o sistema NERV como um programa de desktop externo maximizado sem tela preta."""
    global GLOBAL_DESKTOP_WINDOW, BROWSER_SUBPROCESS

    # 1. Tentativa nativa via pywebview (janela Windows independente sem elementos de navegador)
    try:
        import webview
        icon_path = str(BASE_DIR / "nerv_icon.ico") if (BASE_DIR / "nerv_icon.ico").exists() else None
        # Evita fullscreen exclusivo que suspende DirectComposition no Windows; usa maximized
        window = webview.create_window(
            title="NERV CENTRAL DOGMA // MAGI SUPERCOMPUTER SYSTEM",
            url=url,
            fullscreen=False,
            maximized=True,
            background_color="#070504",
            text_select=True,
            zoomable=True,
            confirm_close=False,
            min_size=(1024, 600),
        )
        GLOBAL_DESKTOP_WINDOW = window
        print("[NERV GUI] Janela de aplicativo nativo maximizada iniciada.")
        webview.start(icon=icon_path, debug=False)
        return
    except Exception as err:
        print(f"[NERV GUI] pywebview indisponível ({err}). Ativando modo aplicativo de alta fidelidade...")

    # 2. Fallback: Janela de aplicativo Edge/Chrome dedicada em tela cheia (--app / --start-fullscreen)
    candidates = [
        os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%LocalAppData%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe"),
    ]

    for exe in candidates:
        if os.path.exists(exe):
            try:
                import subprocess
                creationflags = 0x08000000 if sys.platform == "win32" else 0
                p = subprocess.Popen([exe, f"--app={url}", "--start-fullscreen"], creationflags=creationflags)
                BROWSER_SUBPROCESS = p
                print(f"[NERV GUI] Executado em modo aplicativo dedicado via: {exe}")
                return
            except Exception:
                continue

    # 3. Fallback final
    webbrowser.open(url)

def launch_magi_server(native_window: bool = True):
    port = find_available_port(CONFIG_PORT)
    url = f"http://127.0.0.1:{port}/"

    print("=" * 65)
    print("      NERV CENTRAL DOGMA // MAGI SUPERCOMPUTER SYSTEM")
    print(f"             PORTAL ATIVO EM: {url}")
    print("=" * 65)
    print("Pressione o botão ENCERRAR no terminal, ALT+F4 ou feche a janela para finalizar.")

    # Inicia o Gateway de Agentes Autônomos (OpenClaw)
    agent_gateway.start()

    # Inicia o servidor Flask em thread daemon de background
    flask_thread = threading.Thread(
        target=lambda: app.run(host="127.0.0.1", port=port, debug=False, threaded=True, use_reloader=False),
        daemon=True,
    )
    flask_thread.start()

    time.sleep(0.8)

    if native_window:
        launch_desktop_window(url)
    else:
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass

if __name__ == "__main__":
    import multiprocessing
    multiprocessing.freeze_support()
    launch_magi_server(native_window=True)

