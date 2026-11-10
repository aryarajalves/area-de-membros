import React, { useState } from 'react';
import { Send, Trash2, Loader2, CornerDownRight } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { createFeedComment, deleteFeedComment } from './communityFeedApi';

export default function FeedCommentsSection({
  postId,
  comments = [],
  currentUser,
  onCommentAdded,
  onCommentDeleted,
}) {
  const { addToast } = useToast();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const newComment = await createFeedComment(postId, { content: content.trim() });
      setContent('');
      if (onCommentAdded) {
        onCommentAdded(newComment);
      }
      addToast('Comentário enviado!', 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao enviar comentário.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    setDeletingCommentId(commentId);
    try {
      await deleteFeedComment(commentId);
      if (onCommentDeleted) {
        onCommentDeleted(commentId);
      }
      addToast('Comentário removido.', 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao remover comentário.', 'error');
    } finally {
      setDeletingCommentId(null);
    }
  };

  const isManager = ['admin', 'superadmin'].includes(currentUser?.role);

  return (
    <div className="feed-comments-section" data-testid={`feed-comments-section-${postId}`}>
      {/* Lista de comentários */}
      {comments && comments.length > 0 && (
        <div className="feed-comments-list" data-testid="feed-comments-list">
          {comments.map((comm) => {
            const canDelete = isManager || comm.user_id === currentUser?.id;
            const initial = comm.user_name ? comm.user_name.charAt(0).toUpperCase() : 'M';
            const isDeleting = deletingCommentId === comm.id;

            return (
              <div key={comm.id} className="feed-comment-item" data-testid={`feed-comment-${comm.id}`}>
                <div className="feed-comment-avatar">
                  {comm.user_avatar ? (
                    <img src={comm.user_avatar} alt={comm.user_name} />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>
                <div className="feed-comment-bubble">
                  <div className="feed-comment-header">
                    <span className="feed-comment-author">{comm.user_name}</span>
                    {comm.user_role === 'superadmin' && (
                      <span className="feed-role-badge superadmin">Super Admin</span>
                    )}
                    {comm.user_role === 'admin' && (
                      <span className="feed-role-badge admin">Admin</span>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        className="feed-comment-delete-btn"
                        onClick={() => handleDelete(comm.id)}
                        disabled={isDeleting}
                        title="Excluir comentário"
                        data-testid={`feed-delete-comment-btn-${comm.id}`}
                      >
                        {isDeleting ? <Loader2 size={12} className="feed-spinner" /> : <Trash2 size={12} />}
                      </button>
                    )}
                  </div>
                  <p className="feed-comment-content">{comm.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Formulário para novo comentário */}
      <form onSubmit={handleSubmit} className="feed-comment-form">
        <input
          type="text"
          className="feed-comment-input"
          placeholder="Escreva um comentário..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={1000}
          disabled={isSubmitting}
          data-testid="feed-new-comment-input"
        />
        <button
          type="submit"
          className="feed-comment-submit-btn"
          disabled={isSubmitting || !content.trim()}
          title="Enviar comentário"
          data-testid="feed-submit-comment-btn"
        >
          {isSubmitting ? <Loader2 size={14} className="feed-spinner" /> : <Send size={14} />}
        </button>
      </form>
    </div>
  );
}
