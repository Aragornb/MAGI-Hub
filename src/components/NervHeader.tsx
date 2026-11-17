import React, { useState, useEffect } from 'react';
import { AlertTriangle, Maximize2, Minimize2 } from 'lucide-react';
import { MagiNodeConfig, MagiNodeId, SupportedLanguage } from '../types/nerv';
import { playKeySound, playWarningSound } from '../utils/audio';
import { TranslationDictionary } from '../utils/i18n';
import { NervClock } from './NervClock';
import { LanguageSelector } from './LanguageSelector';

interface NervHeaderProps {
  nodes: MagiNodeConfig[];
  onToggleNode: (id: MagiNodeId) => void;
  isWorking: boolean;
  nodeKeyStatus: Record<MagiNodeId, boolean>;
  language: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onOpenAlertModal: () => void;
  isTokenLow: boolean;
  activeAngelName?: string | null;
  onOpenAngels?: () => void;
  onCloseApp?: () => void;
  t: TranslationDictionary;
}

export const NervHeader: React.FC<NervHeaderProps> = ({
  nodes,
  onToggleNode,
  isWorking,
  nodeKeyStatus,
  language,
  onSelectLanguage,
  onOpenAlertModal,
  isTokenLow,
  activeAngelName,
  onOpenAngels,
  onCloseApp,
  t,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleToggleFullscreen = () => {
    playKeySound();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };
  return (
    <header className="border-b-2 border-[#ff7a00] bg-[#090704] select-none shrink-0 z-20">
      {/* Top Hazard Warning Stripe */}
      <div className="h-2 hazard-stripes w-full border-b border-black" />

      <div className="px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left Section: NERV Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="font-serif font-black text-2xl sm:text-3xl tracking-tight text-[#ff2233] scale-y-125 origin-left leading-none">
                {t.brandTitle}
              </span>
              <span className="text-xs font-mono font-bold tracking-widest text-[#ff7a00] border border-[#ff7a00] px-1 py-0.2">
                {t.magiSystem}
              </span>
            </div>
            <span className="text-[9px] font-mono text-[#b88d5e] tracking-wider mt-0.5">
              {t.centralDogma}
            </span>
          </div>

          <div className="hidden xl:block h-7 w-[1px] bg-[#3a2515]" />

          <div className="hidden 2xl:flex flex-col text-[10px] font-mono text-[#c49a6c]">
            <span className="text-[#ffca8a]">
              {t.linkStatus}: {isWorking ? t.transmitting : t.operational}
            </span>
            <span>{t.restrictedAccess}</span>
          </div>
        </div>

        {/* Center: The Five MAGI AI Nodes (ChatGPT, Claude, Gemini, Grok, DeepSeek) */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center flex-1 min-w-0">
          {nodes.map((node) => {
            const isNodeWorking = node.status === 'WORKING';
            const isOperant = Boolean(nodeKeyStatus[node.id]);

            return (
              <button
                key={node.id}
                type="button"
                disabled={!isOperant}
                onClick={() => {
                  if (!isOperant) return;
                  playKeySound();
                  onToggleNode(node.id);
                }}
                className={`relative px-2.5 py-1 text-left border-2 transition-all font-mono flex flex-col justify-center min-w-[110px] sm:min-w-[125px] h-[44px] ${
                  !isOperant
                    ? 'bg-[#140608] opacity-55 border-[#ff2233] cursor-not-allowed'
                    : node.active
                    ? 'bg-[#150f09] shadow-[0_0_12px_rgba(255,122,0,0.22)] cursor-pointer'
                    : 'bg-[#0a0805] opacity-50 border-[#4a3520] cursor-pointer'
                }`}
                style={{
                  borderColor: !isOperant ? '#ff2233' : node.active ? node.borderColor : '#4a3520',
                }}
                title={
                  !isOperant
                    ? `[BLOQUEADO] ${node.magiName} (${node.realPlatform}) ${t.nodeBlockedTooltip}`
                    : `${t.nodeToggleTooltip}: ${node.magiName} (${node.realPlatform})`
                }
              >
                {/* Line 1: Agent Name + Operating Light */}
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className="font-bold text-[11px] sm:text-xs tracking-wider truncate"
                    style={{ color: !isOperant ? '#ff7788' : node.active ? node.color : '#8a6845' }}
                  >
                    {node.magiName}
                  </span>

                  {/* Status Light */}
                  <span
                    className={`w-2.5 h-2.5 rounded-xs shrink-0 transition-all ${
                      !isOperant
                        ? 'bg-[#ff2233] shadow-[0_0_8px_#ff2233]'
                        : isNodeWorking
                        ? 'bg-[#ff2233] animate-working shadow-[0_0_8px_#ff2233]'
                        : node.active
                        ? 'bg-[#4dff9a] shadow-[0_0_6px_#4dff9a]'
                        : 'bg-[#1c3824]'
                    }`}
                  />
                </div>

                {/* Line 2: Corresponding AI + Status Label */}
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] mt-0.5">
                  <span className={`truncate ${!isOperant ? 'text-[#8a6845]' : 'text-[#ffca8a] font-semibold'}`}>
                    {node.realPlatform}
                  </span>
                  <span
                    className={`text-[8px] sm:text-[9px] uppercase font-mono font-bold shrink-0 ml-1 ${
                      !isOperant
                        ? 'text-[#ff2233]'
                        : isNodeWorking
                        ? 'text-[#ff7a00]'
                        : node.active
                        ? 'text-[#4dff9a]'
                        : 'text-[#7a5a3a]'
                    }`}
                  >
                    {!isOperant ? t.withoutKey : isNodeWorking ? t.processing : node.active ? t.statusOn : t.statusOff}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Tactical Clock, ALERT Button & Language Selector Dropdown */}
        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          {/* Active Angel Badge */}
          {activeAngelName && onOpenAngels && (
            <button
              type="button"
              onClick={() => {
                playKeySound();
                onOpenAngels();
              }}
              className="hidden lg:flex items-center gap-1.5 px-2 py-1 border border-[#00f0ff] bg-[#00f0ff]/10 text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black cursor-pointer text-xs font-mono font-bold transition-all shadow-[0_0_8px_rgba(0,240,255,0.25)]"
              title="Skill Angel ativa na janela de contexto: clique para gerenciar"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-ping" />
              <span>SKILL: {activeAngelName}</span>
            </button>
          )}

          {/* Tactical Clock with Current Time */}
          <NervClock t={t} />

          {/* Emergency ALERT Button (Blinks red when token usage is running low) */}
          <button
            type="button"
            onClick={() => {
              if (isTokenLow) {
                playWarningSound();
              } else {
                playKeySound();
              }
              onOpenAlertModal();
            }}
            className={`relative px-2.5 py-1 text-left border-2 font-mono flex flex-col justify-center min-w-[85px] sm:min-w-[100px] h-[44px] cursor-pointer transition-all select-none ${
              isTokenLow
                ? 'animate-alert-flash border-[#ff2233]'
                : 'bg-[#180709] border-[#ff2233]/70 text-[#ff5566] hover:bg-[#ff2233] hover:text-white shadow-[0_0_8px_rgba(255,34,51,0.25)]'
            }`}
            title="ALERT: Níveis disponíveis de consumo de cada IA (Pisca vermelho quando a utilização de tokens estiver acabando)"
          >
            {/* Line 1: Alert Icon + Label + Status Dot */}
            <div className="flex items-center justify-between gap-1.5 leading-none">
              <div className="flex items-center gap-1">
                <AlertTriangle className={`w-3.5 h-3.5 ${isTokenLow ? 'text-white animate-bounce' : 'text-[#ff5566]'}`} />
                <span className="font-bold text-[11px] sm:text-xs tracking-wider">
                  ALERT
                </span>
              </div>
              <span
                className={`w-2 h-2 rounded-xs shrink-0 ${
                  isTokenLow
                    ? 'bg-white shadow-[0_0_8px_#ffffff] animate-ping'
                    : 'bg-[#ff2233] shadow-[0_0_6px_#ff2233]'
                }`}
              />
            </div>

            {/* Line 2: Telemetry status text */}
            <div className="flex items-center justify-between text-[8px] sm:text-[9px] mt-0.5 uppercase font-mono font-bold leading-none">
              <span className={`truncate ${isTokenLow ? 'text-white font-black' : 'text-[#ff99aa]'}`}>
                {isTokenLow ? 'CRÍTICO < 20%' : 'CONSUMO IAs'}
              </span>
              <span className="text-[7px] text-[#ff7788] hidden sm:inline ml-1 font-bold">
                [LIVE]
              </span>
            </div>
          </button>

          {/* Platform Language Selector Dropdown (PT-BR, ENG, JPN, CHI) */}
          <LanguageSelector
            currentLanguage={language}
            onSelectLanguage={onSelectLanguage}
            title={t.langSelectTitle}
          />

          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="h-[44px] px-2.5 border-2 border-[#4a3520] bg-[#140e08] hover:border-[#ff7a00] text-[#ff7a00] hover:text-white cursor-pointer transition-all flex items-center justify-center font-mono gap-1.5 shadow-[0_0_8px_rgba(255,122,0,0.15)]"
            title={isFullscreen ? "Sair de Tela Cheia (F11)" : "Modo Tela Cheia (F11)"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-[#4dff9a]" />
            ) : (
              <Maximize2 className="w-4 h-4 text-[#ff7a00]" />
            )}
            <span className="hidden xl:inline text-[9px] font-bold">
              {isFullscreen ? "JANELA" : "TELA CHEIA"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
