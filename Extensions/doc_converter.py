"""NERV MAGI EXTENSIONS // DOC / DOCX CONVERTER
Converte texto, markdown e relatórios em documentos do Word (.docx / .doc).
"""
import io
import re
from typing import Union, Optional
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, fill_hex: str):
    """Define a cor de fundo de uma célula da tabela."""
    tcPr = cell._element.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def convert_to_doc(content: Union[str, bytes], title: Optional[str] = None) -> bytes:
    """Converte conteúdo textual ou markdown para documento Word (.docx/.doc)."""
    if isinstance(content, bytes):
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("latin-1", errors="replace")
    else:
        text = str(content)

    doc = Document()

    # Page setup: Margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Document Header Title
    doc_title = title or "RELATÓRIO TÁTICO // NERV MAGI HUB"
    heading = doc.add_heading(level=0)
    run_title = heading.add_run(doc_title)
    run_title.font.name = "Calibri"
    run_title.font.size = Pt(20)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(0xD9, 0x53, 0x0F) # NERV Orange

    # Subtitle with metadata
    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.LEFT
    sub_run = sub.add_run("[CLASSIFIED // NERV CENTRAL DOGMA // MAGI ARCHIVE SYSTEM]")
    sub_run.font.name = "Consolas"
    sub_run.font.size = Pt(9)
    sub_run.font.italic = True
    sub_run.font.color.rgb = RGBColor(0x7A, 0x5A, 0x3A)

    lines = text.split("\n")
    in_code_block = False
    code_lines = []
    table_lines = []

    def flush_table():
        if not table_lines:
            return
        # Parse markdown table
        rows = []
        for tl in table_lines:
            cells = [c.strip() for c in tl.strip().strip("|").split("|")]
            if all(set(c) <= set("-: ") for c in cells):
                continue # Divider line
            rows.append(cells)
        if rows:
            max_cols = max(len(r) for r in rows)
            table = doc.add_table(rows=len(rows), cols=max_cols)
            table.style = 'Table Grid'
            for r_idx, row in enumerate(rows):
                for c_idx, val in enumerate(row):
                    cell = table.cell(r_idx, c_idx)
                    cell.text = val
                    if r_idx == 0:
                        set_cell_background(cell, "2D1B0E")
                        for p in cell.paragraphs:
                            for r in p.runs:
                                r.font.bold = True
                                r.font.color.rgb = RGBColor(0xFF, 0xCA, 0x8A)
                                r.font.size = Pt(9.5)
                    else:
                        for p in cell.paragraphs:
                            for r in p.runs:
                                r.font.size = Pt(9.5)
            doc.add_paragraph()
        table_lines.clear()

    for line in lines:
        stripped = line.strip()

        # Handle code blocks
        if stripped.startswith("```"):
            if in_code_block:
                in_code_block = False
                code_text = "\n".join(code_lines)
                p = doc.add_paragraph()
                p.paragraph_format.left_indent = Inches(0.4)
                p.paragraph_format.space_before = Pt(4)
                p.paragraph_format.space_after = Pt(4)
                r = p.add_run(code_text)
                r.font.name = "Consolas"
                r.font.size = Pt(9)
                r.font.color.rgb = RGBColor(0x33, 0x33, 0x33)
                code_lines.clear()
            else:
                flush_table()
                in_code_block = True
                code_lines.clear()
            continue

        if in_code_block:
            code_lines.append(line)
            continue

        # Handle Markdown Tables
        if stripped.startswith("|") and stripped.endswith("|"):
            table_lines.append(stripped)
            continue
        elif table_lines:
            flush_table()

        if not stripped:
            continue

        # Headings
        if stripped.startswith("# "):
            h = doc.add_heading(stripped[2:], level=1)
            for r in h.runs:
                r.font.color.rgb = RGBColor(0xD9, 0x53, 0x0F)
        elif stripped.startswith("## "):
            h = doc.add_heading(stripped[3:], level=2)
            for r in h.runs:
                r.font.color.rgb = RGBColor(0x2B, 0x5B, 0x84)
        elif stripped.startswith("### "):
            h = doc.add_heading(stripped[4:], level=3)
            for r in h.runs:
                r.font.color.rgb = RGBColor(0x4A, 0x6B, 0x52)
        elif stripped.startswith(("- ", "* ", "+ ")):
            doc.add_paragraph(stripped[2:], style='List Bullet')
        elif re.match(r"^\d+\.\s", stripped):
            content_part = re.sub(r"^\d+\.\s", "", stripped)
            doc.add_paragraph(content_part, style='List Number')
        elif stripped.startswith("> "):
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.3)
            r = p.add_run(stripped[2:])
            r.font.italic = True
            r.font.color.rgb = RGBColor(0x55, 0x55, 0x55)
        else:
            doc.add_paragraph(line)

    if in_code_block and code_lines:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.4)
        r = p.add_run("\n".join(code_lines))
        r.font.name = "Consolas"
        r.font.size = Pt(9)
    if table_lines:
        flush_table()

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()
