"""NERV MAGI EXTENSIONS // IMAGE CONVERTER & VERTEX AI / NANO BANANA GENERATOR
Converte formatos de imagem (PNG, JPG) e sintetiza novas imagens.
Se uma chave Gemini estiver ativa, prioriza a síntese via Google Cloud Vertex AI (Imagen 3).
Caso contrário ou em contingência, utiliza Nano Banana (sem marca d'água).
"""
import io
import os
import re
import random
import urllib.parse
from typing import Union, Optional, Tuple
import requests
from PIL import Image

NANO_BANANA_PRIMARY_MODEL = "nanobanana2"
NANO_BANANA_FALLBACKS = ["nanobanana", "google/gemini-nano-banana-2.1", "flux"]

def generate_vertex_ai_image(prompt: str, gemini_key: Optional[str] = None) -> Optional[bytes]:
    """Gera uma imagem via Google Cloud Vertex AI (Imagen 3) se uma chave Gemini estiver ativa."""
    key = gemini_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key or not str(key).strip():
        return None
    key = str(key).strip()

    clean_prompt = prompt.strip()

    # 1. Tentativa via SDK google-genai
    try:
        from google import genai
        from google.genai import types

        project = os.environ.get("VERTEX_AI_PROJECT") or os.environ.get("GOOGLE_CLOUD_PROJECT")
        location = os.environ.get("VERTEX_AI_LOCATION") or os.environ.get("GOOGLE_CLOUD_LOCATION") or "us-central1"
        if project:
            client = genai.Client(vertexai=True, project=project, location=location)
        else:
            client = genai.Client(api_key=key)

        response = client.models.generate_images(
            model="imagen-3.0-generate-002",
            prompt=clean_prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio="1:1",
                output_mime_type="image/png",
                person_generation="ALLOW_ADULT",
            ),
        )
        if response.generated_images and response.generated_images[0].image.image_bytes:
            return response.generated_images[0].image.image_bytes
    except Exception as err:
        print(f"[EXTENSIONS // VERTEX AI SDK] Falha ao sintetizar imagem: {err}")

    # 2. Tentativa via endpoint REST nativo (Imagen 3 / Imagen 3 Fast)
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

            headers = {"Content-Type": "application/json", "x-goog-api-key": key}
            payload = {
                "instances": [{"prompt": clean_prompt}],
                "parameters": {"sampleCount": 1, "aspectRatio": "1:1", "outputMimeType": "image/png", "personGeneration": "ALLOW_ADULT"}
            }

            for url in urls_to_try:
                resp = requests.post(url, headers=headers, json=payload, timeout=50)
                if resp.ok:
                    data = resp.json()
                    preds = data.get("predictions", [])
                    if preds and "bytesBase64Encoded" in preds[0]:
                        import base64
                        return base64.b64decode(preds[0]["bytesBase64Encoded"])
        except Exception as err:
            print(f"[EXTENSIONS // VERTEX AI REST] Modelo {model_name} falhou: {err}")
            continue

    return None

def generate_nano_banana_image(prompt: str, seed: Optional[int] = None) -> bytes:
    """Gera uma imagem via Nano Banana com parâmetro nologo=true (sem marca d'água)."""
    if not seed:
        seed = random.randint(100000, 999999999)

    clean_prompt = prompt.strip()
    encoded = urllib.parse.quote(clean_prompt)

    # Tentativa 1: Modelo Nano Banana padrão
    models_to_try = [NANO_BANANA_PRIMARY_MODEL] + NANO_BANANA_FALLBACKS
    last_err = None

    for model in models_to_try:
        url = (
            f"https://image.pollinations.ai/prompt/{encoded}"
            f"?model={model}&width=1024&height=1024&seed={seed}&nologo=true&enhance=false"
        )
        try:
            r = requests.get(url, timeout=35)
            if r.ok and len(r.content) > 5000:
                # Valida que são bytes reais de imagem via Pillow
                img = Image.open(io.BytesIO(r.content))
                img.verify()
                return r.content
        except Exception as e:
            last_err = e
            continue

    raise RuntimeError(f"Falha ao gerar imagem com Nano Banana: {last_err or 'Timeout ou modelo indisponível'}")

def convert_or_generate_image(
    content: Union[str, bytes],
    target_format: str = "png",
    title: Optional[str] = None,
    gemini_key: Optional[str] = None,
) -> bytes:
    """Converte ou sintetiza arquivo de imagem nos formatos PNG ou JPG.

    - Se content for um prompt textual:
      * Se uma chave Gemini estiver ativa, sintetiza com Google Cloud Vertex AI (Imagen 3).
      * Caso contrário ou em contingência, sintetiza via Nano Banana sem marca d'água.
    - Se content for bytes ou URL ou data URI, converte para o formato de imagem desejado.
    """
    fmt = "JPEG" if target_format.lower() in ("jpg", "jpeg") else "PNG"
    raw_bytes: Optional[bytes] = None

    # Caso 1: Content são bytes brutos
    if isinstance(content, bytes):
        raw_bytes = content

    # Caso 2: Content é string
    elif isinstance(content, str):
        trimmed = content.strip()
        # Se for Data URL Base64
        if trimmed.startswith("data:image/"):
            import base64
            _, b64 = trimmed.split(",", 1)
            raw_bytes = base64.b64decode(b64)
        # Se for URL HTTP
        elif trimmed.startswith("http://") or trimmed.startswith("https://"):
            r = requests.get(trimmed, timeout=30)
            if r.ok:
                raw_bytes = r.content
        # Se for texto/prompt -> verifica se chave Gemini está ativa para Google Cloud Vertex AI
        else:
            vertex_img = None
            key_to_check = gemini_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
            if key_to_check and str(key_to_check).strip():
                try:
                    vertex_img = generate_vertex_ai_image(trimmed, gemini_key=str(key_to_check).strip())
                except Exception as err:
                    print(f"[EXTENSIONS] Falha ao tentar Google Cloud Vertex AI: {err}")

            if vertex_img:
                raw_bytes = vertex_img
            else:
                raw_bytes = generate_nano_banana_image(trimmed)

    if not raw_bytes:
        raise ValueError("Conteúdo inválido ou indisponível para geração/conversão de imagem.")

    # Converte e garante integridade do formato alvo (PNG ou JPG) via Pillow
    try:
        img = Image.open(io.BytesIO(raw_bytes))
        out_buf = io.BytesIO()

        # JPEG não suporta canal Alpha (transparência), converte para RGB
        if fmt == "JPEG" and img.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            background.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
            background.save(out_buf, format="JPEG", quality=95, optimize=True)
        else:
            img.save(out_buf, format=fmt, quality=95)

        return out_buf.getvalue()
    except Exception:
        # Se falhar o processamento Pillow, retorna os bytes brutos
        return raw_bytes
