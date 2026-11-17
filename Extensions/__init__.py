"""NERV MAGI EXTENSIONS // FILE GENERATION CONVERTERS
Módulo central de registro e despacho de conversores de arquivos.
Suporta conversão e geração de: DOC/DOCX, XLS/XLSX, PPT/PPTX, PDF, PNG e JPG.
"""
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, Union

from .doc_converter import convert_to_doc
from .xls_converter import convert_to_xls
from .ppt_converter import convert_to_ppt
from .pdf_converter import convert_to_pdf
from .image_converter import convert_or_generate_image

SUPPORTED_EXTENSIONS = {
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xls": "application/vnd.ms-excel",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "ppt": "application/vnd.ms-powerpoint",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "pdf": "application/pdf",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
}

def generate_file_by_extension(
    content: Union[str, bytes],
    extension: str,
    output_path: Optional[Union[str, Path]] = None,
    title: Optional[str] = None,
) -> Tuple[bytes, str]:
    """Converte ou sintetiza o conteúdo no formato desejado.

    Retorna uma tupla (bytes_gerados, mime_type).
    Se output_path for especificado, salva o arquivo em disco.
    """
    ext = extension.lower().lstrip(".")
    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Extensão '.{ext}' não é suportada por NERV Extensions. Suportadas: {list(SUPPORTED_EXTENSIONS.keys())}")

    mime = SUPPORTED_EXTENSIONS[ext]

    if ext in ("doc", "docx"):
        data = convert_to_doc(content, title=title)
    elif ext in ("xls", "xlsx"):
        data = convert_to_xls(content, title=title)
    elif ext in ("ppt", "pptx"):
        data = convert_to_ppt(content, title=title)
    elif ext == "pdf":
        data = convert_to_pdf(content, title=title)
    elif ext in ("png", "jpg", "jpeg"):
        data = convert_or_generate_image(content, target_format=ext, title=title)
    else:
        raise ValueError(f"Conversor não implementado para .{ext}")

    if output_path:
        out_p = Path(output_path)
        out_p.parent.mkdir(parents=True, exist_ok=True)
        out_p.write_bytes(data)

    return data, mime

__all__ = [
    "SUPPORTED_EXTENSIONS",
    "generate_file_by_extension",
    "convert_to_doc",
    "convert_to_xls",
    "convert_to_ppt",
    "convert_to_pdf",
    "convert_or_generate_image",
]
