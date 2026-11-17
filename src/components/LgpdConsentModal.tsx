// Copyright 2026 Aragornb / MAGI-Hub. Licensed under the Apache License, Version 2.0.
import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, X, CheckCircle2, FileSearch } from 'lucide-react';
import { LgpdConsentRecord, AuditLogEntry } from '../types/nerv';
import { playKeySound } from '../utils/audio';

interface LgpdConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PURPOSES = [
  { id: 'ai_orchestration', label: 'Orquestração Multi-IA (envio de prompts às APIs configuradas pelo operador)' },
  { id: 'local_vault_storage', label: 'Armazenamento criptografado local de chaves e artefatos no cofre NERV' },
  { id: 'autonomous_agents_execution', label: 'Execução de Agentes Autônomos (OpenClaw) com memória local MEMORY.md' },
  { id: 'audit_logging', label: 'Trilha de Auditoria anonimizada (Due Diligence / LGPD Art. 12)' },
];

export const LgpdConsentModal: React.FC<LgpdConsentModalProps> = ({ isOpen, onClose }) => {
  const [consent, setConsent] = useState<LgpdConsentRecord | null>(null);
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>(PURPOSES.map((p) => p.id));
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [savedNotice, setSavedNotice] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [cRes, aRes] = await Promise.all([
        fetch('/api/lgpd/consent'),
        fetch('/api/audit/logs?limit=25'),
      ]);
      const cData = await cRes.json();
      const aData = await aRes.json();
      if (cData.ok && cData.consent) {
        setConsent(cData.consent);
        if (Array.isArray(cData.consent.purposes) && cData.consent.purposes.length > 0) {
          setSelectedPurposes(cData.consent.purposes);
        }
      }
      if (aData.ok && Array.isArray(aData.logs)) {
        setAuditLogs(aData.logs);
      }
    } catch {
      // Offline fallback
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    loadData();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, loadData, onClose]);

  if (!isOpen) return null;

  const togglePurpose = (id: string) => {
    setSelectedPurposes((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSaveConsent = async (accepted: boolean) => {
    playKeySound();
    try {
      const res = await fetch('/api/lgpd/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted, purposes: selectedPurposes }),
      });
      const data = await res.json();
      if (data.ok) {
        setConsent(data.consent);
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2500);
        loadData();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lgpd-modal-title"
    >
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#0b0805] border-2 border-[#4dff9a] shadow-[0_0_25px_rgba(77,255,154,0.2)] flex flex-col font-mono text-[#ffca8a] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#4dff9a]/50 bg-[#071a10] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#4dff9a]" aria-hidden="true" />
            <h2 id="lgpd-modal-title" className="text-sm sm:text-base font-bold text-[#4dff9a]">
              GOVERNANÇA LGPD // CONSENTIMENTO &amp; TRILHA DE AUDITORIA
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel LGPD e Auditoria"
            className="p-1.5 border border-[#ff2233] text-[#ff7788] hover:bg-[#ff2233] hover:text-black cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          <section className="p-3 border border-[#4dff9a]/40 bg-[#0d140f] space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-[#4dff9a]">Termo de Ciência e Consentimento (LGPD - Lei nº 13.709/2018)</h3>
              <span className="text-[11px] px-2 py-0.5 border border-[#4dff9a]/60 text-[#4dff9a]">
                {consent?.accepted ? 'CONSENTIMENTO ATIVO' : 'PENDENTE DE ACEITE'}
              </span>
            </div>
            <p className="text-[#ffd7a8]">
              O MAGI-Hub opera em arquitetura local-first. Chaves de API e dados sensíveis são mascarados nos logs, criptografados em repouso quando persistidos e nunca enviados a servidores de terceiros além dos provedores de IA explicitamente configurados por você.
            </p>
            <div className="space-y-1.5">
              {PURPOSES.map((p) => (
                <label key={p.id} className="flex items-start gap-2 cursor-pointer text-[#ffca8a]">
                  <input
                    type="checkbox"
                    checked={selectedPurposes.includes(p.id)}
                    onChange={() => togglePurpose(p.id)}
                    className="mt-0.5"
                  />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleSaveConsent(true)}
                className="px-3 py-1.5 bg-[#4dff9a] text-black font-bold cursor-pointer hover:bg-[#7bffb5]"
              >
                ACEITAR E REGISTRAR CONSENTIMENTO
              </button>
              <button
                type="button"
                onClick={() => handleSaveConsent(false)}
                className="px-3 py-1.5 border border-[#ff2233] text-[#ff7788] cursor-pointer hover:bg-[#ff2233] hover:text-black"
              >
                REVOGAR CONSENTIMENTO
              </button>
              {savedNotice && (
                <span className="text-[#4dff9a] flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  Registro atualizado na auditoria!
                </span>
              )}
            </div>
          </section>

          <section className="p-3 border border-[#5a422a] bg-[#120d08] space-y-2">
            <h3 className="font-bold text-[#ffca8a] flex items-center gap-1.5">
              <FileSearch className="w-4 h-4 text-[#ff7a00]" aria-hidden="true" />
              Trilha de Auditoria Recente (Dados Anonimizados / Redactados)
            </h3>
            <div className="max-h-56 overflow-y-auto space-y-1.5">
              {auditLogs.length === 0 ? (
                <p className="text-[#b88d5e]">Nenhum evento crítico registrado ainda nesta sessão.</p>
              ) : (
                auditLogs.map((log, idx) => (
                  <div key={`${log.timestamp}-${idx}`} className="p-2 bg-black border border-[#3a2515] text-[11px]">
                    <div className="flex justify-between text-[#b88d5e]">
                      <span>[{log.isoTime}] {log.action} • {log.method} {log.route}</span>
                      <span className="text-[#4dff9a]">HTTP {log.statusCode} • {log.actor}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
