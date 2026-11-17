"""NERV CENTRAL DOGMA // AI ORCHESTRATOR & WORKFLOW ENGINE
Módulo avançado de orquestração de IAs:
- /mtask: Disparo simultâneo com agregação resiliente (Gather parcial) e síntese com notas de timeout
- /otask: Decomposição de tarefas isoladas em etapas independentes com re-tentativa individual (Retry)
- /pipe: Pipeline sequencial em cascata com Circuit Breaker imediato e Retry com contexto preservado
"""
import os
import re
import json
import time
import uuid
import logging
from typing import Dict, Any, List, Optional
from concurrent.futures import ThreadPoolExecutor, TimeoutError, as_completed

from config import format_system_prompt
from artifacts_manager import artifacts_manager
from providers import (
    execute_single_provider,
    CALLERS,
    sanitize_error_message,
    enrich_image_response,
)

logger = logging.getLogger("nerv.orchestrator")

# Global configurable timeout in seconds (Default: 50s, configurable between 45s and 60s)
DEFAULT_ORCHESTRATOR_TIMEOUT = int(os.environ.get("GLOBAL_WORKFLOW_TIMEOUT", "50"))

# Active in-memory workflow store for recovery and retry
WORKFLOW_CACHE: Dict[str, Dict[str, Any]] = {}

def get_node_display_name(node_id: str) -> str:
    mapping = {
        "chatgpt": "UNIT-00 (ChatGPT)",
        "claude": "UNIT-01 (Claude)",
        "gemini": "UNIT-02 (Gemini)",
        "grok": "UNIT-03 (Grok)",
        "deepseek": "UNIT-04 (DeepSeek)",
    }
    return mapping.get(node_id, f"UNIT-?? ({node_id})")

def execute_with_timeout(
    provider_id: str,
    prompt: str,
    custom_api_key: Optional[str] = None,
    history: Optional[List[Dict[str, Any]]] = None,
    angel_context: Optional[str] = None,
    timeout_seconds: int = DEFAULT_ORCHESTRATOR_TIMEOUT,
) -> Dict[str, Any]:
    """Executa um nó de IA com timeout estrito e sanitização de falhas."""
    start_time = time.time()
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(
            execute_single_provider,
            provider_id,
            prompt,
            custom_api_key,
            history,
            angel_context,
        )
        try:
            result = future.result(timeout=timeout_seconds)
            elapsed_ms = int((time.time() - start_time) * 1000)
            result["durationMs"] = elapsed_ms
            return result
        except TimeoutError:
            elapsed_ms = int((time.time() - start_time) * 1000)
            node_name = get_node_display_name(provider_id)
            raise TimeoutError(
                f"Tempo limite global esgotado [{timeout_seconds}s] na conexão com {node_name}."
            )
        except Exception as err:
            sensitive = [custom_api_key] if custom_api_key else []
            clean_err = sanitize_error_message(str(err), sensitive)
            raise RuntimeError(clean_err)

# =========================================================================
# 1. PARSER DE INTENÇÕES & DECOMPOSIÇÃO (/otask e /pipe)
# =========================================================================

