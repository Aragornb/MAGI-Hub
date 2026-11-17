"""NERV MAGI EXTENSIONS // PDF CONVERTER
Converte relatórios, textos e dados em documentos PDF (.pdf) profissionais com layout estruturado.
"""
import io
import re
from typing import Union, Optional, List
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Preformatted,
    HRFlowable,
)

def convert_to_pdf(content: Union[str, bytes], title: Optional[str] = None) -> bytes:
    """Converte conteúdo de texto ou markdown para documento PDF (.pdf)."""
    if isinstance(content, bytes):
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("latin-1", errors="replace")
    else:
        text = str(content)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        rightMargin=45,
        leftMargin=45,
        topMargin=45,
        bottomMargin=45,
    )

    styles = getSampleStyleSheet()

    # Custom Tactical Evangelion Typography Styles
    style_title = ParagraphStyle(
        "NervTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#D9530F"),
        spaceAfter=4,
    )

    style_sub = ParagraphStyle(
        "NervSub",
        parent=styles["Normal"],
        fontName="Courier-Oblique",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#7A5A3A"),
        spaceAfter=12,
    )

    style_h1 = ParagraphStyle(
        "NervH1",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#1A0F07"),
        spaceBefore=10,
        spaceAfter=6,
    )

    style_h2 = ParagraphStyle(
        "NervH2",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#2B5B84"),
        spaceBefore=8,
        spaceAfter=4,
    )

    style_body = ParagraphStyle(
        "NervBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#222222"),
        spaceAfter=6,
    )

    style_bullet = ParagraphStyle(
        "NervBullet",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#222222"),
        leftIndent=15,
        spaceAfter=4,
    )

    style_quote = ParagraphStyle(
        "NervQuote",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#555555"),
        leftIndent=15,
        spaceAfter=6,
    )

    style_code = ParagraphStyle(
        "NervCode",
        fontName="Courier",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#111111"),
    )

    elements = []

    # Title & Header Banner
    doc_title = title or "RELATÓRIO TÁTICO // NERV MAGI SYSTEM"
    elements.append(Paragraph(doc_title, style_title))
    elements.append(Paragraph("[CLASSIFIED // NERV CENTRAL DOGMA // ARQUIVO NEURAL EMITIDO]", style_sub))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#FF7A00"), spaceAfter=12))

    lines = text.split("\n")
    in_code_block = False
    code_lines = []
    table_lines = []

    def flush_table():
        if not table_lines:
            return
        rows = []
        for tl in table_lines:
            cells = [c.strip() for c in tl.strip().strip("|").split("|")]
            if all(set(c) <= set("-: ") for c in cells):
                continue
            rows.append([Paragraph(c, style_body) for c in cells])
        if rows:
            t = Table(rows, hAlign='LEFT')
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1A0F07")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#FFCA8A")),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
            ]))
            elements.append(t)
            elements.append(Spacer(1, 8))
        table_lines.clear()

    for line in lines:
        stripped = line.strip()

        if stripped.startswith("```"):
            if in_code_block:
                in_code_block = False
                c_text = "\n".join(code_lines)
                code_elem = Preformatted(c_text, style_code)
                code_table = Table([[code_elem]], colWidths=[520])
                code_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F5F3F0")),
                    ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#D9D2C9")),
                    ('TOPPADDING', (0, 0), (-1, -1), 6),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('LEFTPADDING', (0, 0), (-1, -1), 8),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ]))
                elements.append(code_table)
                elements.append(Spacer(1, 6))
                code_lines.clear()
            else:
                flush_table()
                in_code_block = True
                code_lines.clear()
            continue

        if in_code_block:
            code_lines.append(line)
            continue

        if stripped.startswith("|") and stripped.endswith("|"):
            table_lines.append(stripped)
            continue
        elif table_lines:
            flush_table()

        if not stripped:
            elements.append(Spacer(1, 4))
            continue

        # HTML-escape for reportlab paragraph xml
        safe_line = stripped.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

        if safe_line.startswith("# "):
            elements.append(Paragraph(safe_line[2:], style_h1))
        elif safe_line.startswith("## "):
            elements.append(Paragraph(safe_line[3:], style_h2))
        elif safe_line.startswith("### "):
            elements.append(Paragraph(safe_line[4:], style_h2))
        elif safe_line.startswith(("- ", "* ", "+ ")):
            bullet_text = f"&bull; {safe_line[2:]}"
            elements.append(Paragraph(bullet_text, style_bullet))
        elif re.match(r"^\d+\.\s", safe_line):
            elements.append(Paragraph(safe_line, style_bullet))
        elif safe_line.startswith("&gt; "):
            elements.append(Paragraph(safe_line[5:], style_quote))
        else:
            elements.append(Paragraph(safe_line, style_body))

    if in_code_block and code_lines:
        code_elem = Preformatted("\n".join(code_lines), style_code)
        elements.append(code_elem)
    if table_lines:
        flush_table()

    # Footer note
    elements.append(Spacer(1, 15))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#D9D2C9"), spaceAfter=6))
    elements.append(Paragraph("NERV MAGI SUPERCOMPUTER // AUTONOMOUS AI NODE REPORT // SECURITY CLEARANCE LEVEL-A", style_sub))

    doc.build(elements)
    return buf.getvalue()
