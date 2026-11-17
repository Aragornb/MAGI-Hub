export type MagiNodeId = 'chatgpt' | 'claude' | 'gemini' | 'grok' | 'deepseek';
export type ConversationScope = 'joint' | 'chatgpt' | 'claude' | 'gemini' | 'grok' | 'deepseek';

export interface MagiNodeConfig {
  id: MagiNodeId;
  magiName: string;
  subName: string;
  realPlatform: string;
  color: string;
  borderColor: string;
  glowColor: string;
  active: boolean;
  status: 'STANDBY' | 'WORKING' | 'RESOLVED' | 'ERROR';
}

export interface GeneratedFile {
  id: string;
  provider: MagiNodeId;
  providerName: string;
  name: string;
  language: string;
  content: string;
  size: number;
  timestamp: number;
}

export interface TerminalEntry {
  id: string;
  type: 'system' | 'user' | 'assistant' | 'error' | 'warning' | 'consensus' | 'diagnostic' | 'workflow';
  nodeId?: MagiNodeId;
  nodeName?: string;
  sender?: string;
  content: string;
  timestamp: string;
  files?: GeneratedFile[];
  status?: string;
  workflow?: WorkflowPlan;
  footnote?: string;
}

export interface ConversationRecord {
  id: string;
  scope: ConversationScope; // 'joint' = todas em conjunto, ou individual
  scopeLabel: string;
  prompt: string;
  timestamp: number;
  timeFormatted: string;
  responses: {
    nodeId: MagiNodeId;
    nodeName: string;
    text: string;
    status: string;
  }[];
  consensus?: string;
  filesCount: number;
  files?: GeneratedFile[];
}

export interface OperatorCredentials {
  openaiKey: string;
  anthropicKey: string;
  geminiKey: string;
  grokKey: string;
  deepseekKey: string;
  operatorName: string;
  clearanceCode: string;
}

export interface MagiVoteResult {
  verdict: string;
  agreementRatio: number;
  timestamp: number;
}

export type SupportedLanguage = 'PT-BR' | 'ENG' | 'JPN' | 'CHI';

export interface MagiNodeUsage {
  nodeId: MagiNodeId;
  nodeName: string;
  realPlatform: string;
  isOperant: boolean;
  availablePercent: number; // 0.0 to 100.0
  requestsCount: number;
  tokensUsed: number;
  quotaLimitTokens: number;
  syncRate: number; // e.g. 99.4
  status: 'OPERACIONAL' | 'BLOQUEADO' | 'STANDBY';
  keySource: 'server' | 'vault' | 'missing';
  latencyMs?: number;
}

export interface AngelKnowledgeFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  uploadedAt: string;
}

