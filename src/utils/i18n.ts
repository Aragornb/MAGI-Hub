export type SupportedLanguage = 'PT-BR' | 'ENG' | 'JPN' | 'CHI';

export interface TranslationDictionary {
  // Brand & Header
  brandTitle: string;
  magiSystem: string;
  centralDogma: string;
  linkStatus: string;
  transmitting: string;
  operational: string;
  restrictedAccess: string;
  
  // Nodes
  melchiorTitle: string;
  balthasarTitle: string;
  casperTitle: string;
  grokTitle: string;
  deepseekTitle: string;
  withoutKey: string;
  processing: string;
  statusOn: string;
  statusOff: string;
  nodeBlockedTooltip: string;
  nodeToggleTooltip: string;

  // Real-Time Clock & Header Tools
  clockLabel: string;
  clockTooltip: string;
  timerLabel: string;
  timerTitle: string;
  timerReset: string;
  timerPause: string;
  timerResume: string;
  crtTitle: string;
  soundOn: string;
  soundOff: string;
  soundActiveTooltip: string;
  soundInactiveTooltip: string;
  vaultButton: string;
  vaultShort: string;
  vaultTooltip: string;
  downloadPcButton: string;
  downloadPcTooltip: string;
  purgeButton: string;
  purgeTooltip: string;
  purgeConfirmText: string;
  quotaCheckButton: string;
  quotaCheckTooltip: string;
  langSelectTitle: string;

  // Angels Context Control
  angelsButton: string;
  angelsTooltip: string;
  angelsTitle: string;
  angelsSubtitle: string;
  angelsActiveSkill: string;
  angelsNoActiveSkill: string;

  // Operator / User identity
  operatorNameLabel: string;
  operatorDefaultName: string;
  operatorEditTitle: string;
  operatorClearanceLabel: string;
  bottomMenuLabel: string;

  // Terminal Prompt & Bar
  commandsTitle: string;
  quickCmdScript: string;
  quickCmdJoint: string;
  quickCmdTestFile: string;
  quickCmdQuota: string;
  promptPlaceholderWorking: string;
  promptPlaceholderNoNodes: string;
  promptPlaceholderDefault: string;
  promptOperatorKicker: string;
  transmitButton: string;
  targetNodesLabel: (count: number) => string;
  tripleDeliberation: string;
  singleOperatorMode: string;
  awaitingOperatorPrompt: string;

  // Terminal Log & Boot Messages
  bootMsg1: string;
  bootMsg2: string;
  bootMsg3: string;
  bootMsg4: string;
  bootMsg5: string;
  systemNormal: string;
  operatorClearance: string;
  integratedNodesNotice: string;
  typeAnyCommandNotice: string;
  alertTransmissionFailed: string;
  consensusTitle: string;
  artifactsSavedInVault: (count: number) => string;
  viewInDrawer: string;

  // Quota & Usage Report Strings
  quotaReportHeader: string;
  quotaReportSub: string;
  quotaAvailableLabel: string;
  quotaBlockedLabel: string;
  requestsExecuted: string;
  tokensConsumedRemaining: string;
  syncRateLabel: string;
  keyStatusLabel: string;
  keyActiveServer: string;
  keyActiveVault: string;
  keyMissing: string;
  quotaAdvice: string;
  
