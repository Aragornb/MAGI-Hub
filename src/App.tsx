// Copyright 2026 Aragornb / MAGI-Hub. Licensed under the Apache License, Version 2.0.
import React, { useState, useEffect, useRef } from 'react';
import {
  MagiNodeConfig,
  MagiNodeId,
  TerminalEntry,
  GeneratedFile,
  OperatorCredentials,
  ConversationRecord,
  SupportedLanguage,
  MagiNodeUsage,
  AngelSkill,
  SaaSSubscription,
  DEFAULT_SAAS_SUBSCRIPTION,
  WorkflowPlan,
  WorkflowStep,
  WorkflowMtaskResult,
} from './types/nerv';
import { TRANSLATIONS } from './utils/i18n';
import { NervHeader } from './components/NervHeader';
import { NervBottomBar } from './components/NervBottomBar';
import { TerminalLog } from './components/TerminalLog';
import { TerminalPrompt } from './components/TerminalPrompt';
import { FilesDrawer } from './components/FilesDrawer';
import { HistoryDrawer } from './components/HistoryDrawer';
import { OperatorVaultModal } from './components/OperatorVaultModal';
import { UserAccountModal } from './components/UserAccountModal';
import { NervAlertModal } from './components/NervAlertModal';
import { AngelsModal } from './components/AngelsModal';
import { FileViewerModal } from './components/FileViewerModal';
import { PcBundleModal } from './components/PcBundleModal';
import { NervBillingModal } from './components/NervBillingModal';
import { NervOnboardingModal } from './components/NervOnboardingModal';
import { NervLockoutOverlay } from './components/NervLockoutOverlay';
import { NervExitConfirmModal } from './components/NervExitConfirmModal';
import { NervDelegationModal } from './components/NervDelegationModal';
import { AutonomousAgentsModal } from './components/AutonomousAgentsModal';
import { LgpdConsentModal } from './components/LgpdConsentModal';
import { LegalCreditsModal } from './components/LegalCreditsModal';
import {
  decryptVaultCredentials,
  encryptVaultCredentials,
  purgeVaultCredentials,
} from './utils/vaultCrypto';
import {
  toggleAudio,
  playFileAlertSound,
  playWarningSound,
  playExecuteSound,
  playKeySound,
} from './utils/audio';
import JSZip from 'jszip';

// Initial MAGI nodes: 5 Supercomputers (UNIT-00 to UNIT-04)
const INITIAL_NODES: MagiNodeConfig[] = [
  {
    id: 'chatgpt',
    magiName: 'UNIT-00',
    subName: 'ChatGPT',
    realPlatform: 'ChatGPT',
    color: '#ff7a00',
    borderColor: '#ff7a00',
    glowColor: 'rgba(255, 122, 0, 0.4)',
    active: true,
    status: 'STANDBY',
  },
  {
    id: 'claude',
    magiName: 'UNIT-01',
    subName: 'Claude',
    realPlatform: 'Claude',
    color: '#4dff9a',
    borderColor: '#4dff9a',
    glowColor: 'rgba(77, 255, 154, 0.4)',
    active: true,
    status: 'STANDBY',
  },
  {
    id: 'gemini',
    magiName: 'UNIT-02',
    subName: 'Gemini',
    realPlatform: 'Gemini',
    color: '#b48cff',
    borderColor: '#b48cff',
    glowColor: 'rgba(180, 140, 255, 0.4)',
    active: true,
    status: 'STANDBY',
  },
  {
    id: 'grok',
    magiName: 'UNIT-03',
    subName: 'Grok',
    realPlatform: 'Grok',
    color: '#ff3366',
    borderColor: '#ff3366',
    glowColor: 'rgba(255, 51, 102, 0.4)',
    active: true,
    status: 'STANDBY',
  },
  {
    id: 'deepseek',
    magiName: 'UNIT-04',
    subName: 'DeepSeek',
    realPlatform: 'DeepSeek',
    color: '#00f0ff',
    borderColor: '#00f0ff',
    glowColor: 'rgba(0, 240, 255, 0.4)',
    active: true,
    status: 'STANDBY',
  },
];

const INITIAL_ANGELS: AngelSkill[] = [];

const INITIAL_ENTRIES: TerminalEntry[] = [
  {
    id: 'boot-1',
    type: 'system',
    content: 'NERV CENTRAL DOGMA // INICIALIZAÇÃO DA MATRIZ MAGI CONCLUÍDA.',
    timestamp: new Date().toLocaleTimeString(),
  },
  {
    id: 'boot-2',
    type: 'system',
    content:
      'SUPERCOMPUTADORES INTEGRADOS: UNIT-00 (ChatGPT) · UNIT-01 (Claude) · UNIT-02 (Gemini) · UNIT-03 (Grok) · UNIT-04 (DeepSeek).',
    timestamp: new Date().toLocaleTimeString(),
  },
  {
    id: 'boot-3',
    type: 'system',
    content:
      'CONFIRMAÇÃO DE SEGURANÇA: Chaves de API cadastradas, histórico de conversas e imagens/arquivos foram limpos com sucesso.',
    timestamp: new Date().toLocaleTimeString(),
  },
  {
    id: 'boot-4',
    type: 'system',
    content:
      'MONITORAMENTO DE IAs: Supercomputadores sem chave de API ativa exibem luz vermelha e permanecem bloqueados contra seleção. Insira as chaves em [COFRE // CHAVES] para ativá-los.',
    timestamp: new Date().toLocaleTimeString(),
  },
  {
    id: 'boot-5',
    type: 'system',
    content:
      'MENUS LATERAIS: Exibem apenas as setas centralizadas na janela de contexto. Elas piscam ao receber novos registros até você abri-las.',
    timestamp: new Date().toLocaleTimeString(),
  },
];