def plan_workflow_decomposition(
    prompt: str,
    workflow_type: str,
    orchestrator_node: str = "claude",
    custom_keys: Optional[Dict[str, str]] = None,
    angel_context: Optional[str] = None,
    timeout_seconds: int = DEFAULT_ORCHESTRATOR_TIMEOUT,
) -> Dict[str, Any]:
    """Utiliza o Agente Orquestrador selecionado (Default: Claude) para planejar e fragmentar as etapas."""
    custom_keys = custom_keys or {}
    workflow_id = f"wf-{uuid.uuid4().hex[:8]}"

    # Valida nó orquestrador com fallback seguro se o selecionado não existir
    if orchestrator_node not in CALLERS:
        orchestrator_node = "claude"

    system_instruction = (
        f"VOCÊ É O AGENTE ORQUESTRADOR TÁTICO DO SISTEMA MAGI DA NERV.\n"
        f"Sua missão é analisar criticamente a diretriz do operador e estruturar uma partição de etapas.\n"
        f"Tipo de Workflow: {'PIPELINE EM CASCATA' if workflow_type == 'pipe' else 'TAREFAS ISOLADAS'}.\n\n"
        f"Regras de partição:\n"
        f"- Para /pipe: Estruture entre 2 a 4 etapas encadeadas onde a saída de uma alimenta a próxima.\n"
        f"- Para /otask: Estruture entre 2 a 4 etapas independentes e modulares que possam ser executadas em paralelo.\n"
        f"- Atribua para cada etapa uma IA sugerida dentre: 'claude', 'chatgpt', 'gemini', 'grok', 'deepseek'.\n"
        f"- Retorne ESTRITAMENTE um objeto JSON válido no seguinte formato, sem textos adicionais fora do JSON:\n"
        f"{{\n"
        f'  "summary": "Resumo executivo do plano em 1 linha",\n'
        f'  "steps": [\n'
        f'    {{\n'
        f'      "id": "step_1",\n'
        f'      "title": "Título conciso da Etapa 1",\n'
        f'      "description": "Objetivo técnico e artefato esperado",\n'
        f'      "assignedNode": "claude",\n'
        f'      "inputPrompt": "Instrução tática específica e completa a ser enviada ao nó executor"\n'
        f'    }}\n'
        f'  ]\n'
        f"}}"
    )

    decomposition_prompt = (
        f"[DIRETIVA DO OPERADOR PARA FRAGMENTAÇÃO ({workflow_type.upper()})]:\n"
        f"\"{prompt}\"\n\n"
        f"Gere o plano de etapas em JSON estruturado:"
    )

    raw_response_text = ""
    try:
        orch_key = custom_keys.get(orchestrator_node)
        call_res = execute_with_timeout(
            orchestrator_node,
            decomposition_prompt,
            custom_api_key=orch_key,
            angel_context=angel_context,
            timeout_seconds=timeout_seconds,
        )
        raw_response_text = call_res.get("text", "")
    except Exception as err:
        logger.warning("Falha no orquestrador %s ao planejar: %s. Aplicando fallback determinístico.", orchestrator_node, err)
        raw_response_text = ""

    # Extrai e valida JSON
    parsed_plan = _extract_json_plan(raw_response_text, prompt, workflow_type)

    steps_data = []
    for idx, s in enumerate(parsed_plan.get("steps", [])):
        step_id = s.get("id") or f"step_{idx + 1}"
        assigned = s.get("assignedNode") or "claude"
        if assigned not in CALLERS:
            assigned = "claude"
        steps_data.append({
            "id": step_id,
            "stepIndex": idx + 1,
            "title": s.get("title") or f"Etapa {idx + 1}",
            "description": s.get("description") or f"Processamento técnico da etapa {idx + 1}",
            "assignedNode": assigned,
            "assignedNodeName": get_node_display_name(assigned),
            "inputPrompt": s.get("inputPrompt") or prompt,
            "status": "PENDING",
            "output": None,
            "error": None,
            "durationMs": None,
            "files": [],
            "retryCount": 0,
        })

    plan_obj = {
        "workflowId": workflow_id,
        "workflowType": workflow_type,
        "originalPrompt": prompt,
        "orchestratorNode": orchestrator_node,
        "orchestratorName": get_node_display_name(orchestrator_node),
        "summary": parsed_plan.get("summary", f"Plano {workflow_type.upper()} gerado por {get_node_display_name(orchestrator_node)}"),
        "steps": steps_data,
        "status": "AWAITING_DELEGATION",
        "circuitBreakerTripped": False,
        "failedStepId": None,
        "synthesis": None,
        "synthesisFootnote": None,
        "createdAt": int(time.time() * 1000),
        "completedAt": None,
    }

    WORKFLOW_CACHE[workflow_id] = plan_obj
    return plan_obj

