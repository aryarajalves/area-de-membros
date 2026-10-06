import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Tag, Plus, X, Trash2, Edit3, Check, RefreshCw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import StudentTagDeleteConfirmModal from './StudentTagDeleteConfirmModal';

const PRESET_COLORS = [
  '#3b82f6', // Azul
  '#10b981', // Verde
  '#f59e0b', // Âmbar
  '#ef4444', // Vermelho
  '#8b5cf6', // Roxo
  '#ec4899', // Rosa
  '#06b6d4', // Ciano
  '#14b8a6', // Teal
];

export default function StudentTagsModal({ isOpen, onClose, onTagsUpdated }) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(PRESET_COLORS[0]);
  const [tagDescription, setTagDescription] = useState('');
  const [editingTagId, setEditingTagId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [tagToDelete, setTagToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      fetchTags();
    } else {
      document.body.style.overflow = '';
      setTagName('');
      setTagDescription('');
      setEditingTagId(null);
      setTagToDelete(null);
      setDeleting(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/v1/students/tags', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setTags(Array.isArray(data) ? data : []);
      }
    } catch {
      addToast('Erro ao carregar etiquetas de alunos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (!tagName.trim()) {
      addToast('Informe o nome da etiqueta', 'error');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/v1/students/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: tagName.trim(),
          color: tagColor,
          description: tagDescription.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Falha ao criar etiqueta');
      }
      addToast(`Etiqueta "${tagName}" criada com sucesso!`, 'success');
      setTagName('');
      setTagDescription('');
      fetchTags();
      if (onTagsUpdated) onTagsUpdated();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTag = async (tagId) => {
    if (!editName.trim()) {
      addToast('O nome da etiqueta não pode ficar vazio', 'error');
      return;
    }
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/students/tags/${tagId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: editName.trim(),
          color: editColor,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Falha ao atualizar etiqueta');
      }
      addToast('Etiqueta atualizada com sucesso!', 'success');
      setEditingTagId(null);
      fetchTags();
      if (onTagsUpdated) onTagsUpdated();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!tagToDelete) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/students/tags/${tagToDelete.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Falha ao excluir etiqueta');
      addToast(`Etiqueta "${tagToDelete.name}" excluída com sucesso!`, 'success');
      setTagToDelete(null);
      fetchTags();
      if (onTagsUpdated) onTagsUpdated();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

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
      data-testid="student-tags-modal-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8fafc',
        }}
        data-testid="student-tags-modal-container"
      >
        {/* Cabeçalho */}
        <div
          style={{
            padding: '20px 24px',
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
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Tag size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                Gerenciar Etiquetas de Alunos
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                Crie e organize tags para segmentar alunos e disparos em massa.
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
            data-testid="close-tags-modal-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Formulário de Criação */}
          <form
            onSubmit={handleCreateTag}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={15} color="#3b82f6" /> Nova Etiqueta
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Nome da etiqueta (ex: VIP Mentoria, Turma 2026)"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                maxLength={50}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '0.86rem',
                  outline: 'none',
                }}
                data-testid="new-tag-name-input"
              />

              <button
                type="submit"
                disabled={saving || !tagName.trim()}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: saving || !tagName.trim() ? 'not-allowed' : 'pointer',
                  opacity: saving || !tagName.trim() ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                data-testid="create-tag-submit-btn"
              >
                {saving ? <RefreshCw size={15} className="spin" /> : <Plus size={15} />}
                Adicionar
              </button>
            </div>

            {/* Seletor de Cores Predefinidas */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Cor:</span>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setTagColor(c)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    border: tagColor === c ? '2px solid #ffffff' : '2px solid transparent',
                    boxShadow: tagColor === c ? `0 0 10px ${c}` : 'none',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                  data-testid={`tag-color-picker-${c}`}
                />
              ))}
            </div>
          </form>

          {/* Lista de Etiquetas Cadastradas */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '10px' }}>
              Etiquetas Cadastradas ({tags.length})
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                <RefreshCw size={22} className="spin" style={{ marginBottom: '8px', display: 'inline-block' }} />
                <div>Carregando etiquetas...</div>
              </div>
            ) : tags.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '30px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '10px',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                }}
              >
                Nenhuma etiqueta cadastrada ainda. Crie sua primeira etiqueta acima.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tags.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                    data-testid={`tag-item-${t.id}`}
                  >
                    {editingTagId === t.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#1e293b',
                            border: '1px solid #3b82f6',
                            color: '#ffffff',
                            fontSize: '0.82rem',
                            flex: 1,
                          }}
                        />
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {PRESET_COLORS.slice(0, 4).map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setEditColor(c)}
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                backgroundColor: c,
                                border: editColor === c ? '2px solid #fff' : 'none',
                                cursor: 'pointer',
                              }}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUpdateTag(t.id)}
                          style={{ background: '#10b981', border: 'none', color: '#fff', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTagId(null)}
                          style={{ background: 'transparent', border: 'none', color: '#94a3b8', padding: '6px', cursor: 'pointer' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              backgroundColor: `${t.color}22`,
                              color: t.color,
                              border: `1px solid ${t.color}44`,
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: t.color }} />
                            {t.name}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            {t.student_count} {t.student_count === 1 ? 'aluno' : 'alunos'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTagId(t.id);
                              setEditName(t.name);
                              setEditColor(t.color);
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '5px' }}
                            title="Editar etiqueta"
                            data-testid={`edit-tag-btn-${t.id}`}
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setTagToDelete(t)}
                            style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '5px' }}
                            title="Excluir etiqueta"
                            data-testid={`delete-tag-btn-${t.id}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão da Etiqueta */}
      <StudentTagDeleteConfirmModal
        isOpen={Boolean(tagToDelete)}
        tag={tagToDelete}
        onClose={() => setTagToDelete(null)}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
      />
    </div>,
    document.body
  );
}
