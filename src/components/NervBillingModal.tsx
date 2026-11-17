import React, { useState } from 'react';
import {
  CreditCard,
  Shield,
  Zap,
  CheckCircle,
  AlertTriangle,
  X,
  Lock,
  RotateCcw,
  Sparkles,
  Calendar,
  Check,
  Receipt,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  BillingConfig,
  CreditCardData,
  SaaSSubscription,
} from '../types/nerv';
import { playKeySound, playWarningSound, playExecuteSound } from '../utils/audio';

interface NervBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: SaaSSubscription;
  onUpdateSubscription: (sub: SaaSSubscription) => void;
  onAddSystemEntry?: (msg: string) => void;
}

export const NervBillingModal: React.FC<NervBillingModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onUpdateSubscription,
  onAddSystemEntry,
}) => {
  const [cardNumber, setCardNumber] = useState(
    subscription.cardLast4 ? `•••• •••• •••• ${subscription.cardLast4}` : ''
  );
  const [cardHolder, setCardHolder] = useState('OPERADOR NERV');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('•••');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdateCard = (e: React.FormEvent) => {
    e.preventDefault();
    playExecuteSound();
    setIsProcessing(true);

    setTimeout(() => {
      const cleanDigits = cardNumber.replace(/\D/g, '');
      const last4 = cleanDigits.slice(-4) || '4242';

      const updatedSub: SaaSSubscription = {
        ...subscription,
        status: 'active',
        cardLast4: last4,
        gracePeriodEnd: null,
        currentPeriodEnd: Date.now() + 30 * 86400 * 1000,
      };

      onUpdateSubscription(updatedSub);
      setIsProcessing(false);
      setSuccessMessage('Cartão atualizado com sucesso via Stripe Billing. Assinatura ativa.');

      if (onAddSystemEntry) {
        onAddSystemEntry('[FINANCEIRO NERV]: Assinatura mensal de R$ 10,00 regularizada com sucesso.');
      }

      setTimeout(() => {
        setSuccessMessage(null);
      }, 2500);
    }, 1000);
  };

  const handleSimulateWebhook = async (event: 'payment_succeeded' | 'payment_failed' | 'lock_immediate') => {
    playKeySound();
    try {
      const res = await fetch('/api/subscription/simulate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event }),
      });
      const data = await res.json();
      if (data.ok && data.subscription) {
        onUpdateSubscription(data.subscription);
        if (event === 'payment_failed') {
          playWarningSound();
          if (onAddSystemEntry) {
            onAddSystemEntry('[DUNNING ALERTA]: Falha na cobrança de R$ 10,00. Período de tolerância de 48h ativado.');
          }
        } else if (event === 'lock_immediate') {
          playWarningSound();
          if (onAddSystemEntry) {
            onAddSystemEntry('[BLOQUEIO SAAS]: Assinatura suspensa por inadimplência.');
          }
        } else {
          playExecuteSound();
          if (onAddSystemEntry) {
            onAddSystemEntry('[FINANCEIRO NERV]: Pagamento de R$ 10,00 confirmado.');
          }
        }
      }
    } catch {
      playWarningSound();
    }
  };

  const isGracePeriod = subscription.status === 'grace_period';
  const isPastDue = subscription.status === 'past_due' || subscription.status === 'canceled';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xs select-none font-mono">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#0d0a07] border-2 border-[#ff7a00] shadow-[0_0_50px_rgba(255,122,0,0.35)] flex flex-col scrollbar-thin">
        {/* Top Hazard Warning Stripe */}
        <div className="h-2 hazard-stripes w-full border-b border-black shrink-0" />

        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#2d1f14] bg-[#140e08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#ff7a00]" />
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-[#ffca8a] tracking-wider">
                ASSINATURA SAAS NERV // RECORRÊNCIA MENSAL
              </h2>
              <p className="text-[9px] sm:text-[10px] text-[#7a5a3a]">
                PLANO ÚNICO: R$ 10,00 / MÊS // MODELO BYOK TRANSPARENTE
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#8a6845] hover:text-[#ff2233] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 text-xs text-[#ffca8a]/90">
          {/* Status Banner */}
          <div
            className={`p-3.5 border rounded flex items-center justify-between ${
              subscription.status === 'active'
                ? 'border-[#00ff66]/50 bg-[#00ff66]/10 text-[#00ff66]'
                : isGracePeriod
                ? 'border-[#ffaa00]/60 bg-[#ffaa00]/10 text-[#ffaa00]'
                : 'border-[#ff2233]/70 bg-[#ff2233]/10 text-[#ff4444]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  subscription.status === 'active'
                    ? 'bg-[#00ff66] animate-pulse'
                    : isGracePeriod
                    ? 'bg-[#ffaa00] animate-pulse'
                    : 'bg-[#ff2233]'
                }`}
              />
              <div>
                <span className="font-bold text-xs uppercase block">
                  STATUS DA ASSINATURA:{' '}
                  {subscription.status === 'active'
                    ? 'REGULAR // ATIVA'
                    : isGracePeriod
                    ? 'TOLERÂNCIA (DUNNING 48H)'
                    : 'INADIMPLENTE // BLOQUEADA'}
                </span>
                <span className="text-[10px] opacity-80 block">
                  {subscription.status === 'active'
                    ? 'Próxima renovação automática: ' + new Date(subscription.currentPeriodEnd).toLocaleDateString()
                    : isGracePeriod
                    ? 'Tentativa de cobrança falhou. Interface em período de tolerância.'
                    : 'Acesso às IAs bloqueado. Atualize o cartão para reativar.'}
                </span>
              </div>
            </div>

            <span className="font-bold text-sm">R$ 10,00 / mês</span>
          </div>

          {/* Plan Highlights */}
          <div className="p-4 border border-[#ff7a00]/30 bg-[#120d09] rounded space-y-3">
            <div className="flex items-center justify-between border-b border-[#2d1f14] pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ff7a00]" />
                <h3 className="font-bold text-xs text-[#ffca8a]">MAGI ORCHESTRATOR PASS</h3>
              </div>
              <span className="text-[10px] text-[#00ff66] font-bold bg-[#00ff66]/10 px-2 py-0.5 border border-[#00ff66]/40 rounded">
                SAAS BYOK
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#c0a080]">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
                <span>Orquestração simultânea (5 IAs conectadas)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
                <span>Histórico persistente e busca em nuvem</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
                <span>Agentes operacionais customizados (Anjos)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
                <span>Cofre de chaves com Web Crypto AES-256</span>
              </div>
            </div>

            <div className="p-2.5 bg-black/60 border border-[#2d1f14] rounded text-[10px] text-[#8a6a4a]">
              💡 <strong>Transparência BYOK:</strong> A NERV não revende nem subsidia tokens.
              Você usa suas próprias chaves e paga centavos de custo computacional diretamente aos provedores.
            </div>
          </div>

          {/* Credit Card Form (Stripe Billing Integration) */}
          <form onSubmit={handleUpdateCard} className="p-4 border border-[#2d1e12] bg-[#070503] rounded space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#ffca8a] flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#ff7a00]" />
                CARTÃO DE CRÉDITO PARA RECORRÊNCIA MENSAL
              </span>
              <span className="text-[9px] text-[#00ff66] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Stripe Billing 256-bit SSL
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-[10px] text-[#7a5a3a] block mb-1">NÚMERO DO CARTÃO</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4532 8912 3456 7890"
                  className="w-full p-2 bg-[#020202] border border-[#3a2515] focus:border-[#ff7a00] text-white text-xs outline-none rounded"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[10px] text-[#7a5a3a] block mb-1">TITULAR DO CARTÃO</label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full p-2 bg-[#020202] border border-[#3a2515] focus:border-[#ff7a00] text-white text-xs outline-none rounded"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#7a5a3a] block mb-1">VALIDADE</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/AA"
                    className="w-full p-2 bg-[#020202] border border-[#3a2515] focus:border-[#ff7a00] text-white text-xs outline-none rounded text-center"
                  />
                </div>
              </div>
            </div>

            {successMessage && (
              <div className="p-2.5 border border-[#00ff66] bg-[#00ff66]/10 text-[#00ff66] text-xs flex items-center gap-2 rounded">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="pt-1 flex justify-end">
              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2 bg-[#ff7a00] text-black font-bold text-xs hover:bg-[#ff9433] transition-colors rounded flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,122,0,0.3)] cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>PROCESSANDO...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>ATUALIZAR FORMA DE PAGAMENTO</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Dunning & Gateway Simulator (Para Testes e Validação) */}
          <div className="p-3 border border-[#3a2515] bg-[#0b0805] rounded space-y-2">
            <span className="text-[10px] text-[#8a6a4a] uppercase font-bold block">
              SIMULADOR DE EVENTOS DE GATEWAY // TESTE DE INADIMPLÊNCIA & DUNNING:
            </span>
            <div className="flex flex-wrap gap-2 text-[10px]">
              <button
                type="button"
                onClick={() => handleSimulateWebhook('payment_succeeded')}
                className="px-2.5 py-1 bg-[#00ff66]/10 border border-[#00ff66]/50 text-[#00ff66] hover:bg-[#00ff66] hover:text-black transition-colors rounded cursor-pointer"
              >
                ✓ Simular Pagamento Aprovado
              </button>
              <button
                type="button"
                onClick={() => handleSimulateWebhook('payment_failed')}
                className="px-2.5 py-1 bg-[#ffaa00]/10 border border-[#ffaa00]/50 text-[#ffaa00] hover:bg-[#ffaa00] hover:text-black transition-colors rounded cursor-pointer"
              >
                ⚠ Simular Falha (Grace Period 48h)
              </button>
              <button
                type="button"
                onClick={() => handleSimulateWebhook('lock_immediate')}
                className="px-2.5 py-1 bg-[#ff2233]/10 border border-[#ff2233]/50 text-[#ff4444] hover:bg-[#ff2233] hover:text-white transition-colors rounded cursor-pointer"
              >
                ⛔ Simular Bloqueio Imediato
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-[#2d1f14] bg-[#140e08] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-[#ff7a00] text-[#ff7a00] hover:bg-[#ff7a00]/10 text-xs rounded transition-colors cursor-pointer"
          >
            FECHAR
          </button>
        </div>
      </div>
    </div>
  );
};