def _extract_json_plan(raw_text: str, original_prompt: str, workflow_type: str) -> Dict[str, Any]:
    """Parse seguro de JSON vindo da IA com resiliência a blocos markdown e fallbacks."""
    if raw_text:
        # Tenta extrair bloco ```json ... ```
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw_text)
        candidate = match.group(1).strip() if match else raw_text.strip()
        try:
            data = json.loads(candidate)
            if isinstance(data, dict) and "steps" in data and len(data["steps"]) > 0:
                return data
        except Exception:
            # Tenta encontrar primeiro { e último }
            start = candidate.find("{")
            end = candidate.rfind("}")
            if start != -1 and end != -1 and end > start:
                try:
                    data = json.loads(candidate[start : end + 1])
                    if isinstance(data, dict) and "steps" in data:
                        return data
                except Exception:
                    pass

    # Fallback Determinístico inteligente caso a resposta não seja um JSON estruturado
    if workflow_type == "pipe":
        return {
            "summary": "Pipeline de Sequência Técnica (Arquitetura, Implementação e Validação)",
            "steps": [
                {
                    "id": "step_1",
                    "title": "Etapa 1: Análise e Arquitetura de Requisitos",
                    "description": "Especificação técnica, modelagem e premissas de execução.",
                    "assignedNode": "claude",
                    "inputPrompt": f"Analise em profundidade a diretriz do operador e projete a arquitetura técnica recomendada e requisitos:\n\n{original_prompt}",
                },
                {
                    "id": "step_2",
                    "title": "Etapa 2: Implementação e Construção de Artefatos",
                    "description": "Desenvolvimento do código, algoritmos ou conteúdo detalhado.",
                    "assignedNode": "chatgpt",
                    "inputPrompt": f"Com base na arquitetura e diretrizes técnicas, desenvolva a solução completa e seus artefatos operacionais:\n\n{original_prompt}",
                },
                {
                    "id": "step_3",
                    "title": "Etapa 3: Revisão Crítica, Otimização e Fechamento",
                    "description": "Validação de segurança, resiliência de falhas e guia de aplicação.",
                    "assignedNode": "deepseek",
                    "inputPrompt": f"Revise criticamente os artefatos gerados, identifique vulnerabilidades ou melhorias e formate o parecer conclusivo:\n\n{original_prompt}",
                },
            ],
        }
    else:  # otask
        return {
            "summary": "Orquestração de Tarefas Modulares e Independentes",
            "steps": [
                {
                    "id": "step_1",
                    "title": "Módulo A: Proposta e Implementação Técnica",
                    "description": "Elaboração do núcleo funcional e regras de negócio.",
                    "assignedNode": "claude",
                    "inputPrompt": f"Execute a primeira vertente da diretriz focando na modelagem técnica e código central:\n\n{original_prompt}",
                },
                {
                    "id": "step_2",
                    "title": "Módulo B: Análise de Resiliência e Casos de Borda",
                    "description": "Avaliação de segurança, concorrência e tolerância a falhas.",
                    "assignedNode": "deepseek",
                    "inputPrompt": f"Execute a segunda vertente analisando segurança, timeouts e estratégias de contingência:\n\n{original_prompt}",
                },
            ],
        }

# =========================================================================
# 2. FLUXO A: MÚLTIPLAS RESPOSTAS RESILIENTES (/mtask)
# =========================================================================

