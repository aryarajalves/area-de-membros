import React, { useState, useEffect, useCallback } from 'react';
import { Send, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { ConfirmDeleteModal } from './ModuleLessonModals';
import CommentItem from './CommentItem';

const COMMENTS_PER_PAGE = 20;

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

export default function LessonComments({
  courseId,
  moduleId,
  lessonId,
  currentUser,
  isLightBg = false
}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { addToast } = useToast();

  const fetchComments = useCallback(async () => {
    if (!courseId || !moduleId || !lessonId) return;
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(
        `/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/comments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      } else {
        const err = await res.json();
        throw new Error(err.detail || 'Erro ao carregar comentários.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao buscar comentários.', 'error');
    } finally {
      setLoading(false);
    }
  }, [courseId, moduleId, lessonId, addToast]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    setCurrentPage(1);
  }, [lessonId]);

  const totalPages = Math.max(1, Math.ceil(comments.length / COMMENTS_PER_PAGE));
  const startIndex = (currentPage - 1) * COMMENTS_PER_PAGE;
  const paginatedComments = comments.slice(startIndex, startIndex + COMMENTS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(
        `/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ content: newComment.trim() })
        }
      );

      if (res.ok) {
        const created = await res.json();
        setComments((prev) => {
          const updated = [...prev, { ...created, replies: created.replies || [] }];
          const newTotalPages = Math.ceil(updated.length / COMMENTS_PER_PAGE);
          setCurrentPage(newTotalPages);
          return updated;
        });
        setNewComment('');
        addToast('Comentário publicado!', 'success');
      } else {
        const err = await res.json();
        throw new Error(err.detail || 'Erro ao publicar comentário.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao enviar comentário.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (parentId, replyText) => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(
        `/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ content: replyText, parent_id: parentId })
        }
      );

      if (res.ok) {
        const createdReply = await res.json();
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === parentId) {
              const existingReplies = c.replies || [];
              return { ...c, replies: [...existingReplies, createdReply] };
            }
            return c;
          })
        );
        addToast('Resposta publicada com sucesso!', 'success');
      } else {
        const err = await res.json();
        throw new Error(err.detail || 'Erro ao publicar resposta.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao enviar resposta.', 'error');
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!commentToDelete) return;
    setDeleting(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(
        `/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/comments/${commentToDelete.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.ok) {
        setComments((prev) => {
          const isRoot = prev.some((c) => c.id === commentToDelete.id);
          if (isRoot) {
            return prev.filter((c) => c.id !== commentToDelete.id);
          }
          return prev.map((c) => {
            if (c.replies && c.replies.some((r) => r.id === commentToDelete.id)) {
              return { ...c, replies: c.replies.filter((r) => r.id !== commentToDelete.id) };
            }
            return c;
          });
        });
        setCommentToDelete(null);
        addToast('Comentário excluído com sucesso.', 'success');
      } else {
        const err = await res.json();
        throw new Error(err.detail || 'Erro ao excluir comentário.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao excluir comentário.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const canDeleteComment = (comment) => {
    if (!currentUser) return false;
    const isAuthor = comment.user_id === currentUser.id;
    const isManager = currentUser.role === 'superadmin' || currentUser.role === 'admin';
    return isAuthor || isManager;
  };

  const getRoleBadge = (role) => {
    if (role === 'superadmin') return { label: 'Super Admin', bg: '#fee2e2', text: '#ef4444' };
    if (role === 'admin') return { label: 'Admin', bg: '#fef3c7', text: '#d97706' };
    if (role === 'aluno') return { label: 'Aluno', bg: '#e0f2fe', text: '#0284c7' };
    return { label: role || 'Usuário', bg: '#f1f5f9', text: '#64748b' };
  };

    const textColor = isLightBg ? '#1e293b' : '#f8fafc';
    const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
    const formBg = isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)';
    const formBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)';
    const emptyBg = isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)';
    const emptyBorder = isLightBg ? '1px dashed #cbd5e1' : '1px dashed rgba(255, 255, 255, 0.12)';
    const paginationBg = isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.04)';
    const paginationBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)';

    return (
    <div style={{ marginTop: '16px' }} data-testid="lesson-comments-container">
      {/* Formulário de Envio de Novo Comentário */}
      <form onSubmit={handleSendComment} style={{ marginBottom: '24px' }}>
        <div style={{
          backgroundColor: formBg,
          border: formBorder,
          borderRadius: '8px',
          padding: '12px'
        }}>
          <textarea
            rows={3}
            placeholder="Deixe sua dúvida, feedback ou comentário sobre esta aula..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="form-control-modern"
            style={{ width: '100%', resize: 'vertical', border: 'none', backgroundColor: 'transparent', padding: '0', fontSize: '13.5px', color: textColor }}
            data-testid="comment-input"
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="primary-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '12.5px' }}
              data-testid="submit-comment-btn"
            >
              <Send size={14} />
              <span>{submitting ? 'Enviando...' : 'Comentar'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Lista de Comentários */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px', color: subTextColor, fontSize: '13px' }}>
          Carregando comentários...
        </div>
      ) : comments.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 16px',
          backgroundColor: emptyBg,
          borderRadius: '8px',
          border: emptyBorder,
          color: subTextColor
        }}>
          <MessageSquare size={32} color={isLightBg ? '#94a3b8' : '#64748b'} style={{ margin: '0 auto 8px', opacity: 0.7 }} />
          <p style={{ fontSize: '13.5px', fontWeight: 600, color: textColor, margin: '0 0 4px 0' }}>
            Nenhum comentário ainda
          </p>
          <p style={{ fontSize: '12.5px', margin: 0 }}>
            Seja o primeiro a deixar uma dúvida ou comentário sobre esta aula!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {paginatedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onReply={handleSendReply}
              onDeleteRequest={setCommentToDelete}
              getRoleBadge={getRoleBadge}
              canDeleteComment={canDeleteComment}
              isLightBg={isLightBg}
            />
          ))}

          {/* Barra de Paginação (20 comentários por página) */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                marginTop: '10px',
                backgroundColor: paginationBg,
                border: paginationBorder,
                borderRadius: '8px',
                flexWrap: 'wrap',
                gap: '12px'
              }}
              data-testid="comments-pagination"
            >
              <span style={{ fontSize: '12.5px', color: subTextColor }}>
                Exibindo {startIndex + 1}–{Math.min(startIndex + COMMENTS_PER_PAGE, comments.length)} de {comments.length} comentários
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="secondary-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  data-testid="prev-comments-page-btn"
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
                  data-testid="next-comments-page-btn"
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
        </div>
      )}

      {/* Modal de Confirmação de Exclusão do Comentário */}
      <ConfirmDeleteModal
        isOpen={!!commentToDelete}
        title="Excluir Comentário?"
        message="Tem certeza que deseja apagar este comentário? Esta ação não pode ser desfeita."
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setCommentToDelete(null)}
      />
    </div>
  );
}
