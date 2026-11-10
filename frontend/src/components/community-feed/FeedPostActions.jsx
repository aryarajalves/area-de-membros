import React from 'react';
import { Heart, MessageCircle, Bookmark, Share2, BarChart2 } from 'lucide-react';

export default function FeedPostActions({
  postId,
  isLiked,
  isLiking,
  likesCount,
  onLike,
  onOpenLikesModal,
  showComments,
  commentsCount,
  onToggleComments,
  isBookmarked,
  isBookmarking,
  onBookmark,
  onShare,
  canViewInsights,
  onOpenInsights,
}) {
  return (
    <footer className="feed-post-footer">
      <div className="feed-footer-actions">
        <div className="feed-like-action-group">
          <button
            type="button"
            className={`feed-interaction-btn ${isLiked ? 'liked' : ''}`}
            onClick={onLike}
            disabled={isLiking}
            title={isLiked ? 'Descurtir' : 'Curtir'}
            data-testid={`feed-like-btn-${postId}`}
          >
            <Heart
              size={18}
              className={`feed-heart-icon ${isLiked ? 'filled' : ''}`}
            />
          </button>
          <button
            type="button"
            className="feed-likes-count-btn"
            onClick={onOpenLikesModal}
            title="Ver quem curtiu"
            data-testid={`feed-likes-count-${postId}`}
          >
            {likesCount} {likesCount === 1 ? 'curtida' : 'curtidas'}
          </button>
        </div>

        <button
          type="button"
          className={`feed-interaction-btn ${showComments ? 'active' : ''}`}
          onClick={onToggleComments}
          title="Comentários"
          data-testid={`feed-comments-toggle-btn-${postId}`}
        >
          <MessageCircle size={18} />
          <span className="feed-interaction-count" data-testid={`feed-comments-count-${postId}`}>
            {commentsCount}
          </span>
        </button>

        <button
          type="button"
          className={`feed-interaction-btn ${isBookmarked ? 'bookmarked' : ''}`}
          onClick={onBookmark}
          disabled={isBookmarking}
          title={isBookmarked ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
          data-testid={`feed-bookmark-btn-${postId}`}
        >
          <Bookmark
            size={17}
            className={`feed-bookmark-icon ${isBookmarked ? 'filled' : ''}`}
          />
          <span className="feed-bookmark-label">{isBookmarked ? 'Salvo' : 'Salvar'}</span>
        </button>

        <button
          type="button"
          className="feed-interaction-btn"
          onClick={onShare}
          title="Compartilhar link"
          data-testid={`feed-share-btn-${postId}`}
        >
          <Share2 size={17} />
          <span className="feed-share-label">Compartilhar</span>
        </button>

        {canViewInsights && (
          <button
            type="button"
            className="feed-post-insights-btn"
            onClick={onOpenInsights}
            title="Ver métricas e alcance da publicação"
            data-testid={`feed-insights-btn-${postId}`}
          >
            <BarChart2 size={15} />
            <span>Ver insights</span>
          </button>
        )}
      </div>
    </footer>
  );
}
