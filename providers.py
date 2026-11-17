"""NERV CENTRAL DOGMA // MAGI NEURAL PROVIDERS ENGINE
Rotinas de inferência simultânea para os nós:
- UNIT-00: ChatGPT (OpenAI)
- UNIT-01: Claude (Anthropic)
- UNIT-02: Gemini (Google GenAI)
- UNIT-03: Grok (xAI)
- UNIT-04: DeepSeek (DeepSeek AI)
"""
import os
import re
import time
import json
import math
import base64
import random
import urllib.parse
from typing import Dict, Any, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests

from config import (
    ARTIFACTS_DIR,
    format_system_prompt,
    DEFAULT_OPENAI_MODEL,
    DEFAULT_ANTHROPIC_MODEL,
    DEFAULT_GEMINI_MODEL,
    DEFAULT_GROK_MODEL,
    DEFAULT_DEEPSEEK_MODEL,
)
from artifacts_manager import artifacts_manager

# Telemetry tracking for each MAGI node
class NodeUsageStats:
    def __init__(self, last_latency_ms: int = 250):
        self.requests_count = 0
        self.tokens_used = 0
        self.last_latency_ms = last_latency_ms

    def record_usage(self, prompt_len: int, text_len: int, latency_ms: int):
        self.requests_count += 1
        self.tokens_used += math.ceil((prompt_len + text_len) / 3.5)
        self.last_latency_ms = latency_ms

node_usage_tracker: Dict[str, NodeUsageStats] = {
    "chatgpt": NodeUsageStats(280),
    "claude": NodeUsageStats(310),
    "gemini": NodeUsageStats(190),
    "grok": NodeUsageStats(250),
    "deepseek": NodeUsageStats(220),
}

def sanitize_error_message(msg: str, sensitive_strings: Optional[List[str]] = None) -> str:
    cleaned = str(msg)
    if sensitive_strings:
        for s in sensitive_strings:
            if s and len(s) > 4:
                cleaned = cleaned.replace(s, "[CHAVE_OCULTADA_POR_SEGURANCA]")
    # Mask any generic API key patterns
    cleaned = re.sub(r"sk-[a-zA-Z0-9_\-]{16,}", "sk-***[PROTEGIDA]***", cleaned)
    cleaned = re.sub(r"AIza[a-zA-Z0-9_\-]{16,}", "AIza***[PROTEGIDA]***", cleaned)
    cleaned = re.sub(r"xai-[a-zA-Z0-9_\-]{16,}", "xai-***[PROTEGIDA]***", cleaned)
    return cleaned

def is_image_request(prompt: str) -> bool:
    keywords = [
        "imagem", "foto", "fotografia", "desenhe", "desenho", "desenhar",
        "ilustre", "ilustracao", "ilustração", "gerar imagem", "crie uma imagem",
        "faça uma imagem", "image", "draw", "picture", "photo", "render", "pintura", "wallpaper"
    ]
    p_lower = prompt.lower()
    return any(k in p_lower for k in keywords)

def refine_image_prompt(raw_prompt: str) -> str:
    """Extrai e enriquece a diretiva de imagem para garantir alta fidelidade na síntese do modelo."""
    clean = raw_prompt
    for prefix in [
        "gere uma imagem de", "gere uma imagem", "crie uma imagem de", "crie uma imagem",
        "faça uma imagem de", "faça uma imagem", "desenhe um", "desenhe uma", "desenhe",
        "desenho de", "ilustre um", "ilustre uma", "ilustre", "imagem de", "foto de",
        "render 3d de", "pintura de", "wallpaper de", "generate an image of",
        "generate image of", "generate image", "create image of", "draw a", "draw"
    ]:
        clean = re.sub(re.escape(prefix), "", clean, flags=re.IGNORECASE)
    clean = clean.strip() or "evangelion mecha anime art masterpiece"
    # Basic translation mapping for common Portuguese prompt terms
    translations = {
        "robô": "mecha robot",
        "robo": "mecha robot",
        "vermelho": "red",
        "azul": "blue",
        "roxo": "purple",
        "dourado": "gold",
        "preto": "black",
        "branco": "white",
        "verde": "green",
        "cidade": "futuristic tokyo city",
        "pôr do sol": "sunset golden hour",
        "por do sol": "sunset golden hour",
        "noite": "neon night",
        "batalha": "epic tactical battle",
        "espaço": "outer space",
        "futurista": "futuristic high tech",
    }
    enhanced = clean
    for pt, en in translations.items():
        enhanced = re.sub(r"\b" + re.escape(pt) + r"\b", en, enhanced, flags=re.IGNORECASE)

    return f"{enhanced}, highly detailed, cinematic lighting, vibrant masterpiece, 8k resolution"

