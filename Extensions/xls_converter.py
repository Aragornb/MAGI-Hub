"""NERV MAGI EXTENSIONS // XLS / XLSX CONVERTER
Converte tabelas markdown, CSV, JSON e dados tabulares em planilhas Excel estilizadas (.xlsx / .xls).
"""
import io
import csv
import json
import re
from typing import Union, Optional, List
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def convert_to_xls(content: Union[str, bytes], title: Optional[str] = None) -> bytes:
    """Converte conteúdo de tabelas (markdown, CSV, TSV, JSON) em planilha Excel (.xlsx/.xls)."""
    if isinstance(content, bytes):
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("latin-1", errors="replace")
    else:
        text = str(content)

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = (title or "NERV_DATA")[:30]

    # Styling definitions
    header_fill = PatternFill(start_color="1A0F07", end_color="1A0F07", fill_type="solid")
    header_font = Font(name="Consolas", size=11, bold=True, color="FF7A00")
    header_align = Alignment(horizontal="center", vertical="center", wrap_text=True)

    data_font = Font(name="Calibri", size=10, color="000000")
    data_align = Alignment(vertical="center")

    thin_border = Border(
        left=Side(style='thin', color='4A3520'),
        right=Side(style='thin', color='4A3520'),
        top=Side(style='thin', color='4A3520'),
        bottom=Side(style='thin', color='4A3520')
    )

    rows: List[List[str]] = []

    # 1. Try parsing JSON array of objects or rows
    stripped = text.strip()
    if (stripped.startswith("[") and stripped.endswith("]")) or (stripped.startswith("{") and stripped.endswith("}")):
        try:
            parsed = json.loads(stripped)
            if isinstance(parsed, list) and len(parsed) > 0 and isinstance(parsed[0], dict):
                headers = list(parsed[0].keys())
                rows.append(headers)
                for item in parsed:
                    rows.append([str(item.get(h, "")) for h in headers])
            elif isinstance(parsed, dict):
                rows.append(["CAMPO / CHAVE", "VALOR REGISTRADO"])
                for k, v in parsed.items():
                    rows.append([str(k), str(v)])
        except Exception:
            rows.clear()

    # 2. Try parsing Markdown Table (| col1 | col2 |)
    if not rows and "|" in text:
        for line in text.split("\n"):
            line_str = line.strip()
            if line_str.startswith("|") and line_str.endswith("|"):
                cells = [c.strip() for c in line_str.strip("|").split("|")]
                if all(set(c) <= set("-: ") for c in cells):
                    continue # Skip divider
                rows.append(cells)

    # 3. Try parsing CSV / TSV / Delimited Lines
    if not rows:
        delimiter = "\t" if "\t" in text else "," if "," in text else ";"
        try:
            reader = csv.reader(io.StringIO(text), delimiter=delimiter)
            for row in reader:
                if any(row):
                    rows.append(row)
        except Exception:
            rows.clear()

    # 4. Fallback: Parse line by line
    if not rows:
        rows.append(["LINHA", "CONTEÚDO"])
        for idx, line in enumerate(text.split("\n")):
            if line.strip():
                rows.append([str(idx + 1), line.strip()])

    # Write data to worksheet
    for r_idx, row_data in enumerate(rows, start=1):
        for c_idx, cell_value in enumerate(row_data, start=1):
            cell = ws.cell(row=r_idx, column=c_idx)
            
            # Try numeric conversion
            val_clean = str(cell_value).strip().replace("$", "").replace("R$", "").replace("€", "").strip()
            if re.match(r"^-?\d+(\.\d+)?$", val_clean):
                try:
                    cell.value = float(val_clean) if "." in val_clean else int(val_clean)
                except ValueError:
                    cell.value = cell_value
            else:
                cell.value = cell_value

            cell.border = thin_border

            if r_idx == 1:
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = header_align
                ws.row_dimensions[r_idx].height = 26
            else:
                cell.font = data_font
                cell.alignment = data_align
                ws.row_dimensions[r_idx].height = 18

    # Auto-adjust column widths
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val_str = str(cell.value or "")
            if len(val_str) > max_len:
                max_len = len(val_str)
        ws.column_dimensions[col_letter].width = min(max(max_len + 3, 12), 50)

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()