  // Drawers
  historyDrawerTitle: string;
  historyDrawerSubtitle: string;
  historyTriggerTooltipNew: (count: number) => string;
  historyTriggerCollapse: string;
  historyTriggerExpand: string;
  filesDrawerTitle: string;
  filesDrawerSubtitle: string;
  filesTriggerTooltipNew: (count: number) => string;
  filesTriggerCollapse: string;
  filesTriggerExpand: string;
  downloadAllZip: string;
  clearFilesButton: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  'PT-BR': {
    brandTitle: 'NERV',
    magiSystem: 'MAGI HUB',
    centralDogma: 'DOGMA CENTRAL // PROTOCOLO DE DELIBERAÇÃO SINCRÔNICA',
    linkStatus: 'STATUS DE LINK',
    transmitting: 'TRANSMITINDO DADOS',
    operational: 'OPERACIONAL',
    restrictedAccess: 'NÍVEL DE ACESSO: RESTRITO A-17',

    melchiorTitle: 'UNIT-00',
    balthasarTitle: 'UNIT-01',
    casperTitle: 'UNIT-02',
    grokTitle: 'UNIT-03',
    deepseekTitle: 'UNIT-04',
    withoutKey: 'SEM CHAVE',
    processing: 'PROCESSANDO',
    statusOn: 'ATIVO',
    statusOff: 'OFF',
    nodeBlockedTooltip: '[BLOQUEADO] Nó sem chave de API operante. Insira no botão [COFRE // CHAVES].',
    nodeToggleTooltip: 'Clique para ativar/desativar supercomputador',

    clockLabel: 'HORÁRIO ATUAL',
    clockTooltip: 'Relógio Oficial NERV Tokyo-3 (Horário Local)',
    timerLabel: 'HORÁRIO',
    timerTitle: 'HORÁRIO ATUAL // NERV TOKYO-3',
    timerReset: 'Reiniciar relógio tático',
    timerPause: 'Pausar',
    timerResume: 'Retomar',
    crtTitle: 'Alternar efeito de linhas CRT / Fósforo',
    soundOn: 'SOM: ON',
    soundOff: 'SOM: OFF',
    soundActiveTooltip: 'Desativar sintetizador sonoro retrô',
    soundInactiveTooltip: 'Ativar som de sintetizador NERV',
    vaultButton: 'COFRE // CHAVES',
    vaultShort: 'COFRE',
    vaultTooltip: 'Cofre de Chaves de API e Nome do Operador',
    downloadPcButton: 'BAIXAR PC',
    downloadPcTooltip: 'Baixar Pacote Standalone para Instalação no PC',
    purgeButton: 'LIMPAR DADOS',
    purgeTooltip: 'Limpar todas as chaves de API, histórico de conversas e arquivos/imagens',
    purgeConfirmText: 'CONFIRMAÇÃO NERV: Deseja realmente limpar todas as chaves de API cadastradas, histórico de conversas e arquivos gerados?',
    quotaCheckButton: '% USO IAs',
    quotaCheckTooltip: 'Verificar porcentagem disponível de uso e cota de cada IA (/quota)',
    langSelectTitle: 'Selecionar idioma da plataforma NERV',

    angelsButton: 'ANGELS // CONTEXTO',
    angelsTooltip: 'Controle de Contexto e Skills (Referência e Base de Conhecimento)',
    angelsTitle: 'NERV // ANGELS CONTEXT CONTROL',
    angelsSubtitle: 'DEFINIÇÃO DE SKILL E BASE DE CONHECIMENTO ATIVA',
    angelsActiveSkill: 'SKILL ATIVA',
    angelsNoActiveSkill: 'NENHUMA SKILL ATIVA',

    operatorNameLabel: 'NOME DO USUÁRIO / OPERADOR',
    operatorDefaultName: 'Usuário',
    operatorEditTitle: 'Edite a identificação do operador local',
    operatorClearanceLabel: 'NÍVEL DE LIBERAÇÃO',
    bottomMenuLabel: 'MENU TÁTICO INFERIOR // NERV CONSOLE',

    commandsTitle: 'COMANDOS:',
    quickCmdScript: '[CRIAR SCRIPT EM TODAS]',
    quickCmdJoint: '[CONSULTA CONJUNTA]',
    quickCmdTestFile: '[TESTAR MENU PISCANTE]',
    quickCmdQuota: '[% USO DAS IAs]',
    promptPlaceholderWorking: 'MAGI DELIBERANDO... AGUARDE A RESPOSTA NEURAL',
    promptPlaceholderNoNodes: 'ATENÇÃO: NENHUM NÓ ATIVO NO HEADER. ATIVE AO MENOS UM MAGI.',
    promptPlaceholderDefault: 'Digite sua mensagem ou comando. [ENTER para enviar simultaneamente a todas as IAs | SHIFT+ENTER quebra linha]',
    promptOperatorKicker: 'OPERADOR@MAGI:',
    transmitButton: 'TRANSMITIR',
    targetNodesLabel: (count: number) => `ALVO: ${count} NÓS ATIVOS (SIMULTÂNEO)`,
    tripleDeliberation: 'DELIBERAÇÃO MAGI MULTI-IA',
    singleOperatorMode: 'MODO EXCLUSIVO: OPERADOR ÚNICO ATIVO',
    awaitingOperatorPrompt: 'Aguardando iterações do operador',

    bootMsg1: 'NERV CENTRAL DOGMA // INICIALIZAÇÃO DA MATRIZ MAGI CONCLUÍDA.',
    bootMsg2: 'SUPERCOMPUTADORES INTEGRADOS: UNIT-00 (ChatGPT) · UNIT-01 (Claude) · UNIT-02 (Gemini) · UNIT-03 (Grok) · UNIT-04 (DeepSeek).',
    bootMsg3: 'CONFIRMAÇÃO DE SEGURANÇA: Chaves de API cadastradas, histórico de conversas e imagens/arquivos foram limpos com sucesso.',
    bootMsg4: 'MONITORAMENTO DE IAs: Supercomputadores sem chave de API ativa exibem luz vermelha e permanecem bloqueados contra seleção. Insira as chaves em [COFRE // CHAVES] para ativá-los.',
    bootMsg5: 'MENUS LATERAIS: Exibem apenas as setas centralizadas na janela de contexto. Elas piscam ao receber novos registros até você abri-las.',
    systemNormal: 'NERV MAGI DELIBERATION GRID // SISTEMA NORMAL',
    operatorClearance: 'OPERADOR AUTENTICADO // LIBERAÇÃO A-17',
    integratedNodesNotice: 'IAs INTEGRADAS: UNIT-00 (ChatGPT) · UNIT-01 (Claude) · UNIT-02 (Gemini) · UNIT-03 (Grok) · UNIT-04 (DeepSeek)',
    typeAnyCommandNotice: 'Digite qualquer instrução ou comando abaixo para transmissão instantânea.',
    alertTransmissionFailed: 'FALHA CRÍTICA NO PROTOCOLO DE TRANSMISSÃO MAGI:',
    consensusTitle: 'CONSENSO MAGI',
    artifactsSavedInVault: (count: number) => `${count} NOVO(S) ARQUIVO(S) REGISTRADO(S) NO COFRE DA NERV`,
    viewInDrawer: 'ABRIR NO PAINEL LATERAL',

    quotaReportHeader: 'NERV CENTRAL DOGMA // RELATÓRIO DE COTA E TELEMETRIA DAS IAs',
    quotaReportSub: 'MONITORAMENTO EM TEMPO REAL DA PORCENTAGEM DE USO DISPONÍVEL',
    quotaAvailableLabel: 'DISPONÍVEL',
    quotaBlockedLabel: 'BLOQUEADO',
    requestsExecuted: 'Requisições executadas',
    tokensConsumedRemaining: 'Tokens consumidos / Cota estimada',
    syncRateLabel: 'Taxa de sincronia neural',
    keyStatusLabel: 'Status de chave',
    keyActiveServer: 'Chave ativa no servidor',
    keyActiveVault: 'Chave fornecida no cofre do operador',
    keyMissing: 'Sem chave ativa (Nó bloqueado)',
    quotaAdvice: 'Para redefinir contadores de cota da sessão, use o comando /purge ou o botão [LIMPAR DADOS].',

    historyDrawerTitle: 'HISTÓRICO // DIRETIVAS',
    historyDrawerSubtitle: 'REGISTRO DE TODAS AS DELIBERAÇÕES MAGI',
    historyTriggerTooltipNew: (count: number) => `Histórico NERV (${count} novas conversas registradas)`,
    historyTriggerCollapse: 'Recolher menu de histórico',
    historyTriggerExpand: 'Expandir menu de histórico',
    filesDrawerTitle: 'COFRE // ARQUIVOS & IMAGENS',
    filesDrawerSubtitle: 'ARTEFATOS E SCRIPTS GERADOS PELAS IAs',
    filesTriggerTooltipNew: (count: number) => `Cofre de Arquivos (${count} novos arquivos gerados)`,
    filesTriggerCollapse: 'Recolher menu de arquivos',
    filesTriggerExpand: 'Expandir menu de arquivos',
    downloadAllZip: 'BAIXAR TUDO (.ZIP)',
    clearFilesButton: 'LIMPAR ARQUIVOS',
  },