def synthesize_ai_image(
    prompt: str,
    node_name: str = "NERV MAGI",
    provider_id: Optional[str] = None,
    custom_api_key: Optional[str] = None,
    custom_keys: Optional[Dict[str, str]] = None,
) -> Tuple[str, str, str]:
    """Sintetiza uma imagem real através de modelos de IA generativa.
    Se uma chave Gemini estiver ativa, direciona e prioriza a geração para o Google Cloud Vertex AI (Imagen 3).
    Caso contrário ou em caso de falha, utiliza OpenAI DALL-E 3 ou FLUX.1 Neural Engine.
    """
    refined = refine_image_prompt(prompt)
    timestamp = int(time.time() * 1000)

    # 1. Identificação de chave Gemini ativa (via parâmetro direto, mapa de chaves ou variáveis de ambiente)
    gemini_key = None
    if provider_id == "gemini" and custom_api_key and str(custom_api_key).strip():
        gemini_key = str(custom_api_key).strip()
    elif custom_keys and isinstance(custom_keys, dict) and custom_keys.get("gemini") and str(custom_keys.get("gemini")).strip():
        gemini_key = str(custom_keys.get("gemini")).strip()
    elif custom_api_key and str(custom_api_key).strip().startswith("AIza"):
        gemini_key = str(custom_api_key).strip()

    if not gemini_key:
        env_gemini = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if env_gemini and str(env_gemini).strip():
            gemini_key = str(env_gemini).strip()

    # Se chave Gemini estiver ativa -> Google Cloud Vertex AI (Imagen 3)
    if gemini_key:
        # 1a. Google Cloud Vertex AI via SDK oficial google-genai
        try:
            from google import genai
            from google.genai import types

            project = os.environ.get("VERTEX_AI_PROJECT") or os.environ.get("GOOGLE_CLOUD_PROJECT")
            location = os.environ.get("VERTEX_AI_LOCATION") or os.environ.get("GOOGLE_CLOUD_LOCATION") or "us-central1"
            if project:
                client = genai.Client(vertexai=True, project=project, location=location)
            else:
                client = genai.Client(api_key=gemini_key)

            img_resp = client.models.generate_images(
                model="imagen-3.0-generate-002",
                prompt=refined,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    aspect_ratio="1:1",
                    output_mime_type="image/png",
                    person_generation="ALLOW_ADULT",
                ),
            )
            if img_resp.generated_images and img_resp.generated_images[0].image.image_bytes:
                img_bytes = img_resp.generated_images[0].image.image_bytes
                safe_name = f"nerv_vertex_imagen_{timestamp}.png"
                (ARTIFACTS_DIR / safe_name).write_bytes(img_bytes)
                return f"/api/vault/image/{safe_name}", "Google Cloud Vertex AI (Imagen 3.0)", refined
        except Exception as err:
            print(f"[NERV SÍNTESE] Google Cloud Vertex AI SDK (imagen-3.0-generate-002) falhou: {err}")

        # 1b. Google Cloud Vertex AI via endpoint REST predict (Imagen 3.0 / Imagen 3 Fast / Imagen 2)
        vertex_models = ["imagen-3.0-generate-002", "imagen-3.0-fast-generate-001", "imagegeneration@006"]
        for model_name in vertex_models:
            try:
                project = os.environ.get("VERTEX_AI_PROJECT") or os.environ.get("GOOGLE_CLOUD_PROJECT")
                location = os.environ.get("VERTEX_AI_LOCATION") or os.environ.get("GOOGLE_CLOUD_LOCATION") or "us-central1"

                urls_to_try = [
                    f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:predict",
                ]
                if project:
                    urls_to_try.insert(0, f"https://{location}-aiplatform.googleapis.com/v1/projects/{project}/locations/{location}/publishers/google/models/{model_name}:predict")

                headers = {"Content-Type": "application/json", "x-goog-api-key": gemini_key}
                payload = {
                    "instances": [{"prompt": refined}],
                    "parameters": {"sampleCount": 1, "aspectRatio": "1:1", "outputMimeType": "image/png", "personGeneration": "ALLOW_ADULT"}
                }

                for url in urls_to_try:
                    resp = requests.post(url, headers=headers, json=payload, timeout=60)
                    if resp.ok:
                        data = resp.json()
                        preds = data.get("predictions", [])
                        if preds and "bytesBase64Encoded" in preds[0]:
                            img_bytes = base64.b64decode(preds[0]["bytesBase64Encoded"])
                            safe_name = f"nerv_vertex_{model_name.replace('-', '_').replace('@', '_')}_{timestamp}.png"
                            (ARTIFACTS_DIR / safe_name).write_bytes(img_bytes)
                            return f"/api/vault/image/{safe_name}", "Google Cloud Vertex AI (Imagen 3.0)", refined
            except Exception as err:
                print(f"[NERV SÍNTESE] Google Cloud Vertex AI {model_name} predict falhou: {err}")

    # 2. Tentativa via OpenAI DALL-E 3 (se chave OpenAI estiver disponível)
    openai_key = None
    if provider_id == "chatgpt" and custom_api_key and str(custom_api_key).strip():
        openai_key = str(custom_api_key).strip()
    elif custom_keys and isinstance(custom_keys, dict) and custom_keys.get("chatgpt") and str(custom_keys.get("chatgpt")).strip():
        openai_key = str(custom_keys.get("chatgpt")).strip()
    if not openai_key:
        openai_key = os.environ.get("OPENAI_API_KEY")

    if openai_key:
        try:
            url = "https://api.openai.com/v1/images/generations"
            headers = {"Content-Type": "application/json", "Authorization": f"Bearer {openai_key}"}
            payload = {
                "model": "dall-e-3",
                "prompt": refined,
                "n": 1,
                "size": "1024x1024",
                "response_format": "b64_json"
            }
            resp = requests.post(url, headers=headers, json=payload, timeout=60)
            if resp.ok:
                data = resp.json()
                items = data.get("data", [])
                if items:
                    safe_name = f"nerv_openai_dalle_{timestamp}.png"
                    if "b64_json" in items[0]:
                        img_bytes = base64.b64decode(items[0]["b64_json"])
                        (ARTIFACTS_DIR / safe_name).write_bytes(img_bytes)
                        return f"/api/vault/image/{safe_name}", "OpenAI DALL-E 3 (UNIT-00 Neural)", refined
                    elif "url" in items[0]:
                        down = requests.get(items[0]["url"], timeout=30)
                        if down.ok:
                            (ARTIFACTS_DIR / safe_name).write_bytes(down.content)
                            return f"/api/vault/image/{safe_name}", "OpenAI DALL-E 3 (UNIT-00 Neural)", refined
        except Exception as err:
            print(f"[NERV SÍNTESE] OpenAI DALL-E 3 falhou: {err}")

    # 3. Motor Neural FLUX.1 (Black Forest Labs via Pollinations)
    seed = random.randint(100000, 999999999)
    encoded = urllib.parse.quote(refined)
    flux_url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&model=flux&seed={seed}&nologo=true&enhance=true"
    safe_name = f"nerv_flux_{timestamp}.png"
    try:
        r = requests.get(flux_url, timeout=40)
        if r.ok and len(r.content) > 10000:
            (ARTIFACTS_DIR / safe_name).write_bytes(r.content)
            return f"/api/vault/image/{safe_name}", "FLUX.1 Neural Engine (Black Forest Labs)", refined
    except Exception as err:
        print(f"[NERV SÍNTESE] FLUX.1 download direto falhou ({err}), utilizando URL de transmissão.")

    return flux_url, "FLUX.1 Neural Generative Engine", refined

