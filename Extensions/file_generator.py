"""NERV MAGI EXTENSIONS // UNIFIED FILE GENERATOR
Motor tático de criação e conversão de múltiplos formatos de arquivos:
- Documentos Word: .doc, .docx
- Planilhas Excel: .xls, .xlsx
- Apresentações: .ppt, .pptx
- Documentos Portable: .pdf
- Imagens de alta fidelidade: .png, .jpg (Nano Banana sem marca d'água)
"""
import os
import sys
import time
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, Union

from . import SUPPORTED_EXTENSIONS, generate_file_by_extension

class FileGeneratorEngine:
    def __init__(self, output_dir: Optional[Path] = None):
        self.output_dir = output_dir or (Path(__file__).parent.parent / "nerv_vault_files")
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate(
        self,
        content: Union[str, bytes],
        extension: str,
        filename: Optional[str] = None,
        title: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Gera um arquivo físico com o conversor correspondente à extensão."""
        ext = extension.lower().lstrip(".")
        if ext not in SUPPORTED_EXTENSIONS:
            raise ValueError(f"Extensão '.{ext}' não suportada. Opções: {list(SUPPORTED_EXTENSIONS.keys())}")

        timestamp = int(time.time() * 1000)
        safe_name = filename or f"nerv_generated_{timestamp}.{ext}"
        if not safe_name.lower().endswith(f".{ext}"):
            safe_name = f"{safe_name}.{ext}"

        file_bytes, mime = generate_file_by_extension(
            content=content,
            extension=ext,
            title=title or safe_name,
        )

        target_path = self.output_dir / safe_name
        target_path.write_bytes(file_bytes)

        return {
            "name": safe_name,
            "path": str(target_path),
            "size": len(file_bytes),
            "mime": mime,
            "extension": ext,
            "bytes": file_bytes,
        }

    def open_native_save_dialog(
        self,
        file_bytes: bytes,
        default_name: str,
        extension: str,
    ) -> Optional[str]:
        """Abre o diálogo nativo do Windows 'Salvar Como' usando comdlg32.dll sem Tkinter."""
        try:
            import ctypes
            from ctypes import wintypes

            class OPENFILENAMEW(ctypes.Structure):
                _fields_ = [
                    ("lStructSize", wintypes.DWORD),
                    ("hwndOwner", wintypes.HWND),
                    ("hInstance", wintypes.HINSTANCE),
                    ("lpstrFilter", wintypes.LPCWSTR),
                    ("lpstrCustomFilter", wintypes.LPWSTR),
                    ("nMaxCustFilter", wintypes.DWORD),
                    ("nFilterIndex", wintypes.DWORD),
                    ("lpstrFile", wintypes.LPWSTR),
                    ("nMaxFile", wintypes.DWORD),
                    ("lpstrFileTitle", wintypes.LPWSTR),
                    ("nMaxFileTitle", wintypes.DWORD),
                    ("lpstrInitialDir", wintypes.LPCWSTR),
                    ("lpstrTitle", wintypes.LPCWSTR),
                    ("Flags", wintypes.DWORD),
                    ("nFileOffset", wintypes.WORD),
                    ("nFileExtension", wintypes.WORD),
                    ("lpstrDefExt", wintypes.LPCWSTR),
                    ("lCustData", wintypes.LPARAM),
                    ("lpfnHook", wintypes.LPVOID),
                    ("lpTemplateName", wintypes.LPCWSTR),
                    ("pvReserved", wintypes.LPVOID),
                    ("dwReserved", wintypes.DWORD),
                    ("FlagsEx", wintypes.DWORD)
                ]

            ext = extension.lower().lstrip(".")
            filter_str = f"Arquivo {ext.upper()} (*.{ext})\0*.{ext}\0Todos os Arquivos (*.*)\0*.*\0\0"
            buffer = ctypes.create_unicode_buffer(default_name, 1024)

            ofn = OPENFILENAMEW()
            ofn.lStructSize = ctypes.sizeof(OPENFILENAMEW)
            try:
                ofn.hwndOwner = ctypes.windll.user32.GetForegroundWindow()
            except Exception:
                ofn.hwndOwner = None
            ofn.lpstrFilter = filter_str
            ofn.lpstrFile = ctypes.cast(buffer, wintypes.LPWSTR)
            ofn.nMaxFile = 1024
            ofn.lpstrTitle = f"NERV MAGI // SALVAR ARQUIVO: {default_name}"
            # OFN_OVERWRITEPROMPT (0x02) | OFN_PATHMUSTEXIST (0x800) | OFN_NOCHANGEDIR (0x08) | OFN_EXPLORER (0x80000)
            ofn.Flags = 0x00000002 | 0x00000800 | 0x00000008 | 0x00080000
            ofn.lpstrDefExt = ext

            res = ctypes.windll.comdlg32.GetSaveFileNameW(ctypes.byref(ofn))
            if res:
                chosen_path = Path(buffer.value)
                chosen_path.write_bytes(file_bytes)
                return str(chosen_path)
            return None
        except Exception as e:
            print(f"[EXTENSIONS ERROR] Falha ao abrir SaveFileDialog nativo: {e}")
            return None

file_generator = FileGeneratorEngine()
