import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Lock, Trash2, Edit2, X, Check, Loader2, StickyNote, Plus, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { FileDeleteConfirmModal } from '../common/FeedbackModals';

const NOTES_PER_PAGE = 20;

export function formatToBrasilia(dateString) {
  if (!dateString) return '';
  const isoString = dateString.endsWith('Z') || dateString.includes('+')
    ? dateString
    : `${dateString}Z`;

  const date = new Date(isoString);
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export default function LessonNotes({ courseId, lessonId, currentUser, isLightBg = false }) {
  const [notes, setNotes] = useState([]);
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, noteId: null, loading: false });
  const [currentPage, setCurrentPage] = useState(1);
  const { addToast } = useToast();

  const textColor = isLightBg ? '#1e293b' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const containerBg = isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.02)';
  const containerBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)';
  const boxBg = isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)';
  const boxBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)';
  const cardBg = isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.04)';
  const cardBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)';
  const inputBg = isLightBg ? '#ffffff' : 'rgba(15, 23, 42, 0.65)';
  const inputBorder = isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)';
  const badgeBg = isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)';

  // Carrega todas as anotações privadas do aluno nesta aula
  const fetchNotes = useCallback(async () => {
    if (!courseId || !lessonId) return;
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/notes`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(Array.isArray(data) ? data : (data.content ? [data] : []));
      }
    } catch (err) {
      console.error('Erro ao buscar anotações:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Paginação: 20 anotações por página
  const totalPages = Math.max(1, Math.ceil(notes.length / NOTES_PER_PAGE));
  const startIndex = (currentPage - 1) * NOTES_PER_PAGE;
  const paginatedNotes = notes.slice(startIndex, startIndex + NOTES_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Criar nova anotação como badge
  const handleCreateNote = async () => {
    const trimmed = newContent.trim();
    if (!trimmed || creating) return;

    setCreating(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ content: trimmed })
      });

      if (res.ok) {
        const createdNote = await res.json();
        setNotes(prev => [createdNote, ...prev]);
        setNewContent('');
        setCurrentPage(1); // Exibe o novo badge na primeira página
        addToast('Anotação salva com sucesso!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Falha ao salvar anotação.');
      }
    } catch (err) {
      addToast(err.message || 'Erro ao salvar anotação.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleStartEdit = (note) => { setEditingId(note.id); setEditingContent(note.content || ''); };
  const handleCancelEdit = () => { setEditingId(null); setEditingContent(''); };
  const handleOpenDeleteModal = (noteId) => setDeleteModalState({ isOpen: true, noteId, loading: false });

  const handleSaveEdit = async (noteId) => {
    const trimmed = editingContent.trim();
    if (!trimmed || savingEdit) return;

    setSavingEdit(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ content: trimmed })
      });

      if (res.ok) {
        const updated = await res.json();
        setNotes(prev => prev.map(n => (n.id === noteId ? updated : n)));
        setEditingId(null);
        setEditingContent('');
        addToast('Anotação atualizada com sucesso!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Falha ao atualizar anotação.');
      }
    } catch (err) {
      addToast(err.message || 'Erro ao atualizar anotação.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    const noteId = deleteModalState.noteId;
    if (!noteId) return;

    setDeleteModalState(prev => ({ ...prev, loading: true }));
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/notes/${noteId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== noteId));
        setDeleteModalState({ isOpen: false, noteId: null, loading: false });
        addToast('Anotação excluída com sucesso!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Falha ao excluir anotação.');
      }
    } catch (err) {
      addToast(err.message || 'Erro ao excluir anotação.', 'error');
      setDeleteModalState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleNewKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleCreateNote(); }
  };

  const handleEditKeyDown = (e, noteId) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleSaveEdit(noteId); }
  };

  return (
    <div
      style={{
        marginTop: '16px',
        backgroundColor: containerBg,
        border: containerBorder,
        borderRadius: '12px',
        padding: '20px',
        boxShadow: isLightBg ? '0 1px 3px rgba(0,0,0,0.03)' : '0 4px 20px rgba(0,0,0,0.25)',
        backdropFilter: isLightBg ? 'none' : 'blur(8px)'
      }}
      data-testid="lesson-notes-container"
    >
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '9px', backgroundColor: isLightBg ? '#eff6ff' : 'rgba(59, 130, 246, 0.15)', color: isLightBg ? '#2563eb' : '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={19} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '15.5px', fontWeight: 700, margin: 0, color: textColor }}>
                Minhas Anotações
              </h3>
              <span
                style={{ fontSize: '11px', fontWeight: 600, backgroundColor: isLightBg ? '#e0e7ff' : 'rgba(99, 102, 241, 0.2)', color: isLightBg ? '#4338ca' : '#a5b4fc', padding: '2px 8px', borderRadius: '10px' }}
                data-testid="notes-count-badge"
              >
                {notes.length} {notes.length === 1 ? 'anotação' : 'anotações'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: '#10b981', marginTop: '2px', fontWeight: 500 }}>
              <Lock size={11} />
              <span>100% Privado — Apenas você visualiza e gerencia suas anotações desta aula</span>
            </div>
          </div>
        </div>
      </div>

      {/* Caixa de Entrada para Nova Anotação */}
      <div style={{ backgroundColor: boxBg, border: boxBorder, borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
        <textarea
          rows={3}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={handleNewKeyDown}
          placeholder="Escreva aqui uma nova anotação, insight, dúvida ou resumo desta aula... (Ctrl+Enter para salvar)"
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '13.5px',
            color: textColor,
            lineHeight: '1.5',
            backgroundColor: inputBg,
            border: `1px solid ${inputBorder}`,
            borderRadius: '7px',
            resize: 'vertical',
            boxSizing: 'border-box',
            outline: 'none',
            fontFamily: 'inherit'
          }}
          data-testid="lesson-note-textarea"
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
          <span style={{ fontSize: '11.5px', color: subTextColor }}>
            {newContent.length} caracteres
          </span>

          <button
            type="button"
            onClick={handleCreateNote}
            disabled={creating || !newContent.trim()}
            className="primary-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12.5px',
              padding: '6px 14px',
              opacity: (!newContent.trim() && !creating) ? 0.6 : 1,
              cursor: (!newContent.trim() && !creating) ? 'default' : 'pointer'
            }}
            data-testid="save-note-btn"
          >
            {creating ? <Loader2 size={13} className="spin-animation" /> : <Plus size={13} />}
            <span>{creating ? 'Salvando...' : 'Salvar Anotação'}</span>
          </button>
        </div>
      </div>

      {/* Lista de Badges / Cards de Anotações */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} data-testid="lesson-notes-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: subTextColor }} data-testid="notes-loading-state">
            <Loader2 size={24} className="spin-animation" style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontSize: '13px' }}>Carregando suas anotações...</p>
          </div>
        ) : notes.length === 0 ? (
          <div
            style={{ padding: '24px 16px', textAlign: 'center', backgroundColor: boxBg, border: isLightBg ? '1px dashed #cbd5e1' : '1px dashed rgba(255, 255, 255, 0.12)', borderRadius: '8px', color: subTextColor }}
            data-testid="notes-empty-state"
          >
            <StickyNote size={28} style={{ color: subTextColor, margin: '0 auto 8px', strokeWidth: 1.5 }} />
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: textColor }}>
              Nenhuma anotação salva ainda nesta aula.
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: subTextColor }}>
              Digite suas observações no campo acima para criar seus badges de estudo.
            </p>
          </div>
        ) : (
          paginatedNotes.map((note) => {
            const isEditing = editingId === note.id;

            return (
              <div
                key={note.id}
                style={{ backgroundColor: cardBg, border: cardBorder, borderRadius: '10px', padding: '14px 16px', backdropFilter: isLightBg ? 'none' : 'blur(8px)' }}
                data-testid={`lesson-note-badge-${note.id}`}
              >
                {/* Cabeçalho do Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: badgeBg, color: subTextColor, fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px' }}
                      data-testid={`note-time-badge-${note.id}`}
                    >
                      <Clock size={11} style={{ color: '#38bdf8' }} />
                      <span>{formatToBrasilia(note.created_at || note.updated_at)}</span>
                    </span>
                    {note.updated_at && note.updated_at !== note.created_at && (
                      <span style={{ fontSize: '10.5px', color: subTextColor, fontStyle: 'italic' }}>
                        (editado)
                      </span>
                    )}
                  </div>

                  {!isEditing && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(note)}
                        title="Editar Anotação"
                        style={{ background: 'none', border: 'none', color: subTextColor, cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11.5px' }}
                        data-testid={`edit-note-btn-${note.id}`}
                      >
                        <Edit2 size={13} />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDeleteModal(note.id)}
                        title="Excluir Anotação"
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11.5px' }}
                        data-testid={`delete-note-btn-${note.id}`}
                      >
                        <Trash2 size={13} />
                        <span>Excluir</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Conteúdo */}
                {isEditing ? (
                  <div style={{ marginTop: '8px' }}>
                    <textarea
                      rows={3}
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      onKeyDown={(e) => handleEditKeyDown(e, note.id)}
                      style={{ width: '100%', padding: '10px 12px', fontSize: '13px', color: textColor, lineHeight: '1.5', backgroundColor: inputBg, border: '1px solid #3b82f6', borderRadius: '6px', resize: 'vertical', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                      data-testid={`edit-note-textarea-${note.id}`}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={savingEdit}
                        className="secondary-btn"
                        style={{ fontSize: '12px', padding: '5px 12px' }}
                        data-testid={`cancel-edit-btn-${note.id}`}
                      >
                        <X size={12} style={{ marginRight: '4px' }} />
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(note.id)}
                        disabled={savingEdit || !editingContent.trim()}
                        className="primary-btn"
                        style={{ fontSize: '12px', padding: '5px 12px' }}
                        data-testid={`save-edit-btn-${note.id}`}
                      >
                        {savingEdit ? <Loader2 size={12} className="spin-animation" style={{ marginRight: '4px' }} /> : <Check size={12} style={{ marginRight: '4px' }} />}
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{ fontSize: '13.5px', color: textColor, lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                    data-testid={`note-content-${note.id}`}
                  >
                    {note.content}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Barra de Paginação */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '12px 14px',
            borderTop: containerBorder,
            marginTop: '16px',
            backgroundColor: boxBg,
            borderRadius: '8px'
          }}
          data-testid="notes-pagination"
        >
          <span style={{ fontSize: '12.5px', color: subTextColor }}>
            Exibindo {startIndex + 1}–{Math.min(startIndex + NOTES_PER_PAGE, notes.length)} de {notes.length} anotações
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="secondary-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              data-testid="prev-notes-page-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                opacity: currentPage === 1 ? 0.5 : 1,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={14} />
              <span>Anterior</span>
            </button>

            <span style={{ fontSize: '12.5px', fontWeight: 600, color: textColor, padding: '0 6px' }}>
              Página {currentPage} de {totalPages}
            </span>

            <button
              type="button"
              className="secondary-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              data-testid="next-notes-page-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                opacity: currentPage === totalPages ? 0.5 : 1,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              <span>Próxima</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Popup Centralizado de Confirmação de Exclusão */}
      <FileDeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        title="Excluir Anotação?"
        message="Tem certeza que deseja excluir esta anotação da aula? Esta ação é definitiva e não pode ser desfeita."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalState({ isOpen: false, noteId: null, loading: false })}
        loading={deleteModalState.loading}
      />
    </div>
  );
}