def enrich_image_response(
    prompt: str,
    text: str,
    node_name: str = "NERV MAGI",
    provider_id: Optional[str] = None,
    custom_api_key: Optional[str] = None,
    custom_keys: Optional[Dict[str, str]] = None,
) -> str:
    """Identifica pedidos de imagem ou tags genéricas pré-existentes e sintetiza a imagem real gerada pelo modelo de IA."""
    needs_image = is_image_request(prompt)
    has_generic_pollinations = "image.pollinations.ai/prompt" in text and "model=flux" not in text

    if not needs_image and not has_generic_pollinations:
        return text

    image_url, model_name, refined_prompt = synthesize_ai_image(
        prompt, node_name, provider_id, custom_api_key, custom_keys
    )

    image_markdown = (
        f"\n\n### [NERV VISUAL SYNTHESIS // IMAGEM GERADA POR {node_name.upper()}]\n"
        f"![{refined_prompt[:45]}]({image_url})\n\n"
        f"> **Diretriz de Síntese**: {refined_prompt[:120]}...\n"
        f"> **Modelo Gerador**: {model_name} (1024x1024 px)\n"
        f"> *Imagem gerada salva no Cofre de Arquivos e disponível para download.*"
    )

    # Se a resposta do LLM já continha uma tag de imagem genérica, substitui pela imagem do modelo
    if "![" in text and ("image.pollinations.ai" in text or "http" in text):
        replaced = re.sub(
            r"!\[.*?\]\((?:https?:\/\/|/api/)[^\s\)]+\)",
            f"![{refined_prompt[:45]}]({image_url})",
            text,
            count=1,
        )
        if "### [NERV VISUAL SYNTHESIS" not in replaced:
            replaced += (
                f"\n\n> **Modelo Gerador**: {model_name} (1024x1024 px)\n"
                f"> *Imagem gerada salva no Cofre de Arquivos e disponível para download.*"
            )
        return replaced

    return text + image_markdown

