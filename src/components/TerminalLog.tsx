import React, { useEffect, useRef, useState } from 'react';
import {
  TerminalEntry,
  MagiNodeId,
  GeneratedFile,
} from '../types/nerv';
import {
  FileCode,
  Copy,
  CheckCircle,
  Eye,
  Check,
  AlertOctagon,
  Sparkles,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Maximize2,
  RotateCw,
  GitCommit,
  Layers,
  Cpu,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { playKeySound, playExecuteSound } from '../utils/audio';
import { TranslationDictionary } from '../utils/i18n';

interface TerminalLogProps {
  entries: TerminalEntry[];
  onOpenFileViewer: (file: GeneratedFile) => void;
  onOpenDrawer: () => void;
  isWorking: boolean;
  t: TranslationDictionary;
  onRetryStep?: (workflowId: string, stepId: string) => void;
  onRetryPipe?: (workflowId: string, fromStepId: string) => void;
  onDownloadFile?: (file: GeneratedFile) => void;
}

// Function to download image directly to computer disk as PNG with location picker
export const downloadImageFile = async (url: string, altText?: string) => {
  try {
    playExecuteSound();
    const cleanName = (altText || 'nerv_generated_visual')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 35);
    const fileName = `NERV_${cleanName || 'IMAGE'}_${Date.now()}.png`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Fetch failed');
    const blob = await res.blob();

    // 1. Modern File System Access API (Operator chooses save folder)
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'Imagem PNG (*.png)',
            accept: { 'image/png': ['.png'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (pickerErr: any) {
        if (pickerErr.name === 'AbortError') return; // Cancelled by operator
      }
    }

    // 2. Server-side Windows Native Save Dialog (GetSaveFileNameW via comdlg32)
    try {
      const serverRes = await fetch('/api/files/save-dialog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fileName,
          content: url,
          format: 'png',
        }),
      });
      const data = await serverRes.json();
      if (data.ok || data.cancelled) return;
    } catch {}

    // 3. Fallback: browser anchor download
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  } catch (err) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = `NERV_IMAGE_${Date.now()}.png`;
    link.click();
  }
};

// Function to save code or convert code to target format (.pdf, .docx, .xlsx) with save picker
export const saveCodeOrConvertedFile = async (
  code: string,
  language: string,
  targetFormat?: string
) => {
  try {
    playExecuteSound();
    const lang = (language || 'txt').toLowerCase().trim();
    const extMap: Record<string, string> = {
      python: 'py',
      py: 'py',
      javascript: 'js',
      js: 'js',
      typescript: 'ts',
      ts: 'ts',
      html: 'html',
      css: 'css',
      sql: 'sql',
      json: 'json',
      markdown: 'md',
      md: 'md',
      bash: 'sh',
      sh: 'sh',
      powershell: 'ps1',
      ps1: 'ps1',
    };

    const outExt = targetFormat ? targetFormat.toLowerCase().replace(/^\.+/, '') : (extMap[lang] || 'txt');
    const defaultFileName = `NERV_SCRIPT_${Date.now()}.${outExt}`;

    // If targetFormat is requested (e.g. pdf, docx, xlsx, pptx) or code should be converted
    if (targetFormat && ['pdf', 'docx', 'xlsx', 'pptx'].includes(targetFormat.toLowerCase())) {
      // Use backend save-dialog with automatic conversion
      try {
        const res = await fetch('/api/files/save-dialog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `NERV_DOCUMENTO_${Date.now()}.${targetFormat}`,
            content: code,
            format: targetFormat,
          }),
        });
        const data = await res.json();
        if (data.ok || data.cancelled) return;
      } catch (convErr) {
        console.error('Falha no diálogo de conversão do servidor:', convErr);
      }
    }

    // Modern browser save file picker for raw code
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: defaultFileName,
          types: [{
            description: `Arquivo .${outExt}`,
            accept: { 'text/plain': [`.${outExt}`] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(new Blob([code], { type: 'text/plain;charset=utf-8' }));
        await writable.close();
        return;
      } catch (pickerErr: any) {
        if (pickerErr.name === 'AbortError') return;
      }
    }

    // Backend save dialog fallback
    try {
      const res = await fetch('/api/files/save-dialog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: defaultFileName,
          content: code,
          format: outExt,
        }),
      });
      const data = await res.json();
      if (data.ok || data.cancelled) return;
    } catch {}

    // Anchor fallback
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = defaultFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  } catch (err) {
    console.error('Erro ao salvar arquivo:', err);
  }
};


