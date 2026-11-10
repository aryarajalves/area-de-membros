import React, { useEffect, useState } from 'react';
import { Heart, X, Loader2 } from 'lucide-react';
import { fetchFeedPostLikes } from './communityFeedApi';

export default function FeedLikesModal({ isOpen, postId, onClose }) {
  const [likes, setLikes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !postId) return;
    let isMounted = true;
    setIsLoading(true);

    fetchFeedPostLikes(postId)
      .then((data) => {
        if (isMounted) setLikes(data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, postId]);

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      className="feed-modal-backdrop"
      data-testid="feed-likes-modal"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="feed-likes-modal-container"
        data-testid="feed-likes-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="feed-likes-modal-header">
          <div className="feed-likes-title-wrapper">
            <Heart size={18} className="feed-likes-heart-icon" />
            <h3 className="feed-likes-modal-title">Quem Curtiu</h3>
            <span className="feed-likes-count-pill">{likes.length}</span>
          </div>

          <button
            type="button"
            className="feed-likes-modal-close-btn"
            onClick={onClose}
            title="Fechar"
            data-testid="feed-likes-modal-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        <div className="feed-likes-modal-body">
          {isLoading ? (
            <div className="feed-likes-loading" data-testid="feed-likes-loading">
              <Loader2 size={24} className="feed-spinner" />
              <span>Carregando membros...</span>
            </div>
          ) : likes.length === 0 ? (
            <div className="feed-likes-empty" data-testid="feed-likes-empty">
              <p>Nenhuma curtida nesta publicação ainda.</p>
            </div>
          ) : (
            <div className="feed-likes-list" data-testid="feed-likes-list">
              {likes.map((like) => {
                const initial = like.name ? like.name.charAt(0).toUpperCase() : 'M';
                return (
                  <div key={like.user_id} className="feed-like-user-row" data-testid={`feed-like-user-${like.user_id}`}>
                    <div className="feed-like-avatar">
                      {like.avatar_url ? (
                        <img src={like.avatar_url} alt={like.name} />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </div>
                    <div className="feed-like-user-info">
                      <div className="feed-like-name-line">
                        <span className="feed-like-name">{like.name}</span>
                        {like.role === 'superadmin' && (
                          <span className="feed-role-badge superadmin">Super Admin</span>
                        )}
                        {like.role === 'admin' && (
                          <span className="feed-role-badge admin">Admin</span>
                        )}
                      </div>
                      <span className="feed-like-time">{formatDate(like.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