# 1. Google Gemini (UNIT-02)
def call_gemini(
    prompt: str,
    custom_api_key: Optional[str] = None,
    history: Optional[List[Dict[str, Any]]] = None,
    angel_context: Optional[str] = None,
) -> Dict[str, Any]:
    start_time = time.time()
    api_key = custom_api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY não configurada no servidor nem no cofre do operador.")

    system_instruction = format_system_prompt(
        "UNIT-02", "Gemini", "Síntese veloz, processamento multimodal e equilíbrio tático", angel_context
    )
    model = os.environ.get("GEMINI_MODEL", DEFAULT_GEMINI_MODEL)

    # Call Gemini REST API using HTTP header authentication (NEVER expose key in URL query parameter)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "aistudio-build",
        "x-goog-api-key": api_key,
    }
    payload = {
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
    }

    resp = requests.post(url, headers=headers, json=payload, timeout=90)
    if not resp.ok:
        # Fallback to gemini-2.5-flash if model name is experimental or altered
        if "gemini-3.8" in model:
            fallback_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
            resp = requests.post(fallback_url, headers=headers, json=payload, timeout=90)

    if not resp.ok:
        sanitized_err = sanitize_error_message(resp.text[:250], [api_key])
        raise RuntimeError(f"Google Gemini API falhou [HTTP {resp.status_code}]: {sanitized_err}")

    data = resp.json()
    candidates = data.get("candidates", [])
    text = ""
    if candidates:
        parts = candidates[0].get("content", {}).get("parts", [])
        text = "".join(p.get("text", "") for p in parts)

    latency_ms = int((time.time() - start_time) * 1000)
    node_usage_tracker["gemini"].record_usage(len(prompt), len(text), latency_ms)

    return {"text": text, "consensus": "AFFIRMATIVE"}

# 2. OpenAI ChatGPT (UNIT-00)
def call_chatgpt(
    prompt: str,
    custom_api_key: Optional[str] = None,
    history: Optional[List[Dict[str, Any]]] = None,
    angel_context: Optional[str] = None,
) -> Dict[str, Any]:
    start_time = time.time()
    api_key = custom_api_key or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return {
            "text": (
                f"[UNIT-00 // CHATGPT STATUS: CHAVE OPENAI NÃO CONFIGURADA]\n"
                f"Operador: Insira sua chave da OpenAI no botão [COFRE DE CHAVES // API CREDENTIALS] ou defina OPENAI_API_KEY no arquivo .env.\n\n"
                f"> Parecer Técnico (UNIT-00 - ChatGPT):\n"
                f"Análise técnica da solicitação \"{prompt[:80]}...\":\n"
                f"1. Parâmetros de sincronização coerentes com o protocolo NERV.\n"
                f"2. Recomendação: Inicializar rotina assim que a chave for inserida.\n\n"
                f"```python nome=unit00_diagnostic.py\n"
                f"def verify_openai_link():\n"
                f"    print(\"UNIT-00 (ChatGPT): Aguardando insercao de OPENAI_API_KEY\")\n"
                f"    return {{\"status\": \"STANDBY\", \"node\": \"UNIT-00\"}}\n"
                f"```"
            ),
            "consensus": "STANDBY",
        }

    system_instruction = format_system_prompt(
        "UNIT-00", "ChatGPT", "Raciocínio lógico, arquitetura de soluções e conformidade técnica", angel_context
    )
    model = os.environ.get("OPENAI_MODEL", DEFAULT_OPENAI_MODEL)

    messages = [{"role": "system", "content": system_instruction}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": prompt})

    resp = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        json={"model": model, "messages": messages, "temperature": 0.7, "max_tokens": 3000},
        timeout=90,
    )

    if not resp.ok:
        sanitized_err = sanitize_error_message(resp.text[:250], [api_key])
        raise RuntimeError(f"OpenAI API falhou [HTTP {resp.status_code}]: {sanitized_err}")

    data = resp.json()
    text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    latency_ms = int((time.time() - start_time) * 1000)
    node_usage_tracker["chatgpt"].record_usage(len(prompt), len(text), latency_ms)

    return {"text": text, "consensus": "AFFIRMATIVE"}