def execute_mtask_workflow(
    prompt: str,
    active_nodes: List[str],
    orchestrator_node: str = "claude",
    custom_keys: Optional[Dict[str, str]] = None,
    angel_context: Optional[str] = None,
    timeout_seconds: int = DEFAULT_ORCHESTRATOR_TIMEOUT,
) -> Dict[str, Any]:
    """Dispara requisições paralelas para todas as IAs ativas.
    Tratamento de Timeout/Falha: Gather parcial das respostas bem-sucedidas.
    Síntese do Orquestrador com nota de rodapé identificando as IAs que falharam/expiraram.
    """
    custom_keys = custom_keys or {}
    start_time = time.time()
    valid_nodes = [n for n in active_nodes if n in CALLERS]
    if not valid_nodes:
        raise ValueError("Nenhum nó de IA ativo e válido para o fluxo /mtask.")

    tasks = {}
    successful_responses: List[Dict[str, Any]] = []
    failed_nodes: List[Dict[str, Any]] = []

    # Disparo paralelo assíncrono com ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=len(valid_nodes)) as executor:
        for node_id in valid_nodes:
            key = custom_keys.get(node_id)
            future = executor.submit(
                execute_with_timeout,
                node_id,
                prompt,
                custom_api_key=key,
                angel_context=angel_context,
                timeout_seconds=timeout_seconds,
            )
            tasks[future] = node_id

        for future in as_completed(tasks):
            node_id = tasks[future]
            node_name = get_node_display_name(node_id)
            try:
                res = future.result()
                successful_responses.append(res)
            except TimeoutError:
                failed_nodes.append({
                    "nodeId": node_id,
                    "nodeName": node_name,
                    "reason": f"Timeout [{timeout_seconds}s]",
                })
            except Exception as err:
                failed_nodes.append({
                    "nodeId": node_id,
                    "nodeName": node_name,
                    "reason": str(err)[:120],
                })

    # Ordena as respostas bem-sucedidas preservando a sequência de entrada
    successful_responses.sort(key=lambda r: valid_nodes.index(r["provider"]) if r["provider"] in valid_nodes else 999)

    # Coleta de arquivos gerados nas respostas bem-sucedidas
    all_files = [f for r in successful_responses for f in r.get("files", [])]

    # Elabora a síntese pelo Agente Orquestrador
    synthesis_text = ""
    footnote_text = ""

    if failed_nodes:
        failed_labels = [f"A IA '{f['nodeName']}' ({f['reason']})" for f in failed_nodes]
        footnote_text = f"Nota: {', '.join(failed_labels)} não respondeu a tempo."

    if successful_responses:
        # Prompt de Síntese para o Orquestrador
        synthesis_input = (
            f"DIRETIVA ORIGINAL DO OPERADOR:\n\"{prompt}\"\n\n"
            f"RESPOSTAS COLETADAS COM SUCESSO ({len(successful_responses)} de {len(valid_nodes)} IAs):\n\n"
        )
        for idx, resp in enumerate(successful_responses):
            synthesis_input += (
                f"--- [PARECER {idx + 1}: {resp['name']}] ---\n"
                f"{resp['text'][:2500]}\n\n"
            )

        if failed_nodes:
            synthesis_input += (
                f"[AVISO DE NÓS INOPERANTES / TIMEOUT]:\n"
                f"{footnote_text}\n\n"
            )

        synthesis_input += (
            f"INSTRUÇÃO DO ORQUESTRADOR:\n"
            f"Elabore a síntese tática final consolidando os pontos de consenso e melhores propostas das IAs respondentes. "
            f"No final do seu parecer, inclua a nota de rodapé indicada."
        )

        try:
            orch_key = custom_keys.get(orchestrator_node)
            orch_res = execute_with_timeout(
                orchestrator_node,
                synthesis_input,
                custom_api_key=orch_key,
                angel_context=angel_context,
                timeout_seconds=timeout_seconds,
            )
            synthesis_text = orch_res.get("text", "")
            # Adiciona arquivos gerados pelo orquestrador se houver
            all_files.extend(orch_res.get("files", []))
        except Exception as err:
            logger.warning("Falha na síntese do orquestrador %s: %s", orchestrator_node, err)
            synthesis_text = (
                f"### SÍNTESE TÁTICA /mtask (CONSOLIDAÇÃO DIRETA MAGI)\n\n"
                f"Foram coletadas {len(successful_responses)} respostas bem-sucedidas de {len(valid_nodes)} nós acionados.\n\n"
                + (f"> **{footnote_text}**\n\n" if footnote_text else "")
            )
    else:
        synthesis_text = (
            f"### ALERTA DE SISTEMA: NENHUMA IA RESPONDEU DENTRO DO TEMPO LIMITE\n"
            f"Todas as requisições ({len(valid_nodes)}) estouraram o timeout de {timeout_seconds}s ou apresentaram erro.\n"
            + (f"> **{footnote_text}**" if footnote_text else "")
        )

    return {
        "workflowType": "mtask",
        "orchestratorNode": orchestrator_node,
        "orchestratorName": get_node_display_name(orchestrator_node),
        "totalNodes": len(valid_nodes),
        "successfulCount": len(successful_responses),
        "failedCount": len(failed_nodes),
        "responses": successful_responses,
        "failedNodes": failed_nodes,
        "synthesis": synthesis_text,
        "footnote": footnote_text,
        "files": all_files,
        "durationMs": int((time.time() - start_time) * 1000),
    }

