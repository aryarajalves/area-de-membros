import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Eye,
  Loader2,
  Trophy,
  Pin,
  Sparkles,
  Link2,
  MapPin,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  fetchFeedPost,
  toggleLikeFeedPost,
  toggleBookmarkFeedPost,
  shareFeedPost,
  recordFeedPostView,
} from './communityFeedApi';
import FeedPostMedia from './FeedPostMedia';
import FeedLightboxModal from './FeedLightboxModal';
import FeedPollWidget from './FeedPollWidget';
import FeedCommentsSection from './FeedCommentsSection';
import { renderTextWithLinks } from '../../utils/linkifyUtils';
import './community-feed-detail.css';

const CATEGORY_MAP = {
  vitoria: { label: 'Vitória', emoji: '🏆', color: '#10b981' },
  duvida: { label: 'Dúvida', emoji: '❓', color: '#f59e0b' },
  dica: { label: 'Dica', emoji: '💡', color: '#3b82f6' },
  aviso: { label: 'Aviso', emoji: '📢', color: '#ef4444' },
  networking: { label: 'Networking', emoji: '🤝', color: '#8b5cf6' },
};

export default function FeedPostDetailModal({
  isOpen,
  post: initialPost,
  postId,
  currentUser,
  onClose,
  onPostUpdated,
  onOpenProfile,
}) {
  const { addToast } = useToast();
  const [post, setPost] = useState(initialPost || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const activePostId = postId || initialPost?.id;

  useEffect(() => {
    if (initialPost) {
      setPost(initialPost);
    }
  }, [initialPost]);

  useEffect(() => {
    if (!isOpen || !activePostId) return;

    let isMounted = true;
    const loadDetail = async () => {
      setIsLoading(true);
      try {
        const data = await fetchFeedPost(activePostId);
        if (isMounted) {
          setPost(data);
          recordFeedPostView(activePostId).catch(() => {});
        }
      } catch (err) {
        if (isMounted) {
          addToast(err.message || 'Erro ao carregar publicação.', 'error');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDetail();
    return () => {
      isMounted = false;
    };
  }, [isOpen, activePostId, addToast]);

  if (!isOpen) return null;

  const handleLike = async () => {
    if (!post || isLiking) return;
    setIsLiking(true);

    const prevLiked = post.is_liked_by_me;
    const prevCount = post.likes_count || 0;
    const optimisticLiked = !prevLiked;
    const optimisticCount = prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1;

    const updated = {
      ...post,
      is_liked_by_me: optimisticLiked,
      likes_count: optimisticCount,
    };
    setPost(updated);
    if (onPostUpdated) onPostUpdated(updated);

    try {
      const res = await toggleLikeFeedPost(post.id);
      const synced = {
        ...post,
        is_liked_by_me: res.liked,
        likes_count: res.likes_count,
      };
      setPost(synced);
      if (onPostUpdated) onPostUpdated(synced);
    } catch (err) {
      const rolledBack = {
        ...post,
        is_liked_by_me: prevLiked,
        likes_count: prevCount,
      };
      setPost(rolledBack);
      if (onPostUpdated) onPostUpdated(rolledBack);
      addToast(err.message || 'Erro ao curtir publicação.', 'error');
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmark = async () => {
    if (!post || isBookmarking) return;
    setIsBookmarking(true);

    const prevBookmarked = post.is_bookmarked_by_me;
    const prevCount = post.bookmarks_count || 0;
    const optimisticBookmarked = !prevBookmarked;
    const optimisticCount = prevBookmarked ? Math.max(0, prevCount - 1) : prevCount + 1;

    const updated = {
      ...post,
      is_bookmarked_by_me: optimisticBookmarked,
      bookmarks_count: optimisticCount,
    };
    setPost(updated);
    if (onPostUpdated) onPostUpdated(updated);

    try {
      const res = await toggleBookmarkFeedPost(post.id);
      const synced = {
        ...post,
        is_bookmarked_by_me: res.bookmarked,
        bookmarks_count: res.bookmarks_count ?? optimisticCount,
      };
      setPost(synced);
      if (onPostUpdated) onPostUpdated(synced);
      addToast(
        res.bookmarked ? 'Publicação salva nos favoritos!' : 'Publicação removida dos favoritos.',
        'success'
      );
    } catch (err) {
      const rolledBack = {
        ...post,
        is_bookmarked_by_me: prevBookmarked,
        bookmarks_count: prevCount,
      };
      setPost(rolledBack);
      if (onPostUpdated) onPostUpdated(rolledBack);
      addToast(err.message || 'Erro ao salvar publicação.', 'error');
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleShare = async () => {
    if (!post || isSharing) return;
    setIsSharing(true);
    try {
      const shareUrl = `${window.location.origin}/community?post=${post.id}`;
      await navigator.clipboard.writeText(shareUrl);
      const res = await shareFeedPost(post.id);

      const updated = {
        ...post,
        shares_count: res.shares_count ?? (post.shares_count || 0) + 1,
      };
      setPost(updated);
      if (onPostUpdated) onPostUpdated(updated);
      addToast('Link da publicação copiado para a área de transferência!', 'success');
    } catch {
      addToast('Não foi possível copiar o link da publicação.', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCommentAdded = (newComment) => {
    if (!post) return;
    const updated = {
      ...post,
      comments: [...(post.comments || []), newComment],
      comments_count: (post.comments_count || 0) + 1,
    };
    setPost(updated);
    if (onPostUpdated) onPostUpdated(updated);
  };

  const handleCommentDeleted = (commentId) => {
    if (!post) return;
    const updated = {
      ...post,
      comments: (post.comments || []).filter((c) => c.id !== commentId),
      comments_count: Math.max(0, (post.comments_count || 0) - 1),
    };
    setPost(updated);
    if (onPostUpdated) onPostUpdated(updated);
  };

  const catInfo = post?.category && CATEGORY_MAP[post.category.toLowerCase()];
  const authorInitial = post?.user_name ? post.user_name.charAt(0).toUpperCase() : '?';

  return (
    <div
      className="feed-detail-modal-backdrop"
      data-testid="feed-post-detail-modal"
      onClick={(e) => {
        // Regra UX: não fecha ao clicar no fundo
        e.stopPropagation();
      }}
    >
      <div className="feed-detail-modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho do Modal */}
        <div className="feed-detail-header">
          <div className="feed-detail-header-info">
            <span className="feed-detail-badge">
              <Sparkles size={13} /> Publicação Maximizada
            </span>
            {post?.is_pinned && (
              <span className="feed-pinned-badge">
                <Pin size={12} /> Fixado
              </span>
            )}
          </div>
          <button
            type="button"
            className="feed-detail-close-btn"
            onClick={onClose}
            title="Fechar publicação"
            data-testid="feed-detail-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo / Loading */}
        <div className="feed-detail-scroll-body">
          {isLoading && !post ? (
            <div className="feed-detail-loading" data-testid="feed-detail-loading">
              <Loader2 size={32} className="feed-spinner" />
              <span>Carregando detalhes da publicação...</span>
            </div>
          ) : !post ? (
            <div className="feed-detail-empty">
              <p>Publicação não encontrada ou removida.</p>
            </div>
          ) : (
            <div className="feed-detail-content-wrap">
              {/* Autor */}
              <div className="feed-detail-author-row">
                <div
                  className="feed-post-avatar-wrap clickable"
                  onClick={() => {
                    if (onOpenProfile) onOpenProfile(post.user_id);
                  }}
                  title={`Ver perfil de ${post.user_name}`}
                >
                  {post.user_avatar ? (
                    <img src={post.user_avatar} alt={post.user_name} className="feed-post-avatar-img" />
                  ) : (
                    <div className="feed-post-avatar-placeholder">{authorInitial}</div>
                  )}
                </div>

                <div className="feed-post-meta">
                  <div className="feed-post-author-name-row">
                    <span
                      className="feed-post-author-name clickable"
                      onClick={() => {
                        if (onOpenProfile) onOpenProfile(post.user_id);
                      }}
                      data-testid="feed-detail-author-name"
                    >
                      {post.user_name}
                    </span>

                    {post.user_level_title && (
                      <span className="feed-elo-badge" title="Nível RPG / Gamificação">
                        <Trophy size={11} /> {post.user_level_title}
                      </span>
                    )}

                    {post.user_role === 'superadmin' && (
                      <span className="feed-role-badge superadmin">Super Admin</span>
                    )}
                    {post.user_role === 'admin' && (
                      <span className="feed-role-badge admin">Admin</span>
                    )}
                  </div>

                  <div className="feed-post-time-row">
                    <span>{new Date(post.created_at).toLocaleString('pt-BR')}</span>
                    {post.location && (
                      <span className="feed-post-location-tag" title={`Localização: ${post.location}`}>
                        <MapPin size={11} /> {post.location}
                      </span>
                    )}
                    {catInfo && (
                      <span className="feed-post-cat-badge" style={{ borderColor: catInfo.color, color: catInfo.color }}>
                        {catInfo.emoji} {catInfo.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Conquista celebrada */}
              {post.achievement_type && (
                <div className="feed-achievement-banner" data-testid="feed-detail-achievement">
                  <Trophy size={20} className="feed-achievement-trophy" />
                  <div className="feed-achievement-content">
                    <strong>{post.achievement_data?.title || 'Conquista Desbloqueada!'}</strong>
                    <span>{post.achievement_data?.subtitle || 'Comemorando um marco na comunidade.'}</span>
                  </div>
                </div>
              )}

              {/* Texto do Post com links clicáveis */}
              <div className="feed-detail-text" data-testid="feed-detail-text">
                {renderTextWithLinks(post.content)}
              </div>

              {/* Mídia ampliada em destaque */}
              {post.media_urls && post.media_urls.length > 0 && (
                <div className="feed-detail-media-wrap">
                  <FeedPostMedia
                    post={post}
                    onOpenLightbox={(idx) => {
                      setLightboxIndex(idx);
                      setLightboxOpen(true);
                    }}
                  />
                </div>
              )}

              {/* Enquete Interativa */}
              {post.poll_question && post.poll_options && (
                <FeedPollWidget
                  post={post}
                  onPollVoteSuccess={(updatedPost) => {
                    setPost(updatedPost);
                    if (onPostUpdated) onPostUpdated(updatedPost);
                  }}
                />
              )}

              {/* Barra de Ações e Métricas */}
              <div className="feed-detail-actions-bar">
                <button
                  type="button"
                  className={`feed-post-action-btn ${post.is_liked_by_me ? 'liked' : ''}`}
                  onClick={handleLike}
                  disabled={isLiking}
                  data-testid="feed-detail-like-btn"
                >
                  <Heart size={18} fill={post.is_liked_by_me ? 'currentColor' : 'none'} />
                  <span>{post.likes_count || 0} curtidas</span>
                </button>

                <div className="feed-post-action-btn active" title="Comentários">
                  <MessageCircle size={18} />
                  <span>{post.comments_count || 0} comentários</span>
                </div>

                <button
                  type="button"
                  className={`feed-post-action-btn ${post.is_bookmarked_by_me ? 'bookmarked' : ''}`}
                  onClick={handleBookmark}
                  disabled={isBookmarking}
                  title="Salvar nos favoritos"
                  data-testid="feed-detail-bookmark-btn"
                >
                  <Bookmark size={18} fill={post.is_bookmarked_by_me ? 'currentColor' : 'none'} />
                  <span>{post.bookmarks_count || 0} salvos</span>
                </button>

                <button
                  type="button"
                  className="feed-post-action-btn"
                  onClick={handleShare}
                  disabled={isSharing}
                  title="Compartilhar publicação"
                  data-testid="feed-detail-share-btn"
                >
                  <Share2 size={18} />
                  <span>{post.shares_count || 0} compartilhamentos</span>
                </button>

                <div className="feed-post-views-count" title="Visualizações">
                  <Eye size={15} />
                  <span>{post.views_count || 0} views</span>
                </div>
              </div>

              {/* Seção Completa de Comentários */}
              <div className="feed-detail-comments-container">
                <FeedCommentsSection
                  postId={post.id}
                  comments={post.comments || []}
                  currentUser={currentUser}
                  onCommentAdded={handleCommentAdded}
                  onCommentDeleted={handleCommentDeleted}
                  onOpenProfile={onOpenProfile}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox para visualização de mídias em tela cheia */}
      {post?.media_urls && post.media_urls.length > 0 && (
        <FeedLightboxModal
          isOpen={lightboxOpen}
          mediaUrls={post.media_urls}
          mediaType={post.media_type}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
