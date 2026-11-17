import React, { useState } from 'react';
import {
  X,
  Copy,
  Download,
  Check,
  FileCode,
  Image as ImageIcon,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FileArchive,
  Layers,
  HardDriveDownload,
} from 'lucide-react';
import { GeneratedFile } from '../types/nerv';
import { playKeySound, playExecuteSound } from '../utils/audio';

interface FileViewerModalProps {
  file: GeneratedFile | null;
  onClose: () => void;
  onDownload: (file: GeneratedFile) => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  file,
  onClose,
  onDownload,
}) => {
  const [copied, setCopied] = useState(false);

  if (!file) return null;

  const fileNameLower = (file.name || '').toLowerCase();
  const fileLangLower = (file.language || '').toLowerCase();

  const isImage =
    fileLangLower === 'image' ||
    Boolean(fileNameLower.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i));

  const isPdf =
    fileLangLower === 'pdf' ||
    fileNameLower.endsWith('.pdf');

  const isWord =
    fileLangLower === 'docx' ||
    fileLangLower === 'doc' ||
    Boolean(fileNameLower.match(/\.(docx|doc)$/i));

  const isExcel =
    fileLangLower === 'xlsx' ||
    fileLangLower === 'xls' ||
    Boolean(fileNameLower.match(/\.(xlsx|xls|csv)$/i));

  const isPpt =
    fileLangLower === 'pptx' ||
    fileLangLower === 'ppt' ||
    Boolean(fileNameLower.match(/\.(pptx|ppt)$/i));

  const isArchive = Boolean(fileNameLower.match(/\.(zip|rar|7z|tar|gz)$/i));

  const isBinaryDoc = isPdf || isWord || isExcel || isPpt || isArchive;

  const contentStr = typeof file.content === 'string' ? file.content : '';
  const isUrlContent = contentStr.startsWith('/api/') || contentStr.startsWith('http://') || contentStr.startsWith('https://');

  const handleCopy = () => {
    if (!contentStr) return;
    navigator.clipboard.writeText(contentStr);
    setCopied(true);
    playKeySound();
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = !isImage && !isBinaryDoc && contentStr ? contentStr.split('\n') : [];

  const getDocIcon = () => {
    if (isImage) return <ImageIcon className="w-5 h-5 text-[#4dff9a] shrink-0" />;
    if (isExcel) return <FileSpreadsheet className="w-5 h-5 text-[#4dff9a] shrink-0" />;
    if (isWord || isPdf) return <FileText className="w-5 h-5 text-[#ff7a00] shrink-0" />;
    if (isArchive) return <FileArchive className="w-5 h-5 text-[#00f0ff] shrink-0" />;
    return <FileCode className="w-5 h-5 text-[#ff7a00] shrink-0" />;
  };

  const getDocBadge = () => {
    if (isPdf) return 'PDF // PORTABLE DOCUMENT';
    if (isWord) return 'WORD // DOCUMENTO FORMATADO';
    if (isExcel) return 'EXCEL // PLANILHA ELETRÔNICA';
    if (isPpt) return 'POWERPOINT // APRESENTAÇÃO';
    if (isImage) return 'IMAGEM // SÍNTESE NERV';
    if (isArchive) return 'PACOTE // ARQUIVO COMPACTADO';
    return file.language.toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xs select-none">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#0c0906] border-2 border-[#ff7a00] shadow-[0_0_50px_rgba(255,122,0,0.4)] flex flex-col font-mono">
        {/* Hazard Header */}
        <div className="h-2 hazard-stripes-sm w-full" />

        {/* Modal Bar */}
        <div className="p-3 sm:p-4 bg-[#140e08] border-b border-[#2d1f14] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            {getDocIcon()}
            <span className="font-bold text-sm text-[#ffca8a] truncate">{file.name}</span>
            <span className="text-[10px] text-[#4dff9a] border border-[#4dff9a] px-1 py-0.2 shrink-0">
              {getDocBadge()}
            </span>
            <span className="text-[10px] text-[#7a5a3a] shrink-0">
              ({(file.size / 1024).toFixed(1)} KB {isImage ? '· IMAGEM' : isBinaryDoc ? '· BINÁRIO FINAL' : `· ${lines.length} LINHAS`})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isImage && !isBinaryDoc && (
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1 text-xs border border-[#3a2515] hover:border-[#4dff9a] text-[#4dff9a] flex items-center gap-1 transition-colors cursor-pointer"
                title="Copiar texto do arquivo"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            )}

            {(isImage || isPdf) && isUrlContent && (
              <button
                type="button"
                onClick={() => window.open(contentStr, '_blank')}
                className="px-2.5 py-1 text-xs border border-[#3a2515] hover:border-[#ff7a00] text-[#ffca8a] flex items-center gap-1 transition-colors cursor-pointer"
                title="Abrir em nova aba do navegador"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Nova Guia</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                playExecuteSound();
                onDownload(file);
              }}
              className="px-3 py-1 text-xs border border-[#ff7a00] bg-[#ff7a00] text-black font-bold flex items-center gap-1.5 transition-colors cursor-pointer hover:bg-white shadow-[0_0_12px_rgba(255,122,0,0.3)]"
              title="Escolher pasta no computador e salvar o arquivo"
            >
              <HardDriveDownload className="w-3.5 h-3.5" />
              <span>{isImage ? 'SALVAR IMAGEM' : 'SALVAR COMO // ESCOLHER LOCAL'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-[#8a6845] hover:text-[#ff2233] cursor-pointer ml-1"
              title="Fechar visualizador"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content View: Image, Converted Binary Doc, or Code */}
        {isImage ? (
          <div className="flex-1 overflow-auto p-6 bg-[#050403] flex flex-col items-center justify-center gap-4">
            <div className="max-w-2xl max-h-[60vh] border-2 border-[#ff7a00] bg-black p-2 shadow-[0_0_30px_rgba(255,122,0,0.2)]">
              <img
                src={file.content}
                alt={file.name}
                className="max-h-[55vh] w-auto max-w-full object-contain mx-auto"
              />
            </div>
            <div className="text-center text-xs text-[#b88d5e]">
              SÍNTESE GRÁFICA NERV · ARQUIVO PNG ALTA RESOLUÇÃO
            </div>
          </div>
        ) : isBinaryDoc ? (
          <div className="flex-1 overflow-auto p-6 bg-[#050403] flex flex-col items-center justify-center gap-6">
            <div className="max-w-lg w-full bg-[#100b07] border-2 border-[#ff7a00] p-6 shadow-[0_0_30px_rgba(255,122,0,0.2)] flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-[#ff7a00] bg-[#1a0f07] flex items-center justify-center text-[#ff7a00] shadow-[0_0_20px_rgba(255,122,0,0.3)]">
                {getDocIcon()}
              </div>

              <div>
                <h2 className="text-base font-bold text-[#ffca8a] uppercase tracking-wide">
                  {file.name}
                </h2>
                <p className="text-xs text-[#4dff9a] mt-1">
                  ✓ FORMATO DETERMINADO GERADO &amp; CONVERTIDO COM SUCESSO
                </p>
                <p className="text-[11px] text-[#8a6845] mt-1">
                  Tamanho: {(file.size / 1024).toFixed(1)} KB · Origem: {file.providerName}
                </p>
              </div>

              <div className="w-full border-t border-[#2d1b0f] pt-4 flex flex-col gap-2">
                <p className="text-xs text-[#ffca8a]">
                  Clique abaixo para escolher onde salvar este arquivo em seu computador:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    playExecuteSound();
                    onDownload(file);
                  }}
                  className="w-full py-2.5 px-4 bg-[#ff7a00] hover:bg-white text-black font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(255,122,0,0.4)]"
                >
                  <Download className="w-4 h-4" />
                  <span>ESCOLHER LOCAL &amp; SALVAR NO DISCO</span>
                </button>
              </div>

              {isPdf && isUrlContent && (
                <div className="w-full pt-2">
                  <iframe
                    src={contentStr}
                    title={file.name}
                    className="w-full h-64 border border-[#3a2010] bg-white rounded-xs"
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-4 bg-[#050403] text-xs leading-relaxed select-text font-mono">
            <div className="table w-full">
              {lines.map((line, idx) => (
                <div key={idx} className="table-row hover:bg-[#120d08]">
                  <span className="table-cell select-none pr-4 text-right text-[#4a3520] w-10 border-r border-[#22160d]">
                    {idx + 1}
                  </span>
                  <span className="table-cell pl-4 text-[#ffca8a] whitespace-pre font-mono">
                    {line}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-2.5 bg-[#090704] border-t border-[#22160d] text-[10px] text-[#7a5a3a] flex items-center justify-between">
          <span>ORIGEM: {file.providerName}</span>
          <span>DATA: {new Date(file.timestamp).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
