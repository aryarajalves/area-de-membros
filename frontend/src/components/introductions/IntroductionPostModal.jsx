import React, { useState, useEffect, useRef } from 'react';
import { X, ThumbsUp, MessageSquare, Send, Trash2, Shield, GraduationCap, Award } from 'lucide-react';

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function RoleBadge({ role }) {
  if (role === 'superadmin') {
    return (
      <span className="user-role-badge badge-superadmin">
        <Shield size={12} />
        <span>Super Admin</span>
      </span>
    );
  }
  if (role === 'admin') {
    return (
      <span className="user-role-badge badge-admin">
        <Award size={12} />
        <span>Admin</span>
      </span>
    );
  }
  return (
    <span className="user-role-badge badge-aluno">
      <GraduationCap size={12} />
      <span>Aluno</span>
    </span>
  );
}

export default function IntroductionPostModal({
  post,
  currentUser,
  onClose,
  onToggleLike,
  onAddComment,
  onDeleteComment,
  onDeletePost,
}) {
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const commentInputRef = useRef(null);

  if (!post) return null;

  const initial = (post.user_name || 'M').charAt(0).toUpperCase();
  const currentInitial = (currentUser?.name || 'V').charAt(0).toUpperCase();
  const canDeletePost = currentUser && (currentUser.id === post.user_id || ['superadmin', 'admin'].includes(currentUser.role));

  const handleLikeClick = async () => {
    if (liking) return;
    setLiking(true);
    try {
      await onToggleLike(post.id);
    } finally {
      setLiking(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    const cleanText = commentText.trim();
    if (!cleanText || submittingComment) return;

    setSubmittingComment(true);
    try {
      await onAddComment(post.id, cleanText);
      setCommentText('');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleFocusComment = () => {
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  return (
    <div className="intro-modal-backdrop" data-testid="intro-post-modal-backdrop">
      <div className="intro-modal-card" data-testid="intro-post-modal" role="dialog" aria-modal="true">
        {/* Top Header */}
        <div className="intro-modal-header">
          <h2 className="intro-modal-title">{post.title}</h2>
          <div className="intro-modal-header-actions">
            {canDeletePost && (
              <button
                type="button"
                className="intro-delete-icon-btn"
                onClick={() => setShowDeleteConfirm(true)}
                title="Excluir apresentação"
                data-testid="delete-intro-post-trigger-btn"
              >
                <Trash2 size={17} />
              </button>
            )}
            <button
              type="button"
              className="intro-close-modal-btn"
              onClick={onClose}
              data-testid="close-intro-post-modal-btn"
              aria-label="Fechar modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="intro-modal-body">
          {/* Autor do Post */}
          <div className="intro-author-header">
            <div className="intro-modal-avatar">
              {post.user_avatar ? (
                <img src={post.user_avatar} alt={post.user_name} className="intro-modal-avatar-img" />
              ) : (
                <div className="intro-modal-avatar-placeholder">{initial}</div>
              )}
            </div>

            <div className="intro-author-details">
              <div className="intro-author-name-row">
                <span className="intro-author-name">{post.user_name}</span>
                <RoleBadge role={post.user_role} />
              </div>
              <span className="intro-post-date">{formatDate(post.created_at)}</span>
            </div>
          </div>

          {/* Texto Principal da Apresentação */}
          <div className="intro-post-full-content" data-testid="intro-post-content">
            {post.content}
          </div>

          {/* Resumo de Curtidas e Comentários */}
          <div className="intro-stats-summary-bar">
            <div className="summary-left">
              <span className="summary-likes-count">
                <ThumbsUp size={14} className="icon-thumb-accent" />
                {post.likes_count}
              </span>
            </div>
            <div className="summary-right">
              <span>{post.comments?.length || post.comments_count || 0} comentários</span>
            </div>
          </div>

          {/* Botões de Ação: Curtir e Comentar */}
          <div className="intro-actions-bar">
            <button
              type="button"
              className={`intro-action-btn ${post.is_liked_by_me ? 'action-liked' : ''}`}
              onClick={handleLikeClick}
              disabled={liking}
              data-testid="toggle-like-post-btn"
            >
              <ThumbsUp size={16} />
              <span>{post.is_liked_by_me ? 'Curtido' : 'Curtir'}</span>
            </button>

            <button
              type="button"
              className="intro-action-btn"
              onClick={handleFocusComment}
              data-testid="focus-comment-btn"
            >
              <MessageSquare size={16} />
              <span>Comentar</span>
            </button>
          </div>

          {/* Lista de Comentários */}
          <div className="intro-comments-list-section">
            <h4 className="comments-heading">Comentários & Boas-vindas</h4>

            {(!post.comments || post.comments.length === 0) ? (
              <p className="no-comments-text">
                Nenhum comentário ainda. Deixe uma mensagem de boas-vindas para {post.user_name}!
              </p>
            ) : (
              <div className="comments-thread">
                {post.comments.map((comment) => {
                  const commentInitial = (comment.user_name || 'M').charAt(0).toUpperCase();
                  const canDeleteComment = currentUser && (
                    currentUser.id === comment.user_id ||
                    currentUser.id === post.user_id ||
                    ['superadmin', 'admin'].includes(currentUser.role)
                  );

                  return (
                    <div key={comment.id} className="comment-item" data-testid={`comment-item-${comment.id}`}>
                      <div className="comment-avatar">
                        {comment.user_avatar ? (
                          <img src={comment.user_avatar} alt={comment.user_name} className="comment-avatar-img" />
                        ) : (
                          <div className="comment-avatar-placeholder">{commentInitial}</div>
                        )}
                      </div>

                      <div className="comment-bubble">
                        <div className="comment-header-row">
                          <div className="comment-author-info">
                            <span className="comment-author-name">{comment.user_name}</span>
                            <RoleBadge role={comment.user_role} />
                            <span className="comment-date">{formatDate(comment.created_at)}</span>
                          </div>
                          {canDeleteComment && (
                            <button
                              type="button"
                              className="comment-delete-btn"
                              onClick={() => onDeleteComment(comment.id)}
                              title="Remover comentário"
                              data-testid={`delete-comment-btn-${comment.id}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        <div className="comment-content-text">{comment.content}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Input de Novo Comentário no Rodapé */}
        <form onSubmit={handleSubmitComment} className="intro-modal-footer-input">
          <div className="footer-input-avatar">
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt={currentUser.name} className="footer-avatar-img" />
            ) : (
              <div className="footer-avatar-placeholder">{currentInitial}</div>
            )}
          </div>

          <div className="footer-input-field-wrapper">
            <input
              ref={commentInputRef}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Deixe uma mensagem de boas-vindas..."
              maxLength={2000}
              data-testid="new-comment-input"
            />
            <button
              type="submit"
              className="send-comment-btn"
              disabled={!commentText.trim() || submittingComment}
              data-testid="submit-comment-btn"
              title="Publicar comentário"
            >
              <Send size={15} />
            </button>
          </div>
        </form>

        {/* Modal de Confirmação de Exclusão da Apresentação */}
        {showDeleteConfirm && (
          <div
            className="intro-confirm-delete-overlay"
            data-testid="intro-confirm-delete-overlay"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="intro-confirm-delete-card"
              role="alertdialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="confirm-delete-icon-glow">
                <Trash2 size={26} />
              </div>
              <h3>Excluir Apresentação?</h3>
              <p>Tem certeza de que deseja excluir permanentemente esta apresentação e todos os seus comentários?</p>
              <div className="confirm-delete-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowDeleteConfirm(false)}
                  data-testid="cancel-delete-post-btn"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="danger-btn"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDeletePost(post.id);
                  }}
                  data-testid="confirm-delete-post-btn"
                >
                  <Trash2 size={15} />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