  ENG: {
    brandTitle: 'NERV',
    magiSystem: 'MAGI HUB',
    centralDogma: 'CENTRAL DOGMA // SYNCHRONOUS DELIBERATION PROTOCOL',
    linkStatus: 'LINK STATUS',
    transmitting: 'TRANSMITTING DATA',
    operational: 'OPERATIONAL',
    restrictedAccess: 'SECURITY CLEARANCE: RESTRICTED A-17',

    melchiorTitle: 'UNIT-00',
    balthasarTitle: 'UNIT-01',
    casperTitle: 'UNIT-02',
    grokTitle: 'UNIT-03',
    deepseekTitle: 'UNIT-04',
    withoutKey: 'NO KEY',
    processing: 'PROCESSING',
    statusOn: 'ONLINE',
    statusOff: 'OFFLINE',
    nodeBlockedTooltip: '[BLOCKED] Node lacks active API key. Insert via [KEY VAULT].',
    nodeToggleTooltip: 'Click to toggle supercomputer node',

    clockLabel: 'LOCAL TIME',
    clockTooltip: 'Official NERV Tokyo-3 System Clock',
    timerLabel: 'CLOCK',
    timerTitle: 'CURRENT TIME // NERV TOKYO-3',
    timerReset: 'Reset tactical clock',
    timerPause: 'Pause',
    timerResume: 'Resume',
    crtTitle: 'Toggle Phosphor CRT Scanlines',
    soundOn: 'AUDIO: ON',
    soundOff: 'AUDIO: OFF',
    soundActiveTooltip: 'Mute retro synthesizer sound FX',
    soundInactiveTooltip: 'Enable NERV retro synthesizer audio',
    vaultButton: 'KEY VAULT',
    vaultShort: 'VAULT',
    vaultTooltip: 'Security Vault for API Credentials & Operator Name',
    downloadPcButton: 'DOWNLOAD PC',
    downloadPcTooltip: 'Download Standalone Offline PC Installer',
    purgeButton: 'PURGE DATA',
    purgeTooltip: 'Wipe all saved API keys, conversation history, and generated artifacts',
    purgeConfirmText: 'NERV SECURITY CONFIRMATION: Are you sure you want to purge all API credentials, conversation history, and files?',
    quotaCheckButton: '% AI USAGE',
    quotaCheckTooltip: 'Check available usage percentage and quota for each AI (/quota)',
    langSelectTitle: 'Select NERV platform language',

    angelsButton: 'ANGELS // CONTEXT',
    angelsTooltip: 'Context Control & Skills (Reference & Knowledge Base)',
    angelsTitle: 'NERV // ANGELS CONTEXT CONTROL',
    angelsSubtitle: 'ACTIVE SKILL AND KNOWLEDGE BASE CONFIGURATION',
    angelsActiveSkill: 'ACTIVE SKILL',
    angelsNoActiveSkill: 'NO ACTIVE SKILL',

    operatorNameLabel: 'USER / OPERATOR NAME',
    operatorDefaultName: 'Usuário',
    operatorEditTitle: 'Edit local operator identification',
    operatorClearanceLabel: 'SECURITY CLEARANCE',
    bottomMenuLabel: 'TACTICAL BOTTOM BAR // NERV CONSOLE',

    commandsTitle: 'COMMANDS:',
    quickCmdScript: '[GENERATE CODE ALL]',
    quickCmdJoint: '[JOINT QUERY]',
    quickCmdTestFile: '[TEST FLASHING MENU]',
    quickCmdQuota: '[CHECK % USAGE]',
    promptPlaceholderWorking: 'MAGI DELIBERATING... AWAITING NEURAL CONSENSUS',
    promptPlaceholderNoNodes: 'WARNING: NO ACTIVE NODES. ENABLE AT LEAST ONE MAGI SUPERCOMPUTER.',
    promptPlaceholderDefault: 'Enter your command or prompt. [ENTER to broadcast to all active AIs | SHIFT+ENTER for newline]',
    promptOperatorKicker: 'OPERATOR@MAGI:',
    transmitButton: 'TRANSMIT',
    targetNodesLabel: (count: number) => `TARGET: ${count} ACTIVE NODES (SIMULTANEOUS)`,
    tripleDeliberation: 'MULTI-AI DELIBERATION GRID',
    singleOperatorMode: 'EXCLUSIVE OPERATOR CONTROL ACTIVE',
    awaitingOperatorPrompt: 'Awaiting operator input',

    bootMsg1: 'NERV CENTRAL DOGMA // MAGI SUPERCOMPUTER MATRIX INITIALIZED.',
    bootMsg2: 'INTEGRATED SUPERCOMPUTERS: UNIT-00 (ChatGPT) · UNIT-01 (Claude) · UNIT-02 (Gemini) · UNIT-03 (Grok) · UNIT-04 (DeepSeek).',
    bootMsg3: 'SECURITY CONFIRMATION: Registered API keys, chat history, and generated files were wiped clean.',
    bootMsg4: 'AI NODE MONITOR: Nodes lacking API keys display red status lights and are locked. Enter keys in [KEY VAULT] to unlock.',
    bootMsg5: 'SIDE DRAWERS: Flashing centered arrow tabs indicate incoming logs and files until viewed.',
    systemNormal: 'NERV MAGI DELIBERATION GRID // ALL SYSTEMS NORMAL',
    operatorClearance: 'OPERATOR AUTHENTICATED // CLEARANCE LEVEL A-17',
    integratedNodesNotice: 'INTEGRATED AIs: UNIT-00 (ChatGPT) · UNIT-01 (Claude) · UNIT-02 (Gemini) · UNIT-03 (Grok) · UNIT-04 (DeepSeek)',
    typeAnyCommandNotice: 'Type any prompt or directive below for simultaneous transmission.',
    alertTransmissionFailed: 'CRITICAL FAILURE IN MAGI TRANSMISSION PROTOCOL:',
    consensusTitle: 'MAGI CONSENSUS RESOLUTION',
    artifactsSavedInVault: (count: number) => `${count} NEW ARTIFACT(S) SAVED IN NERV STORAGE`,
    viewInDrawer: 'VIEW IN LATERAL DRAWER',

    quotaReportHeader: 'NERV CENTRAL DOGMA // AI USAGE & QUOTA TELEMETRY REPORT',
    quotaReportSub: 'REAL-TIME MONITORING OF AVAILABLE AI COMPUTATIONAL CAPACITY',
    quotaAvailableLabel: 'AVAILABLE',
    quotaBlockedLabel: 'BLOCKED',
    requestsExecuted: 'Queries executed',
    tokensConsumedRemaining: 'Tokens consumed / Estimated quota',
    syncRateLabel: 'Neural synchronization rate',
    keyStatusLabel: 'Key status',
    keyActiveServer: 'Active server key',
    keyActiveVault: 'Provided via Operator Vault',
    keyMissing: 'Missing key (Node locked)',
    quotaAdvice: 'To reset session quota meters, run /purge or click [PURGE DATA].',

    historyDrawerTitle: 'DIRECTIVE LOGS',
    historyDrawerSubtitle: 'COMPLETE ARCHIVE OF MAGI DELIBERATIONS',
    historyTriggerTooltipNew: (count: number) => `NERV Logs (${count} new sessions recorded)`,
    historyTriggerCollapse: 'Collapse history drawer',
    historyTriggerExpand: 'Expand history drawer',
    filesDrawerTitle: 'VAULT // FILES & MEDIA',
    filesDrawerSubtitle: 'ARTIFACTS GENERATED BY MAGI SUPERCOMPUTERS',
    filesTriggerTooltipNew: (count: number) => `Files Vault (${count} new artifacts generated)`,
    filesTriggerCollapse: 'Collapse files drawer',
    filesTriggerExpand: 'Expand files drawer',
    downloadAllZip: 'DOWNLOAD ALL (.ZIP)',
    clearFilesButton: 'CLEAR FILES',
  },

