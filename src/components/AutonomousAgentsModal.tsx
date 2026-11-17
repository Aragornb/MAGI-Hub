// Copyright 2026 Aragornb / MAGI-Hub. Licensed under the Apache License, Version 2.0.
import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot,
  Play,
  Pause,
  Trash2,
  Plus,
  X,
  RefreshCw,
  Webhook,
  FileText,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import {
  AutonomousAgent,
  AgentRunRecord,
  AgentTriggerType,
  AgentToolId,
  MagiNodeId,
} from '../types/nerv';
import { playKeySound, playExecuteSound } from '../utils/audio';

interface AutonomousAgentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customKeys: Record<string, string>;
}

const TOOL_OPTIONS: { id: AgentToolId; label: string; desc: string }[] = [
  { id: 'read_vault', label: 'Ler Cofre Local', desc: 'Listar e ler arquivos em nerv_vault_files' },
  { id: 'write_vault', label: 'Gravar no Cofre', desc: 'Salvar relatórios e notas Markdown no workspace do agente' },
  { id: 'update_memory', label: 'Atualizar MEMORY.md', desc: 'Persistir aprendizados locais em Markdown' },
  { id: 'magi_consensus', label: 'Consenso MAGI', desc: 'Consultar outras IAs da matriz MAGI para verificação' },
  { id: 'web_fetch', label: 'Web Fetch (HTTPS)', desc: 'Requisições GET públicas com proteção anti-SSRF' },
];

const MODEL_OPTIONS: { id: MagiNodeId; label: string }[] = [
  { id: 'gemini', label: 'UNIT-02 // Gemini' },
  { id: 'claude', label: 'UNIT-01 // Claude' },
  { id: 'chatgpt', label: 'UNIT-00 // ChatGPT' },
  { id: 'grok', label: 'UNIT-03 // Grok' },
  { id: 'deepseek', label: 'UNIT-04 // DeepSeek' },
];

