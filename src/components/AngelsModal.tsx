import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  FileText,
  Upload,
  Layers,
  Sparkles,
  AlertTriangle,
  FolderOpen,
  FileCode,
  Shield,
  Eye,
  Check,
  Search,
  Radio,
  FileUp,
} from 'lucide-react';
import { AngelSkill, AngelKnowledgeFile } from '../types/nerv';
import { playKeySound, playExecuteSound, playWarningSound } from '../utils/audio';
import { TranslationDictionary } from '../utils/i18n';

interface AngelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  angels: AngelSkill[];
  activeAngelId: string | null;
  onSelectActiveAngel: (id: string | null) => void;
  onSaveAngel: (angel: AngelSkill) => void;
  onDeleteAngel: (id: string) => void;
  t: TranslationDictionary;
}

export const AngelsModal: React.FC<AngelsModalProps> = ({
  isOpen,
  onClose,
  angels,
  activeAngelId,
  onSelectActiveAngel,
  onSaveAngel,
  onDeleteAngel,
  t,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAngel, setEditingAngel] = useState<AngelSkill | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list');
  const [viewingFile, setViewingFile] = useState<AngelKnowledgeFile | null>(null);

  // Form states for creating / editing
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [formFiles, setFormFiles] = useState<AngelKnowledgeFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const startCreate = () => {
    playKeySound();
    setIsCreating(true);
    setEditingAngel(null);
    setFormCode(`ANGEL-0${angels.length + 1}`);
    setFormName('');
    setFormDescription('');
    setFormInstructions('');
    setFormFiles([]);
    setActiveTab('editor');
  };

  const startEdit = (angel: AngelSkill) => {
    playKeySound();
    setIsCreating(false);
    setEditingAngel(angel);
    setFormCode(angel.code);
    setFormName(angel.name);
    setFormDescription(angel.description);
    setFormInstructions(angel.instructions);
    setFormFiles([...angel.files]);
    setActiveTab('editor');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      playWarningSound();
      return;
    }

    playExecuteSound();
    const now = new Date().toISOString();
    const angelId = isCreating ? `angel-${Date.now()}` : (editingAngel ? editingAngel.id : `angel-${Date.now()}`);

    const savedAngel: AngelSkill = {
      id: angelId,
      code: formCode.trim() || `ANGEL-0${angels.length + 1}`,
      name: formName.trim(),
      description: formDescription.trim(),
      instructions: formInstructions.trim(),
      files: formFiles,
      isActive: activeAngelId === angelId,
      createdAt: editingAngel ? editingAngel.createdAt : now,
      updatedAt: now,
    };

    onSaveAngel(savedAngel);
    setActiveTab('list');
    setEditingAngel(null);
    setIsCreating(false);
  };

  // Upload knowledge base files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded || uploaded.length === 0) return;

    Array.from(uploaded).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const textContent = (event.target?.result as string) || '';
        const newFile: AngelKnowledgeFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          content: textContent,
          uploadedAt: new Date().toLocaleTimeString(),
        };
        setFormFiles((prev) => [...prev, newFile]);
        playKeySound();
      };
      reader.readAsText(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId: string) => {
    playKeySound();
    setFormFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const filteredAngels = angels.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.code.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.instructions.toLowerCase().includes(q)
    );
  });

  const activeAngel = angels.find((a) => a.id === activeAngelId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs select-none">
      <div className="w-full max-w-4xl max-h-[92vh] bg-[#0c0906] border-2 border-[#00f0ff] shadow-[0_0_40px_rgba(0,240,255,0.35)] flex flex-col font-mono">
        {/* Top Hazard Cyan/Orange Stripe */}
        <div className="h-2 w-full bg-repeating-linear-gradient border-b border-black shrink-0"
             style={{
               background: 'repeating-linear-gradient(-45deg, #00f0ff 0, #00f0ff 12px, #050403 12px, #050403 24px)',
             }}
        />

        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 bg-[#09151e] border-b border-[#0f3448] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#00f0ff]/10 border border-[#00f0ff] text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.3)]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base text-[#00f0ff] tracking-wider">
                  NERV ANGELS // CONTROLE DE CONTEXTO & SKILLS
                </h2>
                <span className="text-[10px] text-[#00f0ff] border border-[#00f0ff] px-1.5 py-0.2">
                  COMANDO /angel
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#699cb3]">
                DEFINIÇÃO DE REFERÊNCIA OPERACIONAL, INSTRUÇÕES E BASE DE CONHECIMENTO DAS IAs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#699cb3] hover:text-[#ff2233] border border-[#1b3e52] hover:border-[#ff2233] transition-colors cursor-pointer"
              title="Fechar painel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Active Skill Tactical Status Bar */}
        <div className="px-4 py-2.5 bg-[#061118] border-b border-[#0f2c3d] flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[#699cb3] font-bold">STATUS DE CONTEXTO:</span>
            {activeAngel ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#042838] border border-[#00f0ff] text-[#00f0ff] font-bold shadow-[0_0_8px_rgba(0,240,255,0.25)]">
                <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
                <span>[{activeAngel.code}] {activeAngel.name}</span>
                <span className="text-[10px] text-[#70c9eb]">({activeAngel.files.length} arquivos na base)</span>
              </div>
            ) : (
              <span className="text-[#8a6845] italic">
                Nenhum Angel ativo (As IAs operam em contexto padrão livre)
              </span>
            )}
          </div>

          {activeAngelId && (
            <button
              type="button"
              onClick={() => {
                playKeySound();
                onSelectActiveAngel(null);
              }}
              className="px-2 py-1 text-[11px] border border-[#ff7a00] bg-[#1a1106] text-[#ffca8a] hover:bg-[#ff7a00] hover:text-black cursor-pointer font-bold transition-colors"
              title="Desativa a skill atual e restaura a operação sem instruções adicionais"
            >
              DESATIVAR SKILL (OPERAÇÃO PURA)
            </button>
          )}
        </div>

        {/* Navigation Tabs (List vs Create/Edit) */}
        <div className="px-4 py-2 bg-[#080d12] border-b border-[#142634] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playKeySound();
                setActiveTab('list');
              }}
              className={`px-3 py-1 font-bold border transition-colors cursor-pointer ${
                activeTab === 'list'
                  ? 'border-[#00f0ff] bg-[#00f0ff]/15 text-[#00f0ff]'
                  : 'border-[#1b3e52] text-[#699cb3] hover:text-[#00f0ff]'
              }`}
            >
              ANGELS CADASTRADOS ({angels.length})
            </button>

            <button
              type="button"
              onClick={startCreate}
              className={`px-3 py-1 font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'editor' && isCreating
                  ? 'border-[#4dff9a] bg-[#4dff9a]/15 text-[#4dff9a]'
                  : 'border-[#1b3e52] text-[#699cb3] hover:text-[#4dff9a]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>CRIAR NOVO ANGEL / SKILL</span>
            </button>
          </div>

          {activeTab === 'list' && (
            <div className="flex items-center gap-1.5 bg-[#04080c] border border-[#1b3e52] px-2 py-0.5 text-xs">
              <Search className="w-3.5 h-3.5 text-[#699cb3]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar skill ou instrução..."
                className="bg-transparent text-white placeholder-[#456b7d] outline-none text-[11px] w-36 sm:w-48 font-mono"
              />
            </div>
          )}
        </div>

        {/* Tab 1: Angels List View */}
        {activeTab === 'list' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredAngels.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#1b3e52] bg-[#060a0f]">
                <Layers className="w-10 h-10 text-[#2a5369] mb-3" />
                <p className="text-sm text-[#00f0ff] font-bold">
                  {searchQuery ? 'NENHUM ANGEL ENCONTRADO' : 'NENHUM ANGEL CADASTRADO'}
                </p>
                <p className="text-xs text-[#699cb3] mt-2 max-w-md leading-relaxed">
                  {searchQuery
                    ? 'Nenhuma skill corresponde ao termo pesquisado.'
                    : 'Cadastre sua primeira skill de referência clicando no botão abaixo. Defina o nome, descrição, instruções operacionais e anexe arquivos na base de conhecimento para guiar as 5 UNITs.'}
                </p>
                <button
                  type="button"
                  onClick={startCreate}
                  className="mt-4 px-3 py-1.5 bg-[#00f0ff] text-black font-bold text-xs cursor-pointer flex items-center gap-1.5 hover:bg-white"
                >
                  <Plus className="w-4 h-4" />
                  <span>CRIAR PRIMEIRO ANGEL</span>
                </button>
              </div>
            ) : (
              filteredAngels.map((angel) => {
                const isActive = activeAngelId === angel.id;
                return (
                  <div
                    key={angel.id}
                    className={`p-3.5 border-2 transition-all flex flex-col gap-2.5 ${
                      isActive
                        ? 'border-[#00f0ff] bg-[#071924] shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                        : 'border-[#1b303d] bg-[#080d12] hover:border-[#00f0ff]/60'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-[#00f0ff] tracking-wider">
                          [{angel.code}]
                        </span>
                        <span className="font-bold text-white text-sm">
                          {angel.name}
                        </span>
                        {isActive && (
                          <span className="text-[10px] bg-[#00f0ff] text-black font-bold px-1.5 py-0.2 animate-pulse">
                            EM OPERAÇÃO NA JANELA DE CONTEXTO
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            playExecuteSound();
                            onSelectActiveAngel(isActive ? null : angel.id);
                          }}
                          className={`px-3 py-1 text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            isActive
                              ? 'border-[#4dff9a] bg-[#082917] text-[#4dff9a] hover:bg-[#ff2233] hover:text-white hover:border-[#ff2233]'
                              : 'border-[#00f0ff] bg-[#061821] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                          }`}
                          title={isActive ? 'Desativar este Angel' : 'Ativar este Angel como contexto operacional'}
                        >
                          <Radio className="w-3.5 h-3.5" />
                          <span>{isActive ? 'ATIVO (CLIQUE P/ DESATIVAR)' : 'ATIVAR ESTA SKILL'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => startEdit(angel)}
                          className="p-1.5 text-[#699cb3] hover:text-[#00f0ff] border border-[#1b303d] hover:border-[#00f0ff] cursor-pointer"
                          title="Editar este Angel"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Confirma a exclusão do Angel [${angel.name}]?`)) {
                              playKeySound();
                              onDeleteAngel(angel.id);
                            }
                          }}
                          className="p-1.5 text-[#699cb3] hover:text-[#ff2233] border border-[#1b303d] hover:border-[#ff2233] cursor-pointer"
                          title="Excluir este Angel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {angel.description && (
                      <p className="text-xs text-[#a2c8d9] leading-relaxed">
                        {angel.description}
                      </p>
                    )}

                    {/* Instructions Snippet */}
                    <div className="p-2.5 bg-[#04080c] border border-[#11232e] text-xs text-[#82a9bc] font-mono select-text">
                      <span className="text-[#00f0ff] block text-[10px] font-bold mb-1">
                        &gt; DIRETRIZES &amp; INSTRUÇÕES DO CONTEXTO:
                      </span>
                      <p className="line-clamp-3 leading-relaxed whitespace-pre-wrap">
                        {angel.instructions || '(Sem instruções específicas definidas)'}
                      </p>
                    </div>

                    {/* Knowledge Base Files Chips */}
                    {angel.files.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-[#558196] font-bold">
                          BASE DE CONHECIMENTO ({angel.files.length}):
                        </span>
                        {angel.files.map((file) => (
                          <button
                            key={file.id}
                            type="button"
                            onClick={() => {
                              playKeySound();
                              setViewingFile(file);
                            }}
                            className="px-2 py-0.5 text-[10px] bg-[#07131b] border border-[#1b3b4f] text-[#00f0ff] hover:border-[#00f0ff] cursor-pointer flex items-center gap-1"
                            title="Clique para ver o conteúdo anexado"
                          >
                            <FileCode className="w-3 h-3" />
                            <span className="truncate max-w-[160px]">{file.name}</span>
                            <span className="text-[#558196]">({(file.size / 1024).toFixed(1)}KB)</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Create / Edit Form */}
        {activeTab === 'editor' && (
          <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#00f0ff] mb-1">
                  CÓDIGO TÁTICO
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="Ex: ANGEL-03, ANGEL-CUSTOM"
                  className="w-full bg-[#05090d] border border-[#1b3b4f] px-3 py-2 text-xs text-white focus:border-[#00f0ff] outline-none font-mono"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#00f0ff] mb-1">
                  NOME DO ANGEL / SKILL
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Engenharia de Software Full-Stack & Clean Code"
                  className="w-full bg-[#05090d] border border-[#1b3b4f] px-3 py-2 text-xs text-white focus:border-[#00f0ff] outline-none font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#00f0ff] mb-1">
                DESCRIÇÃO / OBJETIVO DA DEMANDA
              </label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Ex: Especialista focado em performance, robustez e salvaguardas de conformidade"
                className="w-full bg-[#05090d] border border-[#1b3b4f] px-3 py-2 text-xs text-white focus:border-[#00f0ff] outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#00f0ff] mb-1">
                INSTRUÇÕES OPERACIONAIS (LIDAS POR TODAS AS UNITs)
              </label>
              <textarea
                value={formInstructions}
                onChange={(e) => setFormInstructions(e.target.value)}
                rows={6}
                placeholder="Defina diretrizes, tom, restrições e premissas técnicas que todas as IAs devem seguir quando este Angel estiver ativo..."
                className="w-full bg-[#05090d] border border-[#1b3b4f] p-3 text-xs text-white focus:border-[#00f0ff] outline-none font-mono resize-y"
              />
            </div>

            {/* Knowledge Base Uploads */}
            <div className="p-3.5 bg-[#05090e] border border-[#1b3e52]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div>
                  <span className="text-xs font-bold text-[#00f0ff] block">
                    BASE DE CONHECIMENTO &amp; ARQUIVOS DE REFERÊNCIA
                  </span>
                  <span className="text-[10px] text-[#558196]">
                    Anexe arquivos (.txt, .md, .py, .ts, .json, .csv) para serem lidos pelas IAs
                  </span>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="angel-file-upload"
                  />
                  <label
                    htmlFor="angel-file-upload"
                    className="px-2.5 py-1.5 border border-[#00f0ff] bg-[#071720] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>INCLUIR ARQUIVO NA BASE</span>
                  </label>
                </div>
              </div>

              {/* Uploaded Files List */}
              {formFiles.length === 0 ? (
                <div className="p-4 border border-dashed border-[#1b303d] text-center text-[11px] text-[#558196]">
                  Nenhum arquivo anexado a esta skill ainda. Clique em "Incluir Arquivo na Base" para fazer upload de documentações ou códigos.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {formFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-2 bg-[#091117] border border-[#182e3c] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode className="w-4 h-4 text-[#00f0ff] shrink-0" />
                        <span className="text-white font-bold truncate">{file.name}</span>
                        <span className="text-[10px] text-[#558196] shrink-0">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setViewingFile(file)}
                          className="px-2 py-0.5 text-[10px] border border-[#1b3e52] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black cursor-pointer"
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file.id)}
                          className="p-1 text-[#699cb3] hover:text-[#ff2233] cursor-pointer"
                          title="Remover arquivo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#142634]">
              <button
                type="button"
                onClick={() => {
                  playKeySound();
                  setActiveTab('list');
                }}
                className="px-3 py-1.5 border border-[#1b3e52] text-[#699cb3] hover:text-white text-xs cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-4 py-1.5 bg-[#00f0ff] text-black font-bold text-xs cursor-pointer hover:bg-white transition-all shadow-[0_0_12px_rgba(0,240,255,0.4)]"
              >
                {isCreating ? 'SALVAR NOVO ANGEL' : 'ATUALIZAR ANGEL'}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="p-3 bg-[#070e14] border-t border-[#0f2c3d] flex items-center justify-between text-[10px] text-[#558196] shrink-0">
          <span>PROTOCOLO ANGEL: CONTEXTO INJETADO EM TEMPO REAL NAS 5 UNITs</span>
          <button
            type="button"
            onClick={onClose}
            className="text-[#00f0ff] hover:underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Internal Knowledge File Viewer Modal */}
      {viewingFile && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 select-none">
          <div className="w-full max-w-2xl max-h-[85vh] bg-[#091117] border-2 border-[#00f0ff] flex flex-col font-mono">
            <div className="p-3 bg-[#0d1d27] border-b border-[#1b3e52] flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <FileCode className="w-4 h-4 text-[#00f0ff]" />
                <span className="font-bold text-sm text-white truncate">{viewingFile.name}</span>
                <span className="text-[10px] text-[#699cb3]">
                  ({(viewingFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingFile(null)}
                className="p-1 text-[#699cb3] hover:text-[#ff2233] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 text-xs text-[#a2c8d9] font-mono whitespace-pre-wrap select-text leading-relaxed">
              {viewingFile.content}
            </div>
            <div className="p-2.5 bg-[#060c11] border-t border-[#1b3e52] text-right">
              <button
                type="button"
                onClick={() => setViewingFile(null)}
                className="px-3 py-1 bg-[#00f0ff] text-black font-bold text-xs cursor-pointer"
              >
                Fechar Visualizador
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
