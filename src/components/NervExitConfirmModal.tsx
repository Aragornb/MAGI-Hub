import React from 'react';
import { Power, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { playKeySound, playExecuteSound } from '../utils/audio';

interface NervExitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
  isShuttingDown: boolean;
}

export const NervExitConfirmModal: React.FC<NervExitConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmExit,
  isShuttingDown,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in font-mono select-none">
      <div className="relative w-full max-w-lg bg-[#0d0705] border-2 border-[#ff2233] shadow-[0_0_40px_rgba(255,34,51,0.4)] overflow-hidden">
        {/* Top Warning Hazard Stripe */}
        <div className="h-2 hazard-stripes w-full border-b border-[#ff2233]" />

        {/* Header */}
        <div className="px-4 py-3 bg-[#1e080b] border-b border-[#ff2233]/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#ff2233] animate-pulse" />
            <div>
              <span className="text-[10px] text-[#ff7788] font-bold tracking-widest block uppercase">
                CLASSIFIED // PROTOCOLO DE DESLIGAMENTO
              </span>
              <h2 className="text-base font-black text-white tracking-wider">
                ENCERRAR NERV MAGI HUB
              </h2>
            </div>
          </div>
          {!isShuttingDown && (
            <button
              type="button"
              onClick={() => {
                playKeySound();
                onClose();
              }}
              className="p-1 hover:bg-[#ff2233]/20 text-[#ff7788] hover:text-white transition-colors cursor-pointer"
              title="Cancelar encerramento"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {isShuttingDown ? (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
              <Power className="w-10 h-10 text-[#ff2233] animate-spin" />
              <div className="text-sm font-black text-[#ff2233] tracking-widest uppercase">
                DESATIVANDO SISTEMA NERV MAGI...
              </div>
              <p className="text-[#ff99aa] max-w-sm">
                Finalizando processos em segundo plano, fechando conexões locais e liberando portas.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 p-3 bg-[#170a0d] border border-[#ff2233]/40">
                <AlertTriangle className="w-5 h-5 text-[#ff4455] shrink-0 mt-0.5" />
                <div className="space-y-1 text-[#ffca8a]">
                  <p className="font-bold text-white">
                    CONFIRMAÇÃO DE FECHAMENTO DO TERMINAL
                  </p>
                  <p className="text-[11px] leading-relaxed text-[#c99a7a]">
                    Você está prestes a encerrar a aplicação desktop do <strong className="text-[#ff7a00]">NERV MAGI HUB</strong>. 
                    Todos os 5 nós supercomputadores, conexões de servidor local e janelas ativas serão finalizados com segurança.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-[#0a0504] border border-[#4a2015] text-[10px] text-[#8a6845] space-y-1">
                <div>• Alternativa de atalho no teclado: <strong>CTRL + F4</strong> ou <strong>ALT + F4</strong></div>
                <div>• Suas chaves salvas no cofre e arquivos gerados permanecerão seguros no seu computador.</div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    playKeySound();
                    onClose();
                  }}
                  className="px-4 py-2 border border-[#6b472e] bg-[#140c07] hover:border-[#ff7a00] text-[#ffca8a] hover:text-white transition-colors cursor-pointer font-bold tracking-wider"
                >
                  CANCELAR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playExecuteSound();
                    onConfirmExit();
                  }}
                  className="px-4 py-2 border-2 border-[#ff2233] bg-[#2a070c] hover:bg-[#ff2233] text-[#ff4455] hover:text-white transition-all cursor-pointer font-black flex items-center gap-2 shadow-[0_0_15px_rgba(255,34,51,0.4)] tracking-wider"
                >
                  <Power className="w-4 h-4" />
                  <span>CONFIRMAR ENCERRAMENTO</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Bottom Hazard Stripe */}
        <div className="h-1.5 hazard-stripes w-full border-t border-[#ff2233]" />
      </div>
    </div>
  );
};