# 3. Anthropic Claude (UNIT-01)
def call_claude(
    prompt: str,
    custom_api_key: Optional[str] = None,
    history: Optional[List[Dict[str, Any]]] = None,
    angel_context: Optional[str] = None,
) -> Dict[str, Any]:
    start_time = time.time()
    api_key = custom_api_key or os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return {
            "text": (
                f"[UNIT-01 // CLAUDE STATUS: CHAVE ANTHROPIC NÃO CONFIGURADA]\n"
                f"Operador: Insira sua chave da Anthropic no botão [COFRE DE CHAVES // API CREDENTIALS] ou defina ANTHROPIC_API_KEY no arquivo .env.\n\n"
                f"> Parecer Técnico (UNIT-01 - Claude):\n"
                f"Avaliação da diretriz \"{prompt[:80]}...\":\n"
                f"1. Parâmetros de consulta recebidos.\n"
                f"2. Assegure a chave da Anthropic para transmissão em tempo real via Claude 3.5 Sonnet.\n\n"
                f"```typescript nome=unit01_safeguard.ts\n"
                f"export interface MagiNodeStatus {{\n"
                f"  node: \"UNIT-01\";\n"
                f"  claudeKeyReady: boolean;\n"
                f"}}\n"
                f"```"
            ),
            "consensus": "STANDBY",
        }

    system_instruction = format_system_prompt(
        "UNIT-01", "Claude", "Refinamento analítico, precisão contextual e salvaguarda", angel_context
    )
    model = os.environ.get("ANTHROPIC_MODEL", DEFAULT_ANTHROPIC_MODEL)

    messages = []
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": prompt})

    resp = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
        json={"model": model, "max_tokens": 3000, "system": system_instruction, "messages": messages},
        timeout=90,
    )

    if not resp.ok:
        sanitized_err = sanitize_error_message(resp.text[:250], [api_key])
        raise RuntimeError(f"Anthropic Claude API falhou [HTTP {resp.status_code}]: {sanitized_err}")

    data = resp.json()
    content_blocks = data.get("content", [])
    text = "".join(b.get("text", "") for b in content_blocks if b.get("type") == "text")
    latency_ms = int((time.time() - start_time) * 1000)
    node_usage_tracker["claude"].record_usage(len(prompt), len(text), latency_ms)

    return {"text": text, "consensus": "AFFIRMATIVE"}

