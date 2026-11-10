import React, { useEffect, useState } from 'react';
import { X, Link2, Edit3, Loader2, Heart, MessageCircle, ExternalLink, UserCheck, UserPlus } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { fetchUserProfile, toggleFollowUser } from './communityFeedApi';
import FeedEditProfileModal from './FeedEditProfileModal';
import FeedFollowListModal from './FeedFollowListModal';
import './community-feed-profile.css';

export default function FeedProfileModal({ isOpen, userId, onClose, onSelectPost, onProfileUpdated }) {
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [followListState, setFollowListState] = useState({ isOpen: false, tab: 'followers' });

  const loadProfile = async (targetId) => {
    if (!targetId) return;
    setIsLoading(true);
    try {
      const data = await fetchUserProfile(targetId);
      setProfile(data);
    } catch {
      // Ignora erro silencioso
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      loadProfile(userId);
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleProfileUpdated = (updated) => {
    setProfile(updated);
    if (onProfileUpdated) onProfileUpdated(updated);
  };

  const handleToggleFollow = async () => {
    if (!profile || profile.is_me) return;
    setIsFollowLoading(true);
    try {
      const res = await toggleFollowUser(profile.id);
      setProfile((prev) => ({
        ...prev,
        is_following: res.following,
        followers_count: res.followers_count,
      }));
      if (res.following) {
        addToast(`Você começou a seguir ${profile.name}!`, 'success');
      } else {
        addToast(`Você deixou de seguir ${profile.name}.`, 'info');
      }
    } catch (err) {
      addToast(err.message || 'Erro ao atualizar seguir.', 'error');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const openFollowList = (tab) => {
    setFollowListState({ isOpen: true, tab });
  };

  const initial = profile?.name ? profile.name.charAt(0).toUpperCase() : 'M';

  return (
    <>
      <div
        className="feed-modal-backdrop"
        data-testid="feed-profile-modal"
        role="dialog"
        aria-modal="true"
      >
        <div
          className="feed-profile-modal-container"
          data-testid="feed-profile-modal-container"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="feed-profile-header">
            <h3 className="feed-profile-title">Perfil do Membro</h3>
            <button
              type="button"
              className="feed-likes-modal-close-btn"
              onClick={onClose}
              title="Fechar"
              data-testid="feed-profile-close-btn"
            >
              <X size={18} />
            </button>
          </div>

          <div className="feed-profile-body">
            {isLoading ? (
              <div className="feed-likes-loading" data-testid="feed-profile-loading">
                <Loader2 size={24} className="feed-spinner" />
                <span>Carregando perfil...</span>
              </div>
            ) : !profile ? (
              <div className="feed-likes-empty" data-testid="feed-profile-empty">
                <p>Perfil não encontrado.</p>
              </div>
            ) : (
              <>
                {/* Bloco de Informações */}
                <div className="feed-profile-info-card">
                  <div className="feed-profile-avatar-large">
                    <div className="feed-profile-avatar-inner">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.name} />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </div>
                  </div>

                  <div className="feed-profile-details">
                    <div className="feed-profile-name-row">
                      <span className="feed-profile-fullname" data-testid="feed-profile-name">
                        {profile.name}
                      </span>
                      {profile.role === 'superadmin' && (
                        <span className="feed-role-badge superadmin">Super Admin</span>
                      )}
                      {profile.role === 'admin' && (
                        <span className="feed-role-badge admin">Admin</span>
                      )}

                      {profile.is_me ? (
                        <button
                          type="button"
                          className="feed-profile-edit-btn"
                          onClick={() => setIsEditOpen(true)}
                          data-testid="feed-profile-edit-btn"
                        >
                          <Edit3 size={13} />
                          <span>Editar perfil</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`feed-profile-follow-action-btn ${profile.is_following ? 'following' : 'follow'}`}
                          onClick={handleToggleFollow}
                          disabled={isFollowLoading}
                          data-testid="feed-profile-follow-btn"
                          title={profile.is_following ? 'Deixar de seguir' : 'Seguir membro'}
                        >
                          {isFollowLoading ? (
                            <Loader2 size={13} className="feed-spinner" />
                          ) : profile.is_following ? (
                            <>
                              <UserCheck size={13} />
                              <span>Seguindo</span>
                            </>
                          ) : (
                            <>
                              <UserPlus size={13} />
                              <span>Seguir</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Contadores */}
                    <div className="feed-profile-stats">
                      <div className="feed-stat-item" data-testid="feed-profile-posts-stat">
                        <span className="feed-stat-number">{profile.posts_count || 0}</span>
                        <span>publicações</span>
                      </div>
                      <div
                        className="feed-stat-item clickable"
                        onClick={() => openFollowList('followers')}
                        role="button"
                        tabIndex={0}
                        data-testid="feed-profile-followers-stat"
                        title="Ver seguidores"
                      >
                        <span className="feed-stat-number">{profile.followers_count || 0}</span>
                        <span>seguidores</span>
                      </div>
                      <div
                        className="feed-stat-item clickable"
                        onClick={() => openFollowList('following')}
                        role="button"
                        tabIndex={0}
                        data-testid="feed-profile-following-stat"
                        title="Ver quem está seguindo"
                      >
                        <span className="feed-stat-number">{profile.following_count || 0}</span>
                        <span>seguindo</span>
                      </div>
                    </div>

                    {/* Bio */}
                    {profile.bio && (
                      <p className="feed-profile-bio-text" data-testid="feed-profile-bio">
                        {profile.bio}
                      </p>
                    )}

                    {/* Link na Bio */}
                    {profile.bio_link && (
                      <a
                        href={profile.bio_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="feed-profile-link-row"
                        data-testid="feed-profile-link"
                      >
                        <Link2 size={13} />
                        <span>{profile.bio_link.replace(/^https?:\/\//i, '')}</span>
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Grade de Publicações */}
                <div className="feed-profile-posts-section">
                  <div className="feed-profile-posts-title">Publicações</div>
                  {(!profile.posts || profile.posts.length === 0) ? (
                    <div className="feed-likes-empty" data-testid="feed-profile-no-posts">
                      <p>Nenhuma publicação feita ainda.</p>
                    </div>
                  ) : (
                    <div className="feed-profile-grid" data-testid="feed-profile-grid">
                      {profile.posts.map((post) => {
                        const hasMedia = post.media_urls && post.media_urls.length > 0;
                        const isVideo = post.media_type === 'video';
                        const thumb = post.media_thumbnail_url || (hasMedia ? post.media_urls[0] : null);

                        return (
                          <div
                            key={post.id}
                            className="feed-profile-grid-item"
                            onClick={() => {
                              if (onSelectPost) onSelectPost(post.id);
                              onClose();
                            }}
                            data-testid={`feed-profile-grid-item-${post.id}`}
                          >
                            {hasMedia && !isVideo ? (
                              <img src={thumb} alt="Post preview" />
                            ) : isVideo ? (
                              <video src={post.media_urls[0]} poster={post.media_thumbnail_url || undefined} />
                            ) : (
                              <div className="feed-profile-grid-text-only">
                                {post.content.slice(0, 80)}...
                              </div>
                            )}

                            <div className="feed-profile-grid-overlay">
                              <span className="feed-profile-grid-stat">
                                <Heart size={14} fill="currentColor" /> {post.likes_count}
                              </span>
                              <span className="feed-profile-grid-stat">
                                <MessageCircle size={14} fill="currentColor" /> {post.comments_count}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edição de Perfil */}
      <FeedEditProfileModal
        isOpen={isEditOpen}
        profile={profile}
        onClose={() => setIsEditOpen(false)}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* Modal de Lista de Seguidores / Seguindo */}
      <FeedFollowListModal
        isOpen={followListState.isOpen}
        targetUserId={profile?.id}
        targetUserName={profile?.name}
        initialTab={followListState.tab}
        onClose={() => {
          setFollowListState({ isOpen: false, tab: 'followers' });
          if (profile?.id) loadProfile(profile.id);
        }}
        onSelectUser={(selectedUserId) => {
          setFollowListState({ isOpen: false, tab: 'followers' });
          loadProfile(selectedUserId);
        }}
      />
    </>
  );
}
