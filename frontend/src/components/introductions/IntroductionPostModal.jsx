import React, { useState, useRef } from 'react';
import { X, MessageSquare, Send, Trash2, Shield, GraduationCap, Award, Pin, Sparkles } from 'lucide-react';
import IntroductionMediaEmbed from './IntroductionMediaEmbed';
import IntroductionSocialLinks from './IntroductionSocialLinks';
import IntroductionMatchmaking from './IntroductionMatchmaking';
import IntroductionDeleteModal from './IntroductionDeleteModal';
import IntroductionReactionsBar, { ReactionPillSummary } from './IntroductionReactionsBar';
import ZodiacBadge from '../common/ZodiacBadge';
import useIsAstrologyPlatform from '../../hooks/useIsAstrologyPlatform';

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

const QUICK_WELCOME_MESSAGES = [
  '👋 Seja muito bem-vindo(a) à comunidade!',
  '🚀 Prazer em conectar com você! Sucesso na jornada!',
  '🤝 Muito bom ter você aqui! Vamos trocar experiências!',
];

export default function IntroductionPostModal({
  post,
  currentUser,
  onClose,
  onToggleLike,
  onTogglePin,
  onAddComment,
  onDeleteComment,
  onDeletePost,
  onOpenDm,
}) {
  const isAstrology = useIsAstrologyPlatform();
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const commentInputRef = useRef(null);

  if (!post) return null;

  const initial = (post.user_name || 'M').charAt(0).toUpperCase();
  const currentInitial = (currentUser?.name || 'V').charAt(0).toUpperCase();
  const canDeletePost = currentUser && (currentUser.id === post.user_id || ['superadmin', 'admin'].includes(currentUser.role));
  const canPinPost = currentUser && ['superadmin', 'admin'].includes(currentUser.role);

  const handleReactionSelect = async (reactionType) => {
    if (liking) return;
    setLiking(true);
    try {
      await onToggleLike(post.id, reactionType);
    } finally {
      setLiking(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeletingPost(true);
    try {
      await onDeletePost(post.id);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeletingPost(false);
    }
  };

  const handlePinClick = async () => {
    if (pinning || !onTogglePin) return;
    setPinning(true);
    try {
      await onTogglePin(post.id);
    } finally {
      setPinning(false);
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

  const handleQuickWelcome = (msg) => {
    setCommentText((prev) => (prev ? `${prev} ${msg}` : msg));
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  const handleFocusComment = () => {
    if (commentInputRef.current) {
      commentInputRef.current.focus();
      commentInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="intro-modal-backdrop" data-testid="intro-post-modal-backdrop">
      <div className="intro-modal-card" data-testid="intro-post-modal" role="dialog" aria-modal="true">
        {/* Top Header */}
        <div className="intro-modal-header">
          <div className="intro-modal-header-left">
            <h2 className="intro-modal-title">{post.title}</h2>
            {post.is_pinned && (
              <span className="intro-pinned-indicator" data-testid="modal-pinned-indicator">
                <Pin size={12} />
                <span>Fixado</span>
              </span>
            )}
          </div>

          <div className="intro-modal-header-actions">
            {canPinPost && onTogglePin && (
              <button
                type="button"
                className={`intro-pin-icon-btn ${post.is_pinned ? 'is-active-pin' : ''}`}
                onClick={handlePinClick}
                disabled={pinning}
                title={post.is_pinned ? 'Desafixar do topo' : 'Fixar apresentação no topo'}
                data-testid="toggle-pin-intro-post-btn"
              >
                <Pin size={17} />
              </button>
            )}

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
                {isAstrology && post.user_birth_date && (
                  <ZodiacBadge birthDate={post.user_birth_date} size="sm" />
                )}
              </div>
              <span className="intro-post-date">{formatDate(post.created_at)}</span>
            </div>
          </div>

          {/* Nicho, Cidade e Matchmaking */}
          <IntroductionMatchmaking
            niche={post.niche}
            location={post.location}
            seeking={post.seeking}
            offering={post.offering}
          />

          {/* Texto Principal da Apresentação */}
          <div className="intro-post-full-content" data-testid="intro-post-content">
            {post.content}
          </div>

          {/* Mídia Anexada (Vídeo / Imagem / Embed YouTube/Loom) */}
          <IntroductionMediaEmbed
            mediaType={post.media_type}
            mediaUrl={post.media_url}
            videoEmbedUrl={post.video_embed_url}
            title={post.title}
          />

          {/* Redes Sociais e Botão Chamar na DM */}
          <IntroductionSocialLinks
            instagram={post.instagram}
            linkedin={post.linkedin}
            whatsapp={post.whatsapp}
            website={post.website}
            authorName={post.user_name}
            authorId={post.user_id}
            currentUserId={currentUser?.id}
            onOpenDm={onOpenDm}
          />

          {/* Resumo de Curtidas e Comentários */}
          <div className="intro-stats-summary-bar">
            <div className="summary-left">
              {post.likes_count > 0 ? (
                <ReactionPillSummary
                  likesCount={post.likes_count}
                  reactionsSummary={post.reactions_summary}
                />
              ) : (
                <span className="summary-likes-zero">Seja o primeiro a reagir</span>
              )}
            </div>
            <div className="summary-right">
              <span>{post.comments?.length || post.comments_count || 0} comentários</span>
            </div>
          </div>

          {/* Botões de Ação: Reagir (LinkedIn) e Comentar */}
          <div className="intro-actions-bar">
            <IntroductionReactionsBar
              isLiked={post.is_liked_by_me}
              myReaction={post.my_reaction}
              disabled={liking}
              onToggleReaction={handleReactionSelect}
              buttonClassName="intro-action-btn"
              dataTestId="toggle-like-post-btn"
            />

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

          {/* Reações Rápidas de Boas-Vindas */}
          <div className="intro-quick-welcome-row" data-testid="intro-quick-welcome">
            <span className="quick-welcome-label">
              <Sparkles size={12} /> Boas-vindas rápidas:
            </span>
            {QUICK_WELCOME_MESSAGES.map((msg) => (
              <button
                key={msg}
                type="button"
                className="quick-welcome-chip"
                onClick={() => handleQuickWelcome(msg)}
              >
                {msg}
              </button>
            ))}
          </div>

          {/* Seção de Comentários */}
          <div className="intro-comments-section" data-testid="intro-comments-section">
            <div className="comments-heading-row">
              <h4 className="comments-heading">
                <MessageSquare size={17} className="comments-heading-icon" />
                <span>Comentários</span>
                <span className="comments-count-pill" data-testid="modal-comments-count-badge">
                  {post.comments?.length || 0}
                </span>
              </h4>
            </div>

            {/* Input para Novo Comentário */}
            <form onSubmit={handleSubmitComment} className="intro-new-comment-form">
              <div className="comment-user-avatar" title={`Comentando como ${currentUser?.name || 'Você'}`}>
                {currentUser?.avatar_url ? (
                  <img src={currentUser.avatar_url} alt={currentUser.name} className="comment-avatar-img" />
                ) : (
                  <div className="comment-avatar-placeholder">{currentInitial}</div>
                )}
              </div>

              <div className="comment-input-wrapper">
                <input
                  ref={commentInputRef}
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={`Comentar como ${currentUser?.name || 'aluno'}...`}
                  data-testid="new-comment-input"
                  disabled={submittingComment}
                />
                <button
                  type="submit"
                  className="send-comment-btn"
                  disabled={!commentText.trim() || submittingComment}
                  data-testid="submit-comment-btn"
                  aria-label="Enviar comentário"
                >
                  <Send size={15} />
                </button>
              </div>
            </form>

            {/* Lista de Comentários Existentes */}
            {post.comments && post.comments.length > 0 ? (
              <div className="intro-comments-list">
                {post.comments.map((comment) => {
                  const cInitial = (comment.user_name || 'M').charAt(0).toUpperCase();
                  const canDeleteComment =
                    currentUser &&
                    (comment.user_id === currentUser.id ||
                      post.user_id === currentUser.id ||
                      ['superadmin', 'admin'].includes(currentUser.role));

                  return (
                    <div
                      key={comment.id}
                      className="intro-comment-item"
                      data-testid={`intro-comment-${comment.id}`}
                    >
                      <div className="comment-avatar-col">
                        {comment.user_avatar ? (
                          <img src={comment.user_avatar} alt={comment.user_name} className="comment-avatar-img" />
                        ) : (
                          <div className="comment-avatar-placeholder">{cInitial}</div>
                        )}
                      </div>

                      <div className="comment-bubble">
                        <div className="comment-bubble-header">
                          <div className="bubble-header-left">
                            <span className="comment-author-name">{comment.user_name}</span>
                            <RoleBadge role={comment.user_role} />
                          </div>
                          <span className="comment-time">{formatDate(comment.created_at)}</span>
                        </div>

                        <p className="comment-text">{comment.content}</p>

                        {canDeleteComment && (
                          <div className="comment-actions-row">
                            <button
                              type="button"
                              className="delete-comment-btn"
                              onClick={() => onDeleteComment(comment.id)}
                              data-testid={`delete-comment-btn-${comment.id}`}
                            >
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="intro-no-comments" data-testid="intro-no-comments-empty">
                <div className="no-comments-icon-bubble">
                  <MessageSquare size={22} />
                </div>
                <p className="no-comments-primary-text">Nenhuma mensagem ainda.</p>
                <p className="no-comments-secondary-text">Seja o primeiro a dar as boas-vindas para {post.user_name || 'este membro'}!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão Centralizado na Tela */}
      <IntroductionDeleteModal
        isOpen={showDeleteConfirm}
        isDeleting={isDeletingPost}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
