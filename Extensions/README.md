# NERV MAGI EXTENSIONS // CONVERSORES E GERADORES DE ARQUIVOS

Esta pasta armazena os conversores táticos de arquivos da Central NERV MAGI.
Por padrão, o sistema MAGI já inclui a capacidade nativa de converter e gerar:

1. **Documentos Word (.doc, .docx)**: `doc_converter.py`
   - Formatação estruturada, títulos táticos NERV, tabelas e cabeçalhos.
2. **Planilhas Excel (.xls, .xlsx)**: `xls_converter.py`
   - Conversão de Markdown, JSON e CSV para planilhas estilizadas com cabeçalhos NERV.
3. **Apresentações (.ppt, .pptx)**: `ppt_converter.py`
   - Geração de slides 16:9 widescreen com layout executivo NERV.
4. **Documentos PDF (.pdf)**: `pdf_converter.py`
   - Criação de relatórios técnicos de alta definição com ReportLab.
5. **Imagens de Alta Resolução (.png, .jpg)**: `image_converter.py`
   - **Nano Banana sem marca d'água** como motor de síntese visual padrão.
   - Conversão e otimização de imagens com canal Alpha e paleta 24-bit.
6. **Motor Unificado e Salvar Como Nativo**: `file_generator.py`
   - Diálogo nativo do Windows (`asksaveasfilename`) permitindo ao operador escolher o diretório de destino.