// Rich Message Content Parser and Renderer (Images, Code Blocks, Text)
const FormattedMessageContent: React.FC<{
  content: string;
  nodeColor: { text: string; border: string; bg: string };
  onCopyText: (text: string, id: string) => void;
  copiedId: string | null;
}> = ({ content, nodeColor, onCopyText, copiedId }) => {
  // Parse content into blocks: markdown images (![alt](url)), code blocks (```lang ... ```), or text
  const blocks: Array<
    | { type: 'text'; value: string }
    | { type: 'image'; alt: string; url: string }
    | { type: 'code'; language: string; value: string }
  > = [];

  // Combined tokenization with regular expressions
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
  const imageRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s\)]+)\)/g;

  // Find all tokens and their positions
  interface MatchToken {
    index: number;
    length: number;
    type: 'image' | 'code';
    data: any;
  }

  const tokens: MatchToken[] = [];
  let m: RegExpExecArray | null;

  while ((m = codeBlockRegex.exec(content)) !== null) {
    tokens.push({
      index: m.index,
      length: m[0].length,
      type: 'code',
      data: {
        language: m[1] || 'plaintext',
        value: m[2],
      },
    });
  }

  while ((m = imageRegex.exec(content)) !== null) {
    // Only add if not inside a code block
    const isInsideCode = tokens.some(
      (tok) => tok.type === 'code' && m!.index >= tok.index && m!.index < tok.index + tok.length
    );
    if (!isInsideCode) {
      tokens.push({
        index: m.index,
        length: m[0].length,
        type: 'image',
        data: {
          alt: m[1] || 'Imagem NERV',
          url: m[2],
        },
      });
    }
  }

  tokens.sort((a, b) => a.index - b.index);

  let currentIndex = 0;
  for (const token of tokens) {
    if (token.index > currentIndex) {
      const textChunk = content.slice(currentIndex, token.index);
      if (textChunk.trim()) {
        blocks.push({ type: 'text', value: textChunk });
      }
    }

    if (token.type === 'image') {
      blocks.push({
        type: 'image',
        alt: token.data.alt,
        url: token.data.url,
      });
    } else if (token.type === 'code') {
      blocks.push({
        type: 'code',
        language: token.data.language,
        value: token.data.value,
      });
    }

    currentIndex = token.index + token.length;
  }

  if (currentIndex < content.length) {
    const trailingText = content.slice(currentIndex);
    if (trailingText.trim()) {
      blocks.push({ type: 'text', value: trailingText });
    }
  }

  // If no blocks matched, just treat as text
  if (blocks.length === 0) {
    blocks.push({ type: 'text', value: content });
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, idx) => {
        if (block.type === 'image') {
          return (
            <div
              key={`img-${idx}`}
              className="my-3 border-2 border-[#ff7a00] bg-[#0c0804] p-3 shadow-[0_0_25px_rgba(255,122,0,0.25)] flex flex-col gap-2 rounded-xs"
            >
              {/* Image Frame Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3a2210] pb-2 text-xs">
                <div className="flex items-center gap-2 text-[#ff7a00] font-bold">
                  <ImageIcon className="w-4 h-4 text-[#ff7a00]" />
                  <span>SÍNTESE VISUAL // IMAGEM GERADA POR IA</span>
                </div>
                <span className="text-[10px] text-[#7a5a3a] border border-[#3a2210] px-1.5 py-0.5">
                  1024x1024 PX · NERV HD GRAPHICS
                </span>
              </div>

              {/* Image Preview Container */}
              <div className="relative group overflow-hidden border border-[#2a170a] bg-black flex items-center justify-center min-h-[220px] max-h-[520px]">
                <img
                  src={block.url}
                  alt={block.alt}
                  loading="lazy"
                  className="max-h-[500px] w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 pointer-events-none">
                  <span className="text-xs text-[#ffca8a] font-mono font-bold bg-black/80 px-2 py-1 border-l-2 border-[#ff7a00]">
                    {block.alt}
                  </span>
                </div>
              </div>

              {/* Action Toolbar for Image */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#22140a]">
                <span className="text-[11px] text-[#ffca8a] truncate max-w-xs font-semibold">
                  {block.alt}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playKeySound();
                      window.open(block.url, '_blank');
                    }}
                    className="px-2 py-1 text-xs border border-[#3a2515] bg-[#140e08] hover:border-[#ff7a00] text-[#ffca8a] flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Abrir imagem em alta definição"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Expandir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadImageFile(block.url, block.alt)}
                    className="px-3 py-1 text-xs border border-[#4dff9a] bg-[#0c2415] hover:bg-[#4dff9a] hover:text-black text-[#4dff9a] font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(77,255,154,0.3)] cursor-pointer"
                    title="Baixar imagem no computador"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>BAIXAR IMAGEM // PNG</span>
                  </button>
                </div>
              </div>
            </div>
          );
        }

        if (block.type === 'code') {
          const codeId = `code-${idx}`;
          const isCopied = copiedId === codeId;
          const codeLower = block.value.toLowerCase();
          const isDocGeneratorPdf = codeLower.includes('reportlab') || codeLower.includes('fpdf') || codeLower.includes('.pdf') || codeLower.includes('canvas.canvas');
          const isDocGeneratorWord = codeLower.includes('docx') || codeLower.includes('document(') || codeLower.includes('.docx');
          const isDocGeneratorExcel = codeLower.includes('openpyxl') || codeLower.includes('xlsxwriter') || codeLower.includes('.xlsx') || codeLower.includes('to_excel');
          const isDocGeneratorPpt = codeLower.includes('pptx') || codeLower.includes('presentation()') || codeLower.includes('.pptx');

          return (
            <div
              key={codeId}
              className="my-3 border border-[#3a2515] bg-[#070503] overflow-hidden"
            >
              <div className="px-3 py-1.5 bg-[#120c06] border-b border-[#2d1a0c] flex flex-wrap items-center justify-between gap-2 text-xs text-[#7a5a3a]">
                <span className="text-[#ff7a00] font-bold uppercase text-[10px]">
                  CÓDIGO // {block.language || 'TEXT'}
                </span>
                
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onCopyText(block.value, codeId)}
                    className="px-2 py-0.5 text-[10px] border border-[#3a2515] hover:border-[#4dff9a] text-[#4dff9a] flex items-center gap-1 transition-colors cursor-pointer"
                    title="Copiar código para a área de transferência"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-[#4dff9a]" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => saveCodeOrConvertedFile(block.value, block.language)}
                    className="px-2 py-0.5 text-[10px] border border-[#3a2515] hover:border-[#ffca8a] text-[#ffca8a] flex items-center gap-1 transition-colors cursor-pointer"
                    title="Salvar código como arquivo de script no disco"
                  >
                    <Download className="w-3 h-3 text-[#ffca8a]" />
                    <span>Salvar Código</span>
                  </button>

                  {isDocGeneratorPdf && (
                    <button
                      type="button"
                      onClick={() => saveCodeOrConvertedFile(block.value, block.language, 'pdf')}
                      className="px-2 py-0.5 text-[10px] border border-[#ff7a00] bg-[#1a0f07] hover:bg-[#ff7a00] hover:text-black text-[#ff7a00] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-[0_0_8px_rgba(255,122,0,0.3)]"
                      title="Converter código e salvar como PDF formatado no computador"
                    >
                      <Download className="w-3 h-3" />
                      <span>CONVERTER // PDF</span>
                    </button>
                  )}

                  {isDocGeneratorWord && (
                    <button
                      type="button"
                      onClick={() => saveCodeOrConvertedFile(block.value, block.language, 'docx')}
                      className="px-2 py-0.5 text-[10px] border border-[#00f0ff] bg-[#061822] hover:bg-[#00f0ff] hover:text-black text-[#00f0ff] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-[0_0_8px_rgba(0,240,255,0.3)]"
                      title="Converter código e salvar como documento Word (.docx) no computador"
                    >
                      <Download className="w-3 h-3" />
                      <span>CONVERTER // DOCX</span>
                    </button>
                  )}

                  {isDocGeneratorExcel && (
                    <button
                      type="button"
                      onClick={() => saveCodeOrConvertedFile(block.value, block.language, 'xlsx')}
                      className="px-2 py-0.5 text-[10px] border border-[#4dff9a] bg-[#091f11] hover:bg-[#4dff9a] hover:text-black text-[#4dff9a] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-[0_0_8px_rgba(77,255,154,0.3)]"
                      title="Converter dados e salvar como planilha Excel (.xlsx) no computador"
                    >
                      <Download className="w-3 h-3" />
                      <span>CONVERTER // XLSX</span>
                    </button>
                  )}

                  {isDocGeneratorPpt && (
                    <button
                      type="button"
                      onClick={() => saveCodeOrConvertedFile(block.value, block.language, 'pptx')}
                      className="px-2 py-0.5 text-[10px] border border-[#ffca8a] bg-[#1a120a] hover:bg-[#ffca8a] hover:text-black text-[#ffca8a] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Converter e salvar como apresentação PowerPoint (.pptx) no computador"
                    >
                      <Download className="w-3 h-3" />
                      <span>CONVERTER // PPTX</span>
                    </button>
                  )}
                </div>
              </div>
              <pre className="p-3 overflow-x-auto text-xs text-[#ffca8a] font-mono leading-relaxed select-text">
                <code>{block.value}</code>
              </pre>
            </div>
          );
        }

        // Text formatting (Markdown style headers, lists, and paragraphs)
        return (
          <div
            key={`txt-${idx}`}
            className="text-[#ffca8a] text-sm leading-relaxed whitespace-pre-wrap select-text font-mono"
          >
            {block.value}
          </div>
        );
      })}
    </div>
  );
};

