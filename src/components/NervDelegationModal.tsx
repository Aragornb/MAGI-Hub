import React, { useState } from 'react';
import {
  WorkflowPlan,
  WorkflowStep,
  MagiNodeId,
  MagiNodeConfig,
} from '../types/nerv';
import {
  Layers,
  ArrowRight,
  GitCommit,
  CheckCircle,
  X,
  Play,
  Cpu,
  Sparkles,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { playExecuteSound, playKeySound, playWarningSound } from '../utils/audio';

interface NervDelegationModalProps {
  isOpen: boolean;
  plan: WorkflowPlan | null;
  nodes: MagiNodeConfig[];
  nodeKeyStatus: Record<MagiNodeId, boolean>;
  onClose: () => void;
  onConfirm: (delegatedPlan: WorkflowPlan) => void;
}

export const NervDelegationModal: React.FC<NervDelegationModalProps> = ({
  isOpen,
  plan,
  nodes,
  nodeKeyStatus,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !plan) return null;

  const [steps, setSteps] = useState<WorkflowStep[]>(plan.steps);

  const isPipe = plan.workflowType === 'pipe';

  const handleNodeChange = (stepId: string, newNodeId: MagiNodeId) => {
    playKeySound();
    const targetNode = nodes.find((n) => n.id === newNodeId);
    const nodeName = targetNode
      ? `${targetNode.magiName} (${targetNode.realPlatform})`
      : newNodeId;

    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? {
              ...s,
              assignedNode: newNodeId,
              assignedNodeName: nodeName,
            }
          : s
      )
    );
  };

  const handleStartWorkflow = () => {
    playExecuteSound();
    onConfirm({
      ...plan,
      steps,
      status: 'RUNNING',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-3xl bg-[#090704] border-2 border-[#ff7a00] shadow-[0_0_30px_rgba(255,122,0,0.35)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* CRT Scanline & Grid Effect */}
        <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-10" />

        {/* Tactical Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#170e08] border-b-2 border-[#ff7a00] text-xs font-mono font-bold">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#ff7a00]" />
            <span className="text-[#ff7a00] tracking-wider">
              NERV CENTRAL DOGMA // JANELA DE ATRIBUIÇÃO TÁTICA
            </span>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${
                isPipe
                  ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-[#00f0ff]'
                  : 'border-[#ff7a00] bg-[#ff7a00]/10 text-[#ff7a00]'
              }`}
            >
              {isPipe ? '/PIPE (PIPELINE EM CASCATA)' : '/OTASK (TAREFAS ISOLADAS)'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              playKeySound();
              onClose();
            }}
            className="p-1 text-[#8a6845] hover:text-[#ff2233] cursor-pointer"
            title="Cancelar e fechar janela de atribuição"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Information Banner */}
        <div className="px-4 py-2 bg-[#0d0905] border-b border-[#2d1b0e] text-xs font-mono flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[#ffca8a]">
            <Info className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" />
            <span className="truncate">
              {isPipe
                ? 'Modo Encadeado: A saída de cada etapa alimenta a próxima. Em caso de Timeout, o Circuit Breaker suspenderá o fluxo para economizar tokens.'
                : 'Modo Modular: As tarefas são disparadas de forma independente. Falhas podem ser repetidas individualmente.'}
            </span>
          </div>
          <div className="text-[10px] text-[#8a6845] shrink-0">
            Orquestrador: <span className="text-[#4dff9a] font-bold">{plan.orchestratorName}</span>
          </div>
        </div>

        {/* Original Directive Summary */}
        <div className="p-4 bg-[#060402] border-b border-[#2d1b0e] font-mono text-xs">
          <span className="text-[10px] text-[#7a5a3a] font-bold block mb-1">
            DIRETIVA DO OPERADOR SUBMETIDA À MATRIZ:
          </span>
          <p className="text-white bg-[#0e0a06] p-2.5 border border-[#3a2515] text-xs max-h-24 overflow-y-auto leading-relaxed">
            "{plan.originalPrompt}"
          </p>
        </div>

        {/* Steps List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
          <span className="text-[11px] text-[#ff7a00] font-bold flex items-center gap-1.5 mb-2">
            <GitCommit className="w-3.5 h-3.5" />
            DECOMPOSIÇÃO DE ETAPAS ({steps.length}) — DELEGAÇÃO DE IAs EXECUTORAS:
          </span>

          {steps.map((step, idx) => {
            const assignedConfig = nodes.find((n) => n.id === step.assignedNode);
            const isAvailable = nodeKeyStatus[step.assignedNode];

            return (
              <div
                key={step.id}
                className="p-3 bg-[#0c0805] border border-[#3a2515] hover:border-[#ff7a00]/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
              >
                {/* Step Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-[#170e08] border border-[#ff7a00] text-[#ff7a00] text-[10px] font-bold shrink-0">
                      ETAPA {step.stepIndex}
                    </span>
                    <h4 className="text-white font-bold text-xs truncate">
                      {step.title}
                    </h4>
                  </div>
                  <p className="text-[#a08060] text-[11px] leading-snug line-clamp-2">
                    {step.description}
                  </p>
                </div>

                {/* AI Delegate Selector Dropdown */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] text-[#7a5a3a] font-bold uppercase">
                      IA Delegada
                    </span>
                    {!isAvailable && (
                      <span className="text-[9px] text-[#ff2233] font-bold flex items-center gap-0.5">
                        <ShieldAlert className="w-2.5 h-2.5" /> Chave Ausente
                      </span>
                    )}
                  </div>

                  <select
                    value={step.assignedNode}
                    onChange={(e) => handleNodeChange(step.id, e.target.value as MagiNodeId)}
                    className={`px-2 py-1.5 bg-[#140d08] font-mono text-xs font-bold border outline-none cursor-pointer ${
                      isAvailable
                        ? 'border-[#ff7a00] text-[#ffca8a] focus:ring-1 focus:ring-[#ff7a00]'
                        : 'border-[#ff2233] text-[#ff8888]'
                    }`}
                  >
                    {nodes.map((n) => {
                      const hasKey = nodeKeyStatus[n.id];
                      return (
                        <option
                          key={n.id}
                          value={n.id}
                          className="bg-[#0e0a06] text-white"
                        >
                          {n.magiName} // {n.subName} {!hasKey ? '(SEM CHAVE)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tactical Action Buttons Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#120b06] border-t-2 border-[#ff7a00]">
          <button
            type="button"
            onClick={() => {
              playKeySound();
              onClose();
            }}
            className="px-3 py-1.5 border border-[#3a2515] bg-[#0c0805] text-[#8a6845] hover:text-white hover:border-[#ff2233] font-mono text-xs cursor-pointer transition-all"
          >
            [ESC] CANCELAR OPERAÇÃO
          </button>

          <button
            type="button"
            onClick={handleStartWorkflow}
            className="px-4 py-1.5 border border-[#ff7a00] bg-[#ff7a00] hover:bg-white text-black font-mono text-xs font-bold flex items-center gap-2 cursor-pointer shadow-[0_0_12px_#ff7a00] transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>INICIAR ORQUESTRAÇÃO [{isPipe ? 'EM CASCATA' : 'MODULAR'}]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
