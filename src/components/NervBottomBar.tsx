import React from 'react';
import {
  Volume2,
  VolumeX,
  Shield,
  Download,
  Monitor,
  Trash2,
  Gauge,
  User,
  Radio,
  Layers,
  CreditCard,
  Power,
  Bot,
  ShieldCheck,
  Scale,
} from 'lucide-react';
import { playKeySound } from '../utils/audio';
import { TranslationDictionary } from '../utils/i18n';
import { NervSyncBar } from './NervSyncBar';

interface NervBottomBarProps {
  operatorName: string;
  onOpenVault: () => void;
  onOpenUserMenu: () => void;
  onOpenBilling?: () => void;
  onOpenAngels?: () => void;
  onOpenAgents?: () => void;
  onOpenLgpd?: () => void;
  onOpenCredits?: () => void;
  activeAngelName?: string | null;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  crtEnabled: boolean;
  onToggleCrt: () => void;
  onOpenPcModal?: () => void;
  onPurgeAll?: () => void;
  onCheckUsage?: () => void;
  onCloseApp?: () => void;
  t: TranslationDictionary;
  isWorking?: boolean;
  interactionCount?: number;
}

export const NervBottomBar: React.FC<NervBottomBarProps> = ({
  operatorName,
  onOpenVault,
  onOpenUserMenu,
  onOpenBilling,
  onOpenAngels,
  onOpenAgents,
  onOpenLgpd,
  onOpenCredits,
  activeAngelName,
  audioEnabled,
  onToggleAudio,
  crtEnabled,
  onToggleCrt,
  onPurgeAll,
  onCheckUsage,
  onCloseApp,
  t,
  isWorking = false,
  interactionCount = 0,
}) => {
  return (
    <footer className="border-t-2 border-[#ff7a00] bg-[#090704] select-none shrink-0 z-20">
      <div className="px-2.5 sm:px-4 py-1.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2.5 text-xs font-mono">
        {/* Left Side: Operator Profile Badge & Status Indicator */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              playKeySound();
              onOpenUserMenu();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#140e08] border border-[#ff7a00]/70 hover:border-[#ffca8a] text-[#ffca8a] hover:text-white transition-all cursor-pointer shadow-[0_0_8px_rgba(255,122,0,0.18)]"
            title="Menu do Usuário: Identificação operacional e diretrizes de conta"
          >
            <User className="w-3.5 h-3.5 text-[#ff7a00]" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] text-[#c49a6c] font-bold">OPERADOR:</span>
              <span className="font-bold text-xs text-[#ffca8a]">{operatorName || 'Usuário'}</span>
            </div>
          </button>

          <div className="hidden xl:flex items-center gap-1 text-[10px] text-[#b88d5e]">
            <Radio className={`w-3 h-3 ${isWorking ? 'text-[#ff2233] animate-pulse' : 'text-[#4dff9a]'}`} />
            <span>{isWorking ? 'TRANSMISSÃO' : 'NERV ONLINE'}</span>
          </div>
        </div>

        {/* Center: The Sync Bar and Timer on the exact SAME HORIZONTAL ROW! */}
        <div className="flex-1 flex justify-center min-w-[280px] max-w-[580px] mx-auto px-1">
          <NervSyncBar isWorking={isWorking} interactionCount={interactionCount} />
        </div>

        {/* Right Side: Complete Bottom Action Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0 ml-auto">
          {/* Billing & Plans Trigger Button */}
          {onOpenBilling && (
            <button
              type="button"
              onClick={() => {
                playKeySound();
                onOpenBilling();
              }}
              className="px-2.5 py-1 border border-[#ff7a00] bg-[#1a0f07] text-[#ffca8a] hover:bg-[#ff7a00] hover:text-black font-mono text-xs cursor-pointer flex items-center gap-1.5 transition-all shadow-[0_0_8px_rgba(255,122,0,0.2)] font-bold"
              title="Sistema de Pagamento: Cartão de crédito, planos (Demand, Basic, Pro, Max) e distribuição de saldo por IA"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#ff7a00]" />
              <span>RECARGAS &amp; PLANOS</span>
            </button>
          )}

          {/* AI Usage / Quota Telemetry Quick Trigger Button */}
          {onCheckUsage && (
            <button
              type="button"
              onClick={() => {
                playKeySound();
                onCheckUsage();
              }}
              className="px-2.5 py-1 border border-[#00f0ff] bg-[#07161f] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black font-mono text-xs cursor-pointer flex items-center gap-1.5 transition-colors shadow-[0_0_8px_rgba(0,240,255,0.25)] font-bold"
              title={t.quotaCheckTooltip}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>{t.quotaCheckButton || '% USO IAs'}</span>
            </button>
          )}

          {/* Angels Context Control Tab & Skill Reference */}
          {onOpenAngels && (
            <button
              type="button"
              onClick={() => {
                playKeySound();
                onOpenAngels();
              }}
              className={`px-2.5 py-1 border font-mono text-xs cursor-pointer flex items-center gap-1.5 transition-all font-bold ${
                activeAngelName
                  ? 'border-[#00f0ff] bg-[#06202e] text-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.4)] ring-1 ring-[#00f0ff]'
                  : 'border-[#1b3e52] bg-[#08151c] text-[#7eb5cc] hover:border-[#00f0ff] hover:text-[#00f0ff]'
              }`}
              title="Controle de Contexto e Skills ANGELS (/angel): define instruções e base de conhecimento ativas"
            >
              <Layers className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span className="tracking-wider">ANGELS</span>
              {activeAngelName ? (
                <span className="text-[10px] bg-[#00f0ff] text-black px-1.5 py-0.2 font-bold truncate max-w-[120px] animate-pulse">
                  {activeAngelName}
                </span>
              ) : (
                <span className="text-[9px] text-[#4d7587] hidden lg:inline">
                  (CONTEXTO)
                </span>
              )}
            </button>
          )}

          {/* Autonomous Agents (OpenClaw) Trigger Button */}
          {onOpenAgents && (
            <button
              type="button"
              onClick={() => {
                playKeySound();
                onOpenAgents();
              }}
              className="px-2.5 py-1 border border-[#00f0ff] bg-[#061c26] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black font-mono text-xs cursor-pointer flex items-center gap-1.5 transition-all font-bold shadow-[0_0_10px_rgba(0,240,255,0.28)]"
              title="OpenClaw Gateway: Criar e gerenciar agentes autônomos com Heartbeats, Crons, Webhooks e MEMORY.md"
            >
              <Bot className="w-3.5 h-3.5" aria-hidden="true" />
              <span>AGENTES</span>
            </button>
          )}

          {/* LGPD & Audit Trail Button */}
          {onOpenLgpd && (
            <button
              type="button"
              onClick={() => {
                playKeySound();
                onOpenLgpd();
              }}
              className="px-2 py-1 border border-[#4dff9a]/70 bg-[#08170e] text-[#4dff9a] hover:bg-[#4dff9a] hover:text-black font-mono text-xs cursor-pointer flex items-center gap-1 transition-colors font-bold"
              title="Governança LGPD: Termo de consentimento, anonimização e trilha de auditoria"
              aria-label="Governança LGPD e Auditoria"
            >
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden xl:inline">LGPD</span>
            </button>
          )}

          {/* Legal Credits & OSS Licenses Button */}
          {onOpenCredits && (
            <button
              type="button"
              onClick={() => {
                playKeySound();
                onOpenCredits();
              }}
              className="px-2 py-1 border border-[#b88d5e] bg-[#140e08] text-[#ffca8a] hover:bg-[#ff7a00] hover:text-black font-mono text-xs cursor-pointer flex items-center gap-1 transition-colors"
              title="Sobre o MAGI-Hub: Licenças Open-Source (Apache 2.0) e Disclaimers"
              aria-label="Sobre e Créditos Open-Source"
            >
              <Scale className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden xl:inline">CRÉDITOS</span>
            </button>
          )}

          {/* Operator Security & Keys Vault */}
          <button
            type="button"
            onClick={() => {
              playKeySound();
              onOpenVault();
            }}
            className="px-2.5 py-1 border border-[#ff7a00] bg-[#170e06] text-[#ff7a00] hover:bg-[#ff7a00] hover:text-black font-mono text-xs cursor-pointer flex items-center gap-1.5 transition-colors font-bold shadow-[0_0_8px_rgba(255,122,0,0.2)]"
            title={t.vaultTooltip}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{t.vaultButton || 'COFRE // CHAVES'}</span>
          </button>

          {/* CRT effect toggle */}
          <button
            type="button"
            onClick={() => {
              playKeySound();
              onToggleCrt();
            }}
            className={`px-2 py-1 border font-mono text-xs cursor-pointer flex items-center gap-1.5 transition-colors ${
              crtEnabled
                ? 'border-[#ff7a00] text-[#ff7a00] bg-[#1a0f07]'
                : 'border-[#4a3520] text-[#8a6845] hover:text-[#ffca8a]'
            }`}
            title={t.crtTitle}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CRT: {crtEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Audio toggle */}
          <button
            type="button"
            onClick={() => {
              playKeySound();
              onToggleAudio();
            }}
            className={`px-2 py-1 border font-mono text-xs cursor-pointer flex items-center gap-1.5 transition-colors ${
              audioEnabled
                ? 'border-[#4dff9a] text-[#4dff9a] bg-[#0c1a10]'
                : 'border-[#4a3520] text-[#8a6845] hover:text-[#ffca8a]'
            }`}
            title={audioEnabled ? t.soundActiveTooltip : t.soundInactiveTooltip}
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{audioEnabled ? t.soundOn : t.soundOff}</span>
          </button>

          {/* Purge / Clear All Data (Keys, History, Files) */}
          {onPurgeAll && (
            <button
              type="button"
              onClick={() => {
                playKeySound();
                onPurgeAll();
              }}
              className="px-2 py-1 border border-[#ff2233] bg-[#1a070a] hover:bg-[#ff2233] text-[#ff7788] hover:text-white font-mono text-xs cursor-pointer flex items-center gap-1 transition-colors font-bold"
              title={t.purgeTooltip}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.purgeButton || 'LIMPAR DADOS'}</span>
            </button>
          )}

          {/* Close Application Button */}
          {onCloseApp && (
            <button
              type="button"
              onClick={() => {
                playKeySound();
                onCloseApp();
              }}
              className="px-2.5 py-1 border border-[#ff2233] bg-[#22070a] hover:bg-[#ff2233] text-[#ff4455] hover:text-white font-mono text-xs cursor-pointer flex items-center gap-1.5 transition-all font-black shadow-[0_0_8px_rgba(255,34,51,0.3)]"
              title="Encerrar Sistema NERV MAGI HUB (Fechar Aplicativo)"
            >
              <Power className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">FECHAR</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Hazard Warning Stripe */}
      <div className="h-1.5 hazard-stripes w-full border-t border-black" />
    </footer>
  );
};
