# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_all

datas = [('dist', 'dist'), ('Extensions', 'Extensions'), ('nerv_icon.ico', '.')]
binaries = []
hiddenimports = [
    'flask', 'requests', 'dotenv', 'jinja2', 'werkzeug', 'clr', 'pythonnet',
    'webview.platforms.winforms', 'ctypes', 'ctypes.wintypes',
    'reportlab', 'docx', 'openpyxl', 'pptx', 'PIL', 'pandas'
]

tmp_ret = collect_all('webview')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]

for pkg in ['reportlab', 'docx', 'openpyxl', 'pptx', 'pandas', 'google.genai']:
    try:
        ret = collect_all(pkg)
        datas += ret[0]; binaries += ret[1]; hiddenimports += ret[2]
    except Exception:
        pass

a = Analysis(
    ['server.py'],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='NervMagiHub',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=['nerv_icon.ico'],
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='NervMagiHub',
)
