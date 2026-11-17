import React, { useState } from 'react';
import {
  Sparkles,
  Key,
  ShieldCheck,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Zap,
  HelpCircle,
  Check,
  Terminal,
} from 'lucide-react';
import { MagiNodeId } from '../types/nerv';
import { playKeySound, playExecuteSound, playWarningSound } from '../utils/audio';

interface NervOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKey: (provider: MagiNodeId, key: string) => void;
  onLaunchDemoPrompt: (promptText: string) => void;
}

export const NervOnboardingModal: React.FC<NervOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSaveKey,
  onLaunchDemoPrompt,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedProvider, setSelectedProvider] = useState<MagiNodeId>('gemini');
  const [inputKey, setInputKey] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<{
    ok: boolean;
    message: string;
    modelChecked?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleNext = () => {
    playKeySound();
    setStep((prev) => Math.min(4, prev + 1));
  };

  const handlePrev = () => {
    playKeySound();
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleValidateKey = async () => {
    if (!inputKey.trim()) {
      playWarningSound();
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const res = await fetch('/api/vault/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: inputKey.trim(),
        }),
      });
      const data = await res.json();
      setValidationResult(data);
      if (data.ok) {
        playExecuteSound();
        onSaveKey(selectedProvider, inputKey.trim());
      } else {
        playWarningSound();
      }
    } catch (err: any) {
      setValidationResult({
        ok: false,
        message: 'Erro ao conectar ao serviço de verificação NERV.',
      });
      playWarningSound();
    } finally {
      setIsValidating(false);
    }
  };

  const handleStartFirstWin = () => {
    playExecuteSound();
    onClose();
    onLaunchDemoPrompt(
      'Analise a arquitetura de um orquestrador multi-IA e apresente a deliberação com foco em eficiência e segurança.'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-sm select-none">
      <div className="w-full max-w-2xl bg-[#0d0a07] border-2 border-[#ff7a00] shadow-[0_0_50px_rgba(255,122,0,0.35)] font-mono flex flex-col overflow-hidden animate-fade-in">
        {/* Top Hazard Warning Stripe */}
        <div className="h-2 hazard-stripes w-full border-b border-black shrink-0" />

        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#2d1f14] bg-[#140e08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#ff7a00]" />
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-[#ffca8a] tracking-wider">
                GUIA DE INICIALIZAÇÃO // PROTOCOLO DE ONBOARDING BYOK
              </h2>
              <p className="text-[9px] sm:text-[10px] text-[#7a5a3a]">
                PASSO {step} DE 4 // CONFIGURAÇÃO RÁPIDA EM MENOS DE 2 MINUTOS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#ff7a00]/70 hover:text-[#ff7a00] hover:bg-[#ff7a00]/10 border border-transparent hover:border-[#ff7a00]/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-4 border-b border-[#2d1f14] text-[10px] bg-[#0a0705]">
          {[
            { num: 1, title: 'MODELO BYOK' },
            { num: 2, title: 'ESCOLHA IA' },
            { num: 3, title: 'VALIDAR CHAVE' },
            { num: 4, title: 'FIRST WIN' },
          ].map((item) => (
            <div
              key={item.num}
              className={`p-2 text-center border-r border-[#2d1f14] last:border-r-0 flex items-center justify-center gap-1.5 ${
                step === item.num
                  ? 'bg-[#ff7a00]/20 text-[#ffca8a] font-bold border-b-2 border-b-[#ff7a00]'
                  : step > item.num
                  ? 'text-[#00ff66]/70'
                  : 'text-[#554030]'
              }`}
            >
              <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[9px]">
                {step > item.num ? '✓' : item.num}
              </span>
              <span className="hidden sm:inline">{item.title}</span>
            </div>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[65vh] space-y-4 text-xs text-[#ffca8a]/90">
          {/* STEP 1: Explicação do Modelo de Negócios e BYOK */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-3 border border-[#ff7a00]/40 bg-[#ff7a00]/5 rounded">
                <span className="text-[10px] text-[#ff7a00] font-bold tracking-wider block mb-1">
                  [ASSINATURA SAAS ATIVADA // R$ 10,00 / MÊS]
                </span>
                <p className="text-[11px] leading-relaxed text-[#dfb890]">
                  Sua assinatura mensal de <strong>R$ 10,00</strong> financia o acesso à interface tática NERV,
                  ao histórico contínuo em nuvem e ao motor de orquestração simultânea dos supercomputadores MAGI.
                </p>
              </div>

              <div className="p-3 border border-[#00ff66]/40 bg-[#00ff66]/5 rounded space-y-2">
                <div className="flex items-center gap-2 text-[#00ff66] font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>POR QUE BRING YOUR OWN KEY (BYOK)?</span>
                </div>
                <p className="text-[11px] text-[#b0e6c0] leading-relaxed">
                  Diferente de plataformas tradicionais que cobram margens exorbitantes em cima dos tokens, a NERV
                  não intermedia o custo computacional. Você paga centavos diretamente para a OpenAI, Google ou
                  Anthropic, economizando até <strong>85%</strong> no uso diário.
                </p>
                <div className="text-[10px] text-[#70b085] flex items-center gap-1.5 pt-1">
                  <span>🔒 Suas chaves NUNCA são salvas em bancos de dados centrais.</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="p-2 border border-[#2d1f14] bg-[#120d09] text-center">
                  <span className="text-[#ff7a00] font-bold block">1. Conecte</span>
                  <span className="text-[#8a6a4a] text-[10px]">Apenas 1 chave para começar</span>
                </div>
                <div className="p-2 border border-[#2d1f14] bg-[#120d09] text-center">
                  <span className="text-[#00ff66] font-bold block">2. Delibere</span>
                  <span className="text-[#8a6a4a] text-[10px]">Compare modelos lado a lado</span>
                </div>
                <div className="p-2 border border-[#2d1f14] bg-[#120d09] text-center">
                  <span className="text-[#3399ff] font-bold block">3. Economize</span>
                  <span className="text-[#8a6a4a] text-[10px]">Pague apenas o que usar</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Seleção e Deep-Links ("Gemini First") */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 border border-[#3399ff]/40 bg-[#3399ff]/5 rounded">
                <HelpCircle className="w-5 h-5 text-[#3399ff] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[#8ac4ff] text-xs">
                    RECOMENDAÇÃO INICIAL: GOOGLE GEMINI (GRATUITO)
                  </h4>
                  <p className="text-[11px] text-[#a0c5ea] mt-1 leading-relaxed">
                    Para iniciar imediatamente sem custos adicionais, recomendamos obter uma chave no{' '}
                    <strong>Google AI Studio</strong>. É 100% gratuita para testes e gerada em menos de 1 minuto.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-[#7a5a3a] uppercase font-bold block">
                  Escolha o provedor de entrada:
                </span>

                {/* Gemini Card */}
                <div
                  onClick={() => {
                    playKeySound();
                    setSelectedProvider('gemini');
                  }}
                  className={`p-3 border cursor-pointer transition-all flex items-center justify-between ${
                    selectedProvider === 'gemini'
                      ? 'border-[#00ff66] bg-[#00ff66]/10 text-white'
                      : 'border-[#2d1f14] bg-[#120d09] text-[#a08060] hover:border-[#ff7a00]/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00ff66] animate-pulse" />
                    <div>
                      <span className="font-bold text-xs text-[#00ff66]">UNIT-02 // GOOGLE GEMINI</span>
                      <span className="text-[10px] text-[#80d090] block">
                        Cota gratuita disponível no Google AI Studio
                      </span>
                    </div>
                  </div>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-[#00ff66]/20 border border-[#00ff66] text-[#00ff66] hover:bg-[#00ff66] hover:text-black transition-colors rounded"
                  >
                    <span>OBTER CHAVE</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* OpenAI Card */}
                <div
                  onClick={() => {
                    playKeySound();
                    setSelectedProvider('chatgpt');
                  }}
                  className={`p-3 border cursor-pointer transition-all flex items-center justify-between ${
                    selectedProvider === 'chatgpt'
                      ? 'border-[#ff7a00] bg-[#ff7a00]/10 text-white'
                      : 'border-[#2d1f14] bg-[#120d09] text-[#a08060] hover:border-[#ff7a00]/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff7a00]" />
                    <div>
                      <span className="font-bold text-xs text-[#ffca8a]">UNIT-00 // OPENAI (CHATGPT)</span>
                      <span className="text-[10px] text-[#9a7050] block">
                        Modelos GPT-4o e GPT-4o-mini
                      </span>
                    </div>
                  </div>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-[#ff7a00]/20 border border-[#ff7a00] text-[#ff7a00] hover:bg-[#ff7a00] hover:text-black transition-colors rounded"
                  >
                    <span>OBTER CHAVE</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Claude Card */}
                <div
                  onClick={() => {
                    playKeySound();
                    setSelectedProvider('claude');
                  }}
                  className={`p-3 border cursor-pointer transition-all flex items-center justify-between ${
                    selectedProvider === 'claude'
                      ? 'border-[#cc5500] bg-[#cc5500]/10 text-white'
                      : 'border-[#2d1f14] bg-[#120d09] text-[#a08060] hover:border-[#ff7a00]/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#cc5500]" />
                    <div>
                      <span className="font-bold text-xs text-[#e08545]">UNIT-01 // ANTHROPIC (CLAUDE)</span>
                      <span className="text-[10px] text-[#9a7050] block">
                        Modelos Claude 3.5 Sonnet
                      </span>
                    </div>
                  </div>
                  <a
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-[#cc5500]/20 border border-[#cc5500] text-[#ff9050] hover:bg-[#cc5500] hover:text-white transition-colors rounded"
                  >
                    <span>OBTER CHAVE</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Inserção e Healthcheck Ping em Tempo Real */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3 border border-[#2d1f14] bg-[#120d09] space-y-2">
                <span className="text-[10px] text-[#ff7a00] font-bold block">
                  INSIRA A CHAVE DO PROVEDOR: [{selectedProvider.toUpperCase()}]
                </span>
                <p className="text-[11px] text-[#8a6a4a]">
                  Cole a chave de API abaixo. O sistema disparará uma requisição leve de verificação instantânea.
                </p>

                <div className="flex gap-2 pt-1">
                  <input
                    type="password"
                    placeholder={`Cole sua chave ${selectedProvider.toUpperCase()} aqui...`}
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    className="flex-1 bg-black/60 border border-[#ff7a00]/50 text-[#ffca8a] px-3 py-2 text-xs focus:outline-none focus:border-[#00ff66] rounded"
                  />
                  <button
                    type="button"
                    onClick={handleValidateKey}
                    disabled={isValidating || !inputKey.trim()}
                    className="px-4 py-2 bg-[#ff7a00] text-black font-bold text-xs hover:bg-[#ff9433] disabled:opacity-50 transition-colors flex items-center gap-1.5 rounded"
                  >
                    {isValidating ? (
                      <>
                        <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>TESTANDO...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3" />
                        <span>VALIDAR</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Real-time Healthcheck Feedback */}
              {validationResult && (
                <div
                  className={`p-3 border rounded flex items-start gap-2.5 ${
                    validationResult.ok
                      ? 'border-[#00ff66] bg-[#00ff66]/10 text-[#00ff66]'
                      : 'border-[#ff3333] bg-[#ff3333]/10 text-[#ff7777]'
                  }`}
                >
                  {validationResult.ok ? (
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#00ff66]" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#ff3333]" />
                  )}
                  <div className="text-xs">
                    <span className="font-bold block">
                      {validationResult.ok
                        ? 'SISTEMA SINCRONIZADO // CHAVE VÁLIDA'
                        : 'FALHA DE SINCRONIZAÇÃO // CHAVE INVÁLIDA'}
                    </span>
                    <p className="text-[11px] mt-0.5 opacity-90">{validationResult.message}</p>
                    {validationResult.modelChecked && (
                      <span className="text-[10px] mt-1 block opacity-75">
                        Modelo verificado: {validationResult.modelChecked}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: First Win */}
          {step === 4 && (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 mx-auto rounded-full border-2 border-[#00ff66] bg-[#00ff66]/10 flex items-center justify-center text-[#00ff66]">
                <Check className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#ffca8a] tracking-wider">
                  SISTEMA MAGI PRONTO PARA OPERAÇÃO
                </h3>
                <p className="text-xs text-[#a08060] mt-1 max-w-md mx-auto">
                  A chave do seu primeiro nó de IA foi validada e criptografada com sucesso. Você pode adicionar
                  outras IAs a qualquer momento pelo Cofre de Chaves.
                </p>
              </div>

              <div className="p-3 border border-[#ff7a00]/30 bg-[#120d09] max-w-md mx-auto rounded text-left">
                <span className="text-[10px] text-[#ff7a00] font-bold block mb-1">
                  DIRETIVA TÁTICA SUGERIDA PARA PRIMEIRO TESTE:
                </span>
                <p className="text-[11px] text-[#d0a070] italic">
                  "Analise a arquitetura de um orquestrador multi-IA e apresente a deliberação com foco em eficiência e segurança."
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartFirstWin}
                  className="px-6 py-2.5 bg-[#00ff66] text-black font-bold text-xs hover:bg-[#33ff88] transition-all tracking-wider shadow-[0_0_20px_rgba(0,255,102,0.4)] rounded inline-flex items-center gap-2"
                >
                  <Terminal className="w-4 h-4" />
                  <span>EXECUTAR PRIMEIRO COMANDO MAGI</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-3 sm:p-4 border-t border-[#2d1f14] bg-[#140e08] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1}
            className="px-3 py-1.5 border border-[#443020] text-[#8a6a4a] text-xs hover:text-[#ffca8a] hover:border-[#ff7a00] disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1 rounded"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>ANTERIOR</span>
          </button>

          <div className="flex items-center gap-2">
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-1.5 bg-[#ff7a00] text-black font-bold text-xs hover:bg-[#ff9433] transition-colors flex items-center gap-1 rounded"
              >
                <span>PRÓXIMO</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 border border-[#ff7a00] text-[#ff7a00] text-xs hover:bg-[#ff7a00]/10 transition-colors rounded"
              >
                CONCLUIR
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
