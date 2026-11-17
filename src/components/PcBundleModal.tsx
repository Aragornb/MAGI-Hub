import React from 'react';
import { Download, Laptop, CheckCircle, Terminal, X, ShieldAlert, Cpu } from 'lucide-react';
import { playKeySound } from '../utils/audio';

interface PcBundleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadZip: () => void;
}

export const PcBundleModal: React.FC<PcBundleModalProps> = ({
  isOpen,
  onClose,
  onDownloadZip,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs select-none">
      <div className="w-full max-w-2xl bg-[#0d0a07] border-2 border-[#b48cff] shadow-[0_0_40px_rgba(180,140,255,0.25)] font-mono flex flex-col">
        {/* Hazard Header */}
        <div className="h-2 hazard-stripes-sm w-full border-b border-black" />

        {/* Header */}
        <div className="p-4 border-b border-[#2d1f14] bg-[#140b24] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Laptop className="w-5 h-5 text-[#b48cff]" />
            <div>
              <h2 className="text-sm font-bold text-[#b48cff] tracking-wider">
                INSTALAÇÃO NO PC // NERV MAGI HUB LOCAL
              </h2>
              <p className="text-[10px] text-[#8a6845]">
                RODANDO NATIVAMENTE NO SEU COMPUTADOR (WINDOWS / LINUX / MAC)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#8a6845] hover:text-[#ff2233] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs leading-relaxed">
          <p className="text-[#ffca8a]">
            Você pode utilizar este terminal diretamente aqui no navegador ou baixar o{' '}
            <strong className="text-white">Pacote Standalone de Execução Local</strong> para o seu PC.
          </p>

          {/* Security details */}
          <div className="p-3 bg-[#08060a] border border-[#3a2055] space-y-1.5 text-[11px]">
            <div className="text-[#b48cff] font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              SEGURANÇA E ACESSO EXCLUSIVO DO OPERADOR:
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[#a590b5]">
              <li>
                <strong>Isolamento Local:</strong> Escuta estritamente em <code>127.0.0.1</code> (localhost).
              </li>
              <li>
                <strong>Validação Host & Token:</strong> Cada inicialização gera um token de sessão criptográfico único em memória.
              </li>
              <li>
                <strong>Zero Compartilhamento:</strong> Ninguém na sua rede local ou internet consegue acessar suas conversas ou IAs.
              </li>
            </ul>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <span className="text-[#ff7a00] font-bold block">COMO EXECUTAR NO SEU PC:</span>

            <div className="space-y-1.5 text-[#ffca8a]">
              <div className="flex items-start gap-2">
                <span className="text-[#4dff9a] font-bold">1.</span>
                <span>Baixe o pacote clicando no botão abaixo e descompacte a pasta no seu PC.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#4dff9a] font-bold">2.</span>
                <span>
                  Edite o arquivo <code className="text-[#ff7a00]">.env</code> colocando suas chaves de API:
                  <br />
                  <code className="text-[10px] text-[#7a5a3a] block mt-0.5">
                    OPENAI_API_KEY=... | ANTHROPIC_API_KEY=... | GEMINI_API_KEY=...
                  </code>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#4dff9a] font-bold">3.</span>
                <span>
                  Dê dois cliques no arquivo <strong className="text-white">iniciar.bat</strong> (no Windows) ou execute <code>python app.py</code> (Linux/Mac).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#4dff9a] font-bold">4.</span>
                <span>
                  A janela do NERV MAGI HUB abrirá imediatamente em modo app limpo conectada às suas 3 contas!
                </span>
              </div>
            </div>
          </div>

          {/* Download CTA */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                playKeySound();
                onDownloadZip();
              }}
              className="w-full py-2.5 px-4 bg-[#b48cff] text-black font-bold text-xs hover:bg-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(180,140,255,0.4)]"
            >
              <Download className="w-4 h-4" />
              <span>BAIXAR PACOTE LOCAL (NERV_MAGI_HUB_PC_BUNDLE.ZIP)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#2d1f14] bg-[#090704] flex items-center justify-between text-[10px] text-[#7a5a3a]">
          <span>INCLUI: app.py, index.html, iniciar.bat, .env.example, README.md</span>
          <button
            type="button"
            onClick={onClose}
            className="text-[#ffca8a] hover:underline cursor-pointer"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};