# 4. xAI Grok (UNIT-03)
def call_grok(
    prompt: str,
    custom_api_key: Optional[str] = None,
    history: Optional[List[Dict[str, Any]]] = None,
    angel_context: Optional[str] = None,
) -> Dict[str, Any]:
    start_time = time.time()
    api_key = custom_api_key or os.environ.get("GROK_API_KEY") or os.environ.get("XAI_API_KEY")
    if not api_key:
        return {
            "text": (
                f"[UNIT-03 // GROK STATUS: CHAVE XAI/GROK NÃO CONFIGURADA]\n"
                f"Operador: Insira sua chave da xAI (Grok) no botão [COFRE DE CHAVES // API CREDENTIALS] ou defina GROK_API_KEY / XAI_API_KEY no arquivo .env.\n\n"
                f"> Parecer Tático (UNIT-03 - xAI):\n"
                f"Análise rápida da diretriz \"{prompt[:80]}...\":\n"
                f"1. Parâmetros de sincronização com o barramento NERV validados.\n"
                f"2. Prontidão operacional imediata assim que a credencial xAI for fornecida.\n\n"
                f"```python nome=unit03_telemetry.py\n"
                f"def grok_status():\n"
                f"    return {{\"node\": \"UNIT-03\", \"status\": \"STANDBY_AWAITING_KEY\", \"engine\": \"xAI Grok\"}}\n"
                f"```"
            ),
            "consensus": "STANDBY",
        }

    system_instruction = format_system_prompt(
        "UNIT-03", "Grok", "xAI - Ágil, incisivo e raciocínio técnico direto", angel_context
    )
    model = os.environ.get("GROK_MODEL", DEFAULT_GROK_MODEL)

    messages = [{"role": "system", "content": system_instruction}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": prompt})

    resp = requests.post(
        "https://api.x.ai/v1/chat/completions",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        json={"model": model, "messages": messages, "temperature": 0.7, "max_tokens": 3000},
        timeout=90,
    )

    if not resp.ok:
        sanitized_err = sanitize_error_message(resp.text[:250], [api_key])
        raise RuntimeError(f"xAI Grok API falhou [HTTP {resp.status_code}]: {sanitized_err}")

    data = resp.json()
    text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    latency_ms = int((time.time() - start_time) * 1000)
    node_usage_tracker["grok"].record_usage(len(prompt), len(text), latency_ms)

    return {"text": text, "consensus": "AFFIRMATIVE"}

# 5. DeepSeek (UNIT-04)
def call_deepseek(
    prompt: str,
    custom_api_key: Optional[str] = None,
    history: Optional[List[Dict[str, Any]]] = None,
    angel_context: Optional[str] = None,
) -> Dict[str, Any]:
    start_time = time.time()
    api_key = custom_api_key or os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        return {
            "text": (
                f"[UNIT-04 // DEEPSEEK STATUS: CHAVE DEEPSEEK NÃO CONFIGURADA]\n"
                f"Operador: Insira sua chave da DeepSeek no botão [COFRE DE CHAVES // API CREDENTIALS] ou defina DEEPSEEK_API_KEY no arquivo .env.\n\n"
                f"> Parecer Tático (UNIT-04 - DeepSeek AI):\n"
                f"Análise profunda da diretriz \"{prompt[:80]}...\":\n"
                f"1. Matriz lógica de cálculo e síntese pronta.\n"
                f"2. Conecte sua chave DeepSeek para habilitar inferência em tempo real.\n\n"
                f"```typescript nome=unit04_matrix.ts\n"
                f"export const deepseekMagiState = {{\n"
                f"  node: \"UNIT-04\",\n"
                f"  platform: \"DeepSeek\",\n"
                f"  state: \"AWAITING_TOKEN\",\n"
                f"}};\n"
                f"```"
            ),
            "consensus": "STANDBY",
        }

    system_instruction = format_system_prompt(
        "UNIT-04", "DeepSeek", "Alta precisão analítica, síntese técnica e raciocínio lógico profundo", angel_context
    )
    model = os.environ.get("DEEPSEEK_MODEL", DEFAULT_DEEPSEEK_MODEL)

    messages = [{"role": "system", "content": system_instruction}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": prompt})

    resp = requests.post(
        "https://api.deepseek.com/chat/completions",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        json={"model": model, "messages": messages, "temperature": 0.6, "max_tokens": 3000},
        timeout=90,
    )

    if not resp.ok:
        sanitized_err = sanitize_error_message(resp.text[:250], [api_key])
        raise RuntimeError(f"DeepSeek API falhou [HTTP {resp.status_code}]: {sanitized_err}")

    data = resp.json()
    text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    latency_ms = int((time.time() - start_time) * 1000)
    node_usage_tracker["deepseek"].record_usage(len(prompt), len(text), latency_ms)

    return {"text": text, "consensus": "AFFIRMATIVE"}

# Provider caller mapping
CALLERS = {
    "gemini": (call_gemini, "UNIT-02", "UNIT-02 (Gemini)"),
    "chatgpt": (call_chatgpt, "UNIT-00", "UNIT-00 (ChatGPT)"),
    "claude": (call_claude, "UNIT-01", "UNIT-01 (Claude)"),
    "grok": (call_grok, "UNIT-03", "UNIT-03 (Grok)"),
    "deepseek": (call_deepseek, "UNIT-04", "UNIT-04 (DeepSeek)"),
}

def execute_single_provider(
    provider_id: str,
    prompt: str,
    custom_api_key: Optional[str] = None,
    history: Optional[List[Dict[str, Any]]] = None,
    angel_context: Optional[str] = None,
    custom_keys: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    if provider_id not in CALLERS:
        raise ValueError(f"Provedor desconhecido: {provider_id}")

    fn, node_id, full_name = CALLERS[provider_id]
    result = fn(prompt, custom_api_key, history, angel_context)
    enriched_text = enrich_image_response(prompt, result["text"], full_name, provider_id, custom_api_key, custom_keys)
    files = artifacts_manager.extract_files_from_response(provider_id, full_name, enriched_text, user_prompt=prompt)

    return {
        "provider": provider_id,
        "node": node_id,
        "name": full_name,
        "text": enriched_text,
        "consensus": result.get("consensus", "AFFIRMATIVE"),
        "files": files,
        "status": "RESOLVED",
    }

def broadcast_magi(
    prompt: str,
    active_nodes: List[str],
    custom_keys: Dict[str, str],
    angel_context: Optional[str] = None,
) -> Dict[str, Any]:
    tasks = {}
    responses = []

    with ThreadPoolExecutor(max_workers=min(len(active_nodes) or 1, 5)) as executor:
        for p in active_nodes:
            if p in CALLERS:
                fn, node_id, full_name = CALLERS[p]
                custom_key = custom_keys.get(p)
                task = executor.submit(fn, prompt, custom_key, [], angel_context)
                tasks[task] = (p, node_id, full_name)

        for future in as_completed(tasks):
            p, node_id, full_name = tasks[future]
            try:
                res = future.result()
                enriched_text = enrich_image_response(prompt, res["text"], full_name, p, custom_keys.get(p), custom_keys=custom_keys)
                files = artifacts_manager.extract_files_from_response(p, full_name, enriched_text, user_prompt=prompt)
                responses.append({
                    "provider": p,
                    "node": node_id,
                    "name": full_name,
                    "text": enriched_text,
                    "status": "RESOLVED",
                    "consensus": res.get("consensus", "AFFIRMATIVE"),
                    "files": files,
                })
            except Exception as err:
                sanitized_msg = sanitize_error_message(str(err), [custom_keys.get(p, "")])
                responses.append({
                    "provider": p,
                    "node": node_id,
                    "name": full_name,
                    "text": f"[ERRO DE CONEXÃO {node_id}]: {sanitized_msg}",
                    "status": "ERROR",
                    "consensus": "REJECTED",
                    "files": [],
                })

    # Preserve order of active_nodes
    order_map = {node_id: i for i, node_id in enumerate(active_nodes)}
    responses.sort(key=lambda r: order_map.get(r["provider"], 999))

    all_extracted_files = [f for r in responses for f in r.get("files", [])]
    resolved_count = sum(1 for r in responses if r.get("status") == "RESOLVED")
    total_count = len(responses)
    agreement_ratio = (resolved_count / total_count * 100) if total_count > 0 else 0

    if resolved_count == total_count and total_count >= 2:
        verdict = "CONSENSUS_UNANIMOUS_APPROVED"
    elif resolved_count > total_count / 2:
        verdict = "CONSENSUS_MAJORITY_APPROVED"
    else:
        verdict = "CONSENSUS_SPLIT_OR_PENDING"

    return {
        "verdict": verdict,
        "agreementRatio": round(agreement_ratio),
        "responses": responses,
        "newFiles": all_extracted_files,
        "timestamp": int(time.time() * 1000),
    }


def verify_provider_key(provider: str, api_key: str) -> Dict[str, Any]:
    """Testa a validade de uma chave de API para o provedor com uma chamada de verificação de baixo custo.
    Retorna {"ok": bool, "provider": str, "message": str, "modelChecked": str}
    """
    prov = (provider or "").lower().strip()
    key = (api_key or "").strip()
    if not key:
        return {"ok": False, "provider": prov, "message": "Chave de API não informada."}

    try:
        if prov == "gemini":
            # Google Gemini model list test
            url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
            headers = {"x-goog-api-key": key, "User-Agent": "aistudio-build"}
            resp = requests.get(url, headers=headers, timeout=12)
            if resp.status_code == 200:
                return {
                    "ok": True,
                    "provider": "gemini",
                    "message": "Chave Google Gemini operante e validada com sucesso.",
                    "modelChecked": "gemini-2.5-flash",
                }
            else:
                err_text = sanitize_error_message(resp.text[:200], [key])
                return {
                    "ok": False,
                    "provider": "gemini",
                    "message": f"Falha na validação do Gemini (HTTP {resp.status_code}): {err_text}",
                }

        elif prov in ("chatgpt", "openai"):
            # OpenAI models check
            url = "https://api.openai.com/v1/models"
            headers = {"Authorization": f"Bearer {key}"}
            resp = requests.get(url, headers=headers, timeout=12)
            if resp.status_code == 200:
                return {
                    "ok": True,
                    "provider": "chatgpt",
                    "message": "Chave OpenAI validada com sucesso. Cota ativa.",
                    "modelChecked": "gpt-4o / gpt-4o-mini",
                }
            else:
                err_text = sanitize_error_message(resp.text[:200], [key])
                return {
                    "ok": False,
                    "provider": "chatgpt",
                    "message": f"Falha na validação da OpenAI (HTTP {resp.status_code}): {err_text}",
                }

        elif prov in ("claude", "anthropic"):
            # Anthropic models check
            url = "https://api.anthropic.com/v1/models"
            headers = {
                "x-api-key": key,
                "anthropic-version": "2023-06-01",
            }
            resp = requests.get(url, headers=headers, timeout=12)
            if resp.status_code == 200:
                return {
                    "ok": True,
                    "provider": "claude",
                    "message": "Chave Anthropic Claude validada com sucesso.",
                    "modelChecked": "claude-3-5-sonnet",
                }
            elif resp.status_code == 404:
                probe_url = "https://api.anthropic.com/v1/messages"
                probe_payload = {
                    "model": "claude-3-5-sonnet-20241022",
                    "max_tokens": 1,
                    "messages": [{"role": "user", "content": "ping"}],
                }
                resp_probe = requests.post(probe_url, headers=headers, json=probe_payload, timeout=12)
                if resp_probe.status_code in (200, 400):
                    return {
                        "ok": True,
                        "provider": "claude",
                        "message": "Chave Anthropic Claude autenticada com sucesso.",
                        "modelChecked": "claude-3-5-sonnet",
                    }
                else:
                    err_text = sanitize_error_message(resp_probe.text[:200], [key])
                    return {
                        "ok": False,
                        "provider": "claude",
                        "message": f"Falha na validação da Anthropic (HTTP {resp_probe.status_code}): {err_text}",
                    }
            else:
                err_text = sanitize_error_message(resp.text[:200], [key])
                return {
                    "ok": False,
                    "provider": "claude",
                    "message": f"Falha na validação da Anthropic (HTTP {resp.status_code}): {err_text}",
                }

        elif prov in ("grok", "xai"):
            # xAI models list
            url = "https://api.x.ai/v1/models"
            headers = {"Authorization": f"Bearer {key}"}
            resp = requests.get(url, headers=headers, timeout=12)
            if resp.status_code == 200:
                return {
                    "ok": True,
                    "provider": "grok",
                    "message": "Chave xAI Grok validada com sucesso.",
                    "modelChecked": "grok-2",
                }
            else:
                err_text = sanitize_error_message(resp.text[:200], [key])
                return {
                    "ok": False,
                    "provider": "grok",
                    "message": f"Falha na validação da xAI (HTTP {resp.status_code}): {err_text}",
                }

        elif prov == "deepseek":
            # DeepSeek models check
            url = "https://api.deepseek.com/models"
            headers = {"Authorization": f"Bearer {key}"}
            resp = requests.get(url, headers=headers, timeout=12)
            if resp.status_code == 200:
                return {
                    "ok": True,
                    "provider": "deepseek",
                    "message": "Chave DeepSeek validada com sucesso.",
                    "modelChecked": "deepseek-chat",
                }
            else:
                err_text = sanitize_error_message(resp.text[:200], [key])
                return {
                    "ok": False,
                    "provider": "deepseek",
                    "message": f"Falha na validação do DeepSeek (HTTP {resp.status_code}): {err_text}",
                }

        else:
            return {"ok": False, "provider": prov, "message": f"Provedor '{prov}' não suportado."}

    except Exception as exc:
        clean = sanitize_error_message(str(exc), [key])
        return {"ok": False, "provider": prov, "message": f"Erro de conexão com o provedor: {clean}"}