export interface AngelSkill {
  id: string;
  code: string;
  name: string;
  description: string;
  instructions: string;
  files: AngelKnowledgeFile[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BillingFrequency = 'demand' | 'monthly';
export type PlanTier = 'demand' | 'basic' | 'pro' | 'max';

export interface CreditCardData {
  cardNumber: string; // Ex: 4532 8912 3456 7890
  cardHolder: string;
  expiry: string;
  cvv: string;
  brand: 'visa' | 'mastercard' | 'elo' | 'amex' | 'generic';
}

export interface NodeAllocation {
  nodeId: MagiNodeId;
  enabled: boolean;
  percentage: number; // 0 to 100
  allocatedAmountBrl: number;
  allocatedTokens: number;
}

export interface BillingReceipt {
  id: string;
  dateFormatted: string;
  timestamp: number;
  planName: string;
  planTier: PlanTier;
  frequency: BillingFrequency;
  amountBrl: number;
  cardLast4: string;
  nodeDistribution: {
    nodeId: MagiNodeId;
    nodeName: string;
    amountBrl: number;
    tokens: number;
  }[];
}

export interface BillingConfig {
  frequency: BillingFrequency; // 'demand' (por demanda) | 'monthly' (mensal)
  plan: PlanTier; // 'demand' | 'basic' | 'pro' | 'max'
  planPriceBrl: number;
  card: CreditCardData;
  distributionMode: 'equal' | 'custom';
  allocations: Record<MagiNodeId, NodeAllocation>;
  lastChargedAt?: number;
  totalBalanceBrl: number;
  receiptHistory: BillingReceipt[];
}

export type SubscriptionStatus = 'active' | 'grace_period' | 'past_due' | 'unpaid' | 'canceled';

export interface SaaSSubscription {
  planName: string;
  monthlyPriceBrl: number;
  status: SubscriptionStatus;
  startedAt: number;
  currentPeriodEnd: number;
  gracePeriodEnd?: number | null;
  cardLast4: string;
  cardBrand: string;
  autoRenew: boolean;
}

export type KeyValidationState = 'untested' | 'testing' | 'valid' | 'invalid';

export interface KeyValidationResult {
  provider: MagiNodeId;
  status: KeyValidationState;
  message?: string;
  modelChecked?: string;
  testedAt?: number;
}

export const DEFAULT_SAAS_SUBSCRIPTION: SaaSSubscription = {
  planName: 'MAGI PASS // SAAS (BYOK)',
  monthlyPriceBrl: 10.00,
  status: 'active',
  startedAt: Date.now() - 86400 * 15 * 1000,
  currentPeriodEnd: Date.now() + 86400 * 15 * 1000,
  gracePeriodEnd: null,
  cardLast4: '4242',
  cardBrand: 'visa',
  autoRenew: true,
};

// =========================================================================
// NERV MAGI AI ORCHESTRATOR & WORKFLOW DATA MODELING
// =========================================================================

export type OrchestratorAgentId = MagiNodeId;

export type WorkflowType = 'mtask' | 'otask' | 'pipe';

export type WorkflowStepStatus =
  | 'PENDING'
  | 'WORKING'
  | 'COMPLETED'
  | 'TIMEOUT'
  | 'ERROR'
  | 'SKIPPED';

export type WorkflowPlanStatus =
  | 'PLANNED'
  | 'AWAITING_DELEGATION'
  | 'RUNNING'
  | 'COMPLETED'
  | 'HALTED_CIRCUIT_BREAKER'
  | 'PARTIAL_SUCCESS'
  | 'FAILED';

export interface WorkflowStep {
  id: string;
  stepIndex: number;
  title: string;
  description: string;
  assignedNode: MagiNodeId;
  assignedNodeName: string;
  inputPrompt: string;
  status: WorkflowStepStatus;
  output?: string | null;
  error?: string | null;
  durationMs?: number | null;
  files?: GeneratedFile[];
  retryCount?: number;
}

export interface WorkflowPlan {
  workflowId: string;
  workflowType: WorkflowType;
  originalPrompt: string;
  orchestratorNode: MagiNodeId;
  orchestratorName: string;
  summary: string;
  steps: WorkflowStep[];
  status: WorkflowPlanStatus;
  circuitBreakerTripped: boolean;
  failedStepId?: string | null;
  synthesis?: string | null;
  synthesisFootnote?: string | null;
  files?: GeneratedFile[];
  createdAt: number;
  completedAt?: number | null;
}

export interface WorkflowMtaskResult {
  workflowType: 'mtask';
  orchestratorNode: MagiNodeId;
  orchestratorName: string;
  totalNodes: number;
  successfulCount: number;
  failedCount: number;
  responses: {
    provider: MagiNodeId;
    node: string;
    name: string;
    text: string;
    status: string;
    consensus: string;
    files?: GeneratedFile[];
    durationMs?: number;
  }[];
  failedNodes: {
    nodeId: MagiNodeId;
    nodeName: string;
    reason: string;
  }[];
  synthesis: string;
  footnote: string;
  files: GeneratedFile[];
  durationMs: number;
}

// =========================================================================
// AUTONOMOUS AGENTS (OPENCLAW-INSPIRED) & LGPD / AUDIT TYPES
// =========================================================================

export type AgentTriggerType = 'manual' | 'heartbeat' | 'cron' | 'webhook';

export type AgentToolId =
  | 'read_vault'
  | 'write_vault'
  | 'web_fetch'
  | 'magi_consensus'
  | 'update_memory';

export interface AutonomousAgent {
  id: string;
  name: string;
  role: string;
  objective: string;
  modelNode: MagiNodeId;
  triggerType: AgentTriggerType;
  heartbeatIntervalSec: number;
  cronSchedule: string;
  allowedTools: AgentToolId[];
  maxSteps: number;
  enabled: boolean;
  status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'ERROR';
  webhookTokenPreview?: string;
  webhookToken?: string;
  lastRunAt?: string | null;
  lastSummary?: string | null;
  runCount: number;
  createdAt: number;
}

export interface AgentRunRecord {
  runId: string;
  timestamp: number;
  triggerSource: string;
  status: 'COMPLETED' | 'ERROR';
  durationMs: number;
  summary: string;
  trace: {
    step: number;
    thought: string;
    tool?: string;
    args?: Record<string, unknown>;
    observation?: string;
    final_answer?: string;
  }[];
}

export interface LgpdConsentRecord {
  accepted: boolean;
  consentVersion: string;
  acceptedAt: number | null;
  purposes: string[];
}

export interface AuditLogEntry {
  timestamp: number;
  isoTime: string;
  action: string;
  route: string;
  method: string;
  statusCode: number;
  actor: string;
  details: Record<string, unknown>;
}





