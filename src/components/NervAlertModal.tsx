import React from 'react';
import { AlertTriangle, X, RefreshCw, Key, Shield, Zap, CheckCircle2, AlertOctagon } from 'lucide-react';
import { MagiNodeUsage } from '../types/nerv';
import { playKeySound, playWarningSound } from '../utils/audio';
import { TranslationDictionary } from '../utils/i18n';

interface NervAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  usages: MagiNodeUsage[];
  onRefreshUsage: () => void;
  onOpenVault: () => void;
  isTokenLow: boolean;
  onToggleSimulatedLow?: () => void;
  isSimulatedLow?: boolean;
  t: TranslationDictionary;
}

export const NervAlertModal: React.FC<NervAlertModalProps> = ({
  isOpen,
  onClose,
  usages,
  onRefreshUsage,
  onOpenVault,
  isTokenLow,
  onToggleSimulatedLow,
  isSimulatedLow,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs select-none">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#0d0a07] border-2 border-[#ff2233] shadow-[0_0_40px_rgba(255,34,51,0.4)] font-mono flex flex-col scrollbar-thin">
        {/* Top Emergency Red Hazard Stripes */}
        <div className="h-2 hazard-stripes-red w-full border-b border-black shrink-0" />

        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#3d1419] bg-[#1a080a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-xs ${isTokenLow ? 'bg-[#ff2233] text-white animate-pulse shadow-[0_0_12px_#ff2233]' : 'bg-[#2b0c10] text-[#ff7788] border border-[#ff2233]'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold text-[#ff7788] tracking-wider">
                  NERV ALERT // MONITOR DE NÍVEIS DE CONSUMO DAS IAs
                </h2>
                {isTokenLow ? (
                  <span className="text-[10px] bg-[#ff2233] text-white px-1.5 py-0.2 font-bold animate-pulse">
                    CRÍTICO: TOKENS ACABANDO
                  </span>
                ) : (
                  <span className="text-[10px] border border-[#4dff9a] text-[#4dff9a] px-1.5 py-0.2">
                    NÍVEIS MONITORADOS
                  </span>
                )}
              </div>
              <p className="text-[9px] sm:text-[10px] text-[#9a6a6f]">
                TELEMETRIA EM TEMPO REAL DA CAPACIDADE OPERACIONAL DE CADA SUPERCOMPUTADOR
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#9a6a6f] hover:text-[#ff2233] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Low token alert warning banner */}
        {isTokenLow && (
          <div className="p-3 bg-[#2b0c10] border-b border-[#ff2233] text-xs text-[#ffaaaa] flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-[#ff2233] shrink-0 animate-pulse" />
            <span className="font-bold">
              ALERTA DE CONSUMO: A cota de tokens de uma ou mais IAs está próxima do esgotamento (&lt; 20% disponível). Insira chaves no Cofre ou aguarde reset para restaurar a capacidade.
            </span>
          </div>
        )}

        {/* Content: All 5 IAs Available Consumption Levels */}
        <div className="p-4 sm:p-5 space-y-3.5">
          {usages.map((u, idx) => {
            const percent = u.availablePercent;
            const isCritical = u.isOperant && percent <= 20;
            const isWarning = u.isOperant && percent > 20 && percent <= 40;
            const totalBlocks = 24;
            const filled = Math.max(0, Math.min(totalBlocks, Math.round((percent / 100) * totalBlocks)));
            const empty = totalBlocks - filled;
            const bar = '█'.repeat(filled) + '░'.repeat(empty);

            const badgeColor = !u.isOperant
              ? 'border-[#ff2233] text-[#ff7788] bg-[#1a070a]'
              : isCritical
              ? 'border-[#ff2233] text-[#ff2233] bg-[#29080d] animate-pulse font-bold'
              : isWarning
              ? 'border-[#ff7a00] text-[#ff7a00] bg-[#1c0f06]'
              : 'border-[#4dff9a] text-[#4dff9a] bg-[#09170e]';

            const barColor = !u.isOperant
              ? 'text-[#6a353b]'
              : isCritical
              ? 'text-[#ff2233]'
              : isWarning
              ? 'text-[#ff7a00]'
              : 'text-[#4dff9a]';

            const displayName = u.nodeId === 'chatgpt' ? 'UNIT-00' : u.nodeId === 'claude' ? 'UNIT-01' : u.nodeId === 'gemini' ? 'UNIT-02' : u.nodeId === 'grok' ? 'UNIT-03' : 'UNIT-04';

            return (
              <div
                key={u.nodeId}
                className={`p-3 border-2 transition-all ${
                  isCritical
                    ? 'border-[#ff2233] bg-[#150608] shadow-[0_0_12px_rgba(255,34,51,0.25)]'
                    : 'border-[#2d1c15] bg-[#0b0806] hover:border-[#ff7a00]/70'
                }`}
              >
                {/* Header row: Node name & Available Percentage */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#ffca8a] tracking-wider">
                      [{displayName}]
                    </span>
                    <span className="text-[11px] text-[#8a6845]">({u.realPlatform})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 border ${badgeColor}`}>
                      {!u.isOperant
                        ? 'BLOQUEADO // SEM CHAVE'
                        : isCritical
                        ? 'CRÍTICO // QUASE ESGOTADO'
                        : isWarning
                        ? 'ATENÇÃO // COTA MODERADA'
                        : 'OPERACIONAL'}
                    </span>
                    <span
                      className={`text-sm sm:text-base font-black font-mono tracking-wider ${
                        !u.isOperant
                          ? 'text-[#ff7788]'
                          : isCritical
                          ? 'text-[#ff2233] animate-pulse'
                          : isWarning
                          ? 'text-[#ff7a00]'
                          : 'text-[#4dff9a]'
                      }`}
                    >
                      {u.isOperant ? `${percent.toFixed(1)}% DISPONÍVEL` : '0.0%'}
                    </span>
                  </div>
                </div>

                {/* Tactical ASCII Gauge */}
                <div className="mb-2">
                  <div className="flex items-center justify-between text-[10px] text-[#7a5a3a] mb-0.5 font-bold">
                    <span>CONSUMO DE TOKENS</span>
                    <span>RESTANTE: {percent.toFixed(1)}%</span>
                  </div>
                  <div className={`font-mono text-xs sm:text-sm tracking-widest break-all ${barColor}`}>
                    {bar}
                  </div>
                </div>

                {/* Telemetry metadata grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] pt-2 border-t border-[#221610] text-[#8a6845]">
                  <div>
                    <span className="text-[#6a4c33] block">REQUISIÇÕES:</span>
                    <span className="text-[#ffca8a] font-bold">{u.requestsCount}</span>
                  </div>
                  <div>
                    <span className="text-[#6a4c33] block">TOKENS USADOS:</span>
                    <span className="text-[#ffca8a] font-bold">{u.tokensUsed.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[#6a4c33] block">SINCRONIA:</span>
                    <span className="text-[#4dff9a] font-bold">{u.isOperant ? `${u.syncRate}%` : '0%'}</span>
                  </div>
                  <div>
                    <span className="text-[#6a4c33] block">ORIGEM CHAVE:</span>
                    <span className="text-[#ffca8a] font-bold uppercase">{u.keySource}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="p-3.5 sm:p-4 border-t border-[#2d1c15] bg-[#120a06] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <span className="text-[10px] text-[#7a5a3a]">
            COTA REINICIADA POR SESSÃO OU VIA PURGA
          </span>

          <div className="flex items-center gap-2 ml-auto flex-wrap justify-end">
            {onToggleSimulatedLow && (
              <button
                type="button"
                onClick={() => {
                  onToggleSimulatedLow();
                }}
                className={`px-2.5 py-1.5 border text-xs cursor-pointer flex items-center gap-1.5 font-bold transition-all ${
                  isSimulatedLow
                    ? 'border-[#ff2233] bg-[#ff2233] text-white animate-pulse shadow-[0_0_12px_#ff2233]'
                    : 'border-[#ff2233]/70 bg-[#1c080a] text-[#ff7788] hover:bg-[#ff2233] hover:text-white'
                }`}
                title="Simula o estado de tokens baixos para testar o alerta piscante no topo"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isSimulatedLow ? 'DESATIVAR SIMULAÇÃO' : 'TESTAR ALERTA PISCANTE'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                playKeySound();
                onRefreshUsage();
              }}
              className="px-2.5 py-1.5 border border-[#00f0ff] bg-[#07161f] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black text-xs cursor-pointer flex items-center gap-1.5 font-bold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>ATUALIZAR</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playKeySound();
                onClose();
                onOpenVault();
              }}
              className="px-2.5 py-1.5 border border-[#ff7a00] bg-[#170e06] text-[#ff7a00] hover:bg-[#ff7a00] hover:text-black text-xs cursor-pointer flex items-center gap-1.5 font-bold transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>COFRE DE CHAVES</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-[#3a2515] text-[#8a6845] hover:text-[#ffca8a] text-xs cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
