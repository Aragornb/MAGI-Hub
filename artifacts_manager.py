"""NERV CENTRAL DOGMA // ARTIFACTS AND FILE REGISTRY MANAGER
Gerenciamento seguro de arquivos de c?digo e convers?o autom?tica para formatos finais (.pdf, .docx, .xlsx, .pptx, imagens).
"""
import os
import re
import sys
import time
import uuid
import zipfile
import io
import shutil
import tempfile
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

from config import ARTIFACTS_DIR

# Certifica que o diret?rio de artefatos existe
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

class GeneratedFile:
    def __init__(
        self,
        file_id: str,
        provider: str,
        provider_name: str,
        name: str,
        language: str,
        content: str,
        size: int,
        timestamp: int,
        source_code: Optional[str] = None,
        is_converted: bool = False,
    ):
        self.id = file_id
        self.provider = provider
        self.provider_name = provider_name
        self.name = name
        self.language = language
        self.content = content
        self.size = size
        self.timestamp = timestamp
        self.source_code = source_code or ""
        self.is_converted = is_converted

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "provider": self.provider,
            "providerName": self.provider_name,
            "name": self.name,
            "language": self.language,
            "content": self.content,
            "size": self.size,
            "timestamp": self.timestamp,
            "sourceCode": self.source_code,
            "isConverted": self.is_converted,
        }

