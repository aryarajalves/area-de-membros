import React, { useEffect, useState } from 'react';
import { X, Link2, Edit3, Loader2, Heart, MessageCircle, ExternalLink, UserCheck, UserPlus, Trophy } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { fetchUserProfile, toggleFollowUser } from './communityFeedApi';
import { calculateStudentLevel, getTierBadgeStyle } from '../../utils/gamificationLevelUtils';
import FeedEditProfileModal from './FeedEditProfileModal';
import FeedFollowListModal from './FeedFollowListModal';
import FeedPostDetailModal from './FeedPostDetailModal';
import './community-feed-profile.css';

export default function FeedProfileModal({ isOpen, userId, onClose, onSelectPost, onProfileUpdated }) {
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [followListState, setFollowListState] = useState({ isOpen: false, tab: 'followers' });
  const [selectedPostDetail, setSelectedPostDetail] = useState(null);
  const [postsFilter, setPostsFilter] = useState('recent');

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

  const eloInfo = profile ? (
    profile.gamification_badge
      ? {
          badge: profile.gamification_badge,
          title: profile.gamification_level_title || profile.gamification_badge,
          tier: profile.gamification_tier || 'Bronze',
          points: profile.gamification_points || 0,
          progress: profile.gamification_progress_percent ?? 0,
          pointsToNext: profile.gamification_points_to_next ?? 0,
          level: profile.gamification_level || 1,
        }
      : calculateStudentLevel(profile.gamification_points || 0)
  ) : null;

  const tierStyle = eloInfo ? getTierBadgeStyle(eloInfo.tier || eloInfo.level_tier) : null;

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

                      {/* Badge de Elo RPG */}
                      {eloInfo && (
                        <div
                          className="feed-profile-elo-badge"
                          data-testid="feed-profile-elo-badge"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 9px',
                            borderRadius: '999px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            backgroundColor: tierStyle?.bg || 'rgba(205, 127, 50, 0.16)',
                            border: tierStyle?.border || '1px solid rgba(205, 127, 50, 0.4)',
                            color: tierStyle?.color || '#fb923c',
                            boxShadow: tierStyle?.glow || 'none',
                            userSelect: 'none',
                          }}
                          title={`Elo de Gamificação: ${eloInfo.title || eloInfo.level_title || 'Bronze I'} (${eloInfo.points || 0} XP)`}
                        >
                          <span>{eloInfo.badge || eloInfo.level_badge || '🛡️ Bronze I'}</span>
                        </div>
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

                    {/* Card de Progresso do Elo RPG */}
                    {eloInfo && (
                      <div
                        className="feed-profile-elo-card"
                        data-testid="feed-profile-elo-card"
                        style={{
                          marginBottom: '14px',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.07)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                          <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Trophy size={13} color={tierStyle?.color || '#fb923c'} />
                            <span>Elo RPG:</span>
                            <strong style={{ color: tierStyle?.color || '#fb923c' }}>
                              {eloInfo.title || eloInfo.level_title || 'Bronze I'}
                            </strong>
                          </span>
                          <span style={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.75rem' }} data-testid="feed-profile-elo-points">
                            {eloInfo.points || 0} XP
                          </span>
                        </div>
                        {(!eloInfo.is_max_level) && (
                          <div style={{ width: '100%', height: '5px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                            <div
                              data-testid="feed-profile-elo-progress-bar"
                              style={{
                                width: `${Math.min(100, Math.max(0, eloInfo.progress ?? eloInfo.level_progress_percent ?? 0))}%`,
                                height: '100%',
                                borderRadius: '999px',
                                background: `linear-gradient(90deg, ${tierStyle?.color || '#fb923c'}, #38bdf8)`,
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}

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
                  <div className="feed-profile-posts-header">
                    <div className="feed-profile-posts-title">Publicações</div>
                    <div className="feed-profile-filter-tabs" data-testid="feed-profile-filter-tabs">
                      {[
                        { id: 'recent', label: 'Recentes' },
                        { id: 'likes', label: 'Mais Curtidas' },
                        { id: 'comments', label: 'Mais Comentadas' },
                        { id: 'saves', label: 'Mais Salvas' },
                        { id: 'shares', label: 'Compartilhadas' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          className={`feed-profile-filter-btn ${postsFilter === f.id ? 'active' : ''}`}
                          onClick={() => setPostsFilter(f.id)}
                          data-testid={`feed-profile-filter-${f.id}`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(!profile.posts || profile.posts.length === 0) ? (
                    <div className="feed-likes-empty" data-testid="feed-profile-no-posts">
                      <p>Nenhuma publicação feita ainda.</p>
                    </div>
                  ) : (
                    <div className="feed-profile-grid" data-testid="feed-profile-grid">
                      {[...profile.posts]
                        .sort((a, b) => {
                          if (postsFilter === 'likes') return (b.likes_count || 0) - (a.likes_count || 0);
                          if (postsFilter === 'comments') return (b.comments_count || 0) - (a.comments_count || 0);
                          if (postsFilter === 'saves') return (b.saves_count || 0) - (a.saves_count || 0);
                          if (postsFilter === 'shares') return (b.shares_count || 0) - (a.shares_count || 0);
                          return (b.id || 0) - (a.id || 0);
                        })
                        .map((post) => {
                        const hasMedia = post.media_urls && post.media_urls.length > 0;
                        const isVideo = post.media_type === 'video';
                        const thumb = post.media_thumbnail_url || (hasMedia ? post.media_urls[0] : null);

                        return (
                          <div
                            key={post.id}
                            className="feed-profile-grid-item"
                            onClick={() => {
                              setSelectedPostDetail(post);
                              if (onSelectPost) onSelectPost(post.id);
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

      {/* Modal da Publicação Maximizada */}
      {selectedPostDetail && (
        <FeedPostDetailModal
          isOpen={Boolean(selectedPostDetail)}
          post={selectedPostDetail}
          postId={selectedPostDetail.id}
          currentUser={{ id: profile?.is_me ? profile?.id : null }}
          onClose={() => setSelectedPostDetail(null)}
          onPostUpdated={(updatedPost) => {
            setSelectedPostDetail(updatedPost);
            setProfile((prev) =>
              prev
                ? {
                    ...prev,
                    posts: prev.posts?.map((p) => (p.id === updatedPost.id ? updatedPost : p)),
                  }
                : prev
            );
          }}
          onOpenProfile={(uid) => {
            setSelectedPostDetail(null);
            loadProfile(uid);
          }}
        />
      )}
    </>
  );
}
