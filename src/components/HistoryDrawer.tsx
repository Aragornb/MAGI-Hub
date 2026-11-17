import React, { useState } from 'react';
import {
  History,
  X,
  Search,
  MessageSquare,
  Sparkles,
  Layers,
  Trash2,
  Download,
  Terminal,
  Copy,
  Check,
  FileCode,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ConversationRecord, ConversationScope, MagiNodeId } from '../types/nerv';
import { playDrawerSound, playKeySound } from '../utils/audio';
import { TranslationDictionary } from '../utils/i18n';

interface HistoryDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  conversations: ConversationRecord[];
  unreadCount?: number;
  onLoadConversationToTerminal: (record: ConversationRecord) => void;
  onClearHistory: () => void;
  onDeleteConversation: (id: string) => void;
  t?: TranslationDictionary;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onToggle,
  conversations,
  unreadCount = 0,
  onLoadConversationToTerminal,
  onClearHistory,
  onDeleteConversation,
  t,
}) => {
  const [activeScope, setActiveScope] = useState<ConversationScope | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);

  const handleToggle = () => {
    playDrawerSound();
    onToggle();
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    playKeySound();
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter conversations
  const filtered = conversations.filter((c) => {
    const matchesScope = activeScope === 'all' || c.scope === activeScope;
    if (!matchesScope) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const promptMatch = c.prompt.toLowerCase().includes(q);
    const respMatch = c.responses.some((r) => r.text.toLowerCase().includes(q));
    return promptMatch || respMatch;
  });

  const getScopeBadge = (scope: ConversationScope) => {
    switch (scope) {
      case 'joint':
        return {
          label: 'CONJUNTO // TODAS AS IAs',
          color: '#00f0ff',
          border: '#00f0ff',
          bg: '#051821',
        };
      case 'chatgpt':
        return {
          label: 'UNIT-00 // ChatGPT',
          color: '#ff7a00',
          border: '#ff7a00',
          bg: '#1a0d05',
        };
      case 'claude':
        return {
          label: 'UNIT-01 // Claude',
          color: '#4dff9a',
          border: '#4dff9a',
          bg: '#081c10',
        };
      case 'gemini':
        return {
          label: 'UNIT-02 // Gemini',
          color: '#b48cff',
          border: '#b48cff',
          bg: '#160d24',
        };
      case 'grok':
        return {
          label: 'UNIT-03 // Grok',
          color: '#ff3366',
          border: '#ff3366',
          bg: '#240a12',
        };
      case 'deepseek':
        return {
          label: 'UNIT-04 // DeepSeek',
          color: '#00f0ff',
          border: '#00f0ff',
          bg: '#061821',
        };
      default:
        return {
          label: 'MAGI // UNIT',
          color: '#ffca8a',
          border: '#7a5a3a',
          bg: '#120d08',
        };
    }
  };

  const exportAllHistoryAsTxt = () => {
    if (conversations.length === 0) return;
    const text = conversations
      .map(
        (c) =>
          `=======================================================\n` +
          `[DATA: ${c.timeFormatted}] - ESCOPO: ${c.scopeLabel}\n` +
          `PROMPT DO OPERADOR:\n${c.prompt}\n\n` +
          `RESPOSTAS:\n` +
          c.responses
            .map((r) => `--- [${r.nodeName}] ---\n${r.text}\n`)
            .join('\n') +
          (c.consensus ? `\nCONSENSO: ${c.consensus}\n` : '') +
          `=======================================================\n\n`
      )
      .join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NERV_MAGI_HISTORICO_CONVERSAS_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Floating Left Retractable Trigger Tab (Only Arrow, Centered Vertically with Context Window) */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Abrir/Fechar Gaveta de Histórico"
        aria-expanded={isOpen}
        className={`fixed left-0 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-8 h-16 sm:w-9 sm:h-20 border-2 border-l-0 rounded-r-md cursor-pointer transition-all select-none shadow-[4px_0_15px_rgba(0,0,0,0.6)] ${
          unreadCount > 0 && !isOpen
            ? 'animate-file-flash'
            : isOpen
            ? 'bg-[#ff7a00] text-black border-[#ff7a00] font-bold shadow-[0_0_20px_#ff7a00]'
            : 'bg-[#120d08] border-[#ff7a00] text-[#ff7a00] hover:bg-[#ff7a00] hover:text-black'
        }`}
        title={
          unreadCount > 0 && !isOpen
            ? (t ? t.historyTriggerTooltipNew(unreadCount) : `[ALERTA NERV] ${unreadCount} nova(s) resposta(s) gerada(s). Clique para visualizar o histórico.`)
            : isOpen
            ? (t ? t.historyTriggerCollapse : 'Recolher gaveta de histórico')
            : (t ? t.historyTriggerExpand : 'Expandir gaveta de histórico')
        }
      >
        <span
          className={`flex items-center justify-center transition-transform ${
            unreadCount > 0 && !isOpen ? 'animate-arrow-flash' : ''
          }`}
        >
          {isOpen ? (
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          ) : (
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          )}
        </span>
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={handleToggle}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Slide-out Left Drawer Panel */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-full sm:w-[480px] bg-[#0c0906] border-r-2 border-[#ff7a00] z-50 flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.85)] transition-transform duration-300 ease-in-out font-mono select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu Retrátil de Histórico de Conversas da NERV"
      >
        {/* Hazard Header Stripe */}
        <div className="h-2 hazard-stripes-sm w-full" />

        {/* Header Bar */}
        <div className="p-4 border-b border-[#2d1f14] bg-[#120d08] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-[#ff7a00]" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[#ff7a00] font-bold text-sm">
                  {t ? t.historyDrawerTitle : 'NERV // HISTÓRICO DE LOGS'}
                </span>
                <span className="text-[10px] text-[#4dff9a] border border-[#4dff9a] px-1 py-0.2">
                  LOCAL
                </span>
              </div>
              <span className="text-[11px] text-[#8a6845] mt-0.5 block">
                {t ? t.historyDrawerSubtitle : 'ÚLTIMAS CONVERSAS EM CONJUNTO E POR IA'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            className="p-1.5 text-[#ffca8a] hover:text-[#ff2233] border border-[#3a2515] hover:border-[#ff2233] transition-colors cursor-pointer"
            title="Fechar menu retrátil"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scope Filter Tabs */}
        <div className="p-3 bg-[#090704] border-b border-[#22160d] flex flex-col gap-2.5">
          {/* Search Bar */}
          <div className="flex items-center gap-2 bg-[#050403] border border-[#3a2515] px-2.5 py-1.5 focus-within:border-[#ff7a00]">
            <Search className="w-3.5 h-3.5 text-[#7a5a3a]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar em prompts e respostas..."
              className="bg-transparent text-xs text-white placeholder-[#7a5a3a] outline-none flex-1 font-mono"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[10px] text-[#8a6845] hover:text-[#ffca8a]"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Categorized Scope Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => {
                playKeySound();
                setActiveScope('all');
              }}
              className={`px-2 py-1 border text-center font-bold transition-all cursor-pointer ${
                activeScope === 'all'
                  ? 'border-[#ffca8a] bg-[#22180e] text-[#ffca8a]'
                  : 'border-[#3a2515] text-[#7a5a3a] hover:text-[#ffca8a] bg-[#0c0906]'
              }`}
            >
              TODAS ({conversations.length})
            </button>

            <button
              type="button"
              onClick={() => {
                playKeySound();
                setActiveScope('joint');
              }}
              className={`px-2 py-1 border text-center font-bold transition-all cursor-pointer ${
                activeScope === 'joint'
                  ? 'border-[#00f0ff] bg-[#061821] text-[#00f0ff]'
                  : 'border-[#3a2515] text-[#7a5a3a] hover:text-[#00f0ff] bg-[#0c0906]'
              }`}
              title="Conversas enviadas simultaneamente a todas as IAs"
            >
              CONJUNTO
            </button>

            <button
              type="button"
              onClick={() => {
                playKeySound();
                setActiveScope('chatgpt');
              }}
              className={`px-2 py-1 border text-center font-bold transition-all cursor-pointer ${
                activeScope === 'chatgpt'
                  ? 'border-[#ff7a00] bg-[#1a0e05] text-[#ff7a00]'
                  : 'border-[#3a2515] text-[#7a5a3a] hover:text-[#ff7a00] bg-[#0c0906]'
              }`}
              title="Apenas conversas com UNIT-00 (ChatGPT)"
            >
              UNIT-00
            </button>

            <button
              type="button"
              onClick={() => {
                playKeySound();
                setActiveScope('claude');
              }}
              className={`px-2 py-1 border text-center font-bold transition-all cursor-pointer ${
                activeScope === 'claude'
                  ? 'border-[#4dff9a] bg-[#081a10] text-[#4dff9a]'
                  : 'border-[#3a2515] text-[#7a5a3a] hover:text-[#4dff9a] bg-[#0c0906]'
              }`}
              title="Apenas conversas com UNIT-01 (Claude)"
            >
              UNIT-01
            </button>

            <button
              type="button"
              onClick={() => {
                playKeySound();
                setActiveScope('gemini');
              }}
              className={`px-2 py-1 border text-center font-bold transition-all cursor-pointer ${
                activeScope === 'gemini'
                  ? 'border-[#b48cff] bg-[#160d24] text-[#b48cff]'
                  : 'border-[#3a2515] text-[#7a5a3a] hover:text-[#b48cff] bg-[#0c0906]'
              }`}
              title="Apenas conversas com UNIT-02 (Gemini)"
            >
              UNIT-02
            </button>

            <button
              type="button"
              onClick={() => {
                playKeySound();
                setActiveScope('grok');
              }}
              className={`px-2 py-1 border text-center font-bold transition-all cursor-pointer ${
                activeScope === 'grok'
                  ? 'border-[#ff3366] bg-[#240a12] text-[#ff3366]'
                  : 'border-[#3a2515] text-[#7a5a3a] hover:text-[#ff3366] bg-[#0c0906]'
              }`}
              title="Apenas conversas com UNIT-03 (Grok)"
            >
              UNIT-03
            </button>

            <button
              type="button"
              onClick={() => {
                playKeySound();
                setActiveScope('deepseek');
              }}
              className={`col-span-2 sm:col-span-3 px-2 py-1 border text-center font-bold transition-all cursor-pointer ${
                activeScope === 'deepseek'
                  ? 'border-[#00f0ff] bg-[#061821] text-[#00f0ff]'
                  : 'border-[#3a2515] text-[#7a5a3a] hover:text-[#00f0ff] bg-[#0c0906]'
              }`}
              title="Apenas conversas com UNIT-04 (DeepSeek)"
            >
              UNIT-04 (DeepSeek)
            </button>
          </div>
        </div>

        {/* Toolbar: Actions */}
        <div className="px-4 py-2 bg-[#120d08] border-b border-[#22160d] flex items-center justify-between text-xs">
          <span className="text-[#8a6845]">
            REGISTROS ENCONTRADOS: <strong className="text-[#ffca8a]">{filtered.length}</strong>
          </span>

          <div className="flex items-center gap-2">
            {conversations.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={exportAllHistoryAsTxt}
                  className="flex items-center gap-1 px-2 py-1 border border-[#3a2515] hover:border-[#ffca8a] text-[#ffca8a] cursor-pointer text-[11px]"
                  title="Exportar histórico completo em arquivo de texto"
                >
                  <Download className="w-3 h-3" />
                  <span>EXPORTAR .TXT</span>
                </button>

                {confirmClear ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClearHistory();
                        setConfirmClear(false);
                      }}
                      className="px-2 py-1 bg-[#ff2233] text-white font-bold text-[10px] cursor-pointer"
                    >
                      CONFIRMAR LIMPEZA
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="px-1.5 py-1 text-[#8a6845] hover:text-[#ffca8a] text-[10px] cursor-pointer"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-1 px-2 py-1 border border-[#3a2515] hover:border-[#ff2233] text-[#ff2233] cursor-pointer text-[11px]"
                    title="Limpar todos os registros de conversas"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>LIMPAR</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#3a2515] bg-[#090704]">
              <MessageSquare className="w-10 h-10 text-[#4a3520] mb-3" />
              <p className="text-sm text-[#ffca8a] font-bold">NENHUMA CONVERSA REGISTRADA</p>
              <p className="text-xs text-[#7a5a3a] mt-2 max-w-xs">
                As conversas enviadas no prompt (em conjunto ou individuais para ChatGPT, Claude e Gemini)
                ficarão salvas aqui para consulta imediata.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const badge = getScopeBadge(item.scope);
              return (
                <div
                  key={item.id}
                  className="p-3 border border-[#3a2515] bg-[#0e0a07] hover:border-[#ff7a00] transition-colors flex flex-col gap-2.5"
                >
                  {/* Header: Scope + Timestamp */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 border uppercase truncate"
                      style={{
                        color: badge.color,
                        borderColor: badge.border,
                        backgroundColor: badge.bg,
                      }}
                    >
                      {badge.label}
                    </span>
                    <span className="text-[10px] text-[#7a5a3a] shrink-0 font-mono">
                      {item.timeFormatted}
                    </span>
                  </div>

                  {/* Prompt Text Preview */}
                  <div className="text-xs text-white font-semibold line-clamp-2 select-text bg-[#160f09] p-2 border-l-2 border-[#ff7a00]">
                    &gt; {item.prompt}
                  </div>

                  {/* Responses Breakdown */}
                  <div className="space-y-1.5 pt-1">
                    {item.responses.map((resp, idx) => (
                      <div
                        key={idx}
                        className="text-[11px] p-2 bg-[#050403] border border-[#22160d] text-[#ffca8a] select-text"
                      >
                        <div className="flex items-center justify-between text-[10px] text-[#8a6845] mb-1 font-bold">
                          <span>[{resp.nodeName}]</span>
                          <span className="text-[#4dff9a]">{resp.status}</span>
                        </div>
                        <p className="line-clamp-2 text-[#d8b584] leading-relaxed">
                          {resp.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Consensus or Files badge */}
                  {(item.consensus || item.filesCount > 0) && (
                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[#22160d]">
                      {item.consensus ? (
                        <span className="text-[#00f0ff] font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {item.consensus}
                        </span>
                      ) : (
                        <span />
                      )}

                      {item.filesCount > 0 && (
                        <span className="text-[#ff7a00] font-bold flex items-center gap-1">
                          <FileCode className="w-3 h-3" />
                          {item.filesCount} ARQUIVO(S)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions for this item */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#22160d]">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.prompt, `p-${item.id}`)}
                      className="px-2 py-1 text-[11px] border border-[#3a2515] hover:border-[#ffca8a] text-[#8a6845] hover:text-[#ffca8a] flex items-center gap-1 cursor-pointer"
                      title="Copiar prompt original"
                    >
                      {copiedId === `p-${item.id}` ? (
                        <>
                          <Check className="w-3 h-3 text-[#4dff9a]" />
                          <span className="text-[#4dff9a]">Copiado</span>
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
                        onLoadConversationToTerminal(item);
                      }}
                      className="px-2 py-1 text-[11px] border border-[#ff7a00] bg-[#1a0f07] hover:bg-[#ff7a00] hover:text-black text-[#ff7a00] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Exibir esta conversa no terminal central"
                    >
                      <Terminal className="w-3 h-3" />
                      <span>Ver no Terminal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteConversation(item.id)}
                      className="p-1 text-[#5a3a25] hover:text-[#ff2233] cursor-pointer"
                      title="Excluir este registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#2d1f14] bg-[#090704] text-[10px] text-[#7a5a3a] flex items-center justify-between">
          <span>ARMAZENAMENTO SEGURO DA SESSÃO LOCAL</span>
          <button
            type="button"
            onClick={handleToggle}
            className="text-[#ffca8a] hover:underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </aside>
    </>
  );
};