  JPN: {
    brandTitle: 'NERV',
    magiSystem: 'MAGI HUB',
    centralDogma: 'セントラルドグマ // 同時合議制プロトコル',
    linkStatus: '回線状態',
    transmitting: 'データ送信中',
    operational: '通常稼働中',
    restrictedAccess: '機密レベル: A-17 限定クリアランス',

    melchiorTitle: 'UNIT-00',
    balthasarTitle: 'UNIT-01',
    casperTitle: 'UNIT-02',
    grokTitle: 'UNIT-03',
    deepseekTitle: 'UNIT-04',
    withoutKey: 'キー未設定',
    processing: '処理実行中',
    statusOn: '稼働中',
    statusOff: '停止',
    nodeBlockedTooltip: '[ロック中] APIキーが未設定です。[キー保管庫]で設定してください。',
    nodeToggleTooltip: 'クリックしてスーパーコンピュータの稼働を切替',

    clockLabel: '現在時刻',
    clockTooltip: 'NERV本部 第3新東京市 正式軍用時計',
    timerLabel: '時刻',
    timerTitle: '現在時刻 // 第3新東京市',
    timerReset: '時計をリセット',
    timerPause: '一時停止',
    timerResume: '再開',
    crtTitle: 'CRTブラウン管走査線フィルター切替',
    soundOn: '音声: ON',
    soundOff: '音声: OFF',
    soundActiveTooltip: 'レトロシンセ音を消音',
    soundInactiveTooltip: 'NERVシステム効果音を有効化',
    vaultButton: '暗号保管庫',
    vaultShort: '保管庫',
    vaultTooltip: 'APIキー暗号保管庫とオペレータ名設定',
    downloadPcButton: 'PC版取得',
    downloadPcTooltip: 'PC用オフライン独立パッケージをダウンロード',
    purgeButton: '全消去',
    purgeTooltip: '全APIキー・対話履歴・生成ファイルを即時完全消去',
    purgeConfirmText: 'NERV機密確認: 登録されたすべてのAPIキー、履歴、ファイルを消去しますか？',
    quotaCheckButton: '% 使用残量',
    quotaCheckTooltip: '各AIの利用可能残量とクォータを確認 (/quota)',
    langSelectTitle: 'NERVプラットフォーム言語選択',

    angelsButton: 'ANGELS // コンテキスト',
    angelsTooltip: 'コンテキスト制御とスキル (ナレッジベース参照)',
    angelsTitle: 'NERV // ANGELS CONTEXT CONTROL',
    angelsSubtitle: 'アクティブスキルおよび知識ベース定義',
    angelsActiveSkill: '稼働中スキル',
    angelsNoActiveSkill: 'アクティブスキルなし',

    operatorNameLabel: 'ユーザー / オペレータ名',
    operatorDefaultName: 'Usuário',
    operatorEditTitle: 'オペレータ識別名の編集',
    operatorClearanceLabel: '承認レベル',
    bottomMenuLabel: '下部戦術メニュー // NERVコンソール',

    commandsTitle: 'コマンド:',
    quickCmdScript: '[全AIでスクリプト生成]',
    quickCmdJoint: '[MAGI合同審議]',
    quickCmdTestFile: '[点滅メニューのテスト]',
    quickCmdQuota: '[使用率・残量確認]',
    promptPlaceholderWorking: 'MAGI審議中... ニューラル合議の完了を待機中',
    promptPlaceholderNoNodes: '警告: 有効なMAGIノードがありません。上部で有効化してください。',
    promptPlaceholderDefault: '指令またはプロンプトを入力 [ENTERで全アクティブAIへ同時送信 | SHIFT+ENTERで改行]',
    promptOperatorKicker: 'オペレータ@MAGI:',
    transmitButton: '送信',
    targetNodesLabel: (count: number) => `対象: ${count} 稼働ノード (同時)`,
    tripleDeliberation: 'MAGI多元審議グリッド',
    singleOperatorMode: '単独専有オペレータ認証中',
    awaitingOperatorPrompt: 'オペレータの入力待ち',

    bootMsg1: 'NERV セントラルドグマ // MAGIマトリクス正常起動完了。',
    bootMsg2: '統合スーパーコンピュータ: UNIT-00 (ChatGPT) · UNIT-01 (Claude) · UNIT-02 (Gemini) · UNIT-03 (Grok) · UNIT-04 (DeepSeek)。',
    bootMsg3: 'セキュリティ確認: APIキー、会話ログ、ファイルキャッシュの初期化を完了。',
    bootMsg4: 'AIノード監視: APIキー未入力のノードは赤色点灯で選択不可です。[暗号保管庫]でキーを入力してください。',
    bootMsg5: 'サイドメニュー: 新着ログまたはファイルを受信すると中央の矢印が点滅して警告します。',
    systemNormal: 'NERV MAGI DELIBERATION GRID // システム正常',
    operatorClearance: 'オペレータ認証完了 // A-17クリアランス',
    integratedNodesNotice: '統合AI群: UNIT-00 (ChatGPT) · UNIT-01 (Claude) · UNIT-02 (Gemini) · UNIT-03 (Grok) · UNIT-04 (DeepSeek)',
    typeAnyCommandNotice: '指令を入力して即時送信してください。',
    alertTransmissionFailed: 'MAGI通信プロトコル致命的障害:',
    consensusTitle: 'MAGI合議決議',
    artifactsSavedInVault: (count: number) => `${count} 件の生成ファイルをNERV保管庫に登録`,
    viewInDrawer: 'サイドパネルで確認',

    quotaReportHeader: 'NERV セントラルドグマ // AI使用状況およびクォータ遠隔測定',
    quotaReportSub: '各人工知能の利用可能残量パーセンテージをリアルタイム監視中',
    quotaAvailableLabel: '利用可能',
    quotaBlockedLabel: '遮断中',
    requestsExecuted: '実行されたリクエスト数',
    tokensConsumedRemaining: '消費トークン数 / 推定クォータ',
    syncRateLabel: 'ニューラル同調率',
    keyStatusLabel: 'キー状態',
    keyActiveServer: 'サーバーキー有効',
    keyActiveVault: 'オペレータ保管庫キー有効',
    keyMissing: 'キー未設定 (ノード遮断)',
    quotaAdvice: 'セッション利用量メーターをリセットするには /purge コマンドまたは [全消去] を実行してください。',

    historyDrawerTitle: '指令ログ // 対話履歴',
    historyDrawerSubtitle: 'MAGI審議記録全アーカイブ',
    historyTriggerTooltipNew: (count: number) => `NERV対話履歴 (${count} 件の新規対話)`,
    historyTriggerCollapse: '履歴メニューを折りたたむ',
    historyTriggerExpand: '履歴メニューを展開',
    filesDrawerTitle: 'データ保管庫 // ファイル',
    filesDrawerSubtitle: 'MAGI各機が生成した成果物・コード',
    filesTriggerTooltipNew: (count: number) => `ファイル保管庫 (${count} 件の新規ファイル)`,
    filesTriggerCollapse: 'ファイルメニューを折りたたむ',
    filesTriggerExpand: 'ファイルメニューを展開',
    downloadAllZip: '一括ダウンロード (.ZIP)',
    clearFilesButton: 'ファイルを消去',
  },

