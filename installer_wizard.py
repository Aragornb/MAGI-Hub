"""NERV CENTRAL DOGMA // ASSISTENTE DE INSTALAÇÃO DO SISTEMA MAGI
Instalador Gráfico com temática Neon Genesis Evangelion para Windows.
Instala o NERV MAGI HUB, cria atalhos no Desktop e Menu Iniciar, e inicializa o sistema.
"""
import os
import sys

# Redireciona stdout e stderr quando em modo windowed (sem console/cmd)
if sys.stdout is None:
    sys.stdout = open(os.devnull, "w", encoding="utf-8")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w", encoding="utf-8")

import shutil
import zipfile
import threading
import subprocess
from pathlib import Path
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

# Default installation directory: %LOCALAPPDATA%\NervMagiHub
DEFAULT_INSTALL_DIR = Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "NervMagiHub"

def get_bundle_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(getattr(sys, "_MEIPASS", sys.executable)).resolve()
    return Path(__file__).parent.resolve()

def create_windows_shortcut(target_exe: str, shortcut_path: str, icon_path: str, description: str):
    try:
        ps_script = f"""
        $WshShell = New-Object -ComObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut("{shortcut_path}")
        $Shortcut.TargetPath = "{target_exe}"
        $Shortcut.WorkingDirectory = "{os.path.dirname(target_exe)}"
        $Shortcut.IconLocation = "{icon_path}, 0"
        $Shortcut.Description = "{description}"
        $Shortcut.Save()
        """
        cflags = 0x08000000 if sys.platform == "win32" else 0
        subprocess.run(["powershell", "-NoProfile", "-Command", ps_script], capture_output=True, check=True, creationflags=cflags)
    except Exception as e:
        print(f"Erro ao criar atalho: {e}")

class NervInstallerApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("NERV // MAGI HUB - INSTALADOR OFICIAL")
        self.geometry("580x420")
        self.resizable(False, False)
        self.configure(bg="#070504")

        # Set window icon if available
        bundle_dir = get_bundle_dir()
        icon_path = bundle_dir / "nerv_icon.ico"
        if icon_path.exists():
            try:
                self.iconbitmap(str(icon_path))
            except Exception:
                pass

        self.install_dir_var = tk.StringVar(value=str(DEFAULT_INSTALL_DIR))
        self.create_desktop_shortcut = tk.BooleanVar(value=True)
        self.launch_after = tk.BooleanVar(value=True)

        self._build_ui()

    def _build_ui(self):
        # Header banner
        header = tk.Frame(self, bg="#120a06", height=70, bd=1, relief="solid")
        header.pack(fill="x", side="top")

        lbl_classified = tk.Label(
            header,
            text="[CLASSIFIED // NERV CENTRAL DOGMA // MAGI SUPERCOMPUTER]",
            bg="#120a06",
            fg="#ff7a00",
            font=("Consolas", 8, "bold"),
        )
        lbl_classified.pack(anchor="w", padx=15, pady=(10, 2))

        lbl_title = tk.Label(
            header,
            text="NERV MAGI HUB // ASSISTENTE DE INSTALAÇÃO",
            bg="#120a06",
            fg="#ffca8a",
            font=("Consolas", 14, "bold"),
        )
        lbl_title.pack(anchor="w", padx=15, pady=(0, 10))

        # Hazard divider stripe
        hazard = tk.Frame(self, bg="#ff7a00", height=3)
        hazard.pack(fill="x")

        # Main content
        content = tk.Frame(self, bg="#070504")
        content.pack(fill="both", expand=True, padx=25, pady=15)

        lbl_desc = tk.Label(
            content,
            text=(
                "Bem-vindo ao instalador do NERV MAGI HUB.\n"
                "Este assistente configurará o hub de deliberação neural e integração\n"
                "das IAs (ChatGPT, Claude, Gemini, Grok e DeepSeek) no seu computador."
            ),
            bg="#070504",
            fg="#ffca8a",
            font=("Consolas", 9),
            justify="left",
        )
        lbl_desc.pack(anchor="w", pady=(0, 15))

        # Folder selection
        lbl_dir = tk.Label(
            content,
            text="DIRETÓRIO DE INSTALAÇÃO:",
            bg="#070504",
            fg="#ff7a00",
            font=("Consolas", 9, "bold"),
        )
        lbl_dir.pack(anchor="w")

        dir_frame = tk.Frame(content, bg="#070504")
        dir_frame.pack(fill="x", pady=(4, 12))

        entry_dir = tk.Entry(
            dir_frame,
            textvariable=self.install_dir_var,
            bg="#140e08",
            fg="#ffffff",
            insertbackground="#ff7a00",
            font=("Consolas", 9),
            relief="solid",
            bd=1,
        )
        entry_dir.pack(side="left", fill="x", expand=True, ipady=4)

        btn_browse = tk.Button(
            dir_frame,
            text="PROCURAR...",
            bg="#1a100a",
            fg="#ffca8a",
            activebackground="#ff7a00",
            activeforeground="#000000",
            font=("Consolas", 8, "bold"),
            relief="solid",
            bd=1,
            cursor="hand2",
            command=self._browse_dir,
        )
        btn_browse.pack(side="left", padx=(8, 0), ipadx=8, ipady=2)

        # Options checkboxes
        chk_desktop = tk.Checkbutton(
            content,
            text="Criar atalho na Área de Trabalho (Desktop)",
            variable=self.create_desktop_shortcut,
            bg="#070504",
            fg="#ffca8a",
            activebackground="#070504",
            activeforeground="#ff7a00",
            selectcolor="#140e08",
            font=("Consolas", 9),
            cursor="hand2",
        )
        chk_desktop.pack(anchor="w", pady=2)

        chk_launch = tk.Checkbutton(
            content,
            text="Iniciar o NERV MAGI HUB imediatamente após a instalação",
            variable=self.launch_after,
            bg="#070504",
            fg="#ffca8a",
            activebackground="#070504",
            activeforeground="#ff7a00",
            selectcolor="#140e08",
            font=("Consolas", 9),
            cursor="hand2",
        )
        chk_launch.pack(anchor="w", pady=2)

        # Progress bar
        self.progress_var = tk.DoubleVar(value=0.0)
        self.progress_bar = ttk.Progressbar(
            content,
            variable=self.progress_var,
            maximum=100,
        )
        self.progress_bar.pack(fill="x", pady=(15, 4))

        self.lbl_status = tk.Label(
            content,
            text="Pronto para iniciar instalação.",
            bg="#070504",
            fg="#8a6845",
            font=("Consolas", 8),
            anchor="w",
        )
        self.lbl_status.pack(fill="x")

        # Bottom actions
        hazard_bottom = tk.Frame(self, bg="#3a2010", height=1)
        hazard_bottom.pack(fill="x", side="bottom")

        actions = tk.Frame(self, bg="#090704", height=50)
        actions.pack(fill="x", side="bottom", padx=25, pady=10)

        self.btn_cancel = tk.Button(
            actions,
            text="CANCELAR",
            bg="#140e08",
            fg="#8a6845",
            activebackground="#ff2233",
            activeforeground="#ffffff",
            font=("Consolas", 9, "bold"),
            relief="solid",
            bd=1,
            cursor="hand2",
            command=self.destroy,
        )
        self.btn_cancel.pack(side="right", padx=(10, 0), ipadx=12, ipady=4)

        self.btn_install = tk.Button(
            actions,
            text="INSTALAR AGORA",
            bg="#ff7a00",
            fg="#000000",
            activebackground="#ffffff",
            activeforeground="#000000",
            font=("Consolas", 9, "bold"),
            relief="solid",
            bd=1,
            cursor="hand2",
            command=self._start_installation,
        )
        self.btn_install.pack(side="right", ipadx=15, ipady=4)

    def _browse_dir(self):
        chosen = filedialog.askdirectory(initialdir=self.install_dir_var.get())
        if chosen:
            self.install_dir_var.set(chosen)

    def _start_installation(self):
        self.btn_install.configure(state="disabled", bg="#4a301a", text="INSTALANDO...")
        self.btn_cancel.configure(state="disabled")
        threading.Thread(target=self._perform_install, daemon=True).start()

    def _perform_install(self):
        try:
            target_dir = Path(self.install_dir_var.get())
            target_dir.mkdir(parents=True, exist_ok=True)

            self.lbl_status.configure(text="Localizando pacote de instalação...")
            self.progress_var.set(20)

            bundle_dir = get_bundle_dir()
            payload_zip = bundle_dir / "installer_payload.zip"

            # If payload_zip is not bundled, look for local folder
            if payload_zip.exists():
                self.lbl_status.configure(text="Extraindo arquivos do NERV MAGI HUB...")
                self.progress_var.set(40)
                with zipfile.ZipFile(payload_zip, "r") as z:
                    z.extractall(target_dir)
            else:
                # Direct folder copy fallback
                source_dir = bundle_dir / "NervMagiHub"
                if not source_dir.exists():
                    source_dir = bundle_dir
                self.lbl_status.configure(text="Copiando binários do NERV MAGI HUB...")
                self.progress_var.set(50)
                for item in source_dir.glob("*"):
                    if item.name not in ("installer_payload.zip", "Instalador_NERV_MAGI_HUB.exe"):
                        dest = target_dir / item.name
                        if item.is_dir():
                            if dest.exists():
                                shutil.rmtree(dest)
                            shutil.copytree(item, dest)
                        else:
                            shutil.copy2(item, dest)

            self.progress_var.set(75)
            self.lbl_status.configure(text="Criando atalhos e configurações...")

            exe_path = target_dir / "NervMagiHub.exe"
            icon_path = target_dir / "nerv_icon.ico"
            if not icon_path.exists():
                icon_path = target_dir / "NervMagiHub" / "nerv_icon.ico"
            if not exe_path.exists():
                alt_exe = target_dir / "NervMagiHub" / "NervMagiHub.exe"
                if alt_exe.exists():
                    exe_path = alt_exe

            # Desktop shortcut
            if self.create_desktop_shortcut.get() and exe_path.exists():
                desktop = Path(os.environ.get("USERPROFILE", "")) / "Desktop"
                if desktop.exists():
                    shortcut_path = desktop / "NERV MAGI HUB.lnk"
                    create_windows_shortcut(
                        str(exe_path),
                        str(shortcut_path),
                        str(icon_path) if icon_path.exists() else str(exe_path),
                        "NERV MAGI SUPERCOMPUTER // CONSOLE TÁTICO MULTI-IA",
                    )

            # Start menu shortcut
            start_menu = Path(os.environ.get("APPDATA", "")) / "Microsoft" / "Windows" / "Start Menu" / "Programs"
            if start_menu.exists() and exe_path.exists():
                sm_shortcut = start_menu / "NERV MAGI HUB.lnk"
                create_windows_shortcut(
                    str(exe_path),
                    str(sm_shortcut),
                    str(icon_path) if icon_path.exists() else str(exe_path),
                    "NERV MAGI SUPERCOMPUTER // CONSOLE TÁTICO MULTI-IA",
                )

            # Create uninstaller script
            uninstaller = (
                "@echo off\r\n"
                "title NERV MAGI HUB // DESINSTALADOR\r\n"
                "echo ========================================================\r\n"
                "echo      DESEJA REALMENTE DESINSTALAR O NERV MAGI HUB?\r\n"
                "echo ========================================================\r\n"
                "pause\r\n"
                f'del "%USERPROFILE%\\Desktop\\NERV MAGI HUB.lnk" 2>nul\r\n'
                f'del "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\NERV MAGI HUB.lnk" 2>nul\r\n'
                f'cd /d "%TEMP%"\r\n'
                f'rd /s /q "{target_dir}"\r\n'
                "echo NERV MAGI HUB removido com sucesso.\r\n"
                "pause\r\n"
            )
            (target_dir / "Desinstalar_Nerv_Magi.bat").write_text(uninstaller, encoding="utf-8")

            self.progress_var.set(100)
            self.lbl_status.configure(text="INSTALAÇÃO CONCLUÍDA COM SUCESSO!")

            # Launch if requested
            if self.launch_after.get() and exe_path.exists():
                cflags = 0x08000000 if sys.platform == "win32" else 0
                subprocess.Popen([str(exe_path)], cwd=str(exe_path.parent), creationflags=cflags)

            self.after(500, self._show_success)
        except Exception as e:
            self.lbl_status.configure(text=f"Erro durante a instalação: {e}")
            messagebox.showerror("Erro de Instalação", f"Falha ao instalar o NERV MAGI HUB:\n\n{e}")
            self.btn_install.configure(state="normal", text="TENTAR NOVAMENTE", bg="#ff7a00")
            self.btn_cancel.configure(state="normal")

    def _show_success(self):
        messagebox.showinfo(
            "NERV CENTRAL DOGMA",
            "Instalação do NERV MAGI HUB concluída com êxito!\n\n"
            "Atalhos foram criados na sua Área de Trabalho e Menu Iniciar.",
        )
        self.destroy()

if __name__ == "__main__":
    app = NervInstallerApp()
    app.mainloop()
