import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Tag, Check, X, RefreshCw, Plus, Search } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const PRESET_COLORS = [
  '#8b5cf6', // Roxo
  '#3b82f6', // Azul
  '#06b6d4', // Ciano
  '#10b981', // Esmeralda
  '#f59e0b', // Âmbar
  '#ef4444', // Vermelho
  '#ec4899', // Rosa
  '#6366f1', // Índigo
];

export default function StudentAssignTagsModal({ isOpen, onClose, student, onSuccess }) {
  const [allTags, setAllTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#8b5cf6');
  const [creatingTag, setCreatingTag] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen && student) {
      document.body.style.overflow = 'hidden';
      // Preencher com as tags já atribuídas ao aluno
      const currentIds = (student.tags || []).map((t) => t.id);
      setSelectedTagIds(currentIds);
      setNewTagName('');
      setSearchQuery('');
      fetchAllTags();
    } else {
      document.body.style.overflow = '';
      setSelectedTagIds([]);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, student]);

  const fetchAllTags = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/v1/students/tags', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setAllTags(Array.isArray(data) ? data : []);
      }
    } catch {
      addToast('Erro ao carregar lista de etiquetas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreateAndAssignTag = async (e) => {
    if (e) e.preventDefault();
    const trimmed = newTagName.trim();
    if (!trimmed) {
      addToast('Informe o nome da nova etiqueta', 'error');
      return;
    }
    setCreatingTag(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/v1/students/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: trimmed,
          color: newTagColor,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Falha ao criar etiqueta');
      }
      const createdTag = await res.json();
      setAllTags((prev) => [...prev, createdTag]);
      setSelectedTagIds((prev) => [...prev, createdTag.id]);
      setNewTagName('');
      addToast(`Etiqueta "${createdTag.name}" criada e marcada!`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setCreatingTag(false);
    }
  };

  const handleSave = async () => {
    if (!student) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/students/tags/student/${student.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ tag_ids: selectedTagIds }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar etiquetas do aluno');
      addToast(`Etiquetas de "${student.name}" atualizadas com sucesso!`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !student) return null;

  const filteredTags = allTags.filter((t) =>
    (t.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px',
      }}
      data-testid="student-assign-tags-modal-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '88vh',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8fafc',
        }}
        data-testid="student-assign-tags-modal-container"
      >
        {/* Cabeçalho */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                color: '#a78bfa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Tag size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                Etiquetas do Aluno
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                {student.name} ({student.email})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
            data-testid="close-assign-tags-modal-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Criação Rápida de Nova Etiqueta na Hora */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
            Criar e Atribuir Nova Etiqueta:
          </label>
          <form onSubmit={handleCreateAndAssignTag} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Ex: VIP, Mentoria, Sem Curso..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f8fafc',
                  fontSize: '0.84rem',
                  outline: 'none',
                }}
                data-testid="inline-create-tag-input"
              />
              <button
                type="submit"
                disabled={creatingTag || !newTagName.trim()}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#8b5cf6',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: creatingTag || !newTagName.trim() ? 'not-allowed' : 'pointer',
                  opacity: creatingTag || !newTagName.trim() ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                }}
                data-testid="inline-create-tag-btn"
              >
                {creatingTag ? <RefreshCw size={14} className="spin" /> : <Plus size={14} />}
                + Criar
              </button>
            </div>

            {/* Paleta rápida de cores para nova etiqueta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Cor:</span>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewTagColor(c)}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    border: newTagColor === c ? '2px solid #ffffff' : '1px solid transparent',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  title={c}
                />
              ))}
            </div>
          </form>
        </div>

        {/* Campo de Busca Rápida se houver várias etiquetas */}
        {allTags.length > 5 && (
          <div style={{ padding: '10px 20px 0 20px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar etiquetas..."
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  borderRadius: '6px',
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        )}

        {/* Lista de Etiquetas para Seleção */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
              <RefreshCw size={20} className="spin" style={{ marginBottom: '8px', display: 'inline-block' }} />
              <div>Carregando etiquetas...</div>
            </div>
          ) : allTags.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '0.84rem' }}>
              Nenhuma etiqueta cadastrada ainda. Digite um nome acima para criar a primeira etiqueta para este aluno!
            </div>
          ) : filteredTags.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.84rem' }}>
              Nenhuma etiqueta correspondente a "{searchQuery}".
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredTags.map((tag) => {
                const isChecked = selectedTagIds.includes(tag.id);
                return (
                  <div
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: isChecked ? 'rgba(139, 92, 246, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                      border: isChecked ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                    data-testid={`assign-tag-option-${tag.id}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: tag.color || '#3b82f6',
                          boxShadow: `0 0 8px ${tag.color || '#3b82f6'}`,
                        }}
                      />
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
                        {tag.name}
                      </span>
                    </div>

                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        border: isChecked ? 'none' : '1px solid rgba(255, 255, 255, 0.25)',
                        backgroundColor: isChecked ? '#8b5cf6' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                      }}
                    >
                      {isChecked && <Check size={14} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé com Salvar */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'transparent',
              color: '#94a3b8',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              backgroundColor: '#8b5cf6',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(139, 92, 246, 0.3)',
            }}
            data-testid="save-student-tags-btn"
          >
            {saving ? <RefreshCw size={15} className="spin" /> : <Check size={15} />}
            Salvar Etiquetas
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
