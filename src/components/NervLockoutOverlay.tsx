import React from 'react';
import { AlertOctagon, CreditCard, ShieldAlert, ArrowRight, RefreshCw } from 'lucide-react';
import { SaaSSubscription } from '../types/nerv';
import { playExecuteSound } from '../utils/audio';

interface NervLockoutOverlayProps {
  isLocked: boolean;
  subscription: SaaSSubscription;
  onOpenBillingModal: () => void;
  onCheckStatus: () => void;
}

export const NervLockoutOverlay: React.FC<NervLockoutOverlayProps> = ({
  isLocked,
  subscription,
  onOpenBillingModal,
  onCheckStatus,
}) => {
  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md select-none font-mono">
      <div className="w-full max-w-lg border-2 border-[#ff2200] bg-[#100505] shadow-[0_0_60px_rgba(255,34,0,0.5)] overflow-hidden">
        {/* Top Danger Hazard Stripe */}
        <div className="h-3 w-full bg-[repeating-linear-gradient(45deg,#ff2200,#ff2200_15px,#000_15px,#000_30px)] border-b border-[#ff2200]" />

        <div className="p-6 text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full border-2 border-[#ff2200] bg-[#ff2200]/10 flex items-center justify-center text-[#ff2200] animate-pulse">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-[#ff5533] uppercase font-bold tracking-widest block">
              [PROTOCOLO DE SEGURANÇA FINANCIAMENTO SAAS]
            </span>
            <h2 className="text-lg font-black text-[#ff8866] tracking-wider">
              ACESSO SUSPENSO // ASSINATURA PENDENTE
            </h2>
            <p className="text-xs text-[#cc7766] max-w-sm mx-auto leading-relaxed">
              A mensalidade recorrente de <strong>R$ 10,00</strong> da suíte MAGI não foi aprovada pelo emissor do cartão.
              As chamadas táticas aos nós de IA foram temporariamente bloqueadas.
            </p>
          </div>

          <div className="p-3 border border-[#ff3300]/40 bg-black/70 rounded text-left text-[11px] space-y-1.5 text-[#e08070]">
            <div className="flex justify-between">
              <span className="text-[#885544]">PLANO:</span>
              <span className="font-bold text-white">{subscription.planName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#885544]">VALOR RECORRENTE:</span>
              <span className="font-bold text-[#ff9988]">R$ 10,00 / mês</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#885544]">STATUS DO GATEWAY:</span>
              <span className="font-bold text-[#ff2200] uppercase">
                {subscription.status === 'past_due' ? 'INADIMPLENTE (DUNNING EXCEDIDO)' : 'CANCELADA'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={() => {
                playExecuteSound();
                onOpenBillingModal();
              }}
              className="px-5 py-2.5 bg-[#ff2200] text-white font-bold text-xs hover:bg-[#ff4422] transition-colors rounded flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,34,0,0.4)]"
            >
              <CreditCard className="w-4 h-4" />
              <span>REGULARIZAR PAGAMENTO (R$ 10,00)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onCheckStatus}
              className="px-4 py-2 border border-[#662211] text-[#aa6655] text-xs hover:text-[#ff8866] hover:border-[#ff4422] transition-colors rounded flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>REVERIFICAR</span>
            </button>
          </div>
        </div>

        {/* Bottom Danger Hazard Stripe */}
        <div className="h-2 w-full bg-[repeating-linear-gradient(-45deg,#ff2200,#ff2200_15px,#000_15px,#000_30px)] border-t border-[#ff2200]" />
      </div>
    </div>
  );
};