# =========================================================================
# 3. FLUXO B: ORQUESTRAÇÃO DE TAREFAS ISOLADAS (/otask)
# =========================================================================

def execute_otask_workflow(
    plan: Dict[str, Any],
    custom_keys: Optional[Dict[str, str]] = None,
    angel_context: Optional[str] = None,
    timeout_seconds: int = DEFAULT_ORCHESTRATOR_TIMEOUT,
) -> Dict[str, Any]:
    """Executa as tarefas isoladas de forma independente.
    Se uma etapa falhar, seu bloco exibe status ERROR/TIMEOUT para 'Repetir Tarefa',
    enquanto os outros blocos bem-sucedidos são entregues normalmente.
    """
    custom_keys = custom_keys or {}
    start_time = time.time()
    steps = plan.get("steps", [])
    workflow_id = plan.get("workflowId", f"wf-{uuid.uuid4().hex[:8]}")
    orchestrator_node = plan.get("orchestratorNode", "claude")

    # Mapeamento e disparo em paralelo das etapas isoladas
    def _run_single_otask_step(step_dict: Dict[str, Any]) -> Dict[str, Any]:
        node_id = step_dict.get("assignedNode", "claude")
        prompt = step_dict.get("inputPrompt") or plan.get("originalPrompt", "")
        key = custom_keys.get(node_id)
        step_copy = dict(step_dict)
        step_copy["status"] = "WORKING"
        step_start = time.time()

        try:
            res = execute_with_timeout(
                node_id,
                prompt,
                custom_api_key=key,
                angel_context=angel_context,
                timeout_seconds=timeout_seconds,
            )
            step_copy["status"] = "COMPLETED"
            step_copy["output"] = res.get("text", "")
            step_copy["files"] = res.get("files", [])
            step_copy["durationMs"] = int((time.time() - step_start) * 1000)
            step_copy["error"] = None
        except TimeoutError as te:
            step_copy["status"] = "TIMEOUT"
            step_copy["error"] = str(te)
            step_copy["durationMs"] = int((time.time() - step_start) * 1000)
        except Exception as err:
            step_copy["status"] = "ERROR"
            step_copy["error"] = str(err)
            step_copy["durationMs"] = int((time.time() - step_start) * 1000)

        return step_copy

    updated_steps = []
    with ThreadPoolExecutor(max_workers=max(len(steps), 1)) as executor:
        future_map = {executor.submit(_run_single_otask_step, s): s["id"] for s in steps}
        results_by_id = {}
        for future in as_completed(future_map):
            step_res = future.result()
            results_by_id[step_res["id"]] = step_res

        # Restaura a ordem original das etapas
        for s in steps:
            updated_steps.append(results_by_id.get(s["id"], s))

    # Consolida síntese final caso haja etapas concluídas
    completed_steps = [s for s in updated_steps if s.get("status") == "COMPLETED"]
    failed_steps = [s for s in updated_steps if s.get("status") in ("TIMEOUT", "ERROR")]

    all_files = [f for s in completed_steps for f in s.get("files", [])]
    synthesis = ""

    if completed_steps:
        synthesis_prompt = (
            f"DIRETIVA DO OPERADOR (/otask):\n\"{plan.get('originalPrompt', '')}\"\n\n"
            f"RESULTADO DAS ETAPAS ISOLADAS EXECUTADAS:\n\n"
        )
        for s in completed_steps:
            synthesis_prompt += (
                f"### [ETAPA {s['stepIndex']}: {s['title']} // {s['assignedNodeName']}]\n"
                f"{s.get('output', '')[:2000]}\n\n"
            )

        if failed_steps:
            synthesis_prompt += (
                f"[ATENÇÃO: ETAPAS COM FALHA OU TIMEOUT]:\n"
                + "\n".join([f"- Etapa {fs['stepIndex']} ({fs['title']}): {fs.get('error')}" for fs in failed_steps])
                + "\nO operador pode utilizar o botão 'Repetir Tarefa' nos blocos correspondentes.\n\n"
            )

        synthesis_prompt += (
            f"Formate um resumo consolidado do pacote de tarefas entregues e indique claramente as etapas pendentes de repetição."
        )

        try:
            orch_key = custom_keys.get(orchestrator_node)
            orch_res = execute_with_timeout(
                orchestrator_node,
                synthesis_prompt,
                custom_api_key=orch_key,
                angel_context=angel_context,
                timeout_seconds=timeout_seconds,
            )
            synthesis = orch_res.get("text", "")
            all_files.extend(orch_res.get("files", []))
        except Exception as err:
            synthesis = (
                f"### RELATÓRIO DE EXECUÇÃO MODULAR (/otask)\n\n"
                f"Tarefas concluídas: {len(completed_steps)} de {len(steps)}.\n"
                + (f"Tarefas pendentes de repetição: {len(failed_steps)}." if failed_steps else "Todas as tarefas foram concluídas com êxito.")
            )

    plan["steps"] = updated_steps
    plan["status"] = "COMPLETED" if not failed_steps else "PARTIAL_SUCCESS"
    plan["synthesis"] = synthesis
    plan["files"] = all_files
    plan["completedAt"] = int(time.time() * 1000)

    WORKFLOW_CACHE[workflow_id] = plan
    return plan

