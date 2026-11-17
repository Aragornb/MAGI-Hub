"""NERV MAGI EXTENSIONS // PPT / PPTX CONVERTER
Converte tópicos, roteiros, resumos e apresentações em slides do PowerPoint (.pptx / .ppt).
"""
import io
import re
from typing import Union, Optional, List
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

def convert_to_ppt(content: Union[str, bytes], title: Optional[str] = None) -> bytes:
    """Converte conteúdo estruturado ou tópicos em apresentação PowerPoint (.pptx/.ppt)."""
    if isinstance(content, bytes):
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("latin-1", errors="replace")
    else:
        text = str(content)

    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5) # 16:9 Widescreen

    # 1. Slide de Título
    title_slide_layout = prs.slide_layouts[0]
    slide = prs.slides.add_slide(title_slide_layout)
    
    # Background color
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = RGBColor(0x07, 0x05, 0x04) # NERV Dark

    title_box = slide.shapes.title
    title_box.text = title or "NERV MAGI SUPERCOMPUTER // BRIEFING TÁTICO"
    for p in title_box.text_frame.paragraphs:
        p.font.name = "Calibri"
        p.font.size = Pt(36)
        p.font.bold = True
        p.font.color.rgb = RGBColor(0xFF, 0x7A, 0x00) # Orange
        p.alignment = PP_ALIGN.LEFT

    if len(slide.placeholders) > 1:
        subtitle_box = slide.placeholders[1]
        subtitle_box.text = "[CLASSIFIED // APRESENTAÇÃO DE DELIBERAÇÃO NEURAL // TOKYO-3]\nGerado automaticamente via NERV Extensions Core"
        for p in subtitle_box.text_frame.paragraphs:
            p.font.name = "Consolas"
            p.font.size = Pt(14)
            p.font.color.rgb = RGBColor(0xFF, 0xCA, 0x8A)
            p.alignment = PP_ALIGN.LEFT

    # Split text into slides by sections, '---', or '# Slide'
    raw_slides: List[Dict[str, Any]] = []
    current_title = "PONTOS E DIRETRIZES"
    current_bullets: List[str] = []

    lines = text.split("\n")
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        if stripped.startswith("---") or re.match(r"^#{1,2}\s+(slide\b|seção\b|tópico\b|etapa\b)", stripped, re.IGNORECASE):
            if current_bullets:
                raw_slides.append({"title": current_title, "bullets": list(current_bullets)})
                current_bullets.clear()
            current_title = re.sub(r"^#{1,3}\s+", "", stripped).replace("---", "").strip() or "DIRETRIZ TÁTICA"
            continue

        if stripped.startswith(("# ", "## ")):
            if current_bullets:
                raw_slides.append({"title": current_title, "bullets": list(current_bullets)})
                current_bullets.clear()
            current_title = stripped.lstrip("#").strip()
            continue

        # Clean bullet marker
        clean_item = re.sub(r"^[-*+]\s+", "", stripped)
        clean_item = re.sub(r"^\d+\.\s+", "", clean_item)
        current_bullets.append(clean_item)

    if current_bullets:
        raw_slides.append({"title": current_title, "bullets": current_bullets})

    # If no slides created, chunk the lines
    if not raw_slides:
        chunk_size = 5
        clean_lines = [l.strip() for l in lines if l.strip()]
        for i in range(0, len(clean_lines), chunk_size):
            chunk = clean_lines[i : i + chunk_size]
            raw_slides.append({
                "title": f"DIRETRIZES OPERACIONAIS // PARTE {(i // chunk_size) + 1}",
                "bullets": chunk
            })

    # Render content slides
    content_layout = prs.slide_layouts[1]
    for s_data in raw_slides:
        c_slide = prs.slides.add_slide(content_layout)
        bg = c_slide.background
        fill = bg.fill
        fill.solid()
        fill.fore_color.rgb = RGBColor(0x0C, 0x08, 0x05)

        # Title
        t_shape = c_slide.shapes.title
        t_shape.text = s_data["title"]
        for p in t_shape.text_frame.paragraphs:
            p.font.name = "Calibri"
            p.font.size = Pt(28)
            p.font.bold = True
            p.font.color.rgb = RGBColor(0xFF, 0x7A, 0x00)

        # Body
        if len(c_slide.placeholders) > 1:
            body_shape = c_slide.placeholders[1]
            tf = body_shape.text_frame
            tf.word_wrap = True
            tf.clear()

            for idx, bullet in enumerate(s_data["bullets"][:8]): # Max 8 bullets per slide
                p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
                p.text = bullet
                p.level = 0
                p.font.name = "Calibri"
                p.font.size = Pt(16)
                p.font.color.rgb = RGBColor(0xFF, 0xCA, 0x8A)
                p.space_after = Pt(10)

    buf = io.BytesIO()
    prs.save(buf)
    return buf.getvalue()
