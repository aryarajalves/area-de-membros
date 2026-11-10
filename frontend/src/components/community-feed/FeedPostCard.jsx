import React, { useState, useEffect } from 'react';
import {
  Pin,
  MoreVertical,
  Trash2,
  Edit2,
  Check,
  X,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  toggleLikeFeedPost,
  togglePinFeedPost,
  updateFeedPost,
  toggleBookmarkFeedPost,
  recordFeedPostView,
} from './communityFeedApi';
import FeedCommentsSection from './FeedCommentsSection';
import DeleteFeedItemModal from './DeleteFeedItemModal';
import FeedMediaCarousel from './FeedMediaCarousel';
import FeedVideoPlayer from './FeedVideoPlayer';
import FeedLightboxModal from './FeedLightboxModal';
import FeedLikesModal from './FeedLikesModal';
import FeedPostActions from './FeedPostActions';
import FeedPostInsightsModal from './FeedPostInsightsModal';

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

  const isManager = ['admin', 'superadmin'].includes(currentUser?.role);
  const isAuthor = currentUser?.id === post.user_id;
  const canManage = isAuthor || isManager;

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
        className={`feed-post-card ${isPinned ? 'is-pinned' : ''}`}
        data-testid={`feed-post-card-${post.id}`}
      >
        {isPinned && (
          <div className="feed-pinned-badge" data-testid="feed-pinned-badge">
            <Pin size={13} className="feed-pin-icon" />
            <span>Publicação Fixada</span>
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
                {post.user_role === 'superadmin' && (
                  <span className="feed-role-badge superadmin">Super Admin</span>
                )}
                {post.user_role === 'admin' && (
                  <span className="feed-role-badge admin">Admin</span>
                )}
              </div>
              <div className="feed-post-subline">
                <span className="feed-post-time">{formatDate(post.created_at)}</span>
                {post.course_title && (
                  <span className="feed-post-course-tag" title={post.course_title}>
                    <BookOpen size={11} /> {post.course_title}
                  </span>
                )}
              </div>
            </div>
          </div>

          {canManage && (
            <div className="feed-post-actions-menu-wrapper">
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
                </div>
              )}
            </div>
          )}
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
              {post.content}
            </p>
          )}

          {/* Mídia da Publicação: Carrossel, Vídeo ou Imagem Única */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="feed-post-media-container" data-testid={`feed-post-media-${post.id}`}>
              {post.media_type === 'video' || post.media_urls[0]?.match(/\.(mp4|webm|mov|m4v)$/i) ? (
                <FeedVideoPlayer
                  videoUrl={post.media_urls[0]}
                  thumbnailUrl={post.media_thumbnail_url}
                  onOpenLightbox={() => {
                    setLightboxIndex(0);
                    setLightboxOpen(true);
                  }}
                />
              ) : post.media_type === 'carousel' || post.media_urls.length > 1 ? (
                <FeedMediaCarousel
                  mediaUrls={post.media_urls}
                  onOpenLightbox={(idx) => {
                    setLightboxIndex(idx);
                    setLightboxOpen(true);
                  }}
                />
              ) : (
                <div
                  className="feed-post-image-wrapper clickable"
                  onClick={() => {
                    setLightboxIndex(0);
                    setLightboxOpen(true);
                  }}
                  title="Clique para ampliar"
                >
                  <img
                    src={post.media_urls[0]}
                    alt={`Mídia do post ${post.id}`}
                    className="feed-post-image"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          )}
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

      <DeleteFeedItemModal
        isOpen={showDeleteModal}
        title="Excluir Publicação"
        message="Deseja realmente apagar esta publicação? Todos os comentários e curtidas serão excluídos permanentemente."
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setShowDeleteModal(false)}
      />

      <FeedLightboxModal
        isOpen={lightboxOpen}
        mediaUrls={post.media_urls || []}
        initialIndex={lightboxIndex}
        mediaType={post.media_type}
        thumbnailUrl={post.media_thumbnail_url}
        onClose={() => setLightboxOpen(false)}
      />

      <FeedLikesModal
        isOpen={showLikesModal}
        postId={post.id}
        onClose={() => setShowLikesModal(false)}
      />

      <FeedPostInsightsModal
        isOpen={showInsightsModal}
        postId={post.id}
        onClose={() => setShowInsightsModal(false)}
      />
    </>
  );
}