def retry_single_otask_step(
    workflow_id: str,
    step_id: str,
    assigned_node: Optional[str] = None,
    custom_keys: Optional[Dict[str, str]] = None,
    angel_context: Optional[str] = None,
    timeout_seconds: int = DEFAULT_ORCHESTRATOR_TIMEOUT,
) -> Dict[str, Any]:
    """Repete individualmente uma tarefa isolada que tenha falhado ou sofrido timeout."""
    custom_keys = custom_keys or {}
    plan = WORKFLOW_CACHE.get(workflow_id)
    if not plan:
        raise ValueError(f"Workflow com id {workflow_id} não encontrado no cache ativo.")

    target_step = None
    for s in plan.get("steps", []):
        if s["id"] == step_id:
            target_step = s
            break

    if not target_step:
        raise ValueError(f"Etapa {step_id} não encontrada no workflow {workflow_id}.")

    if assigned_node and assigned_node in CALLERS:
        target_step["assignedNode"] = assigned_node
        target_step["assignedNodeName"] = get_node_display_name(assigned_node)

    node_id = target_step["assignedNode"]
    key = custom_keys.get(node_id)
    prompt = target_step.get("inputPrompt") or plan.get("originalPrompt", "")

    target_step["status"] = "WORKING"
    target_step["retryCount"] = target_step.get("retryCount", 0) + 1
    step_start = time.time()

    try:
        res = execute_with_timeout(
            node_id,
            prompt,
            custom_api_key=key,
            angel_context=angel_context,
            timeout_seconds=timeout_seconds,
        )
        target_step["status"] = "COMPLETED"
        target_step["output"] = res.get("text", "")
        target_step["files"] = res.get("files", [])
        target_step["durationMs"] = int((time.time() - step_start) * 1000)
        target_step["error"] = None
    except TimeoutError as te:
        target_step["status"] = "TIMEOUT"
        target_step["error"] = str(te)
        target_step["durationMs"] = int((time.time() - step_start) * 1000)
    except Exception as err:
        target_step["status"] = "ERROR"
        target_step["error"] = str(err)
        target_step["durationMs"] = int((time.time() - step_start) * 1000)

    # Recalcula status geral do workflow
    failed = [s for s in plan.get("steps", []) if s.get("status") in ("TIMEOUT", "ERROR")]
    plan["status"] = "COMPLETED" if not failed else "PARTIAL_SUCCESS"

    WORKFLOW_CACHE[workflow_id] = plan
    return {
        "workflowId": workflow_id,
        "step": target_step,
        "overallStatus": plan["status"],
    }