class ArtifactsManager:
    def __init__(self):
        self.file_registry: List[GeneratedFile] = []

    def _execute_python_generator_in_process(
        self,
        raw_code: str,
        target_ext: str,
        clean_stem: str,
    ) -> Optional[Tuple[bytes, str, str]]:
        """Executa com seguran?a in-process o script gerador Python num diret?rio tempor?rio isolado.
        Evita absolutamente a abertura de novas janelas ou execu??o de subprocess do execut?vel principal.
        """
        try:
            with tempfile.TemporaryDirectory() as tmp_dir:
                tmp_path = Path(tmp_dir)
                script_file = tmp_path / "generator_script.py"
                script_file.write_text(raw_code, encoding="utf-8")

                old_cwd = os.getcwd()
                old_sys_path = list(sys.path)
                try:
                    os.chdir(tmp_dir)
                    sys.path.insert(0, tmp_dir)
                    
                    # Cria namespace limpo para a execu??o
                    exec_globals = {
                        "__name__": "__main__",
                        "__file__": str(script_file),
                        "__builtins__": __builtins__,
                    }
                    exec(compile(raw_code, "generator_script.py", "exec"), exec_globals)

                    # Verifica arquivos gerados no diret?rio tempor?rio
                    created_files = [
                        p for p in tmp_path.iterdir()
                        if p.is_file() and p.name != "generator_script.py"
                    ]
                    if created_files:
                        matching = [f for f in created_files if f.suffix.lower().lstrip(".") == target_ext.lower()]
                        best_file = max(matching, key=lambda f: f.stat().st_size) if matching else max(created_files, key=lambda f: f.stat().st_size)
                        if best_file.stat().st_size > 50:
                            data = best_file.read_bytes()
                            ext = best_file.suffix.lower().lstrip(".")
                            return data, best_file.name, ext
                finally:
                    os.chdir(old_cwd)
                    sys.path = old_sys_path
        except Exception as e:
            print(f"[ARTIFACT IN-PROCESS EXEC] {e}, alternando para conversor Extensions.")
        return None

    def _try_convert_to_target_format(
        self,
        raw_content: str,
        detected_name: str,
        detected_lang: str,
        prompt_target_ext: Optional[str] = None,
    ) -> Optional[Tuple[bytes, str, str]]:
        """Tenta converter ou executar o script gerado para produzir o arquivo no formato determinado.
        
        Retorna: (file_bytes, final_filename, final_extension) ou None se n?o for formato convers?vel.
        """
        name_lower = detected_name.lower()
        content_lower = raw_content.lower()

        target_ext = None
        # 1. Extens?o expl?cita no nome do arquivo
        if name_lower.endswith((".pdf",)):
            target_ext = "pdf"
        elif name_lower.endswith((".docx", ".doc")):
            target_ext = "docx"
        elif name_lower.endswith((".xlsx", ".xls")):
            target_ext = "xlsx"
        elif name_lower.endswith((".pptx", ".ppt")):
            target_ext = "pptx"

        # 2. Palavras-chave no nome do arquivo sugerido
        if not target_ext:
            stem_lower = Path(detected_name).stem.lower()
            if any(k in stem_lower for k in ["planilha", "excel", "tabela", "spreadsheet", "financas", "orcamento", "gastos", "vendas"]):
                target_ext = "xlsx"
            elif any(k in stem_lower for k in ["relatorio", "report", "laudo", "parecer", "pdf"]):
                target_ext = "pdf"
            elif any(k in stem_lower for k in ["documento", "doc", "word", "oficio", "contrato"]):
                target_ext = "docx"
            elif any(k in stem_lower for k in ["apresentacao", "slides", "slide", "powerpoint", "pitch"]):
                target_ext = "pptx"

        # 3. Busca por chamadas de salvamento com extens?o no c?digo
        if not target_ext:
            save_match = re.search(r'\.(?:save|output|write|save_to_file)\s*\(\s*["\']([^"\']+\.(xlsx|xls|pdf|docx|doc|pptx|ppt))["\']', raw_content, re.IGNORECASE)
            if save_match:
                ext_found = save_match.group(2).lower()
                target_ext = "xlsx" if ext_found in ("xlsx", "xls") else "docx" if ext_found in ("docx", "doc") else "pptx" if ext_found in ("pptx", "ppt") else "pdf"

        # 4. Bibliotecas importadas no c?digo
        if not target_ext:
            if "reportlab" in content_lower or "fpdf" in content_lower or (".pdf" in content_lower and "canvas" in content_lower):
                target_ext = "pdf"
            elif "openpyxl" in content_lower or "xlsxwriter" in content_lower or ("pandas" in content_lower and "to_excel" in content_lower):
                target_ext = "xlsx"
            elif "docx" in content_lower and ("document" in content_lower or "paragraph" in content_lower):
                target_ext = "docx"
            elif "pptx" in content_lower and ("presentation" in content_lower or "slides" in content_lower):
                target_ext = "pptx"

        # 5. Formato solicitado pelo prompt do operador
        if not target_ext and prompt_target_ext:
            target_ext = prompt_target_ext

        if not target_ext:
            return None

        clean_stem = Path(detected_name).stem
        if clean_stem.endswith((".py", ".txt", ".ts", ".js", ".csv", ".json")):
            clean_stem = Path(clean_stem).stem
        final_filename = f"{clean_stem}.{target_ext}"

        # Estrat?gia 1: Se for script Python que cria arquivos, executa in-process sem abrir novo processo GUI
        if detected_lang in ("python", "py") or "import " in raw_content or "def " in raw_content:
            in_proc_res = self._execute_python_generator_in_process(raw_content, target_ext, clean_stem)
            if in_proc_res:
                return in_proc_res

        # Estrat?gia 2: Conversor de alta fidelidade nativo das Extensions NERV
        try:
            from Extensions import generate_file_by_extension
            data, _ = generate_file_by_extension(
                content=raw_content,
                extension=target_ext,
                title=clean_stem.replace("_", " ").upper(),
            )
            if data and len(data) > 50:
                return data, final_filename, target_ext
        except Exception as e:
            print(f"[ARTIFACT CONVERTER] Falha na convers?o via Extensions: {e}")

        return None

    def extract_files_from_response(
        self,
        provider: str,
        provider_name: str,
        text: str,
        user_prompt: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        extracted: List[GeneratedFile] = []
        timestamp = int(time.time() * 1000)

        # Detecta inten??o de formato a partir do prompt do usu?rio
        prompt_target_ext = None
        if user_prompt:
            p_low = user_prompt.lower()
            if any(k in p_low for k in ["excel", "planilha", ".xlsx", ".xls", "tabela excel"]):
                prompt_target_ext = "xlsx"
            elif any(k in p_low for k in [".pdf", "em pdf", "gerar pdf", "formato pdf", "relatorio", "relat?rio"]):
                prompt_target_ext = "pdf"
            elif any(k in p_low for k in ["word", ".docx", ".doc", "documento word", "em word"]):
                prompt_target_ext = "docx"
            elif any(k in p_low for k in ["powerpoint", ".pptx", ".ppt", "slides", "apresentacao", "apresenta??o"]):
                prompt_target_ext = "pptx"

        # Pattern 1: ```lang nome=filename.ext ou filename=filename.ext
        named_pattern = re.compile(
            r"```([a-zA-Z0-9_\-+]*)[ \t]+(?:nome|filename|file)=([^\s`]+)[^\n]*\n([\s\S]*?)```"
        )
        for match in named_pattern.finditer(text):
            lang = match.group(1) or "text"
            raw_name = re.sub(r"[^a-zA-Z0-9_.\-]", "_", match.group(2).strip())
            content = match.group(3)
            file_id = f"{provider}-{timestamp}-{uuid.uuid4().hex[:5]}"

            # Tenta convers?o para o formato determinado
            conversion = self._try_convert_to_target_format(content, raw_name, lang, prompt_target_ext)
            if conversion:
                conv_bytes, conv_name, conv_ext = conversion
                safe_disk_name = f"{file_id}_{conv_name}"
                disk_path = ARTIFACTS_DIR / safe_disk_name
                disk_path.write_bytes(conv_bytes)

                file_item = GeneratedFile(
                    file_id=file_id,
                    provider=provider,
                    provider_name=provider_name,
                    name=conv_name,
                    language=conv_ext,
                    content=f"/api/vault/file/{safe_disk_name}",
                    size=len(conv_bytes),
                    timestamp=timestamp,
                    source_code=content,
                    is_converted=True,
                )
            else:
                ext = "py" if lang == "python" else "ts" if lang in ("typescript", "ts") else "txt"
                filename = raw_name or f"magi_artifact_{int(time.time())}.{ext}"
                file_item = GeneratedFile(
                    file_id=file_id,
                    provider=provider,
                    provider_name=provider_name,
                    name=filename,
                    language=lang,
                    content=content,
                    size=len(content.encode("utf-8")),
                    timestamp=timestamp,
                    source_code=content,
                    is_converted=False,
                )
                try:
                    disk_path = ARTIFACTS_DIR / f"{file_item.id}_{file_item.name}"
                    disk_path.write_text(content, encoding="utf-8")
                except Exception as e:
                    print(f"[NERV VAULT] Falha ao gravar arquivo em disco: {e}")

            extracted.append(file_item)
            self.file_registry.insert(0, file_item)

        # Fallback: Detect substantial code blocks without explicit 'nome='
        if not extracted:
            generic_code_regex = re.compile(r"```([a-zA-Z0-9_\-+]+)\n([\s\S]*?)```")
            block_idx = 1
            ext_map = {
                "python": "py", "py": "py", "typescript": "ts", "ts": "ts",
                "javascript": "js", "js": "js", "json": "json", "html": "html",
                "css": "css", "sql": "sql", "rust": "rs", "cpp": "cpp", "c": "c",
            }
            for gen_match in generic_code_regex.finditer(text):
                lang = gen_match.group(1).lower()
                content = gen_match.group(2).strip()
                if len(content) > 60 and lang not in ("bash", "sh"):
                    file_id = f"{provider}-{timestamp}-{block_idx}"
                    suggested_name = f"{provider}_artifact_{block_idx}.{ext_map.get(lang, 'txt')}"

                    conversion = self._try_convert_to_target_format(content, suggested_name, lang, prompt_target_ext)
                    if conversion:
                        conv_bytes, conv_name, conv_ext = conversion
                        safe_disk_name = f"{file_id}_{conv_name}"
                        disk_path = ARTIFACTS_DIR / safe_disk_name
                        disk_path.write_bytes(conv_bytes)

                        file_item = GeneratedFile(
                            file_id=file_id,
                            provider=provider,
                            provider_name=provider_name,
                            name=conv_name,
                            language=conv_ext,
                            content=f"/api/vault/file/{safe_disk_name}",
                            size=len(conv_bytes),
                            timestamp=timestamp,
                            source_code=content,
                            is_converted=True,
                        )
                    else:
                        ext = ext_map.get(lang, "txt")
                        file_item = GeneratedFile(
                            file_id=file_id,
                            provider=provider,
                            provider_name=provider_name,
                            name=suggested_name,
                            language=lang,
                            content=content,
                            size=len(content.encode("utf-8")),
                            timestamp=timestamp,
                            source_code=content,
                            is_converted=False,
                        )
                        try:
                            disk_path = ARTIFACTS_DIR / f"{file_item.id}_{file_item.name}"
                            disk_path.write_text(content, encoding="utf-8")
                        except Exception as e:
                            print(f"[NERV VAULT] Falha ao salvar arquivo gen?rico: {e}")

                    extracted.append(file_item)
                    self.file_registry.insert(0, file_item)
                    block_idx += 1

        # Fallback 3: Se o usu?rio pediu explicitamente um documento/planilha e n?o veio bloco de c?digo, mas h? texto com dados/tabela
        if not extracted and prompt_target_ext and len(text.strip()) > 50:
            try:
                from Extensions import generate_file_by_extension
                clean_title = f"{provider}_{prompt_target_ext}_{int(time.time())}"
                final_name = f"{clean_title}.{prompt_target_ext}"
                data, _ = generate_file_by_extension(
                    content=text,
                    extension=prompt_target_ext,
                    title="RELAT?RIO // NERV MAGI HUB",
                )
                if data and len(data) > 50:
                    file_id = f"{provider}-{timestamp}-doc"
                    safe_disk_name = f"{file_id}_{final_name}"
                    disk_path = ARTIFACTS_DIR / safe_disk_name
                    disk_path.write_bytes(data)
                    file_item = GeneratedFile(
                        file_id=file_id,
                        provider=provider,
                        provider_name=provider_name,
                        name=final_name,
                        language=prompt_target_ext,
                        content=f"/api/vault/file/{safe_disk_name}",
                        size=len(data),
                        timestamp=timestamp,
                        source_code=text,
                        is_converted=True,
                    )
                    extracted.append(file_item)
                    self.file_registry.insert(0, file_item)
            except Exception as e:
                print(f"[ARTIFACT TEXT AUTO-CONVERT ERROR] {e}")

        # Image Detection: Extracts Markdown images ![alt](url) as downloadable image artifacts
        img_pattern = re.compile(r"!\[(.*?)\]\(((?:https?:\/\/|\/api\/)[^\s\)]+)\)")
        img_idx = 1
        for img_match in img_pattern.finditer(text):
            alt_text = img_match.group(1).strip()
            img_url = img_match.group(2).strip()
            clean_name = re.sub(r"[^a-zA-Z0-9_\-]", "_", alt_text).strip("_")
            if not clean_name:
                clean_name = f"{provider}_imagem_{img_idx}"
            if not clean_name.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                clean_name += ".png"

            file_id = f"{provider}-img-{timestamp}-{img_idx}"
            file_item = GeneratedFile(
                file_id=file_id,
                provider=provider,
                provider_name=provider_name,
                name=clean_name,
                language="image",
                content=img_url,
                size=1024 * 1024,
                timestamp=timestamp,
                is_converted=True,
            )
            extracted.append(file_item)
            self.file_registry.insert(0, file_item)
            img_idx += 1

        return [f.to_dict() for f in extracted]

    def get_all_files(self) -> List[Dict[str, Any]]:
        return [f.to_dict() for f in self.file_registry]

    def get_file_by_id(self, file_id: str) -> Optional[GeneratedFile]:
        for f in self.file_registry:
            if f.id == file_id:
                return f
        return None

    def create_zip_archive(self) -> bytes:
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
            for f in self.file_registry:
                arcname = f"nerv_magi_generated_files/{f.provider}/{f.name}"
                # Caso 1: Imagem local do cofre
                if f.language == "image" and f.content.startswith("/api/vault/image/"):
                    img_rel = f.content.replace("/api/vault/image/", "").strip()
                    disk_target = ARTIFACTS_DIR / img_rel
                    if disk_target.exists():
                        z.writestr(arcname, disk_target.read_bytes())
                        continue
                # Caso 2: Arquivo bin?rio convertido do cofre
                elif f.content.startswith("/api/vault/file/"):
                    file_rel = f.content.replace("/api/vault/file/", "").strip()
                    disk_target = ARTIFACTS_DIR / file_rel
                    if disk_target.exists():
                        z.writestr(arcname, disk_target.read_bytes())
                        continue
                elif f.content.startswith("data:image/"):
                    try:
                        import base64
                        _, b64_part = f.content.split(",", 1)
                        z.writestr(arcname, base64.b64decode(b64_part))
                        continue
                    except Exception:
                        pass
                elif f.content.startswith("http"):
                    try:
                        import requests
                        r = requests.get(f.content, timeout=12)
                        if r.ok:
                            z.writestr(arcname, r.content)
                            continue
                    except Exception:
                        pass
                z.writestr(arcname, f.content)
        buf.seek(0)
        return buf.getvalue()

    def clear_all(self):
        self.file_registry.clear()
        try:
            if ARTIFACTS_DIR.exists():
                for p in ARTIFACTS_DIR.glob("*"):
                    if p.is_file():
                        p.unlink()
        except Exception as e:
            print(f"[NERV VAULT] Erro ao limpar disco de artefatos: {e}")

artifacts_manager = ArtifactsManager()