export default function App() {
  const [nodes, setNodes] = useState<MagiNodeConfig[]>(INITIAL_NODES);
  const [entries, setEntries] = useState<TerminalEntry[]>(INITIAL_ENTRIES);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [unreadFilesCount, setUnreadFilesCount] = useState<number>(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [unreadConversationsCount, setUnreadConversationsCount] = useState<number>(0);
  const [isWorking, setIsWorking] = useState<boolean>(false);
  const [interactionCount, setInteractionCount] = useState<number>(0);

  // Platform Interface Language: PT-BR (default), ENG, JPN, CHI
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('nerv_magi_language') as SupportedLanguage;
    if (saved && ['PT-BR', 'ENG', 'JPN', 'CHI'].includes(saved)) {
      return saved;
    }
    return 'PT-BR';
  });

  const t = TRANSLATIONS[language];

  const handleSelectLanguage = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    localStorage.setItem('nerv_magi_language', newLang);
    const langMap: Record<SupportedLanguage, string> = {
      'PT-BR': 'pt-BR',
      ENG: 'en',
      JPN: 'ja',
      CHI: 'zh',
    };
    document.documentElement.lang = langMap[newLang] || 'pt-BR';
    addSystemEntry(`[NERV CONFIG] IDIOMA / LANGUAGE ALTERADO: [${newLang}]`);
  };

  // Conversations history state (cleared as requested)
  const [conversations, setConversations] = useState<ConversationRecord[]>(() => {
    localStorage.removeItem('nerv_magi_conversations');
    return [];
  });

  // Tools & Modals
  const [crtEnabled, setCrtEnabled] = useState<boolean>(true);
  const [audioActive, setAudioActive] = useState<boolean>(true);
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);
  const [isPcModalOpen, setIsPcModalOpen] = useState<boolean>(false);
  const [isAlertOpen, setIsAlertOpen] = useState<boolean>(false);
  const [magiUsages, setMagiUsages] = useState<MagiNodeUsage[]>([]);
  const [isTokenLow, setIsTokenLow] = useState<boolean>(false);
  const [isSimulatedLow, setIsSimulatedLow] = useState<boolean>(false);
  const [activeFileViewer, setActiveFileViewer] = useState<GeneratedFile | null>(null);
  const [isUserAccountOpen, setIsUserAccountOpen] = useState<boolean>(false);

  // Tactical Billing SaaS R$ 10,00/mês, Plan Tiers & Lockout Management
  const [isBillingOpen, setIsBillingOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState<boolean>(false);
  const [isShuttingDown, setIsShuttingDown] = useState<boolean>(false);
  const [isSystemTerminated, setIsSystemTerminated] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // AI Orchestrator Agent State (Default: Claude UNIT-01)
  const [orchestratorAgent, setOrchestratorAgent] = useState<MagiNodeId>('claude');

  // Delegation Modal & Active Workflow State (/otask and /pipe)
  const [isDelegationOpen, setIsDelegationOpen] = useState<boolean>(false);
  const [activePlan, setActivePlan] = useState<WorkflowPlan | null>(null);
  const [isAgentsOpen, setIsAgentsOpen] = useState<boolean>(false);
  const [isLgpdOpen, setIsLgpdOpen] = useState<boolean>(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState<boolean>(false);

  const [subscription, setSubscription] = useState<SaaSSubscription>(() => {
    const saved = localStorage.getItem('nerv_magi_saas_subscription');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch {}
    }
    return DEFAULT_SAAS_SUBSCRIPTION;
  });

  const handleUpdateSubscription = (sub: SaaSSubscription) => {
    setSubscription(sub);
    localStorage.setItem('nerv_magi_saas_subscription', JSON.stringify(sub));
  };


  // Angels / Context Control & Skills (Empty by default)
  const [isAngelsOpen, setIsAngelsOpen] = useState<boolean>(false);
  const [angels, setAngels] = useState<AngelSkill[]>(() => {
    const saved = localStorage.getItem('nerv_magi_angels');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  const [activeAngelId, setActiveAngelId] = useState<string | null>(() => {
    return localStorage.getItem('nerv_magi_active_angel') || null;
  });

  const activeAngel = angels.find((a) => a.id === activeAngelId) || null;

  // Select/Deselect active Angel
  const handleSelectActiveAngel = (id: string | null) => {
    setActiveAngelId(id);
    if (id) {
      localStorage.setItem('nerv_magi_active_angel', id);
      const chosen = angels.find((a) => a.id === id);
      if (chosen) {
        addSystemEntry(`[ANGEL ATIVADO]: [${chosen.code}] ${chosen.name}. Diretrizes e base de conhecimento ativas na janela de contexto.`);
      }
    } else {
      localStorage.removeItem('nerv_magi_active_angel');
      addSystemEntry('[ANGEL DESATIVADO]: Janela de contexto operando sem skill adicional.');
    }
  };

  // Save/Update Angel
  const handleSaveAngel = (angel: AngelSkill) => {
    setAngels((prev) => {
      const idx = prev.findIndex((a) => a.id === angel.id);
      let updated: AngelSkill[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = angel;
      } else {
        updated = [angel, ...prev];
      }
      localStorage.setItem('nerv_magi_angels', JSON.stringify(updated));
      return updated;
    });
    addSystemEntry(`[ANGELS] Skill [${angel.code} - ${angel.name}] salva com sucesso.`);
  };

  // Delete Angel
  const handleDeleteAngel = (id: string) => {
    setAngels((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      localStorage.setItem('nerv_magi_angels', JSON.stringify(updated));
      return updated;
    });
    if (activeAngelId === id) {
      handleSelectActiveAngel(null);
    }
    addSystemEntry('[ANGELS] Angel removido do sistema.');
  };

  // Format active Angel context for AI calls
  const getActiveAngelContext = (): string | undefined => {
    if (!activeAngel) return undefined;
    let ctx = `SKILL / ANGEL DE REFERÊNCIA: [${activeAngel.code}] ${activeAngel.name}\n` +
              `OBJETIVO DA DEMANDA: ${activeAngel.description}\n` +
              `DIRETRIZES & INSTRUÇÕES:\n${activeAngel.instructions}\n`;
    if (activeAngel.files && activeAngel.files.length > 0) {
      ctx += `\nBASE DE CONHECIMENTO ANEXADA (${activeAngel.files.length} arquivos):\n`;
      activeAngel.files.forEach((file) => {
        ctx += `--- ARQUIVO: ${file.name} (${(file.size / 1024).toFixed(1)} KB) ---\n${file.content}\n-----------------------------------------\n`;
      });
    }
    return ctx;
  };

  // Server ping status
  const [serverKeysStatus, setServerKeysStatus] = useState({
    gemini: false,
    chatgpt: false,
    claude: false,
    grok: false,
    deepseek: false,
  });

  // Operator credentials (allow editing operatorName, defaulting to 'Usuário')
  const [credentials, setCredentials] = useState<OperatorCredentials>(() => {
    const saved = localStorage.getItem('nerv_magi_credentials');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          operatorName: parsed.operatorName || 'Usuário',
          clearanceCode: parsed.clearanceCode || 'NÍVEL A-17 // OPERADOR',
          openaiKey: parsed.openaiKey || '',
          anthropicKey: parsed.anthropicKey || '',
          geminiKey: parsed.geminiKey || '',
          grokKey: parsed.grokKey || '',
          deepseekKey: parsed.deepseekKey || '',
        };
      } catch {}
    }
    return {
      operatorName: 'Usuário',
      clearanceCode: 'NÍVEL A-17 // OPERADOR',
      openaiKey: '',
      anthropicKey: '',
      geminiKey: '',
      grokKey: '',
      deepseekKey: '',
    };
  });

  // Check backend server ping, load decrypted credentials and check onboarding
  useEffect(() => {
    fetch('/api/ping')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.keys) {
          setServerKeysStatus(data.keys);
        }
      })
      .catch(() => {});

    // Decrypt credentials from Web Crypto AES-GCM
    decryptVaultCredentials().then((creds) => {
      if (creds) {
        setCredentials((prev) => ({
          ...prev,
          ...creds,
        }));
      } else {
        const hasKeys = Boolean(
          credentials.geminiKey || credentials.openaiKey || credentials.anthropicKey
        );
        const onboardingDone = localStorage.getItem('nerv_magi_onboarding_completed');
        if (!hasKeys && !onboardingDone) {
          setIsOnboardingOpen(true);
        }
      }
    });

    // Check SaaS subscription status
    fetch('/api/subscription/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.subscription) {
          setSubscription(data.subscription);
          localStorage.setItem('nerv_magi_saas_subscription', JSON.stringify(data.subscription));
          if (data.warningMessage) {
            addSystemEntry(data.warningMessage);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Save credentials on change with Web Crypto AES-GCM encryption
  const handleSaveCredentials = (creds: OperatorCredentials) => {
    setCredentials(creds);
    encryptVaultCredentials(creds);
    // Synchronize ephemeral keys with backend proxy session
    fetch('/api/vault/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keys: {
          chatgpt: creds.openaiKey,
          claude: creds.anthropicKey,
          gemini: creds.geminiKey,
          grok: creds.grokKey,
          deepseek: creds.deepseekKey,
        },
        persistLocally: false, // Zero-Knowledge: não grava chaves em banco de dados
      }),
    }).catch(() => {});
    addSystemEntry(`Credenciais do Operador [${creds.operatorName || 'Usuário'}] criptografadas via Web Crypto AES-256 e sincronizadas.`);
  };

  // Add helper for terminal logs
  const addSystemEntry = (content: string) => {
    setEntries((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}-${Math.random()}`,
        type: 'system',
        content,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  // Fetch AI token usage and calculate low token status for ALERT beacon
  const fetchUsages = async () => {
    try {
      const res = await fetch('/api/magi/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customKeys: {
            chatgpt: credentials.openaiKey,
            claude: credentials.anthropicKey,
            gemini: credentials.geminiKey,
            grok: credentials.grokKey,
            deepseek: credentials.deepseekKey,
          },
        }),
      });
      const data = await res.json();
      if (data.ok && data.usage) {
        setMagiUsages(data.usage);
        // An AI is considered low on tokens if available percent drops <= 20%
        const anyLow = data.usage.some(
          (u: MagiNodeUsage) => u.isOperant && u.availablePercent <= 20
        );
        setIsTokenLow(isSimulatedLow || anyLow);
        return data.usage as MagiNodeUsage[];
      }
    } catch {}
    return null;
  };

  // Toggle simulated low token state for testing the ALERT button
  const handleToggleSimulatedLow = () => {
    setIsSimulatedLow((prev) => {
      const next = !prev;
      setIsTokenLow(next);
      if (next) {
        playWarningSound();
        addSystemEntry('[ALERTA MAGI] Simulação de tokens baixos ativada: O botão ALERT está piscando em vermelho.');
      } else {
        playKeySound();
        addSystemEntry('[ALERTA MAGI] Simulação desativada.');
      }
      return next;
    });
  };

  // Check token usage periodically and on credential/server changes
  useEffect(() => {
    fetchUsages();
  }, [
    credentials.openaiKey,
    credentials.anthropicKey,
    credentials.geminiKey,
    credentials.grokKey,
    credentials.deepseekKey,
    serverKeysStatus,
  ]);

  // Check available usage percentage & quota for each AI (MELCHIOR, BALTHASAR, CASPER, GROK, DEEPSEEK)
  const handleCheckUsageQuota = async () => {
    try {
      playKeySound();
      const usages = (await fetchUsages()) || magiUsages;
      if (!usages || usages.length === 0) {
        throw new Error('Falha ao recuperar telemetria de cota das IAs');
      }

      // Build tactical NERV ASCII telemetry report
      let report = `${'='.repeat(72)}\n`;
      report += `${t.quotaReportHeader}\n`;
      report += `${t.quotaReportSub}\n`;
      report += `${'='.repeat(72)}\n\n`;

      usages.forEach((u, idx) => {
        const percent = u.availablePercent;
        const totalBlocks = 20;
        const filled = Math.max(0, Math.min(totalBlocks, Math.round((percent / 100) * totalBlocks)));
        const empty = totalBlocks - filled;
        const bar = '█'.repeat(filled) + '░'.repeat(empty);

        const statusTag = u.isOperant
          ? `[${percent.toFixed(1)}% ${t.quotaAvailableLabel}]`
          : `[0.0% ${t.quotaBlockedLabel}]`;

        const keyText =
          u.keySource === 'server'
            ? t.keyActiveServer
            : u.keySource === 'vault'
            ? t.keyActiveVault
            : t.keyMissing;

        report += `[MAGI-${idx + 1}] ${u.nodeName.padEnd(12)} (${u.realPlatform})\n`;
        report += `  » ${bar} ${statusTag}\n`;
        report += `  » ${t.keyStatusLabel.padEnd(20)}: ${keyText}\n`;
        report += `  » ${t.requestsExecuted.padEnd(20)}: ${u.requestsCount}\n`;
        if (u.isOperant) {
          const remainingTokens = Math.max(0, u.quotaLimitTokens - u.tokensUsed);
          report += `  » ${t.tokensConsumedRemaining.padEnd(20)}: ${u.tokensUsed.toLocaleString()} / ~${remainingTokens.toLocaleString()}\n`;
          report += `  » ${t.syncRateLabel.padEnd(20)}: ${u.syncRate}% [LATÊNCIA: ${u.latencyMs || 210}ms]\n`;
        } else {
          report += `  » INSTRUÇÃO            : Insira sua chave no [COFRE // CHAVES] para liberar\n`;
        }
        report += '\n';
      });

      report += `${'='.repeat(72)}\n`;
      report += `ℹ ${t.quotaAdvice}\n`;
      report += `${'='.repeat(72)}`;

      setEntries((prev) => [
        ...prev,
        {
          id: `quota-${Date.now()}`,
          type: 'diagnostic',
          content: report,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err: any) {
      playWarningSound();
      addSystemEntry(`[ERRO DE TELEMETRIA]: ${err.message}`);
    }
  };

  // Compute whether each AI node has an operant API key
  const nodeKeyStatus: Record<MagiNodeId, boolean> = {
    chatgpt: Boolean(credentials.openaiKey?.trim() || serverKeysStatus.chatgpt),
    claude: Boolean(credentials.anthropicKey?.trim() || serverKeysStatus.claude),
    gemini: Boolean(credentials.geminiKey?.trim() || serverKeysStatus.gemini),
    grok: Boolean(credentials.grokKey?.trim() || serverKeysStatus.grok),
    deepseek: Boolean(credentials.deepseekKey?.trim() || serverKeysStatus.deepseek),
  };

  // Automatically keep inactive any node without an operant key
  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) => {
        const isOperant = Boolean(
          n.id === 'chatgpt'
            ? credentials.openaiKey?.trim() || serverKeysStatus.chatgpt
            : n.id === 'claude'
            ? credentials.anthropicKey?.trim() || serverKeysStatus.claude
            : n.id === 'gemini'
            ? credentials.geminiKey?.trim() || serverKeysStatus.gemini
            : n.id === 'grok'
            ? credentials.grokKey?.trim() || serverKeysStatus.grok
            : credentials.deepseekKey?.trim() || serverKeysStatus.deepseek
        );
        return {
          ...n,
          active: isOperant ? n.active : false,
        };
      })
    );
  }, [
    credentials.openaiKey,
    credentials.anthropicKey,
    credentials.geminiKey,
    credentials.grokKey,
    credentials.deepseekKey,
    serverKeysStatus,
  ]);

  // Regra de Fallback Automático do Orquestrador (Regra de Negócio 1):
  // Se o Claude estiver inativo ou sem chave, seleciona automaticamente a IA ativa na sessão do usuário
  useEffect(() => {
    if (orchestratorAgent === 'claude' && !nodeKeyStatus.claude) {
      const activeFallback = nodes.find((n) => n.id !== 'claude' && n.active && nodeKeyStatus[n.id]);
      if (activeFallback) {
        setOrchestratorAgent(activeFallback.id);
        addSystemEntry(
          `[FALLBACK AUTOMÁTICO DE ORQUESTRADOR]: Indisponibilidade detectada no Claude (UNIT-01). Orquestrador alterado automaticamente para [${activeFallback.magiName} (${activeFallback.subName})].`
        );
      }
    }
  }, [nodeKeyStatus, orchestratorAgent, nodes]);

  // Toggle active node (blocked if no operant API key)
  const handleToggleNode = (id: MagiNodeId) => {
    if (!nodeKeyStatus[id]) {
      playWarningSound();
      addSystemEntry(
        `AVISO: [${id.toUpperCase()}] não pode ser selecionado sem chave de API operante. Insira a chave no [COFRE // CHAVES].`
      );
      return;
    }
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, active: !n.active } : n))
    );
  };

  // Toggle Audio
  const handleToggleAudio = () => {
    const next = toggleAudio();
    setAudioActive(next);
  };

  // Toggle CRT effect
  const handleToggleCrt = () => {
    setCrtEnabled((prev) => !prev);
  };

  // Drawer open toggle (clears unread flashing!)
  const handleToggleDrawer = () => {
    setIsDrawerOpen((prev) => {
      const next = !prev;
      if (next) {
        setUnreadFilesCount(0);
      }
      return next;
    });
  };

  // History Drawer toggle (clears unread flashing!)
  const handleToggleHistory = () => {
    setIsHistoryOpen((prev) => {
      const next = !prev;
      if (next) {
        setUnreadConversationsCount(0);
      }
      return next;
    });
  };

  // Clear all conversations history
  const handleClearHistory = () => {
    setConversations([]);
    localStorage.removeItem('nerv_magi_conversations');
    addSystemEntry('Histórico de conversas apagado do armazenamento local.');
  };

  // Delete single conversation record
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      localStorage.setItem('nerv_magi_conversations', JSON.stringify(updated));
      return updated;
    });
  };

  // Load a conversation into the central terminal view
  const handleLoadConversationToTerminal = (record: ConversationRecord) => {
    setEntries((prev) => [
      ...prev,
      {
        id: `loaded-banner-${Date.now()}`,
        type: 'system',
        content: `=======================================================\n` +
          `[CONVERSA CARREGADA DO HISTÓRICO: ${record.scopeLabel}]\n` +
          `REGISTRO: ${record.timeFormatted}\n` +
          `=======================================================`,
        timestamp: new Date().toLocaleTimeString(),
      },
      {
        id: `loaded-usr-${Date.now()}`,
        type: 'user',
        content: record.prompt,
        timestamp: record.timeFormatted,
      },
      ...record.responses.map((resp) => ({
        id: `loaded-resp-${resp.nodeId}-${Date.now()}-${Math.random()}`,
        type: (resp.status === 'ERROR' ? 'error' : 'assistant') as 'assistant' | 'error',
        nodeId: resp.nodeId,
        nodeName: resp.nodeName,
        content: resp.text,
        status: resp.status,
        timestamp: record.timeFormatted,
      })),
      ...(record.consensus
        ? [
            {
              id: `loaded-consensus-${Date.now()}`,
              type: 'consensus' as const,
              status: record.consensus,
              content: `Resultado de consenso salvo do registro: ${record.consensus}`,
              timestamp: record.timeFormatted,
            },
          ]
        : []),
    ]);
    addSystemEntry(`Conversa carregada no terminal principal.`);
  };

  // Receive and register generated files
  const registerNewFiles = (newFiles: GeneratedFile[]) => {
    if (!newFiles || newFiles.length === 0) return;

    setFiles((prev) => {
      const existingIds = new Set(prev.map((f) => f.id));
      const fresh = newFiles.filter((f) => !existingIds.has(f.id));
      return [...fresh, ...prev];
    });

    if (!isDrawerOpen) {
      setUnreadFilesCount((prev) => prev + newFiles.length);
      playFileAlertSound();
    }
  };

  // Download single file with user location choice (supports code, images, and converted PDF/Word/Excel documents)
  const handleDownloadFile = async (file: GeneratedFile) => {
    try {
      playExecuteSound();
      const fileName = file.name || `nerv_artifact_${Date.now()}.txt`;
      let fileBlob: Blob | null = null;

      // 1. Fetch real binary content from server or data URL
      const contentStr = typeof file.content === 'string' ? file.content : '';

      if (contentStr.startsWith('/api/vault/file/') || contentStr.startsWith('/api/vault/image/')) {
        try {
          const res = await fetch(contentStr);
          if (res.ok) fileBlob = await res.blob();
        } catch (fetchErr) {
          console.warn('Falha no fetch direto do cofre:', fetchErr);
        }
      } else if (contentStr.startsWith('http://') || contentStr.startsWith('https://')) {
        try {
          const res = await fetch(contentStr);
          if (res.ok) fileBlob = await res.blob();
        } catch (fetchErr) {
          console.warn('Falha no fetch da URL externa:', fetchErr);
        }
      } else if (contentStr.startsWith('data:')) {
        try {
          const res = await fetch(contentStr);
          fileBlob = await res.blob();
        } catch {}
      }

      // If not fetched yet, attempt to fetch via file_id from download API
      if (!fileBlob && file.id) {
        try {
          const res = await fetch(`/api/files/${encodeURIComponent(file.id)}/download`);
          if (res.ok) fileBlob = await res.blob();
        } catch {}
      }

      // Fallback: create blob from content string
      if (!fileBlob) {
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        const mimeMap: Record<string, string> = {
          pdf: 'application/pdf',
          docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          png: 'image/png',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          json: 'application/json',
          html: 'text/html;charset=utf-8',
          js: 'application/javascript;charset=utf-8',
          py: 'text/x-python;charset=utf-8',
          txt: 'text/plain;charset=utf-8',
        };
        const mime = mimeMap[ext] || 'text/plain;charset=utf-8';
        fileBlob = new Blob([file.content], { type: mime });
      }

      // TIER 1: Native browser File System Access API (Operator chooses save folder)
      if ('showSaveFilePicker' in window && fileBlob) {
        try {
          const ext = fileName.split('.').pop()?.toLowerCase() || 'txt';
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [{
              description: `Arquivo ${ext.toUpperCase()}`,
              accept: { [fileBlob.type || 'application/octet-stream']: [`.${ext}`] },
            }],
          });
          const writable = await handle.createWritable();
          await writable.write(fileBlob);
          await writable.close();
          addSystemEntry(`[ARQUIVO SALVO]: "${fileName}" salvo com sucesso no local selecionado.`);
          return;
        } catch (pickerErr: any) {
          if (pickerErr.name === 'AbortError') {
            return; // Operator intentionally cancelled the save dialog
          }
        }
      }

      // TIER 2: Native Windows Save Dialog via Server (ctypes comdlg32.GetSaveFileNameW)
      try {
        const serverRes = await fetch('/api/files/save-dialog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_id: file.id,
            name: fileName,
            content: file.content,
          }),
        });
        const data = await serverRes.json();
        if (data.ok && data.saved_path) {
          addSystemEntry(`[ARQUIVO SALVO]: "${fileName}" gravado no disco em: ${data.saved_path}`);
          return;
        } else if (data.cancelled) {
          return;
        }
      } catch (srvErr) {
        console.warn('Diálogo do servidor indisponível:', srvErr);
      }

      // TIER 3: Browser Anchor Download Fallback
      if (fileBlob) {
        const url = URL.createObjectURL(fileBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        addSystemEntry(`[DOWNLOAD]: "${fileName}" transferido para o computador.`);
      }
    } catch (err: any) {
      playWarningSound();
      addSystemEntry(`[ERRO NO DOWNLOAD]: ${err.message}`);
    }
  };

  // Download all files as ZIP
  const handleDownloadAllZip = async () => {
    if (files.length === 0) return;
    try {
      const zip = new JSZip();
      const folder = zip.folder('nerv_magi_files');
      files.forEach((f) => {
        folder?.file(`${f.provider}/${f.name}`, f.content);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'NERV_MAGI_ALL_ARTIFACTS.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      addSystemEntry(`Erro ao compactar arquivos: ${e.message}`);
    }
  };

  // Clear all generated files and images
  const handleClearFiles = async () => {
    setFiles([]);
    setUnreadFilesCount(0);
    localStorage.removeItem('nerv_magi_files');
    localStorage.removeItem('nerv_magi_images');
    try {
      await fetch('/api/clear-all', { method: 'POST' });
    } catch {}
    addSystemEntry('Cofre de arquivos e imagens esvaziado com sucesso.');
  };

  // Complete purge of API keys, conversation history, and generated files/images
  const handlePurgeAllData = async () => {
    const clearedCreds: OperatorCredentials = {
      operatorName: 'Usuário',
      clearanceCode: 'NÍVEL A-17 // OPERADOR',
      openaiKey: '',
      anthropicKey: '',
      geminiKey: '',
      grokKey: '',
      deepseekKey: '',
    };
    setCredentials(clearedCreds);
    purgeVaultCredentials();
    localStorage.removeItem('nerv_magi_credentials');
    localStorage.removeItem('nerv_magi_conversations');
    localStorage.removeItem('nerv_magi_history');
    localStorage.removeItem('nerv_magi_files');
    localStorage.removeItem('nerv_magi_images');

    setConversations([]);
    setUnreadConversationsCount(0);
    setFiles([]);
    setUnreadFilesCount(0);

    try {
      await fetch('/api/vault/purge', { method: 'POST' });
    } catch {}

    playExecuteSound();
    setEntries([
      {
        id: `purge-${Date.now()}`,
        type: 'system',
        content:
          '=======================================================\n' +
          'NERV CENTRAL DOGMA // PURGA GERAL CONCLUÍDA\n' +
          '=======================================================\n' +
          '✔ Chaves de API cadastradas: LIMPAS (redefinidas para vazio)\n' +
          '✔ Nome do Usuário: REDEFINIDO PARA [Usuário]\n' +
          '✔ Histórico de conversas: LIMPO (todas as sessões excluídas)\n' +
          '✔ Arquivos e imagens gerados: LIMPOS (cofre esvaziado)\n' +
          'As IAs sem chave de API retornaram ao status de bloqueio com luz vermelha.',
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  // Download local PC standalone bundle
  const handleDownloadPcBundle = () => {
    const link = document.createElement('a');
    link.href = '/api/download-pc-bundle';
    link.setAttribute('download', 'NERV_MAGI_HUB_PC_BUNDLE.zip');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Close Application and Clean Shutdown Handler
  const handleConfirmExit = async () => {
    setIsShuttingDown(true);
    playExecuteSound();
    addSystemEntry('[NERV SHUTDOWN] PROTOCOLO DE DESLIGAMENTO INICIADO. Fechando janelas e encerrando supercomputadores...');

    try {
      await fetch('/api/system/exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.log('Servidor finalizado.');
    }

    try {
      window.close();
    } catch {}

    setTimeout(() => {
      setIsShuttingDown(false);
      setIsExitModalOpen(false);
      setIsSystemTerminated(true);
    }, 1000);
  };

  // Main command submission handler
  const handlePromptSubmit = async (text: string) => {
    setInteractionCount((prev) => prev + 1);
    const trimmed = text.trim();

    // Intercept tactical slash commands
    if (trimmed.startsWith('/')) {
      const parts = trimmed.split(' ');
      const cmd = parts[0].toLowerCase();
      const arg = parts.slice(1).join(' ');

      if (cmd === '/clear') {
        setEntries([
          {
            id: `clr-${Date.now()}`,
            type: 'system',
            content: 'BUFFER DO TERMINAL LIMPO PELO OPERADOR.',
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        return;
      }

      if (cmd === '/purge' || cmd === '/reset' || cmd === '/limpar') {
        await handlePurgeAllData();
        return;
      }

      if (
        cmd === '/quota' ||
        cmd === '/usage' ||
        cmd === '/uso' ||
        cmd === '/porcentagem' ||
        cmd === '/consumo' ||
        cmd === '/status' ||
        cmd === '/limite'
      ) {
        await handleCheckUsageQuota();
        return;
      }

      if (cmd === '/alert' || cmd === '/alerta') {
        setIsAlertOpen(true);
        return;
      }

      // Angel context control & skill command (/angel)
      if (cmd === '/angel' || cmd === '/angels') {
        const cleanArg = (arg || '').trim();
        if (!cleanArg || cleanArg.toLowerCase() === 'menu' || cleanArg.toLowerCase() === 'list' || cleanArg.toLowerCase() === 'ajuda' || cleanArg.toLowerCase() === 'painel') {
          setIsAngelsOpen(true);
          const activeText = activeAngel ? `[${activeAngel.code}] ${activeAngel.name}` : 'Nenhum Angel ativo (modo padrão)';
          addSystemEntry(
            `======================================================\n` +
            `      NERV ANGELS // CONTROLE DE CONTEXTO & SKILLS\n` +
            `======================================================\n` +
            `• Status atual    : ${activeText}\n` +
            `• Total registrado: ${angels.length} skills disponíveis.\n` +
            `• Uso rápido:\n` +
            `   - /angel <nome/código> : Ativa o Angel diretamente\n` +
            `   - /angel off           : Desativa a skill atual\n` +
            `   - /angel               : Abre o painel completo de edição e base de arquivos\n` +
            `Abrindo painel NERV Angels...`
          );
          return;
        }

        if (cleanArg.toLowerCase() === 'off' || cleanArg.toLowerCase() === 'none' || cleanArg.toLowerCase() === 'desativar') {
          handleSelectActiveAngel(null);
          return;
        }

        // Search for angel by code or name
        const q = cleanArg.toLowerCase();
        const found = angels.find(
          (a) => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)
        );

        if (found) {
          handleSelectActiveAngel(found.id);
        } else {
          addSystemEntry(
            `[ANGELS] Nenhum Angel encontrado com o termo "${cleanArg}".\n` +
            `Angels cadastrados: ${angels.map((a) => `[${a.code}] ${a.name}`).join(' · ')}\n` +
            `Abrindo painel Angels para configuração...`
          );
          setIsAngelsOpen(true);
        }
        return;
      }

      if (cmd === '/lang' || cmd === '/idioma') {
        const target = (arg || '').toUpperCase();
        if (['PT-BR', 'ENG', 'JPN', 'CHI'].includes(target)) {
          handleSelectLanguage(target as SupportedLanguage);
        } else {
          addSystemEntry(`Idiomas disponíveis: PT-BR, ENG, JPN, CHI. Exemplo: /lang ENG`);
        }
        return;
      }

      if (cmd === '/help') {
        setEntries((prev) => [
          ...prev,
          {
            id: `help-${Date.now()}`,
            type: 'system',
            content: `======================================================\n` +
              `           NERV MAGI HUB // DIRETIVAS TÁTICAS\n` +
              `======================================================\n` +
              `• Texto livre     : Transmite simultaneamente para todas as 5 UNITs ativas\n` +
              `• /angel          : Abre o menu de controle de contexto Angels (skills e base de conhecimento)\n` +
              `• /angel <nome>   : Ativa skill Angel de referência para as interações da janela de contexto\n` +
              `• /angel off      : Desativa skill atual (retorna à operação padrão livre)\n` +
              `• /quota          : Verifica a porcentagem disponível de uso de cada IA\n` +
              `• /alert          : Abre o monitor ALERT com os níveis de consumo das IAs\n` +
              `• /mtask <txt>    : Disparo simultâneo com Gather resiliente e síntese do Orquestrador\n` +
              `• /otask <txt>    : Decomposição de tarefas isoladas, atribuição manual de IAs e repetição\n` +
              `• /pipe <txt>     : Pipeline em cascata com encadeamento de artefatos e Circuit Breaker\n` +
              `• /all <texto>    : Transmissão explícita para todas as 5 UNITs (UNIT-00 a UNIT-04)\n` +
              `• /unit00 <txt>   : Consulta exclusiva à UNIT-00 (ChatGPT)\n` +
              `• /unit01 <txt>   : Consulta exclusiva à UNIT-01 (Claude)\n` +
              `• /unit02 <txt>   : Consulta exclusiva à UNIT-02 (Gemini)\n` +
              `• /unit03 <txt>   : Consulta exclusiva à UNIT-03 (Grok)\n` +
              `• /unit04 <txt>   : Consulta exclusiva à UNIT-04 (DeepSeek)\n` +
              `• /user           : Abre o menu do operador (plano ativo, pagamentos e cancelamento)\n` +
              `• /keys           : Abre o cofre exclusivo de chaves de API das UNITs\n` +
              `• /lang <idioma>  : Alterna idioma (PT-BR, ENG, JPN, CHI)\n` +
              `• /purge          : Limpa todas as chaves de API, histórico e arquivos\n` +
              `• /clear          : Limpa as mensagens exibidas no terminal\n` +
              `• /sound          : Alterna sintetizador sonoro retrô\n` +
              `• /crt            : Alterna linhas de varredura CRT de fósforo\n` +
              `======================================================`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        return;
      }

      if (cmd === '/user' || cmd === '/usuario' || cmd === '/conta' || cmd === '/plano' || cmd === '/assinatura') {
        setIsUserAccountOpen(true);
        return;
      }

      if (cmd === '/keys') {
        setIsVaultOpen(true);
        return;
      }

      if (cmd === '/sound') {
        handleToggleAudio();
        addSystemEntry(`Sintetizador sonoro: ${!audioActive ? 'ATIVADO' : 'DESATIVADO'}`);
        return;
      }

      if (cmd === '/crt') {
        handleToggleCrt();
        addSystemEntry(`Filtro de linhas CRT: ${!crtEnabled ? 'ATIVADO' : 'DESATIVADO'}`);
        return;
      }

      // AI Orchestration: Multiple Responses Flow with Partial Gather (/mtask)
      if (cmd === '/mtask') {
        const cleanPrompt = (arg || '').trim();
        if (!cleanPrompt) {
          addSystemEntry('AVISO: Formato inválido. Uso correto: /mtask <diretiva do operador>');
          return;
        }
        await executeMtaskWorkflow(cleanPrompt);
        return;
      }

      // AI Orchestration: Isolated Modular Tasks with Delegation Window (/otask)
      if (cmd === '/otask') {
        const cleanPrompt = (arg || '').trim();
        if (!cleanPrompt) {
          addSystemEntry('AVISO: Formato inválido. Uso correto: /otask <diretiva do operador>');
          return;
        }
        await planWorkflow('otask', cleanPrompt);
        return;
      }

      // AI Orchestration: Cascading Sequential Pipeline with Circuit Breaker (/pipe)
      if (cmd === '/pipe') {
        const cleanPrompt = (arg || '').trim();
        if (!cleanPrompt) {
          addSystemEntry('AVISO: Formato inválido. Uso correto: /pipe <diretiva do operador>');
          return;
        }
        await planWorkflow('pipe', cleanPrompt);
        return;
      }

      if (cmd === '/all' && arg) {
        await executeBroadcast(arg);
        return;
      }

      // UNIT-00 (ChatGPT)
      if ((cmd === '/unit00' || cmd === '/unit-00' || cmd === '/unit0' || cmd === '/chatgpt' || cmd === '/melchior') && arg) {
        await executeSingleNode('chatgpt', arg);
        return;
      }

      // UNIT-01 (Claude)
      if ((cmd === '/unit01' || cmd === '/unit-01' || cmd === '/unit1' || cmd === '/claude' || cmd === '/balthasar') && arg) {
        await executeSingleNode('claude', arg);
        return;
      }

      // UNIT-02 (Gemini)
      if ((cmd === '/unit02' || cmd === '/unit-02' || cmd === '/unit2' || cmd === '/gemini' || cmd === '/casper' || cmd === '/caspar') && arg) {
        await executeSingleNode('gemini', arg);
        return;
      }

      // UNIT-03 (Grok)
      if ((cmd === '/unit03' || cmd === '/unit-03' || cmd === '/unit3' || cmd === '/grok') && arg) {
        await executeSingleNode('grok', arg);
        return;
      }

      // UNIT-04 (DeepSeek)
      if ((cmd === '/unit04' || cmd === '/unit-04' || cmd === '/unit4' || cmd === '/deepseek') && arg) {
        await executeSingleNode('deepseek', arg);
        return;
      }
    }

    // Default: Broadcast to all active nodes simultaneously
    await executeBroadcast(trimmed);
  };

  // =========================================================================
  // NERV AI ORCHESTRATOR & WORKFLOW ENGINES (/mtask, /otask, /pipe)
  // =========================================================================

  const planWorkflow = async (type: 'otask' | 'pipe', originalPrompt: string) => {
    // Check SaaS Lockout
    if (subscription.status === 'past_due' || subscription.status === 'canceled' || subscription.status === 'unpaid') {
      playWarningSound();
      setIsBillingOpen(true);
      addSystemEntry('[ACESSO BLOQUEADO // SAAS]: Assinatura de R$ 10,00 pendente. Regularize o pagamento para continuar.');
      return;
    }

    setIsWorking(true);
    playExecuteSound();
    const orchConfig = nodes.find((n) => n.id === orchestratorAgent);
    addSystemEntry(
      `[ORQUESTRADOR: ${orchConfig?.magiName || 'UNIT-01'} (${orchConfig?.subName || 'Claude'})] Analisando diretiva e fragmentando etapas para /${type}...`
    );

    try {
      const customKeys = {
        chatgpt: credentials.openaiKey,
        claude: credentials.anthropicKey,
        gemini: credentials.geminiKey,
        grok: credentials.grokKey,
        deepseek: credentials.deepseekKey,
      };

      const res = await fetch('/api/orchestrator/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: originalPrompt,
          workflowType: type,
          orchestratorNode: orchestratorAgent,
          customKeys,
          angelContext: getActiveAngelContext(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao fragmentar plano no orquestrador.');
      }

      setActivePlan(data.plan);
      setIsDelegationOpen(true);
    } catch (err: any) {
      playWarningSound();
      addSystemEntry(`[ERRO DE ORQUESTRADOR]: ${err.message}`);
    } finally {
      setIsWorking(false);
    }
  };

  const handleConfirmDelegatedWorkflow = async (delegatedPlan: WorkflowPlan) => {
    setIsDelegationOpen(false);
    setIsWorking(true);

    const isPipe = delegatedPlan.workflowType === 'pipe';
    const entryId = `wf-entry-${Date.now()}`;

    // Add user directive and initial workflow card to terminal
    setEntries((prev) => [
      ...prev,
      {
        id: `usr-${Date.now()}`,
        type: 'user',
        content: `[ORQUESTRAÇÃO ${delegatedPlan.workflowType.toUpperCase()} // ${delegatedPlan.orchestratorName}]: ${delegatedPlan.originalPrompt}`,
        timestamp: new Date().toLocaleTimeString(),
      },
      {
        id: entryId,
        type: 'workflow',
        content: delegatedPlan.summary,
        workflow: delegatedPlan,
        status: 'RUNNING',
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    const customKeys = {
      chatgpt: credentials.openaiKey,
      claude: credentials.anthropicKey,
      gemini: credentials.geminiKey,
      grok: credentials.grokKey,
      deepseek: credentials.deepseekKey,
    };

    try {
      const endpoint = isPipe ? '/api/orchestrator/execute-pipe' : '/api/orchestrator/execute-otask';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: delegatedPlan,
          customKeys,
          angelContext: getActiveAngelContext(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha na execução do workflow');
      }

      const executedPlan: WorkflowPlan = data.plan;

      // Update workflow card in terminal log
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, workflow: executedPlan, status: executedPlan.status } : e))
      );

      if (executedPlan.files && executedPlan.files.length > 0) {
        registerNewFiles(executedPlan.files);
      }

      if (executedPlan.circuitBreakerTripped) {
        playWarningSound();
        addSystemEntry(
          `[ALERTA CIRCUIT BREAKER]: Pipeline em cascata interrompido preventivamente na etapa ${executedPlan.failedStepId} para economizar tokens. O operador pode repetir a partir desta etapa.`
        );
      } else {
        playExecuteSound();
        addSystemEntry(`[ORQUESTRAÇÃO CONCLUÍDA]: Pacote de tarefas finalizado com êxito por ${executedPlan.orchestratorName}.`);
      }

      // Record in conversations history
      const convRecord: ConversationRecord = {
        id: `conv-wf-${Date.now()}`,
        scope: 'joint',
        scopeLabel: `Workflow ${executedPlan.workflowType.toUpperCase()} (${executedPlan.orchestratorName})`,
        prompt: executedPlan.originalPrompt,
        timestamp: Date.now(),
        timeFormatted: new Date().toLocaleString(),
        responses: executedPlan.steps
          .filter((s) => s.status === 'COMPLETED' && s.output)
          .map((s) => ({
            nodeId: s.assignedNode,
            nodeName: s.assignedNodeName,
            text: s.output || '',
            status: s.status,
          })),
        consensus: executedPlan.synthesis || undefined,
        filesCount: executedPlan.files?.length || 0,
        files: executedPlan.files,
      };

      setConversations((prev) => {
        const updated = [convRecord, ...prev];
        localStorage.setItem('nerv_magi_conversations', JSON.stringify(updated));
        return updated;
      });
    } catch (err: any) {
      playWarningSound();
      addSystemEntry(`[FALHA NA EXECUÇÃO DO WORKFLOW]: ${err.message}`);
    } finally {
      setIsWorking(false);
      fetchUsages();
    }
  };

  const handleRetryStep = async (workflowId: string, stepId: string) => {
    setIsWorking(true);
    addSystemEntry(`[REPETIR TAREFA]: Reexecutando etapa [${stepId}] do workflow ${workflowId}...`);

    const customKeys = {
      chatgpt: credentials.openaiKey,
      claude: credentials.anthropicKey,
      gemini: credentials.geminiKey,
      grok: credentials.grokKey,
      deepseek: credentials.deepseekKey,
    };

    try {
      const res = await fetch('/api/orchestrator/retry-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId,
          stepId,
          customKeys,
          angelContext: getActiveAngelContext(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao repetir etapa');

      const updatedStep: WorkflowStep = data.step;

      setEntries((prev) =>
        prev.map((e) => {
          if (e.type === 'workflow' && e.workflow && e.workflow.workflowId === workflowId) {
            const nextSteps = e.workflow.steps.map((s) => (s.id === stepId ? updatedStep : s));
            const allDone = nextSteps.every((s) => s.status === 'COMPLETED');
            return {
              ...e,
              workflow: {
                ...e.workflow,
                steps: nextSteps,
                status: allDone ? 'COMPLETED' : e.workflow.status,
              },
            };
          }
          return e;
        })
      );

      if (updatedStep.files && updatedStep.files.length > 0) {
        registerNewFiles(updatedStep.files);
      }

      playExecuteSound();
      addSystemEntry(`[TAREFA REPETIDA]: Etapa ${updatedStep.stepIndex} finalizada com status ${updatedStep.status}.`);
    } catch (err: any) {
      playWarningSound();
      addSystemEntry(`[ERRO NO RETRY]: ${err.message}`);
    } finally {
      setIsWorking(false);
      fetchUsages();
    }
  };

  const handleRetryPipe = async (workflowId: string, fromStepId: string) => {
    setIsWorking(true);
    addSystemEntry(`[REINICIAR PIPELINE]: Retomando fluxo em cascata a partir da etapa [${fromStepId}] com artefatos anteriores preservados...`);

    const customKeys = {
      chatgpt: credentials.openaiKey,
      claude: credentials.anthropicKey,
      gemini: credentials.geminiKey,
      grok: credentials.grokKey,
      deepseek: credentials.deepseekKey,
    };

    try {
      const res = await fetch('/api/orchestrator/retry-pipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId,
          fromStepId,
          customKeys,
          angelContext: getActiveAngelContext(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao reiniciar pipeline');

      const updatedPlan: WorkflowPlan = data.plan;

      setEntries((prev) =>
        prev.map((e) => {
          if (e.type === 'workflow' && e.workflow && e.workflow.workflowId === workflowId) {
            return {
              ...e,
              workflow: updatedPlan,
              status: updatedPlan.status,
            };
          }
          return e;
        })
      );

      if (updatedPlan.files && updatedPlan.files.length > 0) {
        registerNewFiles(updatedPlan.files);
      }

      if (updatedPlan.circuitBreakerTripped) {
        playWarningSound();
        addSystemEntry(`[CIRCUIT BREAKER]: Pipeline novamente interrompido na etapa ${updatedPlan.failedStepId}.`);
      } else {
        playExecuteSound();
        addSystemEntry(`[PIPELINE FINALIZADO]: Cadeia de etapas concluída com sucesso.`);
      }
    } catch (err: any) {
      playWarningSound();
      addSystemEntry(`[ERRO NO RETRY DO PIPELINE]: ${err.message}`);
    } finally {
      setIsWorking(false);
      fetchUsages();
    }
  };

  const executeMtaskWorkflow = async (prompt: string) => {
    // Check SaaS Lockout
    if (subscription.status === 'past_due' || subscription.status === 'canceled' || subscription.status === 'unpaid') {
      playWarningSound();
      setIsBillingOpen(true);
      addSystemEntry('[ACESSO BLOQUEADO // SAAS]: Assinatura de R$ 10,00 pendente. Regularize o pagamento para continuar.');
      return;
    }

    const activeNodesList = nodes.filter((n) => n.active && nodeKeyStatus[n.id]).map((n) => n.id);
    if (activeNodesList.length === 0) {
      playWarningSound();
      addSystemEntry('ERRO: Nenhum MAGI com chave operante está ativo para /mtask.');
      return;
    }

    setEntries((prev) => [
      ...prev,
      {
        id: `usr-${Date.now()}`,
        type: 'user',
        content: `[DIRETIVA /mtask -> TODAS AS IAs]: ${prompt}`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    setIsWorking(true);
    setNodes((prev) =>
      prev.map((n) => (activeNodesList.includes(n.id) ? { ...n, status: 'WORKING' } : n))
    );

    const customKeys = {
      chatgpt: credentials.openaiKey,
      claude: credentials.anthropicKey,
      gemini: credentials.geminiKey,
      grok: credentials.grokKey,
      deepseek: credentials.deepseekKey,
    };

    try {
      const res = await fetch('/api/orchestrator/execute-mtask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          activeNodes: activeNodesList,
          orchestratorNode: orchestratorAgent,
          customKeys,
          angelContext: getActiveAngelContext(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha na execução de /mtask');

      const result: WorkflowMtaskResult = data.result;

      // Render successful responses
      const newAssistantEntries: TerminalEntry[] = result.responses.map((r) => ({
        id: `mtask-resp-${r.provider}-${Date.now()}`,
        type: 'assistant',
        nodeId: r.provider,
        nodeName: r.name,
        sender: r.name,
        content: r.text,
        status: 'RESOLVED',
        files: r.files,
        timestamp: new Date().toLocaleTimeString(),
      }));

      // Render warning entries for nodes that timed out or errored
      const failedEntries: TerminalEntry[] = result.failedNodes.map((f) => ({
        id: `mtask-fail-${f.nodeId}-${Date.now()}`,
        type: 'warning',
        nodeId: f.nodeId,
        nodeName: f.nodeName,
        content: `[NÓ NÃO RESPONDEU A TEMPO]: ${f.reason}`,
        status: 'TIMEOUT',
        timestamp: new Date().toLocaleTimeString(),
      }));

      // Synthesis verdict from Orchestrator with Footnote
      const synthesisEntry: TerminalEntry = {
        id: `mtask-synth-${Date.now()}`,
        type: 'consensus',
        status: 'ORCHESTRATOR_SYNTHESIS',
        content: result.synthesis,
        footnote: result.footnote,
        timestamp: new Date().toLocaleTimeString(),
      };

      setEntries((prev) => [...prev, ...newAssistantEntries, ...failedEntries, synthesisEntry]);

      if (result.files && result.files.length > 0) {
        registerNewFiles(result.files);
      }

      playExecuteSound();

      // Record in conversations history
      const convRecord: ConversationRecord = {
        id: `conv-mtask-${Date.now()}`,
        scope: 'joint',
        scopeLabel: `MTask Deliberation (${result.orchestratorName})`,
        prompt,
        timestamp: Date.now(),
        timeFormatted: new Date().toLocaleString(),
        responses: result.responses.map((r) => ({
          nodeId: r.provider,
          nodeName: r.name,
          text: r.text,
          status: 'RESOLVED',
        })),
        consensus: result.synthesis,
        filesCount: result.files?.length || 0,
        files: result.files,
      };

      setConversations((prev) => {
        const updated = [convRecord, ...prev];
        localStorage.setItem('nerv_magi_conversations', JSON.stringify(updated));
        return updated;
      });
    } catch (err: any) {
      playWarningSound();
      addSystemEntry(`[ERRO NO FLUXO /mtask]: ${err.message}`);
    } finally {
      setIsWorking(false);
      setNodes((prev) => prev.map((n) => ({ ...n, status: 'STANDBY' })));
      fetchUsages();
    }
  };

  // Execute single node query
  const executeSingleNode = async (nodeId: MagiNodeId, prompt: string) => {
    // Check SaaS Lockout
    if (subscription.status === 'past_due' || subscription.status === 'canceled' || subscription.status === 'unpaid') {
      playWarningSound();
      setIsBillingOpen(true);
      addSystemEntry('[ACESSO BLOQUEADO // SAAS]: Assinatura de R$ 10,00 pendente. Regularize o pagamento para continuar.');
      return;
    }

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setEntries((prev) => [
      ...prev,
      {
        id: `usr-${Date.now()}`,
        type: 'user',
        content: `[DIRETIVA INDIVIDUAL -> ${node.magiName} (${node.realPlatform})]: ${prompt}`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    setIsWorking(true);
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, status: 'WORKING' } : n))
    );

    const customKey =
      nodeId === 'chatgpt'
        ? credentials.openaiKey
        : nodeId === 'claude'
        ? credentials.anthropicKey
        : nodeId === 'gemini'
        ? credentials.geminiKey
        : nodeId === 'grok'
        ? credentials.grokKey
        : credentials.deepseekKey;

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`/api/ask/${nodeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          prompt,
          customApiKey: customKey,
          angelContext: getActiveAngelContext(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Erro de conexão com ${node.magiName}`);
      }

      setEntries((prev) => [
        ...prev,
        {
          id: `node-${Date.now()}`,
          type: 'assistant',
          nodeId,
          nodeName: `${node.magiName} (${node.realPlatform})`,
          sender: node.realPlatform,
          content: data.text,
          status: 'RESOLVED',
          files: data.files,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      if (data.files && data.files.length > 0) {
        registerNewFiles(data.files);
      }

      // Record to Conversations History (Retractable Left Menu)
      const convRecord: ConversationRecord = {
        id: `conv-${nodeId}-${Date.now()}`,
        scope: nodeId,
        scopeLabel: `${node.magiName} (${node.realPlatform})`,
        prompt,
        timestamp: Date.now(),
        timeFormatted: new Date().toLocaleString(),
        responses: [
          {
            nodeId,
            nodeName: `${node.magiName} (${node.realPlatform})`,
            text: data.text,
            status: 'RESOLVED',
          },
        ],
        filesCount: data.files?.length || 0,
        files: data.files,
      };

      setConversations((prev) => {
        const updated = [convRecord, ...prev];
        localStorage.setItem('nerv_magi_conversations', JSON.stringify(updated));
        return updated;
      });

      if (!isHistoryOpen) {
        setUnreadConversationsCount((prev) => prev + 1);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        addSystemEntry(`[CANCELADO]: Transmissão para [${node.magiName}] abortada pelo operador.`);
        return;
      }
      playWarningSound();
      setEntries((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          type: 'error',
          content: `Falha na transmissão neural para [${node.magiName}]: ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsWorking(false);
      setNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, status: 'STANDBY' } : n))
      );
      fetchUsages();
    }
  };

  // Broadcast to all active nodes simultaneously
  const executeBroadcast = async (prompt: string) => {
    // Check SaaS Lockout
    if (subscription.status === 'past_due' || subscription.status === 'canceled' || subscription.status === 'unpaid') {
      playWarningSound();
      setIsBillingOpen(true);
      addSystemEntry('[ACESSO BLOQUEADO // SAAS]: Assinatura de R$ 10,00 pendente. Regularize o pagamento para continuar.');
      return;
    }

    const activeNodesList = nodes
      .filter((n) => n.active && nodeKeyStatus[n.id])
      .map((n) => n.id);
    if (activeNodesList.length === 0) {
      playWarningSound();
      addSystemEntry('ERRO: Nenhum MAGI com chave de API operante está ativo. Configure as chaves no [COFRE // CHAVES].');
      return;
    }

    setEntries((prev) => [
      ...prev,
      {
        id: `usr-${Date.now()}`,
        type: 'user',
        content: prompt,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    setIsWorking(true);
    setNodes((prev) =>
      prev.map((n) => (n.active ? { ...n, status: 'WORKING' } : n))
    );

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/magi/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          prompt,
          activeNodes: activeNodesList,
          angelContext: getActiveAngelContext(),
          customKeys: {
            chatgpt: credentials.openaiKey,
            claude: credentials.anthropicKey,
            gemini: credentials.geminiKey,
            grok: credentials.grokKey,
            deepseek: credentials.deepseekKey,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha na deliberação MAGI');
      }

      (data.responses || []).forEach((resp: any) => {
        setEntries((prev) => [
          ...prev,
          {
            id: `resp-${resp.provider}-${Date.now()}-${Math.random()}`,
            type: resp.status === 'ERROR' ? 'error' : 'assistant',
            nodeId: resp.provider,
            nodeName: resp.name,
            content: resp.text,
            status: resp.status,
            files: resp.files,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      });

      // MAGI Consensus Resolution Entry
      if (data.responses && data.responses.length > 1) {
        setEntries((prev) => [
          ...prev,
          {
            id: `consensus-${Date.now()}`,
            type: 'consensus',
            status: `${data.agreementRatio}% CONCORDÂNCIA`,
            content:
              `DELIBERAÇÃO MAGI MULTI-IA CONCLUÍDA:\n` +
              data.responses
                .map((r: any) => `• ${r.name}: ${r.status === 'ERROR' ? 'Falha' : 'Aprovado'}`)
                .join('\n') +
              `\nRESULTADO: ${data.agreementRatio >= 66 ? 'CONSENSO APROVADO' : 'DELIBERAÇÃO PARCIAL'} (${data.agreementRatio}% DE ACORDO).`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }

      if (data.newFiles && data.newFiles.length > 0) {
        registerNewFiles(data.newFiles);
      }

      // Record to Conversations History (Retractable Left Menu)
      const convRecord: ConversationRecord = {
        id: `conv-joint-${Date.now()}`,
        scope: 'joint',
        scopeLabel: 'CONJUNTO // TODAS AS IAs',
        prompt,
        timestamp: Date.now(),
        timeFormatted: new Date().toLocaleString(),
        responses: (data.responses || []).map((r: any) => ({
          nodeId: r.provider,
          nodeName: r.name,
          text: r.text,
          status: r.status,
        })),
        consensus: data.responses?.length > 1 ? `${data.agreementRatio}% CONCORDÂNCIA` : undefined,
        filesCount: data.newFiles?.length || 0,
        files: data.newFiles,
      };

      setConversations((prev) => {
        const updated = [convRecord, ...prev];
        localStorage.setItem('nerv_magi_conversations', JSON.stringify(updated));
        return updated;
      });

      if (!isHistoryOpen) {
        setUnreadConversationsCount((prev) => prev + 1);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        addSystemEntry('[CANCELADO]: Deliberação conjunta MAGI abortada pelo operador.');
        return;
      }
      playWarningSound();
      setEntries((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          type: 'error',
          content: `FALHA CRÍTICA NO PROTOCOLO DE TRANSMISSÃO MAGI: ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsWorking(false);
      setNodes((prev) =>
        prev.map((n) => ({ ...n, status: 'STANDBY' }))
      );
      fetchUsages();
    }
  };

  const handleCancelExecution = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsWorking(false);
    setNodes((prev) => prev.map((n) => ({ ...n, status: 'STANDBY' })));
    playWarningSound();
    addSystemEntry('[INTERRUPÇÃO TÁTICA]: Processamento neural abortado pelo operador [ESC].');
  };

  const activeCount = nodes.filter((n) => n.active && nodeKeyStatus[n.id]).length;

  return (
    <div className="relative min-h-screen h-screen flex flex-col bg-[#070504] text-[#ffca8a] overflow-hidden select-none font-mono">
      {/* Scanline CRT overlay */}
      {crtEnabled && <div className="crt-overlay fixed inset-0 z-30 pointer-events-none" />}

      {/* Main NERV Tactical Header (Top: AIs, Clock, ALERT, and Language Menu) */}
      <NervHeader
        nodes={nodes}
        onToggleNode={handleToggleNode}
        isWorking={isWorking}
        nodeKeyStatus={nodeKeyStatus}
        language={language}
        onSelectLanguage={handleSelectLanguage}
        onOpenAlertModal={() => setIsAlertOpen(true)}
        isTokenLow={isTokenLow}
        activeAngelName={activeAngel?.name || null}
        onOpenAngels={() => setIsAngelsOpen(true)}
        onCloseApp={() => setIsExitModalOpen(true)}
        t={t}
      />

      {/* Terminal Work Area Framed Before Side Drawer Arrow Tabs */}
      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden bg-[#070504] px-11 sm:px-12 md:px-14 py-2">
        <main className="flex-1 flex flex-col min-h-0 relative overflow-hidden bg-[#050403] border-2 border-[#ff7a00] shadow-[0_0_24px_rgba(255,122,0,0.18)]">
          {/* Tactical HUD Corner Enclosure Markers */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#ffca8a] pointer-events-none z-10" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#ffca8a] pointer-events-none z-10" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#ffca8a] pointer-events-none z-10" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#ffca8a] pointer-events-none z-10" />

          {/* Top Context Window Tactical Enclosure Header */}
          <div className="h-6 bg-[#120a06] border-b border-[#3a2515] px-3 flex items-center justify-between text-[9px] font-mono text-[#8a6845] shrink-0 select-none">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a00] animate-pulse" />
              <span className="font-bold text-[#ffca8a]">JANELA DE CONTEXTO // TERMINAL CENTRAL MAGI</span>
              {activeAngel && (
                <button
                  type="button"
                  onClick={() => setIsAngelsOpen(true)}
                  className="flex items-center gap-1 px-1.5 py-0.2 bg-[#06202e] border border-[#00f0ff] text-[#00f0ff] text-[9px] font-bold cursor-pointer hover:bg-[#00f0ff] hover:text-black transition-colors"
                  title="Skill Angel ativa guiando a janela de contexto. Clique para alterar."
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-ping" />
                  <span>ANGEL ATIVO: [{activeAngel.code}] {activeAngel.name}</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeAngel && activeAngel.files.length > 0 && (
                <span className="text-[#00f0ff] hidden md:inline text-[9px]">
                  [{activeAngel.files.length} ARQUIVO(S) NA BASE]
                </span>
              )}
              <span className="text-[#8a6845] hidden sm:inline text-[9px] tracking-wider">
                ENQUADRAMENTO TÁTICO // DELIMITAÇÃO CENTRAL
              </span>
            </div>
          </div>

          {/* Terminal Log Output Window */}
          <TerminalLog
            entries={entries}
            onOpenFileViewer={(f) => setActiveFileViewer(f)}
            onOpenDrawer={handleToggleDrawer}
            isWorking={isWorking}
            t={t}
            onRetryStep={handleRetryStep}
            onRetryPipe={handleRetryPipe}
            onDownloadFile={handleDownloadFile}
          />

          {/* Command Line Prompt */}
          <TerminalPrompt
            onSubmit={handlePromptSubmit}
            isWorking={isWorking}
            activeCount={activeCount}
            t={t}
            onCancel={handleCancelExecution}
            orchestratorAgent={orchestratorAgent}
            onSelectOrchestrator={(nodeId) => {
              setOrchestratorAgent(nodeId);
              const nodeObj = nodes.find((n) => n.id === nodeId);
              addSystemEntry(`[ORQUESTRADOR MAGI ALTERADO]: ${nodeObj?.magiName} (${nodeObj?.subName})`);
            }}
            nodes={nodes}
            nodeKeyStatus={nodeKeyStatus}
          />
        </main>
      </div>

      {/* Dedicated Tactical Bottom Menu / Action Dock */}
      <NervBottomBar
        operatorName={credentials.operatorName || 'Usuário'}
        onOpenUserMenu={() => setIsUserAccountOpen(true)}
        onOpenVault={() => setIsVaultOpen(true)}
        onOpenAngels={() => setIsAngelsOpen(true)}
        onOpenAgents={() => setIsAgentsOpen(true)}
        onOpenLgpd={() => setIsLgpdOpen(true)}
        onOpenCredits={() => setIsCreditsOpen(true)}
        onOpenBilling={() => setIsBillingOpen(true)}
        activeAngelName={activeAngel?.name || null}
        audioEnabled={audioActive}
        onToggleAudio={handleToggleAudio}
        crtEnabled={crtEnabled}
        onToggleCrt={handleToggleCrt}
        onPurgeAll={handlePurgeAllData}
        onCheckUsage={handleCheckUsageQuota}
        onCloseApp={() => setIsExitModalOpen(true)}
        t={t}
        isWorking={isWorking}
        interactionCount={interactionCount}
      />

      {/* Retractable Left Menu: Latest Conversations by AI and Joint */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onToggle={handleToggleHistory}
        conversations={conversations}
        unreadCount={unreadConversationsCount}
        onLoadConversationToTerminal={handleLoadConversationToTerminal}
        onClearHistory={handleClearHistory}
        onDeleteConversation={handleDeleteConversation}
        t={t}
      />

      {/* Expandable Slide-out Right Menu: Generated Files with Flashing Tab & Working Light */}
      <FilesDrawer
        isOpen={isDrawerOpen}
        onToggle={handleToggleDrawer}
        files={files}
        unreadCount={unreadFilesCount}
        isWorking={isWorking}
        onOpenFileViewer={(f) => setActiveFileViewer(f)}
        onDownloadFile={handleDownloadFile}
        onDownloadAllZip={handleDownloadAllZip}
        onClearFiles={handleClearFiles}
        t={t}
      />

      {/* Modals */}
      <UserAccountModal
        isOpen={isUserAccountOpen}
        onClose={() => setIsUserAccountOpen(false)}
        operatorName={credentials.operatorName || 'Usuário'}
        onSaveOperatorName={(newName) => {
          handleSaveCredentials({
            ...credentials,
            operatorName: newName,
          });
        }}
        onPurgeAll={handlePurgeAllData}
        onOpenBilling={() => setIsBillingOpen(true)}
      />

      <AngelsModal
        isOpen={isAngelsOpen}
        onClose={() => setIsAngelsOpen(false)}
        angels={angels}
        activeAngelId={activeAngelId}
        onSelectActiveAngel={handleSelectActiveAngel}
        onSaveAngel={handleSaveAngel}
        onDeleteAngel={handleDeleteAngel}
        t={t}
      />

      <OperatorVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        credentials={credentials}
        onSaveCredentials={handleSaveCredentials}
        serverKeysStatus={serverKeysStatus}
      />

      <NervAlertModal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        usages={magiUsages}
        onRefreshUsage={fetchUsages}
        onOpenVault={() => setIsVaultOpen(true)}
        isTokenLow={isTokenLow}
        onToggleSimulatedLow={handleToggleSimulatedLow}
        isSimulatedLow={isSimulatedLow}
        t={t}
      />

      <FileViewerModal
        file={activeFileViewer}
        onClose={() => setActiveFileViewer(null)}
        onDownload={handleDownloadFile}
      />

      <PcBundleModal
        isOpen={isPcModalOpen}
        onClose={() => setIsPcModalOpen(false)}
        onDownloadZip={handleDownloadPcBundle}
      />

      <NervBillingModal
        isOpen={isBillingOpen}
        onClose={() => setIsBillingOpen(false)}
        subscription={subscription}
        onUpdateSubscription={handleUpdateSubscription}
        onAddSystemEntry={addSystemEntry}
      />

      <NervOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => {
          setIsOnboardingOpen(false);
          localStorage.setItem('nerv_magi_onboarding_completed', 'true');
        }}
        onSaveKey={(prov, key) => {
          const updated = {
            ...credentials,
            ...(prov === 'gemini' ? { geminiKey: key } : {}),
            ...(prov === 'chatgpt' ? { openaiKey: key } : {}),
            ...(prov === 'claude' ? { anthropicKey: key } : {}),
            ...(prov === 'grok' ? { grokKey: key } : {}),
            ...(prov === 'deepseek' ? { deepseekKey: key } : {}),
          };
          handleSaveCredentials(updated);
        }}
        onLaunchDemoPrompt={(p) => handlePromptSubmit(p)}
      />

      <NervLockoutOverlay
        isLocked={subscription.status === 'past_due' || subscription.status === 'canceled' || subscription.status === 'unpaid'}
        subscription={subscription}
        onOpenBillingModal={() => setIsBillingOpen(true)}
        onCheckStatus={() => {
          fetch('/api/subscription/status')
            .then((r) => r.json())
            .then((d) => {
              if (d.subscription) {
                setSubscription(d.subscription);
                localStorage.setItem('nerv_magi_saas_subscription', JSON.stringify(d.subscription));
              }
            });
        }}
      />

      <NervExitConfirmModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onConfirmExit={handleConfirmExit}
        isShuttingDown={isShuttingDown}
      />

      {/* Janela de Atribuição (Modal de Delegação para /otask e /pipe) */}
      <NervDelegationModal
        isOpen={isDelegationOpen}
        plan={activePlan}
        nodes={nodes}
        nodeKeyStatus={nodeKeyStatus}
        onClose={() => {
          setIsDelegationOpen(false);
          setActivePlan(null);
        }}
        onConfirm={handleConfirmDelegatedWorkflow}
      />

      <AutonomousAgentsModal
        isOpen={isAgentsOpen}
        onClose={() => setIsAgentsOpen(false)}
        customKeys={{
          chatgpt: credentials.openaiKey,
          claude: credentials.anthropicKey,
          gemini: credentials.geminiKey,
          grok: credentials.grokKey,
          deepseek: credentials.deepseekKey,
        }}
      />

      <LgpdConsentModal
        isOpen={isLgpdOpen}
        onClose={() => setIsLgpdOpen(false)}
      />

      <LegalCreditsModal
        isOpen={isCreditsOpen}
        onClose={() => setIsCreditsOpen(false)}
      />

      {isSystemTerminated && (
        <div className="fixed inset-0 z-50 bg-[#050302] text-[#ff2233] flex flex-col items-center justify-center p-6 font-mono select-none">
          <div className="max-w-md w-full border-2 border-[#ff2233] bg-[#120507] p-8 text-center space-y-4 shadow-[0_0_50px_rgba(255,34,51,0.5)]">
            <div className="h-2 hazard-stripes w-full mb-4" />
            <h1 className="text-2xl font-black tracking-widest text-white">NERV MAGI HUB</h1>
            <div className="text-sm font-bold text-[#ff4455] tracking-widest uppercase">
              [SISTEMA DESATIVADO COM SUCESSO]
            </div>
            <p className="text-xs text-[#c99a7a] leading-relaxed">
              Todos os processos locais foram encerrados e os supercomputadores MAGI foram desligados.
            </p>
            <p className="text-[11px] text-[#8a6845]">
              Você já pode fechar esta janela com segurança.
            </p>
            <button
              type="button"
              onClick={() => window.close()}
              className="px-6 py-2 border border-[#ff2233] bg-[#ff2233] text-white font-bold hover:bg-white hover:text-black transition-colors cursor-pointer text-xs uppercase tracking-wider"
            >
              FECHAR JANELA
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
