import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  CornerDownLeft,
  Sparkles,
  Terminal as TerminalIcon,
  AlertCircle,
  Gauge,
  Layers,
  Paperclip,
  FileCode,
  X,
  Upload,
  Square,
  Cpu,
  GitCommit,
} from 'lucide-react';
import { playExecuteSound, playKeySound, playWarningSound } from '../utils/audio';
import { TranslationDictionary } from '../utils/i18n';
import { MagiNodeConfig, MagiNodeId } from '../types/nerv';

interface AttachedDialogFile {
  id: string;
  name: string;
  size: number;
  content: string;
}

interface TerminalPromptProps {
  onSubmit: (text: string) => void;
  isWorking: boolean;
  activeCount: number;
  t: TranslationDictionary;
  onCancel?: () => void;
  orchestratorAgent: MagiNodeId;
  onSelectOrchestrator: (nodeId: MagiNodeId) => void;
  nodes: MagiNodeConfig[];
  nodeKeyStatus: Record<MagiNodeId, boolean>;
}

export const TerminalPrompt: React.FC<TerminalPromptProps> = ({
  onSubmit,
  isWorking,
  activeCount,
  t,
  onCancel,
  orchestratorAgent,
  onSelectOrchestrator,
  nodes,
  nodeKeyStatus,
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [attachedFiles, setAttachedFiles] = useState<AttachedDialogFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const textContent = (event.target?.result as string) || '';
        const newAttached: AttachedDialogFile = {
          id: `dialog-file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: file.name,
          size: file.size,
          content: textContent,
        };
        setAttachedFiles((prev) => [...prev, newAttached]);
        playKeySound();
      };
      reader.readAsText(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttached = (id: string) => {
    playKeySound();
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    playKeySound();

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }

    // Command History Navigation
    if (e.key === 'ArrowUp') {
      if (history.length > 0) {
        e.preventDefault();
        const nextIndex = historyIndex + 1 < history.length ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIndex);
        setInput(history[history.length - 1 - nextIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex > 0) {
        e.preventDefault();
        const prevIndex = historyIndex - 1;
        setHistoryIndex(prevIndex);
        setInput(history[history.length - 1 - prevIndex] || '');
      } else if (historyIndex === 0) {
        e.preventDefault();
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Escape' && isWorking && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if ((!trimmed && attachedFiles.length === 0) || isWorking) return;

    playExecuteSound();

    let fullMessage = trimmed;
    if (attachedFiles.length > 0) {
      const filesContext = attachedFiles
        .map(
          (f, idx) =>
            `--- [ARQUIVO CARREGADO ${idx + 1}: ${f.name} (${(f.size / 1024).toFixed(1)} KB)] ---\n${f.content}\n--- FIM DO ARQUIVO ${f.name} ---`
        )
        .join('\n\n');

      fullMessage = trimmed
        ? `${trimmed}\n\n[BASE DE ARQUIVOS ANEXADA À CAIXA DE DIÁLOGO]:\n${filesContext}`
        : `[LEITURA DE ARQUIVO(S) ANEXADO(S)]:\n${filesContext}\n\nPor favor, analise o(s) arquivo(s) acima e forneça um parecer técnico detalhado.`;
    }

    if (trimmed) {
      setHistory((prev) => [...prev, trimmed]);
      setHistoryIndex(-1);
    }

    onSubmit(fullMessage);
    setInput('');
    setAttachedFiles([]);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const setQuickCommand = (cmd: string) => {
    setInput(cmd);
    textareaRef.current?.focus();
    playKeySound();
  };

  return (
    <div className="border-t-2 border-[#ff7a00] bg-[#090704] p-3 sm:p-4 select-none">
      {/* Quick Tactical Preset Chips */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 text-xs font-mono">
        {/* Command Presets */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[#7a5a3a] text-[11px] shrink-0 font-bold">{t.commandsTitle}</span>

        {/* Angels / Context Control quick preset */}
        <button
          type="button"
          onClick={() => {
            onSubmit('/angel');
            playExecuteSound();
          }}
          className="px-2 py-0.5 border border-[#00f0ff] hover:bg-[#00f0ff] hover:text-black bg-[#061e2b] text-[#00f0ff] shrink-0 cursor-pointer text-[11px] flex items-center gap-1 font-bold shadow-[0_0_8px_rgba(0,240,255,0.3)]"
          title="Controle de Contexto e Skills Angels (/angel)"
        >
          <Layers className="w-3 h-3" />
          <span>/angel</span>
        </button>

        {/* Tactical Workflow Orchestration Presets */}
        <button
          type="button"
          onClick={() => setQuickCommand('/mtask ')}
          className="px-2 py-0.5 border border-[#4dff9a] hover:bg-[#4dff9a] hover:text-black bg-[#071a0e] text-[#4dff9a] shrink-0 cursor-pointer text-[11px] flex items-center gap-1 font-bold shadow-[0_0_6px_rgba(77,255,154,0.25)]"
          title="Múltiplas Respostas paralelas com Gather resiliente e síntese (/mtask)"
        >
          <Cpu className="w-3 h-3 text-[#4dff9a]" />
          <span>/mtask</span>
        </button>

        <button
          type="button"
          onClick={() => setQuickCommand('/otask ')}
          className="px-2 py-0.5 border border-[#ff7a00] hover:bg-[#ff7a00] hover:text-black bg-[#170e08] text-[#ff7a00] shrink-0 cursor-pointer text-[11px] flex items-center gap-1 font-bold shadow-[0_0_6px_rgba(255,122,0,0.25)]"
          title="Orquestração de Tarefas Isoladas com janela de atribuição e retry (/otask)"
        >
          <Layers className="w-3 h-3 text-[#ff7a00]" />
          <span>/otask</span>
        </button>

        <button
          type="button"
          onClick={() => setQuickCommand('/pipe ')}
          className="px-2 py-0.5 border border-[#00f0ff] hover:bg-[#00f0ff] hover:text-black bg-[#061e2b] text-[#00f0ff] shrink-0 cursor-pointer text-[11px] flex items-center gap-1 font-bold shadow-[0_0_6px_rgba(0,240,255,0.25)]"
          title="Pipeline em Cascata com Circuit Breaker e recuperação (/pipe)"
        >
          <GitCommit className="w-3 h-3 text-[#00f0ff]" />
          <span>/pipe</span>
        </button>

        <button
          type="button"
          onClick={() => setQuickCommand('/all Crie um script Python com nome=eva_telemetry.py que calcule o ratio de sincronizacao')}
          className="px-2 py-0.5 border border-[#3a2515] hover:border-[#ff7a00] bg-[#120d08] text-[#ffca8a] hover:text-[#ff7a00] shrink-0 cursor-pointer text-[11px]"
          title="Pedir código para todas as IAs simultaneamente"
        >
          {t.quickCmdScript}
        </button>

        <button
          type="button"
          onClick={() => setQuickCommand('/all Compare a teoria da barreira AT sob o ponto de vista cientifico')}
          className="px-2 py-0.5 border border-[#3a2515] hover:border-[#4dff9a] bg-[#0c1610] text-[#ffca8a] hover:text-[#4dff9a] shrink-0 cursor-pointer text-[11px]"
          title="Consulta analítica com deliberação MAGI"
        >
          {t.quickCmdJoint}
        </button>

        <button
          type="button"
          onClick={() => setQuickCommand('/clear')}
          className="px-2 py-0.5 border border-[#3a2515] hover:border-[#ff2233] bg-[#120d08] text-[#8a6845] hover:text-[#ff2233] shrink-0 cursor-pointer text-[11px]"
          title="Limpar buffer do terminal"
        >
          /clear
        </button>

        <button
          type="button"
          onClick={() => setQuickCommand('/help')}
          className="px-2 py-0.5 border border-[#3a2515] hover:border-[#00f0ff] bg-[#120d08] text-[#8a6845] hover:text-[#00f0ff] shrink-0 cursor-pointer text-[11px]"
          title="Ver ajuda e todos os comandos táticos"
        >
          /help
        </button>
      </div>

        {/* Right: Dedicated Orchestrator Agent Selector (Directly above the Transmit button) */}
        <div className="shrink-0 flex items-center">
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 bg-[#120b06] border border-[#ff7a00]/70 shadow-[0_0_8px_rgba(255,122,0,0.18)]"
            title="Orchestrator_Agent: IA respons?vel pelo planejamento, decomposi??o e s?ntese (/mtask, /otask, /pipe)"
          >
            <Cpu
              className="w-3.5 h-3.5 shrink-0"
              style={{
                color: nodes.find((n) => n.id === orchestratorAgent)?.color || '#4dff9a',
              }}
            />
            <span className="hidden sm:inline text-[9px] font-mono text-[#8a6845] font-bold uppercase">
              ORQUESTRADOR:
            </span>
            <select
              value={orchestratorAgent}
              onChange={(e) => {
                playKeySound();
                onSelectOrchestrator(e.target.value as MagiNodeId);
              }}
              disabled={isWorking}
              className="bg-transparent font-mono text-[11px] font-bold outline-none cursor-pointer"
              style={{
                color: nodes.find((n) => n.id === orchestratorAgent)?.color || '#4dff9a',
              }}
            >
              {nodes.map((n) => {
                const hasKey = nodeKeyStatus[n.id];
                return (
                  <option
                    key={n.id}
                    value={n.id}
                    className="bg-[#0e0a06] text-white"
                  >
                    {n.magiName} ({n.subName}) {!hasKey ? '(OFF)' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Main Input Box Container */}
      <div className="flex flex-col bg-[#050403] border-2 border-[#ff7a00] shadow-[0_0_15px_rgba(255,122,0,0.15)] focus-within:border-[#ffca8a] focus-within:shadow-[0_0_20px_rgba(255,122,0,0.3)] transition-all">
        {/* Attached Files Tray (Inside Dialogue Box) */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#0d0905] border-b border-[#2d1b0e] select-none">
            <span className="text-[10px] text-[#ff7a00] font-bold flex items-center gap-1 shrink-0">
              <Paperclip className="w-3 h-3 text-[#ff7a00]" />
              ARQUIVOS CARREGADOS ({attachedFiles.length}):
            </span>
            {attachedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-1.5 px-2 py-0.5 bg-[#170e08] border border-[#ff7a00]/70 text-[#ffca8a] text-[10px]"
              >
                <FileCode className="w-3 h-3 text-[#ff7a00]" />
                <span className="font-bold truncate max-w-[140px] sm:max-w-[200px]">{file.name}</span>
                <span className="text-[#8a6845]">({(file.size / 1024).toFixed(1)} KB)</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttached(file.id)}
                  className="ml-0.5 p-0.5 text-[#8a6845] hover:text-[#ff2233] cursor-pointer"
                  title="Remover este arquivo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Area & Action Buttons Row */}
        <div className="flex items-start gap-2 p-2 sm:p-3">
          {/* Monospace Prompt Kicker with Blinking Solid Square Cursor */}
          <div className="flex items-center gap-1.5 text-[#ff7a00] font-mono font-bold text-xs sm:text-sm select-none pt-1 shrink-0">
            <TerminalIcon className="w-4 h-4 text-[#ff7a00]" />
            <span className="hidden sm:inline">{t.promptOperatorKicker}</span>
            <span>$&gt;</span>
            {/* Square prompt block blinking awaiting user iterations */}
            <span
              className="w-2.5 h-4 bg-[#ff7a00] shadow-[0_0_10px_#ff7a00] animate-block-cursor inline-block shrink-0"
              title={t.awaitingOperatorPrompt}
            />
          </div>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isWorking}
            placeholder={
              isWorking
                ? t.promptPlaceholderWorking
                : activeCount === 0
                ? t.promptPlaceholderNoNodes
                : attachedFiles.length > 0
                ? `${attachedFiles.length} arquivo(s) carregado(s). Adicione instruções ou pressione Transmitir.`
                : t.promptPlaceholderDefault
            }
            className="flex-1 bg-transparent text-white font-mono text-sm sm:text-base outline-none resize-none placeholder-[#7a5a3a] leading-normal min-h-[36px] max-h-[180px]"
          />

          {/* Actions: File Upload & Submit Button */}
          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="dialog-file-input"
            />

            {/* Dedicated "Carregar Arquivo" button inside dialogue box */}
            <button
              type="button"
              onClick={() => {
                playKeySound();
                fileInputRef.current?.click();
              }}
              disabled={isWorking}
              className="px-2 sm:px-2.5 py-1.5 font-mono text-xs font-bold flex items-center gap-1 border border-[#ff7a00]/70 bg-[#140c06] hover:bg-[#ff7a00] hover:text-black text-[#ffca8a] transition-all cursor-pointer shadow-[0_0_8px_rgba(255,122,0,0.18)]"
              title="Carregar arquivos de texto, código ou documentos para a caixa de diálogo"
            >
              <Paperclip className="w-3.5 h-3.5 text-[#ff7a00]" />
              <span className="hidden sm:inline">CARREGAR ARQUIVO</span>
            </button>

            {/* Abort/Cancel Button when isWorking */}
            {isWorking && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-2.5 sm:px-3 py-1.5 font-mono text-xs font-bold flex items-center gap-1.5 border border-[#ff2233] bg-[#ff2233]/20 hover:bg-[#ff2233] text-[#ff8888] hover:text-white transition-all cursor-pointer shadow-[0_0_12px_rgba(255,34,51,0.4)] animate-pulse"
                title="Interromper geração de tokens em andamento [ESC]"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>INTERROMPER</span>
              </button>
            )}

            {/* Transmit Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={(!input.trim() && attachedFiles.length === 0) || isWorking}
              className={`px-3 py-1.5 font-mono text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                (!input.trim() && attachedFiles.length === 0) || isWorking
                  ? 'opacity-40 border-[#4a3520] bg-[#120d08] text-[#7a5a3a] cursor-not-allowed'
                  : 'border-[#ff7a00] bg-[#ff7a00] text-black hover:bg-white hover:text-black shadow-[0_0_10px_#ff7a00]'
              }`}
              title="Enviar comando para as IAs ativas [ENTER]"
            >
              <span>{t.transmitButton}</span>
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer Status Line */}
      <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#7a5a3a]">
        <div className="flex items-center gap-2">
          <span>{t.targetNodesLabel(activeCount)}</span>
          <span>·</span>
          <span>{t.tripleDeliberation}</span>
        </div>

        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-[#8a6845]">{t.singleOperatorMode}</span>
        </div>
      </div>
    </div>
  );
};