export const AutonomousAgentsModal: React.FC<AutonomousAgentsModalProps> = ({
  isOpen,
  onClose,
  customKeys,
}) => {
  const [agents, setAgents] = useState<AutonomousAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AutonomousAgent | null>(null);
  const [memoryContent, setMemoryContent] = useState('');
  const [runs, setRuns] = useState<AgentRunRecord[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create form state
  const [name, setName] = useState('');
  const [role, setRole] = useState('Agente Autônomo OpenClaw');
  const [objective, setObjective] = useState('');
  const [modelNode, setModelNode] = useState<MagiNodeId>('gemini');
  const [triggerType, setTriggerType] = useState<AgentTriggerType>('heartbeat');
  const [heartbeatIntervalSec, setHeartbeatIntervalSec] = useState(300);
  const [cronSchedule, setCronSchedule] = useState('@every 30m');
  const [maxSteps, setMaxSteps] = useState(4);
  const [allowedTools, setAllowedTools] = useState<AgentToolId[]>([
    'read_vault',
    'write_vault',
    'update_memory',
  ]);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      if (data.ok) {
        setAgents(data.agents || []);
      } else {
        setError(data.error || 'Falha ao carregar agentes.');
      }
    } catch {
      setError('Servidor Python offline ou inacessível.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAgentDetails = useCallback(async (agent: AutonomousAgent) => {
    setSelectedAgent(agent);
    try {
      const res = await fetch(`/api/agents/${agent.id}/memory`);
      const data = await res.json();
      if (data.ok) {
        setMemoryContent(data.memory || '');
        setRuns(data.runs || []);
      }
    } catch {
      setMemoryContent('');
      setRuns([]);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetchAgents();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, fetchAgents, onClose]);

  if (!isOpen) return null;

  const handleToggleTool = (toolId: AgentToolId) => {
    setAllowedTools((prev) =>
      prev.includes(toolId) ? prev.filter((t) => t !== toolId) : [...prev, toolId]
    );
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !objective.trim()) return;
    playExecuteSound();
    setError(null);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          role,
          objective,
          modelNode,
          triggerType,
          heartbeatIntervalSec,
          cronSchedule,
          maxSteps,
          allowedTools,
          enabled: triggerType === 'heartbeat' || triggerType === 'cron',
          customKeys,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setName('');
        setObjective('');
        setShowCreateForm(false);
        await fetchAgents();
        if (data.agent) loadAgentDetails(data.agent);
      } else {
        setError(data.error || 'Erro ao criar agente.');
      }
    } catch {
      setError('Falha de conexão ao criar agente.');
    }
  };

  const handleToggleAgent = async (agent: AutonomousAgent) => {
    playKeySound();
    try {
      await fetch(`/api/agents/${agent.id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !agent.enabled }),
      });
      await fetchAgents();
    } catch {
      setError('Erro ao alternar estado do agente.');
    }
  };

  const handleRunAgent = async (agent: AutonomousAgent) => {
    playExecuteSound();
    setRunningId(agent.id);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customKeys }),
      });
      const data = await res.json();
      if (!data.ok) setError(data.error || 'Erro na execução.');
      await fetchAgents();
      await loadAgentDetails(agent);
    } catch {
      setError('Falha ao executar agente.');
    } finally {
      setRunningId(null);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    playKeySound();
    try {
      await fetch(`/api/agents/${agentId}`, { method: 'DELETE' });
      if (selectedAgent?.id === agentId) setSelectedAgent(null);
      await fetchAgents();
    } catch {
      setError('Falha ao remover agente.');
    }
  };

  const handleSaveMemory = async () => {
    if (!selectedAgent) return;
    playKeySound();
    try {
      await fetch(`/api/agents/${selectedAgent.id}/memory`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memory: memoryContent }),
      });
    } catch {
      setError('Falha ao salvar MEMORY.md.');
    }
  };

  const copyWebhook = (agent: AutonomousAgent) => {
    const url = `${window.location.origin}/api/agents/${agent.id}/webhook`;
    navigator.clipboard?.writeText(url);
    setCopiedId(agent.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="openclaw-modal-title"
    >
      <div className="w-full max-w-6xl max-h-[92vh] bg-[#0b0805] border-2 border-[#00f0ff] shadow-[0_0_30px_rgba(0,240,255,0.25)] flex flex-col font-mono text-[#ffca8a] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#00f0ff]/60 bg-[#07131a] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Bot className="w-5 h-5 text-[#00f0ff]" aria-hidden="true" />
            <div>
              <h2 id="openclaw-modal-title" className="text-sm sm:text-base font-bold text-[#00f0ff] tracking-wider">
                OPENCLAW GATEWAY // AGENTES AUTÔNOMOS LOCAL-FIRST
              </h2>
              <p className="text-[11px] text-[#b8d8e8]">
                Criação de agentes com Heartbeats, Crons, Webhooks, Memória Markdown (MEMORY.md) e Sandbox de Ferramentas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playKeySound();
                setShowCreateForm((v) => !v);
              }}
              className="px-3 py-1.5 bg-[#00f0ff] text-black font-bold text-xs flex items-center gap-1.5 hover:bg-[#66f7ff] cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>{showCreateForm ? 'VOLTAR' : 'NOVO AGENTE'}</span>
            </button>
            <button
              type="button"
              onClick={fetchAgents}
              aria-label="Atualizar lista de agentes autônomos"
              className="p-1.5 border border-[#00f0ff]/60 text-[#00f0ff] hover:bg-[#00f0ff]/20 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar janela de agentes autônomos"
              className="p-1.5 border border-[#ff2233] text-[#ff7788] hover:bg-[#ff2233] hover:text-black cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Security & Autonomy Disclaimer */}
        <div className="px-4 py-2 bg-[#1a1106] border-b border-[#ff7a00]/40 text-[11px] text-[#ffd7a8] flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#ff7a00] shrink-0" aria-hidden="true" />
          <span>
            Aviso de Governança: Agentes autônomos operam em sandbox local com limite de passos e proteção anti-SSRF. Todas as execuções são registradas na Trilha de Auditoria e exigem supervisão do operador.
          </span>
        </div>

        {error && (
          <div className="px-4 py-2 bg-[#2a080c] border-b border-[#ff2233] text-xs text-[#ff99a4]" role="alert">
            {error}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {showCreateForm ? (
            <form onSubmit={handleCreateAgent} className="lg:col-span-12 space-y-4 bg-[#120d08] border border-[#00f0ff]/50 p-4">
              <h3 className="text-sm font-bold text-[#00f0ff] uppercase">Configurar Novo Agente Autônomo</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="claw-name" className="block text-xs text-[#ffd7a8] mb-1">Nome do Agente *</label>
                  <input
                    id="claw-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Sentinel-Sec"
                    className="w-full px-3 py-2 bg-black border border-[#b88d5e] text-xs text-[#ffca8a]"
                  />
                </div>
                <div>
                  <label htmlFor="claw-role" className="block text-xs text-[#ffd7a8] mb-1">Papel / Especialidade</label>
                  <input
                    id="claw-role"
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-[#b88d5e] text-xs text-[#ffca8a]"
                  />
                </div>
                <div>
                  <label htmlFor="claw-model" className="block text-xs text-[#ffd7a8] mb-1">Unidade MAGI (Modelo)</label>
                  <select
                    id="claw-model"
                    value={modelNode}
                    onChange={(e) => setModelNode(e.target.value as MagiNodeId)}
                    className="w-full px-3 py-2 bg-black border border-[#b88d5e] text-xs text-[#ffca8a]"
                  >
                    {MODEL_OPTIONS.map((m) => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="claw-obj" className="block text-xs text-[#ffd7a8] mb-1">Objetivo & Instruções Autônomas *</label>
                <textarea
                  id="claw-obj"
                  required
                  rows={3}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Ex: Monitorar arquivos do cofre, resumir pendências diárias em Markdown e registrar aprendizados no MEMORY.md."
                  className="w-full px-3 py-2 bg-black border border-[#b88d5e] text-xs text-[#ffca8a]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="claw-trigger" className="block text-xs text-[#ffd7a8] mb-1">Tipo de Gatilho (Gateway)</label>
                  <select
                    id="claw-trigger"
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value as AgentTriggerType)}
                    className="w-full px-3 py-2 bg-black border border-[#b88d5e] text-xs text-[#ffca8a]"
                  >
                    <option value="heartbeat">Heartbeat (Periódico)</option>
                    <option value="cron">Cron (@every / HH:MM)</option>
                    <option value="webhook">Webhook Externo</option>
                    <option value="manual">Manual (Sob Demanda)</option>
                  </select>
                </div>
                {triggerType === 'heartbeat' && (
                  <div>
                    <label htmlFor="claw-hb" className="block text-xs text-[#ffd7a8] mb-1">Intervalo Heartbeat (seg, mín 30s)</label>
                    <input
                      id="claw-hb"
                      type="number"
                      min={30}
                      value={heartbeatIntervalSec}
                      onChange={(e) => setHeartbeatIntervalSec(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-black border border-[#b88d5e] text-xs text-[#ffca8a]"
                    />
                  </div>
                )}
                {triggerType === 'cron' && (
                  <div>
                    <label htmlFor="claw-cron" className="block text-xs text-[#ffd7a8] mb-1">Expressão Cron (@every 30m ou 09:00)</label>
                    <input
                      id="claw-cron"
                      type="text"
                      value={cronSchedule}
                      onChange={(e) => setCronSchedule(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-[#b88d5e] text-xs text-[#ffca8a]"
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="claw-steps" className="block text-xs text-[#ffd7a8] mb-1">Máx. Passos por Ciclo (1-8)</label>
                  <input
                    id="claw-steps"
                    type="number"
                    min={1}
                    max={8}
                    value={maxSteps}
                    onChange={(e) => setMaxSteps(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-black border border-[#b88d5e] text-xs text-[#ffca8a]"
                  />
                </div>
              </div>

              <div>
                <span className="block text-xs text-[#ffd7a8] mb-2">Permissões de Ferramentas (Sandbox):</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {TOOL_OPTIONS.map((tool) => {
                    const checked = allowedTools.includes(tool.id);
                    return (
                      <label
                        key={tool.id}
                        className={`flex items-start gap-2 p-2 border cursor-pointer text-xs ${
                          checked ? 'border-[#00f0ff] bg-[#07202b]' : 'border-[#5a422a] bg-black'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleTool(tool.id)}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="font-bold text-[#ffca8a]">{tool.label}</div>
                          <div className="text-[10px] text-[#b88d5e]">{tool.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-[#b88d5e] text-xs text-[#ffca8a] cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00f0ff] text-black font-bold text-xs cursor-pointer hover:bg-[#66f7ff]"
                >
                  INSTANCIAR AGENTE OPENCLAW
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Left List */}
              <div className="lg:col-span-5 space-y-2.5">
                <h3 className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider">
                  Agentes Registrados ({agents.length})
                </h3>
                {agents.length === 0 ? (
                  <div className="p-4 border border-[#5a422a] bg-[#120d08] text-xs text-[#b88d5e]">
                    Nenhum agente autônomo configurado. Clique em "NOVO AGENTE" para criar um agente estilo OpenClaw.
                  </div>
                ) : (
                  agents.map((ag) => (
                    <div
                      key={ag.id}
                      className={`p-3 border transition-all ${
                        selectedAgent?.id === ag.id
                          ? 'border-[#00f0ff] bg-[#081d26]'
                          : 'border-[#5a422a] bg-[#120d08]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => loadAgentDetails(ag)}
                          className="text-left flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#ffca8a]">{ag.name}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 font-bold ${
                                ag.status === 'RUNNING'
                                  ? 'bg-[#ff7a00] text-black'
                                  : ag.status === 'ERROR'
                                  ? 'bg-[#ff2233] text-white'
                                  : ag.enabled
                                  ? 'bg-[#4dff9a]/20 text-[#4dff9a] border border-[#4dff9a]/50'
                                  : 'bg-[#2a2015] text-[#b88d5e]'
                              }`}
                            >
                              {ag.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#b88d5e] mt-0.5">
                            {ag.modelNode.toUpperCase()} • Gatilho: {ag.triggerType.toUpperCase()} • Ciclos: {ag.runCount}
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRunAgent(ag)}
                            disabled={runningId === ag.id}
                            aria-label={`Executar agente ${ag.name} agora`}
                            title="Executar ciclo agora"
                            className="p-1.5 border border-[#4dff9a] text-[#4dff9a] hover:bg-[#4dff9a] hover:text-black cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleAgent(ag)}
                            aria-label={ag.enabled ? `Pausar agente ${ag.name}` : `Ativar agente ${ag.name}`}
                            title={ag.enabled ? 'Pausar Gateway' : 'Ativar Gateway'}
                            className="p-1.5 border border-[#ff7a00] text-[#ff7a00] hover:bg-[#ff7a00] hover:text-black cursor-pointer"
                          >
                            {ag.enabled ? <Pause className="w-3.5 h-3.5" aria-hidden="true" /> : <Clock className="w-3.5 h-3.5" aria-hidden="true" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAgent(ag.id)}
                            aria-label={`Excluir agente ${ag.name}`}
                            title="Excluir agente"
                            className="p-1.5 border border-[#ff2233] text-[#ff7788] hover:bg-[#ff2233] hover:text-black cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      {ag.lastSummary && (
                        <p className="mt-2 text-[11px] text-[#ffd7a8] line-clamp-2 border-t border-[#3a2515] pt-1.5">
                          {ag.lastSummary}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Right Details: MEMORY.md & Run Traces */}
              <div className="lg:col-span-7 space-y-3">
                {selectedAgent ? (
                  <>
                    <div className="p-3 border border-[#00f0ff]/40 bg-[#0d1114] space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold text-[#00f0ff] flex items-center gap-1.5">
                          <Webhook className="w-4 h-4" aria-hidden="true" />
                          ENDPOINT WEBHOOK ({selectedAgent.id})
                        </span>
                        <button
                          type="button"
                          onClick={() => copyWebhook(selectedAgent)}
                          className="px-2.5 py-1 border border-[#00f0ff] text-[11px] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === selectedAgent.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === selectedAgent.id ? 'COPIADO' : 'COPIAR URL'}</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-[#b8d8e8]">
                        Header obrigatório: <code>X-Agent-Token: {selectedAgent.webhookTokenPreview || '***'}</code>
                      </p>
                    </div>

                    <div className="p-3 border border-[#5a422a] bg-[#120d08] space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor="agent-memory-editor" className="text-xs font-bold text-[#ffca8a] flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-[#ff7a00]" aria-hidden="true" />
                          MEMÓRIA LOCAL-FIRST (MEMORY.md)
                        </label>
                        <button
                          type="button"
                          onClick={handleSaveMemory}
                          className="px-2.5 py-1 bg-[#ff7a00] text-black font-bold text-[11px] cursor-pointer hover:bg-[#ff9a33]"
                        >
                          SALVAR MEMORY.md
                        </button>
                      </div>
                      <textarea
                        id="agent-memory-editor"
                        rows={6}
                        value={memoryContent}
                        onChange={(e) => setMemoryContent(e.target.value)}
                        className="w-full p-2 bg-black border border-[#5a422a] text-xs text-[#ffd7a8] font-mono"
                      />
                    </div>

                    <div className="p-3 border border-[#5a422a] bg-[#120d08] space-y-2">
                      <h4 className="text-xs font-bold text-[#ffca8a]">HISTÓRICO DE EXECUÇÕES ({runs.length})</h4>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {runs.length === 0 ? (
                          <p className="text-xs text-[#b88d5e]">Nenhuma execução registrada ainda.</p>
                        ) : (
                          runs.map((r) => (
                            <div key={r.runId} className="p-2 bg-black border border-[#3a2515] text-[11px]">
                              <div className="flex justify-between text-[#b88d5e]">
                                <span>{r.runId} ({r.triggerSource})</span>
                                <span className={r.status === 'COMPLETED' ? 'text-[#4dff9a]' : 'text-[#ff7788]'}>
                                  {r.status} • {r.durationMs}ms
                                </span>
                              </div>
                              <p className="text-[#ffca8a] mt-1">{r.summary}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6 border border-[#5a422a] bg-[#120d08] text-xs text-[#b88d5e] flex items-center justify-center h-full">
                    Selecione um agente à esquerda para inspecionar seu MEMORY.md, Webhook e histórico de ações autônomas.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
