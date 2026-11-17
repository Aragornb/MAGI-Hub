// Copyright 2026 Aragornb / MAGI-Hub. Licensed under the Apache License, Version 2.0.
import React, { useEffect } from 'react';
import { Scale, X, Award, AlertTriangle } from 'lucide-react';

interface LegalCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OSS_CREDITS = [
  { name: 'React & ReactDOM', license: 'MIT License', desc: 'Interface reativa de terminal' },
  { name: 'Vite & Tailwind CSS', license: 'MIT License', desc: 'Build e estilização utilitária' },
  { name: 'Lucide React', license: 'ISC License', desc: 'Iconografia vetorial acessível' },
  { name: 'JSZip & Motion', license: 'MIT License', desc: 'Empacotamento de artefatos e animações' },
  { name: 'Flask & Werkzeug', license: 'BSD-3-Clause', desc: 'Servidor HTTP local Python' },
  { name: 'Cryptography (Fernet)', license: 'Apache-2.0 / BSD', desc: 'Criptografia em repouso' },
  { name: 'ReportLab / python-docx / openpyxl / python-pptx', license: 'BSD / MIT', desc: 'Geração de documentos' },
  { name: 'Google GenAI SDK', license: 'Apache-2.0', desc: 'Integração oficial Gemini' },
];

export const LegalCreditsModal: React.FC<LegalCreditsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-credits-title"
    >
      <div className="w-full max-w-3xl max-h-[90vh] bg-[#0b0805] border-2 border-[#ff7a00] shadow-[0_0_25px_rgba(255,122,0,0.25)] flex flex-col font-mono text-[#ffca8a] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#ff7a00]/50 bg-[#140d06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#ff7a00]" aria-hidden="true" />
            <h2 id="legal-credits-title" className="text-sm sm:text-base font-bold text-[#ff7a00]">
              SOBRE O MAGI-HUB // CRÉDITOS OPEN-SOURCE &amp; DISCLAIMERS
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela de créditos e avisos legais"
            className="p-1.5 border border-[#ff2233] text-[#ff7788] hover:bg-[#ff2233] hover:text-black cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          <section className="p-3 border border-[#ff7a00]/40 bg-[#120d08] space-y-1.5">
            <h3 className="font-bold text-[#ffca8a] flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#ff7a00]" aria-hidden="true" />
              Titularidade e Licenciamento
            </h3>
            <p className="text-[#ffd7a8]">
              <strong>MAGI-Hub (NERV Tactical AI Console)</strong> — Copyright © 2026 Aragornb / MAGI-Hub. Distribuído sob a licença <strong>Apache License 2.0</strong>.
            </p>
            <p className="text-[#b88d5e]">
              Arquitetura de agentes autônomos inspirada nos conceitos open-source do projeto OpenClaw (Gateway, Heartbeats, Webhooks e Memória Local-First em Markdown).
            </p>
          </section>

          <section className="p-3 border border-[#ff2233]/50 bg-[#1a090b] space-y-1.5">
            <h3 className="font-bold text-[#ff99a4] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#ff2233]" aria-hidden="true" />
              Disclaimers de Uso, Métricas e Inteligência Artificial
            </h3>
            <ul className="list-disc pl-4 space-y-1 text-[#ffd7a8]">
              <li>
                Indicadores de taxa de sincronização, percentuais de cota e estimativas de tokens exibidos na interface são <strong>estimativas locais aproximadas</strong> e não substituem o faturamento oficial dos provedores de IA.
              </li>
              <li>
                Respostas geradas por modelos de linguagem e ações executadas por agentes autônomos podem conter imprecisões e <strong>exigem revisão e supervisão humana</strong> antes de uso em produção ou decisões críticas.
              </li>
              <li>
                Em conformidade com a acessibilidade WCAG 2.2 (AA) e LGPD, dados de protótipo/demonstração utilizam exclusivamente registros sintéticos.
              </li>
            </ul>
          </section>

          <section className="p-3 border border-[#5a422a] bg-[#120d08] space-y-2">
            <h3 className="font-bold text-[#ffca8a]">Componentes Open-Source Utilizados (Licenças Permissivas)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {OSS_CREDITS.map((item) => (
                <div key={item.name} className="p-2 bg-black border border-[#3a2515]">
                  <div className="font-bold text-[#ffca8a]">{item.name}</div>
                  <div className="text-[11px] text-[#4dff9a]">{item.license}</div>
                  <div className="text-[10px] text-[#b88d5e]">{item.desc}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