  CHI: {
    brandTitle: 'NERV',
    magiSystem: 'MAGI HUB',
    centralDogma: '中央教条 // 同步审议协议',
    linkStatus: '链路状态',
    transmitting: '数据传输中',
    operational: '正常运转中',
    restrictedAccess: '保密权限: 限制级 A-17',

    melchiorTitle: 'UNIT-00',
    balthasarTitle: 'UNIT-01',
    casperTitle: 'UNIT-02',
    grokTitle: 'UNIT-03',
    deepseekTitle: 'UNIT-04',
    withoutKey: '未配置密钥',
    processing: '处理中',
    statusOn: '在线',
    statusOff: '离线',
    nodeBlockedTooltip: '[已锁定] 节点缺乏有效API密钥，请在[密钥保险库]中配置。',
    nodeToggleTooltip: '点击以切换超级计算机节点工作状态',

    clockLabel: '当前时间',
    clockTooltip: 'NERV第三新东京市官方军用时钟',
    timerLabel: '时间',
    timerTitle: '当前时间 // 第三新东京市',
    timerReset: '重置时钟',
    timerPause: '暂停',
    timerResume: '继续',
    crtTitle: '切换CRT显像管扫描线效果',
    soundOn: '音效: 开',
    soundOff: '音效: 关',
    soundActiveTooltip: '关闭复古合成器音效',
    soundInactiveTooltip: '开启NERV战术音效',
    vaultButton: '密钥保险库',
    vaultShort: '保险库',
    vaultTooltip: 'API密钥保险库及操作员姓名设置',
    downloadPcButton: '下载电脑版',
    downloadPcTooltip: '下载独立PC离线安装包',
    purgeButton: '清空数据',
    purgeTooltip: '彻底清空所有API密钥、对话历史记录和生成文件',
    purgeConfirmText: 'NERV安全确认: 您确定要彻底清空所有已保存的密钥、对话历史和文件吗？',
    quotaCheckButton: '% 使用残量',
    quotaCheckTooltip: '查询各AI可用使用百分比与额度 (/quota)',
    langSelectTitle: '选择NERV平台界面语言',

    angelsButton: 'ANGELS // 上下文',
    angelsTooltip: '上下文控制与技能 (提示词指令及知识库)',
    angelsTitle: 'NERV // ANGELS CONTEXT CONTROL',
    angelsSubtitle: '活跃技能与知识库基准定义',
    angelsActiveSkill: '生效技能',
    angelsNoActiveSkill: '无活跃技能',

    operatorNameLabel: '用户 / 操作员姓名',
    operatorDefaultName: 'Usuário',
    operatorEditTitle: '编辑本地操作员识别名',
    operatorClearanceLabel: '通行权限',
    bottomMenuLabel: '底部战术菜单 // NERV控制台',

    commandsTitle: '战术指令:',
    quickCmdScript: '[全体AI生成脚本]',
    quickCmdJoint: '[联合审议问答]',
    quickCmdTestFile: '[测试侧边栏闪烁]',
    quickCmdQuota: '[查询使用率/额度]',
    promptPlaceholderWorking: 'MAGI审议中... 等待神经网络一致裁决',
    promptPlaceholderNoNodes: '警告: 顶部无活跃MAGI节点，请至少激活一台计算机。',
    promptPlaceholderDefault: '输入指令或提示词 [ENTER同时向全体AI广播 | SHIFT+ENTER换行]',
    promptOperatorKicker: '操作员@MAGI:',
    transmitButton: '发射传输',
    targetNodesLabel: (count: number) => `目标: ${count} 活跃节点 (同时)`,
    tripleDeliberation: 'MAGI多元联合审议矩阵',
    singleOperatorMode: '独占操作员控制模式生效中',
    awaitingOperatorPrompt: '等待操作员输入指令',

    bootMsg1: 'NERV 中央教条 // MAGI超级计算机矩阵初始化完成。',
    bootMsg2: '集成超级计算机: UNIT-00 (ChatGPT) · UNIT-01 (Claude) · UNIT-02 (Gemini) · UNIT-03 (Grok) · UNIT-04 (DeepSeek)。',
    bootMsg3: '安全确认: 已清空所有注册API密钥、对话历史和文件缓存。',
    bootMsg4: 'AI节点监控: 无密钥节点亮红灯且锁定禁止选取，请在[密钥保险库]中录入密钥以激活。',
    bootMsg5: '侧边栏菜单: 收到新对话或生成文件时，中央箭头将持续闪烁警报直至打开查阅。',
    systemNormal: 'NERV MAGI DELIBERATION GRID // 系统运行正常',
    operatorClearance: '操作员已通过验证 // A-17权限核准',
    integratedNodesNotice: '集成AI群: UNIT-00 (ChatGPT) · UNIT-01 (Claude) · UNIT-02 (Gemini) · UNIT-03 (Grok) · UNIT-04 (DeepSeek)',
    typeAnyCommandNotice: '在下方输入任意指令以进行即时同步传输。',
    alertTransmissionFailed: 'MAGI通讯协议严重故障:',
    consensusTitle: 'MAGI一致性裁决',
    artifactsSavedInVault: (count: number) => `已将 ${count} 个新生成的文件保存至NERV数据库`,
    viewInDrawer: '在侧边面板中查看',

    quotaReportHeader: 'NERV 中央教条 // AI使用率及配额遥测报告',
    quotaReportSub: '实时监测各AI超级计算机的可用运算能力与剩余百分比',
    quotaAvailableLabel: '可用',
    quotaBlockedLabel: '已锁定',
    requestsExecuted: '已执行指令数',
    tokensConsumedRemaining: '已消耗Token / 估算限额',
    syncRateLabel: '神经同步率',
    keyStatusLabel: '密钥状态',
    keyActiveServer: '服务器预设密钥生效',
    keyActiveVault: '操作员保险库密钥生效',
    keyMissing: '未配置密钥 (节点已锁定)',
    quotaAdvice: '如需重置当前会话的配额计数，请使用 /purge 指令或点击[清空数据]按钮。',

    historyDrawerTitle: '指令档案 // 对话日志',
    historyDrawerSubtitle: 'MAGI全体联合审议完整记录',
    historyTriggerTooltipNew: (count: number) => `NERV对话历史 (${count} 条新记录)`,
    historyTriggerCollapse: '收起历史面板',
    historyTriggerExpand: '展开历史面板',
    filesDrawerTitle: '数据保险库 // 产出档案',
    filesDrawerSubtitle: 'MAGI各机生成的代码、脚本与媒体',
    filesTriggerTooltipNew: (count: number) => `文件保险库 (${count} 个新文件)`,
    filesTriggerCollapse: '收起文件面板',
    filesTriggerExpand: '展开文件面板',
    downloadAllZip: '打包下载全部 (.ZIP)',
    clearFilesButton: '清空文件库',
  },
};
