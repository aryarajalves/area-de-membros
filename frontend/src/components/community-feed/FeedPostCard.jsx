import React, { useState, useEffect } from 'react';
import { Pin, MoreVertical, Trash2, Edit2, Check, X, BookOpen, Loader2, Flag, MapPin, Calendar, Send } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  toggleLikeFeedPost, togglePinFeedPost, updateFeedPost,
  toggleBookmarkFeedPost, recordFeedPostView, publishFeedPostNow
} from './communityFeedApi';
import FeedCommentsSection from './FeedCommentsSection';
import FeedPostMedia from './FeedPostMedia';
import FeedPostActions from './FeedPostActions';
import FeedPollWidget from './FeedPollWidget';
import FeedPostModals from './FeedPostModals';
import { renderTextWithLinks } from '../../utils/linkifyUtils';

export default function FeedPostCard({
  post,
  currentUser,
  onPostUpdated,
  onPostDeleted,
  onOpenProfile,
}) {
  const { addToast } = useToast();
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiked, setIsLiked] = useState(post.is_liked_by_me || false);
  const [isLiking, setIsLiking] = useState(false);
  const [isPinned, setIsPinned] = useState(post.is_pinned || false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [showMenu, setShowMenu] = useState(false);

  // Lightbox / Zoom
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Favoritos e Quem Curtiu
  const [isBookmarked, setIsBookmarked] = useState(Boolean(post.is_bookmarked_by_me));
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentPost, setCurrentPost] = useState(post);

  useEffect(() => {
    setCurrentPost(post);
  }, [post]);

  // Rastreia visualização única no mount do post
  useEffect(() => {
    if (post?.id) {
      recordFeedPostView(post.id).catch(() => {});
    }
  }, [post?.id]);

  // Edição
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Deleção
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishingNow, setIsPublishingNow] = useState(false);

  const isManager = ['admin', 'superadmin'].includes(currentUser?.role);
  const isAuthor = currentUser?.id === post.user_id;
  const canManage = isAuthor || isManager;

  const handlePublishNow = async () => {
    setIsPublishingNow(true);
    try {
      const updated = await publishFeedPostNow(post.id);
      addToast('Post publicado com sucesso no feed geral! 🚀', 'success');
      if (onPostUpdated) onPostUpdated(updated);
    } catch (err) {
      addToast(err.message || 'Erro ao publicar post agendado.', 'error');
    } finally {
      setIsPublishingNow(false);
    }
  };

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    // Otimista
    const prevLiked = isLiked;
    const prevCount = likesCount;
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await toggleLikeFeedPost(post.id);
      setIsLiked(res.liked);
      setLikesCount(res.likes_count);
    } catch (err) {
      // Reverte em caso de erro
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
      addToast('Erro ao curtir a publicação.', 'error');
    } finally {
      setIsLiking(false);
    }
  };

  const handleTogglePin = async () => {
    try {
      const res = await togglePinFeedPost(post.id);
      setIsPinned(res.is_pinned);
      setShowMenu(false);
      addToast(res.is_pinned ? 'Publicação fixada no topo!' : 'Publicação desafixada.', 'success');
      if (onPostUpdated) {
        onPostUpdated({ ...post, is_pinned: res.is_pinned });
      }
    } catch (err) {
      addToast(err.message || 'Erro ao fixar publicação.', 'error');
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      addToast('O conteúdo não pode estar vazio.', 'error');
      return;
    }
    setIsSavingEdit(true);
    try {
      const updated = await updateFeedPost(post.id, { content: editContent.trim() });
      setIsEditing(false);
      addToast('Publicação atualizada!', 'success');
      if (onPostUpdated) {
        onPostUpdated(updated);
      }
    } catch (err) {
      addToast(err.message || 'Erro ao salvar alterações.', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (onPostDeleted) {
        await onPostDeleted(post.id);
      }
      setShowDeleteModal(false);
      addToast('Publicação excluída com sucesso.', 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao excluir publicação.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/#post-${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      addToast('Link do post copiado para a área de transferência!', 'success');
    } else {
      addToast('Link gerado!', 'success');
    }
  };

  const handleBookmark = async () => {
    if (isBookmarking) return;
    setIsBookmarking(true);
    const prev = isBookmarked;
    setIsBookmarked(!prev);
    try {
      const res = await toggleBookmarkFeedPost(post.id);
      setIsBookmarked(res.bookmarked);
      addToast(res.bookmarked ? 'Salvo nos seus posts favoritos! ⭐' : 'Removido dos favoritos.', 'success');
      if (onPostUpdated) {
        onPostUpdated({ ...post, is_bookmarked_by_me: res.bookmarked });
      }
    } catch (err) {
      setIsBookmarked(prev);
      addToast('Erro ao salvar publicação nos favoritos.', 'error');
    } finally {
      setIsBookmarking(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const userInitial = post.user_name ? post.user_name.charAt(0).toUpperCase() : 'M';

  return (
    <>
      <article
        className={`feed-post-card ${isPinned ? 'is-pinned feed-post-pinned-neon' : ''} ${showMenu ? 'menu-open' : ''}`}
        data-testid={`feed-post-card-${post.id}`}
      >
        {isPinned && (
          <div className="feed-pinned-badge feed-pinned-neon" data-testid="feed-pinned-badge">
            <Pin size={13} className="feed-pin-icon" />
            <span>Publicação Fixada</span>
          </div>
        )}

        {post.is_scheduled && (
          <div className="feed-scheduled-banner" data-testid={`feed-scheduled-banner-${post.id}`}>
            <div className="feed-scheduled-info">
              <Calendar size={13} className="feed-scheduled-icon" />
              <span>Agendado para: <strong>{new Date(post.scheduled_at).toLocaleString('pt-BR')}</strong></span>
            </div>
            {canManage && (
              <button
                type="button"
                className="feed-publish-now-btn"
                onClick={handlePublishNow}
                disabled={isPublishingNow}
                title="Publicar agora no feed geral"
                data-testid={`feed-publish-now-btn-${post.id}`}
              >
                <Send size={12} />
                <span>{isPublishingNow ? 'Publicando...' : 'Publicar Agora'}</span>
              </button>
            )}
          </div>
        )}

        <header className="feed-post-header">
          <div className="feed-post-author-wrapper">
            <div
              className="feed-user-avatar clickable"
              onClick={() => onOpenProfile?.(post.user_id)}
              title={`Ver perfil de ${post.user_name}`}
              data-testid={`feed-author-avatar-${post.id}`}
              style={{ cursor: 'pointer' }}
            >
              {post.user_avatar ? (
                <img src={post.user_avatar} alt={post.user_name} />
              ) : (
                <span>{userInitial}</span>
              )}
            </div>
            <div className="feed-author-meta">
              <div className="feed-author-line">
                <span
                  className="feed-author-name clickable"
                  onClick={() => onOpenProfile?.(post.user_id)}
                  title={`Ver perfil de ${post.user_name}`}
                  style={{ cursor: 'pointer' }}
                >
                  {post.user_name}
                </span>
                {post.user_level_badge && (
                  <span className="feed-author-elo-badge" title={post.user_level_title || 'Nível'}>
                    {post.user_level_badge}
                  </span>
                )}
                {post.user_role === 'superadmin' && (
                  <span className="feed-role-badge superadmin">Super Admin</span>
                )}
                {post.user_role === 'admin' && (
                  <span className="feed-role-badge admin">Admin</span>
                )}
              </div>
              <div className="feed-post-subline">
                <span className="feed-post-time">{formatDate(post.created_at)}</span>
                {post.location && (
                  <span className="feed-post-location-tag" title={`Localização: ${post.location}`}>
                    <MapPin size={11} /> {post.location}
                  </span>
                )}
                {post.category && post.category !== 'geral' && (
                  <span className={`feed-post-category-tag tag-${post.category}`}>
                    #{post.category}
                  </span>
                )}
                {post.course_title && (
                  <span className="feed-post-course-tag" title={post.course_title}>
                    <BookOpen size={11} /> {post.course_title}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={`feed-post-actions-menu-wrapper ${showMenu ? 'menu-open' : ''}`}>
            <button
              type="button"
              className="feed-menu-btn"
              onClick={() => setShowMenu(!showMenu)}
              title="Opções"
              data-testid={`feed-post-menu-btn-${post.id}`}
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <div className="feed-menu-dropdown" data-testid={`feed-menu-dropdown-${post.id}`}>
                {isManager && (
                  <button
                    type="button"
                    className="feed-menu-item"
                    onClick={handleTogglePin}
                    data-testid={`feed-pin-toggle-btn-${post.id}`}
                  >
                    <Pin size={14} />
                    {isPinned ? 'Desafixar do Topo' : 'Fixar no Topo'}
                  </button>
                )}
                {canManage && !isEditing && (
                  <button
                    type="button"
                    className="feed-menu-item"
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    data-testid={`feed-edit-btn-${post.id}`}
                  >
                    <Edit2 size={14} />
                    Editar Texto
                  </button>
                )}
                {canManage && (
                  <button
                    type="button"
                    className="feed-menu-item danger"
                    onClick={() => {
                      setShowDeleteModal(true);
                      setShowMenu(false);
                    }}
                    data-testid={`feed-delete-btn-${post.id}`}
                  >
                    <Trash2 size={14} />
                    Excluir Publicação
                  </button>
                )}
                {!isAuthor && (
                  <button
                    type="button"
                    className="feed-menu-item warning"
                    onClick={() => {
                      setShowReportModal(true);
                      setShowMenu(false);
                    }}
                    data-testid={`feed-report-btn-${post.id}`}
                  >
                    <Flag size={14} />
                    Denunciar Publicação
                  </button>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Conteúdo / Texto do Post */}
        <div className="feed-post-body">
          {isEditing ? (
            <div className="feed-post-edit-container">
              <textarea
                className="feed-edit-textarea"
                rows={4}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={2200}
                data-testid="feed-edit-textarea"
              />
              <div className="feed-edit-buttons">
                <button
                  type="button"
                  className="feed-edit-cancel-btn"
                  onClick={() => setIsEditing(false)}
                  disabled={isSavingEdit}
                >
                  <X size={14} /> Cancelar
                </button>
                <button
                  type="button"
                  className="feed-edit-save-btn"
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit || !editContent.trim()}
                  data-testid="feed-save-edit-btn"
                >
                  {isSavingEdit ? (
                    <Loader2 size={14} className="feed-spinner" />
                  ) : (
                    <Check size={14} />
                  )}
                  Salvar
                </button>
              </div>
            </div>
          ) : (
            <p className="feed-post-text" data-testid={`feed-post-content-${post.id}`}>
              {renderTextWithLinks(post.content)}
            </p>
          )}

          {/* Enquete Interativa */}
          {currentPost.poll_question && (
            <FeedPollWidget
              postId={currentPost.id}
              question={currentPost.poll_question}
              options={currentPost.poll_options}
              myVote={currentPost.my_poll_vote}
              totalVotes={currentPost.total_poll_votes}
              onVoteSuccess={(updated) => {
                setCurrentPost(updated);
                onPostUpdated?.(updated);
              }}
            />
          )}

          {/* Mídia da Publicação: Carrossel, Vídeo ou Imagem Única */}
          <FeedPostMedia
            post={currentPost}
            onOpenLightbox={(idx) => {
              setLightboxIndex(idx);
              setLightboxOpen(true);
            }}
          />
        </div>

        {/* Barra de Reações e Interações Sociais */}
        <FeedPostActions
          postId={post.id}
          isLiked={isLiked}
          isLiking={isLiking}
          likesCount={likesCount}
          onLike={handleLike}
          onOpenLikesModal={() => setShowLikesModal(true)}
          showComments={showComments}
          commentsCount={commentsCount}
          onToggleComments={() => setShowComments(!showComments)}
          isBookmarked={isBookmarked}
          isBookmarking={isBookmarking}
          onBookmark={handleBookmark}
          onShare={handleShare}
          canViewInsights={canManage}
          onOpenInsights={() => setShowInsightsModal(true)}
        />

        {/* Seção de comentários expansível */}
        {showComments && (
          <FeedCommentsSection
            postId={post.id}
            comments={comments}
            currentUser={currentUser}
            onCommentAdded={(newComment) => {
              setComments((prev) => [...prev, newComment]);
              setCommentsCount((prev) => prev + 1);
            }}
            onCommentDeleted={(commentId) => {
              setComments((prev) => prev.filter((c) => c.id !== commentId));
              setCommentsCount((prev) => Math.max(0, prev - 1));
            }}
          />
        )}
      </article>

      <FeedPostModals
        post={post}
        showDeleteModal={showDeleteModal}
        isDeleting={isDeleting}
        onConfirmDelete={handleConfirmDelete}
        onCloseDelete={() => setShowDeleteModal(false)}
        lightboxOpen={lightboxOpen}
        lightboxIndex={lightboxIndex}
        onCloseLightbox={() => setLightboxOpen(false)}
        showLikesModal={showLikesModal}
        onCloseLikes={() => setShowLikesModal(false)}
        showInsightsModal={showInsightsModal}
        onCloseInsights={() => setShowInsightsModal(false)}
        showReportModal={showReportModal}
        onCloseReport={() => setShowReportModal(false)}
      />
    </>
  );
}
