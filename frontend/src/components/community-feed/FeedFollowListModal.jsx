import React, { useEffect, useState } from 'react';
import { X, Loader2, UserCheck, UserPlus, Users } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { fetchUserFollowers, fetchUserFollowing, toggleFollowUser } from './communityFeedApi';
import './community-feed-follow.css';

export default function FeedFollowListModal({
  isOpen,
  targetUserId,
  targetUserName = 'Membro',
  initialTab = 'followers',
  onClose,
  onSelectUser,
}) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const loadList = async (tab, userId) => {
    if (!userId) return;
    setIsLoading(true);
    try {
      if (tab === 'followers') {
        const data = await fetchUserFollowers(userId);
        setUsers(data);
      } else {
        const data = await fetchUserFollowing(userId);
        setUsers(data);
      }
    } catch (err) {
      addToast(err.message || 'Erro ao carregar lista.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && targetUserId) {
      loadList(activeTab, targetUserId);
    }
  }, [isOpen, targetUserId, activeTab]);

  if (!isOpen) return null;

  const handleToggleFollow = async (user) => {
    setActionLoadingId(user.id);
    try {
      const res = await toggleFollowUser(user.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_following: res.following } : u))
      );
      if (res.following) {
        addToast(`Você agora está seguindo ${user.name}!`, 'success');
      } else {
        addToast(`Você deixou de seguir ${user.name}.`, 'info');
      }
    } catch (err) {
      addToast(err.message || 'Erro ao atualizar seguir.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div
      className="feed-modal-backdrop"
      data-testid="feed-follow-list-modal"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="feed-follow-list-container"
        data-testid="feed-follow-list-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="feed-follow-list-header">
          <div className="feed-follow-tabs">
            <button
              type="button"
              className={`feed-follow-tab-btn ${activeTab === 'followers' ? 'active' : ''}`}
              onClick={() => setActiveTab('followers')}
              data-testid="feed-follow-tab-followers"
            >
              Seguidores
            </button>
            <button
              type="button"
              className={`feed-follow-tab-btn ${activeTab === 'following' ? 'active' : ''}`}
              onClick={() => setActiveTab('following')}
              data-testid="feed-follow-tab-following"
            >
              Seguindo
            </button>
          </div>
          <button
            type="button"
            className="feed-likes-modal-close-btn"
            onClick={onClose}
            title="Fechar"
            data-testid="feed-follow-list-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lista */}
        <div className="feed-follow-list-body">
          {isLoading ? (
            <div className="feed-likes-loading" data-testid="feed-follow-loading">
              <Loader2 size={24} className="feed-spinner" />
              <span>Carregando {activeTab === 'followers' ? 'seguidores' : 'quem segue'}...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="feed-likes-empty" data-testid="feed-follow-empty">
              <Users size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
              <p>
                {activeTab === 'followers'
                  ? `${targetUserName} ainda não tem seguidores.`
                  : `${targetUserName} ainda não está seguindo ninguém.`}
              </p>
            </div>
          ) : (
            <div className="feed-follow-users-list">
              {users.map((u) => {
                const initial = u.name ? u.name.charAt(0).toUpperCase() : 'M';
                const isActionLoading = actionLoadingId === u.id;

                return (
                  <div
                    key={u.id}
                    className="feed-follow-user-item"
                    data-testid={`feed-follow-user-${u.id}`}
                  >
                    <div
                      className="feed-follow-user-info"
                      onClick={() => {
                        if (onSelectUser) onSelectUser(u.id);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="feed-user-avatar" style={{ width: 40, height: 40 }}>
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.name} />
                        ) : (
                          <span>{initial}</span>
                        )}
                      </div>
                      <div className="feed-follow-user-meta">
                        <div className="feed-follow-user-name-row">
                          <span className="feed-follow-user-name">{u.name}</span>
                          {u.role === 'superadmin' && (
                            <span className="feed-role-badge superadmin">Super Admin</span>
                          )}
                          {u.role === 'admin' && (
                            <span className="feed-role-badge admin">Admin</span>
                          )}
                        </div>
                        {u.bio && (
                          <p className="feed-follow-user-bio">
                            {u.bio.length > 50 ? `${u.bio.slice(0, 50)}...` : u.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    {!u.is_me && (
                      <button
                        type="button"
                        className={`feed-follow-action-btn ${u.is_following ? 'following' : 'follow'}`}
                        onClick={() => handleToggleFollow(u)}
                        disabled={isActionLoading}
                        data-testid={`feed-follow-toggle-btn-${u.id}`}
                      >
                        {isActionLoading ? (
                          <Loader2 size={13} className="feed-spinner" />
                        ) : u.is_following ? (
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
