import React, { useState } from 'react';
import {
  User,
  Shield,
  CheckCircle,
  AlertTriangle,
  X,
  Lock,
  RotateCcw,
  Sparkles,
  Zap,
  Server,
  FileCheck,
  Trash2,
  CreditCard,
} from 'lucide-react';
import { playKeySound, playWarningSound, playExecuteSound } from '../utils/audio';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  operatorName: string;
  onSaveOperatorName: (name: string) => void;
  onPurgeAll?: () => void;
  onOpenBilling?: () => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  operatorName,
  onSaveOperatorName,
  onPurgeAll,
  onOpenBilling,
}) => {
  const [nameInput, setNameInput] = useState(operatorName || 'Usuário');
  const [activeTab, setActiveTab] = useState<'plan' | 'security' | 'purge'>('plan');
  const [isSaved, setIsSaved] = useState(false);
  const [purgeConfirmed, setPurgeConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    playExecuteSound();
    const final = nameInput.trim() || 'Usuário';
    onSaveOperatorName(final);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleResetName = () => {
    playKeySound();
    setNameInput('Usuário');
    onSaveOperatorName('Usuário');
  };

  const handleExecutePurge = () => {
    playWarningSound();
    if (onPurgeAll) {
      onPurgeAll();
    }
    setPurgeConfirmed(true);
    setTimeout(() => {
      setPurgeConfirmed(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs select-none">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#0a0705] border-2 border-[#ff7a00] shadow-[0_0_40px_rgba(255,122,0,0.35)] flex flex-col font-mono scrollbar-thin">
        {/* Top Hazard Warning Stripe */}
        <div className="h-2 hazard-stripes w-full border-b border-black shrink-0" />

        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 bg-[#140e08] border-b border-[#2d1e12] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#ff7a00]/15 border border-[#ff7a00] text-[#ff7a00]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#ffca8a] tracking-wider">
                NERV // CONTA DO OPERADOR &amp; DIRETIVAS DE SEGURANÇA
              </h2>
              <p className="text-[10px] text-[#7a5a3a]">
                IDENTIFICAÇÃO TÁTICA · PRIVACIDADE TOTAL · ISENÇÃO DE DADOS BANCÁRIOS
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#8a6845] hover:text-[#ff2233] border border-[#3a2515] hover:border-[#ff2233] cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operator Profile Header Card */}
        <div className="p-4 bg-[#0d0905] border-b border-[#26180c] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-[#ff7a00] bg-[#1a0f07] flex items-center justify-center text-[#ff7a00] font-black text-base shadow-[0_0_10px_rgba(255,122,0,0.3)]">
              {operatorName ? operatorName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{operatorName}</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-[#ff7a00]/20 border border-[#ff7a00] text-[#ff7a00] font-bold">
                  LIBERAÇÃO A-17 // LOCAL
                </span>
              </div>
              <span className="text-[11px] text-[#4dff9a]">ESTAÇÃO OPERACIONAL LOCAL (127.0.0.1)</span>
            </div>
          </div>

          {/* Quick Edit Name Form */}
          <form onSubmit={handleSaveName} className="flex items-center gap-1.5">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Nome do operador"
              className="px-2.5 py-1 text-xs bg-[#050403] border border-[#3a2515] focus:border-[#ff7a00] text-white outline-none w-36 sm:w-44 font-mono font-bold"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-[#ff7a00] text-black text-xs font-bold cursor-pointer hover:bg-white transition-colors"
              title="Salvar nome do operador"
            >
              {isSaved ? 'SALVO!' : 'SALVAR'}
            </button>
            <button
              type="button"
              onClick={handleResetName}
              className="p-1 border border-[#3a2515] text-[#8a6845] hover:text-[#ff7a00] cursor-pointer"
              title="Redefinir para 'Usuário'"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 py-2 bg-[#090604] border-b border-[#22160d] flex items-center gap-2 text-xs shrink-0">
          <button
            type="button"
            onClick={() => {
              playKeySound();
              setActiveTab('plan');
            }}
            className={`px-3 py-1 font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'plan'
                ? 'border-[#ff7a00] bg-[#ff7a00]/15 text-[#ffca8a]'
                : 'border-[#3a2515] text-[#7a5a3a] hover:text-[#ffca8a]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#ff7a00]" />
            <span>ACESSO OPERACIONAL</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playKeySound();
              setActiveTab('security');
            }}
            className={`px-3 py-1 font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-[#00f0ff] bg-[#00f0ff]/15 text-[#00f0ff]'
                : 'border-[#3a2515] text-[#7a5a3a] hover:text-[#00f0ff]'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>SEGURANÇA &amp; DADOS BANCÁRIOS</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playKeySound();
              setActiveTab('purge');
            }}
            className={`px-3 py-1 font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'purge'
                ? 'border-[#ff2233] bg-[#ff2233]/15 text-[#ff5566]'
                : 'border-[#3a2515] text-[#7a5a3a] hover:text-[#ff5566]'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 text-[#ff2233]" />
            <span>PURGA DE DADOS</span>
          </button>
        </div>

        {/* Tab 1: Plano Ativo */}
        {activeTab === 'plan' && (
          <div className="p-4 sm:p-5 space-y-4 flex-1">
            <div className="p-4 border-2 border-[#ff7a00] bg-[#120a05] shadow-[0_0_20px_rgba(255,122,0,0.15)] flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-[#ffca8a] tracking-wider">
                    NERV MAGI SYNCHRONIZATION GRID
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-[#4dff9a]/20 border border-[#4dff9a] text-[#4dff9a] font-bold">
                    ACESSO TOTAL ILIMITADO
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-[#8a6845] block">CUSTO DA APLICAÇÃO:</span>
                  <span className="text-base font-black text-[#4dff9a]">R$ 0,00 <span className="text-xs text-[#8a6845]">(BYOK / LOCAL)</span></span>
                </div>
              </div>

              <p className="text-xs text-[#d9a877] leading-relaxed">
                Este sistema opera com licença autônoma local. Não há mensalidades, cobranças ocultas ou renovações. O uso de tokens é processado diretamente junto às provedoras oficiais de IA (OpenAI, Anthropic, Google, xAI e DeepSeek) de acordo com suas próprias chaves de API configuradas no Cofre.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#3a2010] text-xs">
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle className="w-3.5 h-3.5 text-[#4dff9a] shrink-0" />
                  <span>5 IAs integradas simultaneamente</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle className="w-3.5 h-3.5 text-[#4dff9a] shrink-0" />
                  <span>Extração e geração de arquivos em tempo real</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle className="w-3.5 h-3.5 text-[#4dff9a] shrink-0" />
                  <span>Controle tático de contexto e skills Angels</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle className="w-3.5 h-3.5 text-[#4dff9a] shrink-0" />
                  <span>Privacidade estrita em 127.0.0.1</span>
                </div>
              </div>

              {/* Billing and Plan Shortcut Button */}
              {onOpenBilling && (
                <div className="mt-2 p-3 bg-[#170e06] border border-[#ff7a00]/50 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-[#ffca8a]">SISTEMA DE PAGAMENTO &amp; RECARGAS</div>
                    <div className="text-[10px] text-[#8a6845]">
                      Planos Demand, Basic, Pro e Max · Cobrança mensal ou por demanda
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playExecuteSound();
                      onClose();
                      onOpenBilling();
                    }}
                    className="px-3 py-1.5 bg-[#ff7a00] hover:bg-white text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-[0_0_12px_rgba(255,122,0,0.3)]"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>GERENCIAR PLANOS &amp; RECARGAS</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Segurança & Dados Bancários */}
        {activeTab === 'security' && (
          <div className="p-4 sm:p-5 space-y-4 flex-1">
            {/* Security Guarantee Box */}
            <div className="p-4 border-2 border-[#00f0ff]/70 bg-[#06141c] space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#00f0ff]" />
                <span className="font-bold text-sm text-[#00f0ff]">
                  GARANTIA DE SEGURANÇA E PROTEÇÃO FINANCEIRA DO OPERADOR
                </span>
              </div>

              <div className="p-3 bg-[#030b10] border border-[#13303d] space-y-2 text-xs text-[#7eb5cc] leading-relaxed">
                <p>
                  <strong className="text-white">1. ISENÇÃO TOTAL DE DADOS BANCÁRIOS:</strong> O NERV MAGI HUB é uma ferramenta de computação local. O software <strong className="text-[#4dff9a]">NUNCA</strong> solicita, armazena, processa ou transmite números de cartão de crédito, códigos de segurança (CVV), senhas bancárias ou dados de faturamento.
                </p>
                <p>
                  <strong className="text-white">2. MODELO BYOK (BRING YOUR OWN KEY):</strong> Você mantém controle financeiro total dos seus gastos de inferência de IA diretamente nos painéis das provedoras oficiais (OpenAI, Anthropic, Google, xAI e DeepSeek). Nenhuma taxa intermediária é aplicada.
                </p>
                <p>
                  <strong className="text-white">3. TÚNEL LOCAL SEGURO:</strong> Todas as chamadas de API são disparadas diretamente do seu computador para as URLs HTTPS das empresas mantenedoras das IAs. Não existem servidores proxy intermediários ou coletores de telemetria da NERV.
                </p>
              </div>

              {/* Security Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs">
                <div className="flex items-center gap-2 p-2 bg-[#091f2b] border border-[#00f0ff]/40 text-white">
                  <CheckCircle className="w-4 h-4 text-[#00f0ff] shrink-0" />
                  <span>Zero dados de cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-[#091f2b] border border-[#00f0ff]/40 text-white">
                  <CheckCircle className="w-4 h-4 text-[#00f0ff] shrink-0" />
                  <span>Chaves protegidas no Cofre Local</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-[#091f2b] border border-[#00f0ff]/40 text-white">
                  <CheckCircle className="w-4 h-4 text-[#00f0ff] shrink-0" />
                  <span>Comunicação direta via HTTPS oficial</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-[#091f2b] border border-[#00f0ff]/40 text-white">
                  <CheckCircle className="w-4 h-4 text-[#00f0ff] shrink-0" />
                  <span>Sem rastreadores de terceiros</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Purga de Dados de Segurança */}
        {activeTab === 'purge' && (
          <div className="p-4 sm:p-5 space-y-4 flex-1">
            <div className="p-4 border-2 border-[#ff2233]/70 bg-[#140608] space-y-3">
              <div className="flex items-center gap-2 text-[#ff2233] font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-[#ff2233]" />
                <span>PROTOCOLO DE PURGA GERAL // SEGURANÇA MÁXIMA</span>
              </div>

              <p className="text-xs text-[#d9989f] leading-relaxed">
                Caso você deseje transferir este computador, compartilhar o terminal ou remover todas as suas credenciais e histórico de conversas do armazenamento local da máquina, execute a purga abaixo:
              </p>

              <div className="p-3 bg-[#1a070a] border border-[#ff2233]/40 text-xs text-[#ffaaaa] space-y-1">
                <div>• Remove todas as chaves de API salvas no Cofre.</div>
                <div>• Limpa todo o histórico de conversas e registros do terminal.</div>
                <div>• Apaga artefatos e arquivos temporários do cofre de disco.</div>
                <div>• Redefine a identidade do operador para o padrão.</div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-[#3a1518]">
                <span className="text-[11px] text-[#8a6845]">
                  Ação irreversível de segurança tática.
                </span>
                <button
                  type="button"
                  onClick={handleExecutePurge}
                  disabled={purgeConfirmed}
                  className="px-4 py-2 bg-[#ff2233] text-white font-bold text-xs cursor-pointer hover:bg-white hover:text-black transition-all shadow-[0_0_12px_rgba(255,34,51,0.5)]"
                >
                  {purgeConfirmed ? 'PURGA EXECUTADA COM SUCESSO' : 'EXECUTAR PURGA DE SEGURANÇA'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-[#0d0905] border-t border-[#26170b] flex items-center justify-between text-[10px] text-[#7a5a3a] shrink-0">
          <span>NERV CENTRAL DOGMA // DIRETIVAS DE SEGURANÇA E PRIVACIDADE</span>
          <button
            type="button"
            onClick={onClose}
            className="text-[#ff7a00] hover:underline cursor-pointer"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};