export const TerminalLog: React.FC<TerminalLogProps> = ({
  entries,
  onOpenFileViewer,
  onOpenDrawer,
  isWorking,
  t,
  onRetryStep,
  onRetryPipe,
  onDownloadFile,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = React.useState<string | null>(null);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries, isWorking]);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(id);
    playKeySound();
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getNodeColor = (nodeId?: MagiNodeId) => {
    switch (nodeId) {
      case 'chatgpt':
        return { text: '#ff7a00', border: '#ff7a00', bg: '#1c1006' };
      case 'claude':
        return { text: '#4dff9a', border: '#4dff9a', bg: '#081c10' };
      case 'gemini':
        return { text: '#b48cff', border: '#b48cff', bg: '#170c2a' };
      case 'grok':
        return { text: '#ff3366', border: '#ff3366', bg: '#240a12' };
      case 'deepseek':
        return { text: '#00f0ff', border: '#00f0ff', bg: '#061821' };
      default:
        return { text: '#ffca8a', border: '#7a5a3a', bg: '#0d0a07' };
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 font-mono text-sm leading-relaxed select-text"
      role="log"
      aria-live="polite"
    >
      {/* MAGI Tactical Boot Header */}
      <div className="p-3 border border-[#3a2515] bg-[#0c0906] text-[#7a5a3a] text-xs space-y-1">
        <div className="text-[#ff7a00] font-bold flex items-center justify-between">
          <span>NERV MAGI CENTRAL PROCESSING UNIT // TOKYO-3</span>
          <span className="text-[10px] text-[#4dff9a]">{t.systemNormal}</span>
        </div>
        <div>{t.operatorClearance}</div>
        <div>{t.integratedNodesNotice}</div>
        <div className="text-[#8a6845]">{t.typeAnyCommandNotice}</div>
      </div>

      {entries.map((entry) => {
        // System logs
        if (entry.type === 'system') {
          return (
            <div key={entry.id} className="text-[#4dff9a] text-xs flex items-start gap-2">
              <span className="text-[#7a5a3a]">[{entry.timestamp}]</span>
              <span className="font-bold">SYS&gt;</span>
              <span className="whitespace-pre-wrap">{entry.content}</span>
            </div>
          );
        }

        // Operator input
        if (entry.type === 'user') {
          return (
            <div key={entry.id} className="pt-2">
              <div className="flex items-center gap-2 text-xs text-[#ff7a00] font-bold">
                <span className="text-[#7a5a3a]">[{entry.timestamp}]</span>
                <span className="bg-[#ff7a00] text-black px-1.5 py-0.2">OPERADOR</span>
                <span>MAGI-DIRECTIVE&gt;</span>
              </div>
              <div className="mt-1 p-2.5 bg-[#140e08] border-l-2 border-[#ff7a00] text-white text-sm font-semibold whitespace-pre-wrap">
                {entry.content}
              </div>
            </div>
          );
        }

        // Error message
        if (entry.type === 'error') {
          return (
            <div
              key={entry.id}
              className="p-3 bg-[#1e070a] border border-[#ff2233] text-[#ff7788] text-xs flex items-start gap-2"
            >
              <AlertOctagon className="w-4 h-4 text-[#ff2233] shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-[#ff2233]">{t.alertTransmissionFailed}</div>
                <div className="mt-1 whitespace-pre-wrap">{entry.content}</div>
              </div>
            </div>
          );
        }

        // Consensus summary
        if (entry.type === 'consensus') {
          return (
            <div
              key={entry.id}
              className="p-3 border-2 border-[#00f0ff] bg-[#07131b] text-[#8ae8ff] text-xs flex flex-col gap-1 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
            >
              <div className="flex items-center justify-between font-bold text-sm text-[#00f0ff]">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  {t.consensusTitle}
                </span>
                <span className="border border-[#00f0ff] px-1.5 py-0.5 text-[10px] text-white">
                  {entry.status || 'UNANIMOUS'}
                </span>
              </div>
              <div className="text-white mt-2 leading-relaxed">
                <FormattedMessageContent
                  content={entry.content}
                  nodeColor={{ text: '#00f0ff', border: '#00f0ff', bg: '#07131b' }}
                  onCopyText={handleCopyCode}
                  copiedId={copiedIndex}
                />
              </div>
              {entry.footnote && (
                <div className="mt-2 p-2 bg-[#170e08] border-l-2 border-[#ff7a00] text-[#ffca8a] text-[11px] font-mono italic">
                  {entry.footnote}
                </div>
              )}
            </div>
          );
        }

        // Tactical Workflow Execution Block (/otask e /pipe)
        if (entry.type === 'workflow' && entry.workflow) {
          const plan = entry.workflow;
          const isPipe = plan.workflowType === 'pipe';
          const isCircuitBreaker = plan.circuitBreakerTripped;

          return (
            <div
              key={entry.id}
              className={`p-3.5 border-2 flex flex-col gap-3 transition-all ${
                isCircuitBreaker
                  ? 'border-[#ff2233] bg-[#120507] shadow-[0_0_20px_rgba(255,34,51,0.25)]'
                  : isPipe
                  ? 'border-[#00f0ff] bg-[#051119] shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                  : 'border-[#ff7a00] bg-[#0c0804] shadow-[0_0_20px_rgba(255,122,0,0.18)]'
              }`}
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#2d1b0e]">
                <div className="flex items-center gap-2">
                  {isPipe ? (
                    <GitCommit className="w-4 h-4 text-[#00f0ff]" />
                  ) : (
                    <Layers className="w-4 h-4 text-[#ff7a00]" />
                  )}
                  <span className="font-bold text-xs font-mono tracking-wider text-white">
                    {isPipe
                      ? 'NERV MAGI // PIPELINE EM CASCATA (/pipe)'
                      : 'NERV MAGI // ORQUESTRAÇÃO MODULAR (/otask)'}
                  </span>
                  <span className="text-[10px] text-[#7a5a3a]">[{entry.timestamp}]</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#8a6845] font-mono">
                    ORQUESTRADOR: <strong className="text-[#4dff9a]">{plan.orchestratorName}</strong>
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 border ${
                      isCircuitBreaker
                        ? 'border-[#ff2233] bg-[#ff2233]/20 text-[#ff4455]'
                        : plan.status === 'COMPLETED'
                        ? 'border-[#4dff9a] bg-[#4dff9a]/10 text-[#4dff9a]'
                        : 'border-[#ff7a00] bg-[#ff7a00]/10 text-[#ff7a00]'
                    }`}
                  >
                    {isCircuitBreaker ? 'CIRCUIT BREAKER' : plan.status}
                  </span>
                </div>
              </div>

              {/* Summary */}
              {plan.summary && (
                <div className="text-xs font-mono text-[#ffca8a] bg-[#0a0603] p-2 border border-[#3a2515]">
                  {plan.summary}
                </div>
              )}

              {/* Steps List */}
              <div className="flex flex-col gap-2 font-mono text-xs">
                {plan.steps.map((step) => {
                  const isDone = step.status === 'COMPLETED';
                  const isErr = step.status === 'ERROR';
                  const isTimeout = step.status === 'TIMEOUT';
                  const isWorkingStep = step.status === 'WORKING';

                  return (
                    <div
                      key={step.id}
                      className={`p-2.5 border flex flex-col gap-2 transition-all ${
                        isErr || isTimeout
                          ? 'border-[#ff2233] bg-[#1a0709]'
                          : isDone
                          ? 'border-[#4dff9a]/60 bg-[#06140b]'
                          : isWorkingStep
                          ? 'border-[#ff7a00] bg-[#140c06] animate-pulse'
                          : 'border-[#2d1b0e] bg-[#080503] opacity-60'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-black/60 border border-[#ff7a00]/60 text-[10px] text-[#ff7a00] font-bold">
                            ETAPA {step.stepIndex}
                          </span>
                          <span className="font-bold text-white text-xs">{step.title}</span>
                          <span className="text-[10px] text-[#8a6845]">({step.assignedNodeName})</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {step.durationMs && (
                            <span className="text-[10px] text-[#7a5a3a] flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {(step.durationMs / 1000).toFixed(1)}s
                            </span>
                          )}
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 border ${
                              isDone
                                ? 'border-[#4dff9a] text-[#4dff9a]'
                                : isErr || isTimeout
                                ? 'border-[#ff2233] text-[#ff4455]'
                                : isWorkingStep
                                ? 'border-[#ff7a00] text-[#ff7a00]'
                                : 'border-[#7a5a3a] text-[#7a5a3a]'
                            }`}
                          >
                            {step.status}
                          </span>
                        </div>
                      </div>

                      {/* Error or Timeout message + Retry Button */}
                      {(isErr || isTimeout) && (
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#2a0b0e] border border-[#ff2233] text-[11px] text-[#ff8888]">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-[#ff2233] shrink-0" />
                            <span>{step.error || 'Falha na execução desta etapa.'}</span>
                          </div>
                          {!isPipe && onRetryStep && (
                            <button
                              type="button"
                              onClick={() => onRetryStep(plan.workflowId, step.id)}
                              className="px-2.5 py-1 bg-[#ff2233] hover:bg-white text-black font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-[0_0_8px_rgba(255,34,51,0.5)]"
                              title="Repetir individualmente esta etapa"
                            >
                              <RotateCw className="w-3 h-3" />
                              <span>REPETIR TAREFA</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Output content if completed */}
                      {isDone && step.output && (
                        <div className="text-white mt-1 pt-2 border-t border-[#1d3522] leading-relaxed max-h-96 overflow-y-auto">
                          <FormattedMessageContent
                            content={step.output}
                            nodeColor={{ text: '#4dff9a', border: '#4dff9a', bg: '#06140b' }}
                            onCopyText={handleCopyCode}
                            copiedId={copiedIndex}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Circuit Breaker Alert Banner & Retry for Pipeline */}
              {isCircuitBreaker && isPipe && (
                <div className="p-3 bg-[#240608] border-2 border-[#ff2233] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_15px_rgba(255,34,51,0.4)] font-mono text-xs">
                  <div>
                    <div className="flex items-center gap-1.5 text-[#ff2233] font-bold text-xs uppercase">
                      <AlertTriangle className="w-4 h-4 fill-current" />
                      CIRCUIT BREAKER ACIONADO // PIPELINE EM CASCATA INTERROMPIDO
                    </div>
                    <p className="text-[#ff9999] text-[11px] mt-0.5">
                      Para economizar tokens, as etapas posteriores não foram acionadas. Você pode reiniciar o fluxo a partir da etapa que sofreu falha mantendo os artefatos anteriores salvos.
                    </p>
                  </div>
                  {onRetryPipe && plan.failedStepId && (
                    <button
                      type="button"
                      onClick={() => onRetryPipe(plan.workflowId, plan.failedStepId!)}
                      className="px-3 py-1.5 bg-[#ff2233] hover:bg-white text-black font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-all shadow-[0_0_10px_#ff2233]"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>REINICIAR A PARTIR DA ETAPA QUE FALHOU</span>
                    </button>
                  )}
                </div>
              )}

              {/* Orchestrator Final Synthesis */}
              {plan.synthesis && (
                <div className="p-3 bg-[#0a0e0b] border-2 border-[#4dff9a] text-xs font-mono shadow-[0_0_15px_rgba(77,255,154,0.15)]">
                  <div className="flex items-center gap-1.5 text-[#4dff9a] font-bold text-xs mb-2 pb-1 border-b border-[#1b3d27]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>SÍNTESE &amp; PACOTE FINAL DO ORQUESTRADOR ({plan.orchestratorName})</span>
                  </div>
                  <div className="text-white leading-relaxed">
                    <FormattedMessageContent
                      content={plan.synthesis}
                      nodeColor={{ text: '#4dff9a', border: '#4dff9a', bg: '#0a0e0b' }}
                      onCopyText={handleCopyCode}
                      copiedId={copiedIndex}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        }

        // Assistant responses from MAGI nodes
        const colors = getNodeColor(entry.nodeId);

        return (
          <div
            key={entry.id}
            className="border-2 transition-all"
            style={{
              borderColor: colors.border,
              backgroundColor: '#090704',
            }}
          >
            {/* Node Banner Header */}
            <div
              className="px-3 py-1.5 border-b flex flex-wrap items-center justify-between gap-2"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.bg,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="font-bold text-xs tracking-wider"
                  style={{ color: colors.text }}
                >
                  [{entry.nodeName || 'MAGI NODE'}]
                </span>
                <span className="text-[10px] text-[#7a5a3a]">[{entry.timestamp}]</span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 border"
                  style={{
                    color: colors.text,
                    borderColor: colors.border,
                  }}
                >
                  {entry.status || 'RESOLVED'}
                </span>
              </div>
            </div>

            {/* AI Terminal Telemetry Stream Data */}
            <div className="px-3 py-1 bg-[#060402] border-b border-[#1c1209] flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#7a5a3a] font-mono">
              <div className="flex items-center gap-2">
                <span>
                  TERMINAL: <strong className="text-[#ffca8a]">{entry.nodeName}</strong>
                </span>
                <span>·</span>
                <span>
                  LINK: <span className="text-[#4dff9a]">ACTIVE</span>
                </span>
                <span>·</span>
                <span>
                  SYNC: <strong className="text-[#ff7a00]">99.1%</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>BUFFER: OK</span>
                <span>·</span>
                <span>CANAL: DIRETO_OPERADOR</span>
              </div>
            </div>

            {/* Answer Content Rendered with Rich Text, Image Download Support and Code blocks */}
            <div className="p-3 select-text">
              <FormattedMessageContent
                content={entry.content}
                nodeColor={colors}
                onCopyText={handleCopyCode}
                copiedId={copiedIndex}
              />
            </div>

            {/* If files were extracted in this turn */}
            {entry.files && entry.files.length > 0 && (
              <div className="px-3 py-2 bg-[#120d08] border-t border-[#2a1d13] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#ff7a00] flex items-center gap-1.5">
                    <FileCode className="w-4 h-4" />
                    {t.artifactsSavedInVault(entry.files.length)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playKeySound();
                      onOpenDrawer();
                    }}
                    className="text-[11px] text-[#4dff9a] hover:underline cursor-pointer"
                  >
                    {t.viewInDrawer}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {entry.files.map((file) => {
                    const isImg = file.language === 'image' || file.name.match(/\.(png|jpg|jpeg|webp)$/i);
                    return (
                      <div
                        key={file.id}
                        className="p-2 border border-[#3a2515] bg-[#060503] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isImg ? (
                            <ImageIcon className="w-3.5 h-3.5 text-[#4dff9a] shrink-0" />
                          ) : (
                            <FileCode className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" />
                          )}
                          <span className="text-xs text-white truncate font-bold">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isImg ? (
                            <button
                              type="button"
                              onClick={() => downloadImageFile(file.content, file.name)}
                              className="px-2 py-0.5 text-[10px] bg-[#0c2415] border border-[#4dff9a] text-[#4dff9a] hover:bg-[#4dff9a] hover:text-black font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Baixar imagem"
                            >
                              <Download className="w-3 h-3" />
                              <span>Baixar</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                playKeySound();
                                if (onDownloadFile) {
                                  onDownloadFile(file);
                                } else if (file.content.startsWith('http') || file.content.startsWith('/api/')) {
                                  window.open(file.content, '_blank');
                                }
                              }}
                              className="px-2 py-0.5 text-[10px] bg-[#1a0f07] border border-[#ff7a00] text-[#ff7a00] hover:bg-[#ff7a00] hover:text-black font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-[0_0_6px_rgba(255,122,0,0.25)]"
                              title={`Baixar ${file.name} no computador`}
                            >
                              <Download className="w-3 h-3" />
                              <span>BAIXAR // {file.name.split('.').pop()?.toUpperCase() || 'ARQUIVO'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              playKeySound();
                              onOpenFileViewer(file);
                            }}
                            className="p-1 hover:text-[#ffca8a] text-[#8a6845] transition-colors cursor-pointer"
                            title="Visualizar arquivo"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {!isImg && (
                            <button
                              type="button"
                              onClick={() => handleCopyCode(file.content, file.id)}
                              className="p-1 hover:text-[#4dff9a] text-[#8a6845] transition-colors cursor-pointer"
                              title="Copiar código"
                            >
                              {copiedIndex === file.id ? (
                                <Check className="w-3.5 h-3.5 text-[#4dff9a]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Live Working Processing Indicator inside the prompt terminal */}
      {isWorking && (
        <div className="p-3 border-2 border-[#ff2233] bg-[#1a0709] flex items-center justify-between gap-3 text-xs animate-working font-mono">
          <div className="flex items-center gap-2 text-[#ff2233]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff2233] shadow-[0_0_8px_#ff2233]" />
            <span className="font-bold tracking-wider">
              MAGI DELIBERATION EM ANDAMENTO // SINCRONIZAÇÃO NEURAL COM AS IAs...
            </span>
          </div>
          <span className="text-[#ff7a00] text-[11px] font-bold">WORKING LIGHT PULSING</span>
        </div>
      )}

      {/* Standby prompt in context window with blinking square awaiting iterations */}
      {!isWorking && (
        <div className="flex items-center gap-2 text-xs font-mono text-[#ff7a00] pt-2 border-t border-[#1c1209]">
          <span className="text-[#7a5a3a]">[{new Date().toLocaleTimeString()}]</span>
          <span className="font-bold">MAGI-PROMPT:~$</span>
          <span className="text-[#8a6845]">{t.awaitingOperatorPrompt}</span>
          {/* Prompt square cursor blinking */}
          <span
            className="w-2.5 h-4 bg-[#ff7a00] shadow-[0_0_10px_#ff7a00] animate-block-cursor inline-block"
            title={t.awaitingOperatorPrompt}
          />
        </div>
      )}
    </div>
  );
};
