import React, { useState } from 'react';
import {
  X,
  Download,
  Eye,
  Copy,
  FileCode,
  AlertTriangle,
  CheckCircle,
  Archive,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { GeneratedFile } from '../types/nerv';
import { playDrawerSound, playKeySound } from '../utils/audio';
import { TranslationDictionary } from '../utils/i18n';

interface FilesDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  files: GeneratedFile[];
  unreadCount: number;
  isWorking: boolean;
  onOpenFileViewer: (file: GeneratedFile) => void;
  onDownloadFile: (file: GeneratedFile) => void;
  onDownloadAllZip: () => void;
  onClearFiles?: () => void;
  t?: TranslationDictionary;
}

export const FilesDrawer: React.FC<FilesDrawerProps> = ({
  isOpen,
  onToggle,
  files,
  unreadCount,
  isWorking,
  onOpenFileViewer,
  onDownloadFile,
  onDownloadAllZip,
  onClearFiles,
  t,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (file: GeneratedFile) => {
    navigator.clipboard.writeText(file.content);
    setCopiedId(file.id);
    playKeySound();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggle = () => {
    playDrawerSound();
    onToggle();
  };

  // Determine provider styles
  const getProviderBadge = (provider: GeneratedFile['provider']) => {
    switch (provider) {
      case 'chatgpt':
        return {
          name: 'UNIT-00',
          real: 'ChatGPT',
          color: '#ff7a00',
          bg: '#211204',
          border: '#ff7a00',
        };
      case 'claude':
        return {
          name: 'UNIT-01',
          real: 'Claude',
          color: '#4dff9a',
          bg: '#081c10',
          border: '#4dff9a',
        };
      case 'gemini':
        return {
          name: 'UNIT-02',
          real: 'Gemini',
          color: '#b48cff',
          bg: '#170c2a',
          border: '#b48cff',
        };
      case 'grok':
        return {
          name: 'UNIT-03',
          real: 'Grok',
          color: '#ff3366',
          bg: '#240a12',
          border: '#ff3366',
        };
      case 'deepseek':
        return {
          name: 'UNIT-04',
          real: 'DeepSeek',
          color: '#00f0ff',
          bg: '#061821',
          border: '#00f0ff',
        };
      default:
        return {
          name: 'MAGI-UNIT',
          real: 'NERV',
          color: '#ff7a00',
          bg: '#211204',
          border: '#ff7a00',
        };
    }
  };

  return (
    <>
      {/* Floating Trigger Tab (Only Arrow, Centered Vertically with Context Window) */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Abrir/Fechar Gaveta de Arquivos"
        aria-expanded={isOpen}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-8 h-16 sm:w-9 sm:h-20 border-2 border-r-0 rounded-l-md cursor-pointer transition-all select-none shadow-[-4px_0_15px_rgba(0,0,0,0.6)] ${
          unreadCount > 0 && !isOpen
            ? 'animate-file-flash'
            : isOpen
            ? 'bg-[#ff7a00] text-black border-[#ff7a00] font-bold shadow-[0_0_20px_#ff7a00]'
            : 'bg-[#120d08] border-[#ff7a00] text-[#ff7a00] hover:bg-[#ff7a00] hover:text-black'
        }`}
        title={
          unreadCount > 0 && !isOpen
            ? (t ? t.filesTriggerTooltipNew(unreadCount) : `[ALERTA NERV] ${unreadCount} novo(s) arquivo(s) gerado(s). Clique para visualizar.`)
            : isOpen
            ? (t ? t.filesTriggerCollapse : 'Recolher gaveta de arquivos')
            : (t ? t.filesTriggerExpand : 'Expandir gaveta de arquivos')
        }
      >
        <span
          className={`flex items-center justify-center transition-transform ${
            unreadCount > 0 && !isOpen ? 'animate-arrow-flash' : ''
          }`}
        >
          {isOpen ? (
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          ) : (
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          )}
        </span>
      </button>

      {/* Slide-out Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={handleToggle}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Expandable Slide-out Drawer Panel */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[460px] bg-[#0c0906] border-l-2 border-[#ff7a00] z-50 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.85)] transition-transform duration-300 ease-in-out font-mono select-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Cofre de Arquivos da NERV"
      >
        {/* Hazard Header Stripe */}
        <div className="h-2 hazard-stripes-sm w-full" />

        {/* Drawer Header with Title and "Working" indicator */}
        <div className="p-4 border-b border-[#2d1f14] bg-[#120d08] flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[#ff2233] font-bold text-sm">
                {t ? t.filesDrawerTitle : 'NERV // ARTIFACT VAULT'}
              </span>
              <span className="text-[10px] text-[#ff7a00] border border-[#ff7a00] px-1 py-0.2">
                CLASSIFIED
              </span>
            </div>
            <span className="text-[11px] text-[#8a6845] mt-0.5">
              {t ? t.filesDrawerSubtitle : 'ARQUIVOS E CÓDIGOS EXTRAÍDOS DAS IAs'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* The Working Light inside the drawer */}
            <div
              className={`flex items-center gap-1.5 px-2 py-1 border text-[11px] font-bold tracking-widest ${
                isWorking
                  ? 'border-[#ff2233] text-[#ff2233] bg-[#22070a] animate-working'
                  : 'border-[#3a2515] text-[#7a5a3a] bg-[#080604]'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isWorking ? 'bg-[#ff2233] shadow-[0_0_10px_#ff2233]' : 'bg-[#3a2515]'
                }`}
              />
              <span>WORKING</span>
            </div>

            <button
              type="button"
              onClick={handleToggle}
              className="p-1.5 text-[#ffca8a] hover:text-[#ff2233] border border-[#3a2515] hover:border-[#ff2233] transition-colors cursor-pointer"
              title="Fechar painel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-toolbar: Quick actions */}
        <div className="px-4 py-2 bg-[#090704] border-b border-[#22160d] flex items-center justify-between text-xs">
          <span className="text-[#8a6845]">
            TOTAL NO COFRE: <strong className="text-[#ffca8a]">{files.length}</strong> ARQUIVOS
          </span>

          <div className="flex items-center gap-2">
            {files.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  playKeySound();
                  onDownloadAllZip();
                }}
                className="flex items-center gap-1 px-2 py-1 bg-[#1a120b] border border-[#ff7a00] text-[#ff7a00] hover:bg-[#ff7a00] hover:text-black transition-colors cursor-pointer text-[11px]"
                title="Baixar todos os arquivos em formato ZIP"
              >
                <Archive className="w-3 h-3" />
                <span>{t ? t.downloadAllZip : 'BAIXAR TUDO (.ZIP)'}</span>
              </button>
            )}

            {files.length > 0 && onClearFiles && (
              <button
                type="button"
                onClick={() => {
                  playKeySound();
                  onClearFiles();
                }}
                className="flex items-center gap-1 px-2 py-1 bg-[#1e070a] border border-[#ff2233] text-[#ff7788] hover:bg-[#ff2233] hover:text-white transition-colors cursor-pointer text-[11px]"
                title="Limpar todos os arquivos e imagens gerados"
              >
                <Trash2 className="w-3 h-3" />
                <span>{t ? t.clearFilesButton : 'LIMPAR ARQUIVOS'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {files.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#3a2515] bg-[#090704]">
              <FileCode className="w-10 h-10 text-[#4a3520] mb-3" />
              <p className="text-sm text-[#ffca8a] font-bold">NENHUM ARQUIVO DETECTADO AINDA</p>
              <p className="text-xs text-[#7a5a3a] mt-2 max-w-xs leading-relaxed">
                Quando você solicitar códigos ou scripts para qualquer uma das IAs da NERV, eles serão
                automaticamente extraídos e salvos neste cofre seguro, com indicador luminoso de alerta.
              </p>
            </div>
          ) : (
            files.map((file) => {
              const badge = getProviderBadge(file.provider);
              return (
                <div
                  key={file.id}
                  className="p-3 border border-[#3a2515] bg-[#0e0a07] hover:border-[#ff7a00] transition-colors flex flex-col gap-2"
                >
                  {/* File Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileCode className="w-4 h-4 text-[#ff7a00] shrink-0" />
                      <span className="font-bold text-sm text-[#ffca8a] truncate" title={file.name}>
                        {file.name}
                      </span>
                    </div>

                    <span
                      className="text-[9px] px-1.5 py-0.5 border uppercase font-bold shrink-0"
                      style={{
                        color: badge.color,
                        borderColor: badge.border,
                        backgroundColor: badge.bg,
                      }}
                    >
                      {badge.name}
                    </span>
                  </div>

                  {/* File Metadata */}
                  <div className="flex items-center justify-between text-[11px] text-[#7a5a3a]">
                    <span>
                      Linguagem: <strong className="text-[#ffca8a]">{file.language}</strong>
                    </span>
                    <span>{(file.size / 1024).toFixed(1)} KB</span>
                    <span>{new Date(file.timestamp).toLocaleTimeString()}</span>
                  </div>

                  {/* File Preview Snippet */}
                  <div className="p-2 bg-[#050403] border border-[#22160d] text-[11px] text-[#8a6845] font-mono max-h-16 overflow-hidden line-clamp-3 leading-tight select-text">
                    {file.name.match(/\.(pdf|docx|xlsx|pptx|zip|png|jpg|jpeg)$/i) || file.language === 'image'
                      ? `[ARQUIVO BINÁRIO CONVERTIDO // PRONTO: ${file.name}]`
                      : (typeof file.content === 'string' ? file.content.slice(0, 180) : '[CONTEÚDO REGISTRADO]')}
                  </div>

                  {/* File Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#22160d]">
                    <button
                      type="button"
                      onClick={() => {
                        playKeySound();
                        onOpenFileViewer(file);
                      }}
                      className="px-2 py-1 text-xs border border-[#4a3520] hover:border-[#ffca8a] text-[#ffca8a] flex items-center gap-1 transition-colors cursor-pointer"
                      title="Visualizar arquivo completo"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Ver</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(file)}
                      className="px-2 py-1 text-xs border border-[#4a3520] hover:border-[#4dff9a] text-[#4dff9a] flex items-center gap-1 transition-colors cursor-pointer"
                      title="Copiar código para a área de transferência"
                    >
                      {copiedId === file.id ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-[#4dff9a]" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playKeySound();
                        onDownloadFile(file);
                      }}
                      className="px-2 py-1 text-xs border border-[#ff7a00] bg-[#1a0f07] hover:bg-[#ff7a00] hover:text-black text-[#ff7a00] flex items-center gap-1 transition-colors cursor-pointer"
                      title="Baixar arquivo no computador"
                    >
                      <Download className="w-3 h-3" />
                      <span>Baixar</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer Warning */}
        <div className="p-3 border-t border-[#2d1f14] bg-[#090704] text-[10px] text-[#7a5a3a] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#ff7a00] shrink-0" />
          <span>NERV PROTOCOL 4-B: ARQUIVOS SALVOS NO DIRETÓRIO LOCAL DO OPERADOR.</span>
        </div>
      </aside>
    </>
  );
};