# =========================================================================
# 4. FLUXO C: PIPELINE EM CASCATA COM CIRCUIT BREAKER (/pipe)
# =========================================================================

def execute_pipe_workflow(
    plan: Dict[str, Any],
    start_from_step_id: Optional[str] = None,
    custom_keys: Optional[Dict[str, str]] = None,
    angel_context: Optional[str] = None,
    timeout_seconds: int = DEFAULT_ORCHESTRATOR_TIMEOUT,
) -> Dict[str, Any]:
    """Execução encadeada: Output da Etapa N alimenta a Etapa N+1.
    Circuit Breaker: Se qualquer etapa sofrer Timeout ou Erro, interrompe imediatamente o pipeline,
    preservando tokens e permitindo Retry a partir da etapa que falhou.
    """
    custom_keys = custom_keys or {}
    start_time = time.time()
    workflow_id = plan.get("workflowId", f"wf-{uuid.uuid4().hex[:8]}")
    steps = plan.get("steps", [])
    orchestrator_node = plan.get("orchestratorNode", "claude")

    start_index = 0
    if start_from_step_id:
        for idx, s in enumerate(steps):
            if s["id"] == start_from_step_id:
                start_index = idx
                break

    circuit_breaker_tripped = False
    failed_step_id = None
    accumulated_context = ""

    # Se estiver resumindo, recupera o contexto das etapas já completadas anteriores
    if start_index > 0:
        for prev_step in steps[:start_index]:
            if prev_step.get("status") == "COMPLETED" and prev_step.get("output"):
                accumulated_context += (
                    f"\n--- [ARTEFATO DA ETAPA {prev_step['stepIndex']}: {prev_step['title']}] ---\n"
                    f"{prev_step['output']}\n"
                )

    for idx in range(start_index, len(steps)):
        step = steps[idx]

        if circuit_breaker_tripped:
            step["status"] = "SKIPPED"
            step["error"] = "Pulado: Circuit breaker interrompeu o pipeline devido a falha na etapa anterior."
            continue

        node_id = step.get("assignedNode", "claude")
        key = custom_keys.get(node_id)
        step_start = time.time()
        step["status"] = "WORKING"

        # Constrói o prompt encadeado incorporando a saída acumulada da etapa anterior
        chained_prompt = step.get("inputPrompt", "")
        if accumulated_context.strip():
            chained_prompt = (
                f"{chained_prompt}\n\n"
                f"=======================================================\n"
                f"[ARTEFATOS E SAÍDAS GERADAS NAS ETAPAS ANTERIORES DO PIPELINE]:\n"
                f"{accumulated_context}\n"
                f"=======================================================\n"
                f"Instrução: Utilize rigorosamente os insumos acima para dar continuidade à cadeia produtiva."
            )

        try:
            res = execute_with_timeout(
                node_id,
                chained_prompt,
                custom_api_key=key,
                angel_context=angel_context,
                timeout_seconds=timeout_seconds,
            )
            step["status"] = "COMPLETED"
            step["output"] = res.get("text", "")
            step["files"] = res.get("files", [])
            step["durationMs"] = int((time.time() - step_start) * 1000)
            step["error"] = None

            # Alimenta o contexto para as etapas subsequentes
            accumulated_context += (
                f"\n--- [ARTEFATO DA ETAPA {step['stepIndex']}: {step['title']} // {step['assignedNodeName']}] ---\n"
                f"{step['output']}\n"
            )
        except TimeoutError as te:
            # CIRCUIT BREAKER ACIONADO
            step["status"] = "TIMEOUT"
            step["error"] = f"Timeout [{timeout_seconds}s]: {te}"
            step["durationMs"] = int((time.time() - step_start) * 1000)
            circuit_breaker_tripped = True
            failed_step_id = step["id"]
            logger.warning("Circuit breaker ativado no pipeline %s na etapa %s (TIMEOUT)", workflow_id, step["id"])
        except Exception as err:
            # CIRCUIT BREAKER ACIONADO
            step["status"] = "ERROR"
            step["error"] = f"Falha na execução: {err}"
            step["durationMs"] = int((time.time() - step_start) * 1000)
            circuit_breaker_tripped = True
            failed_step_id = step["id"]
            logger.warning("Circuit breaker ativado no pipeline %s na etapa %s (ERRO: %s)", workflow_id, step["id"], err)

    plan["circuitBreakerTripped"] = circuit_breaker_tripped
    plan["failedStepId"] = failed_step_id

    # Coleta de todos os arquivos gerados até a interrupção ou término
    all_files = [f for s in steps if s.get("status") == "COMPLETED" for f in s.get("files", [])]

    if circuit_breaker_tripped:
        plan["status"] = "HALTED_CIRCUIT_BREAKER"
        failed_step = next((s for s in steps if s["id"] == failed_step_id), None)
        failed_num = failed_step["stepIndex"] if failed_step else "?"
        plan["synthesis"] = (
            f"### [ALERTA DE SEGURANÇA // CIRCUIT BREAKER ACIONADO]\n\n"
            f"O pipeline foi **interrompido preventivamente** na **Etapa {failed_num}** ({failed_step['title'] if failed_step else ''}) "
            f"para evitar desperdício de tokens e chamadas em cascata inválidas.\n\n"
            f"- **Causa**: {failed_step.get('error', 'Timeout ou erro na API') if failed_step else 'Falha no nó'}\n"
            f"- **Artefatos Anteriores**: Preservados com sucesso no cofre de dados.\n"
            f"- **Ação Recomendada**: Clique em **'Repetir a partir desta etapa'** na interface para retomar a execução."
        )
    else:
        plan["status"] = "COMPLETED"
        # Síntese final com Orquestrador
        synthesis_prompt = (
            f"DIRETIVA ORIGINAL DO PIPELINE (/pipe):\n\"{plan.get('originalPrompt', '')}\"\n\n"
            f"CADEIA DE EXECUÇÃO CONCLUÍDA COM SUCESSO ({len(steps)} etapas):\n\n"
        )
        for s in steps:
            synthesis_prompt += (
                f"### [ETAPA {s['stepIndex']}: {s['title']} // {s['assignedNodeName']}]\n"
                f"{s.get('output', '')[:2000]}\n\n"
            )
        synthesis_prompt += (
            f"INSTRUÇÃO DO ORQUESTRADOR:\n"
            f"Formate o pacote final de entrega técnica integrando com excelência todos os artefatos das etapas acima."
        )

        try:
            orch_key = custom_keys.get(orchestrator_node)
            orch_res = execute_with_timeout(
                orchestrator_node,
                synthesis_prompt,
                custom_api_key=orch_key,
                angel_context=angel_context,
                timeout_seconds=timeout_seconds,
            )
            plan["synthesis"] = orch_res.get("text", "")
            all_files.extend(orch_res.get("files", []))
        except Exception as err:
            plan["synthesis"] = (
                f"### PIPELINE EXECUTADO COM SUCESSO ({len(steps)} ETAPAS)\n\n"
                f"Todos os artefatos e saídas encadeadas foram gerados e armazenados com integridade."
            )

    plan["files"] = all_files
    plan["completedAt"] = int(time.time() * 1000)

    WORKFLOW_CACHE[workflow_id] = plan
    return plan
