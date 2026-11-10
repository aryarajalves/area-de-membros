import React, { useEffect, useState } from 'react';
import { Bell, Heart, MessageCircle, AtSign, CheckCheck, Trash2, X, Loader2 } from 'lucide-react';
import {
  fetchFeedNotifications,
  markFeedNotificationAsRead,
  markAllFeedNotificationsAsRead,
  deleteFeedNotification,
} from './communityFeedApi';

export default function FeedNotificationsModal({ isOpen, onClose, onSelectPost, onUnreadCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'

  const loadNotifications = async (tab = activeTab) => {
    setIsLoading(true);
    try {
      const data = await fetchFeedNotifications({ unreadOnly: tab === 'unread', limit: 40 });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
      if (onUnreadCountChange) onUnreadCountChange(data.unread_count || 0);
    } catch {
      // Ignora erro silencioso
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications(activeTab);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await markFeedNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (onUnreadCountChange) onUnreadCountChange(Math.max(0, unreadCount - 1));
    } catch {
      // Falha silenciosa
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllFeedNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      if (onUnreadCountChange) onUnreadCountChange(0);
    } catch {
      // Falha silenciosa
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await deleteFeedNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // Falha silenciosa
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      handleMarkAsRead(notif.id);
    }
    if (notif.post_id && onSelectPost) {
      onSelectPost(notif.post_id);
      onClose();
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Agora';
      if (diffMin < 60) return `${diffMin}m atrás`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h atrás`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d atrás`;
    } catch {
      return '';
    }
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'feed_like':
        return <Heart size={14} className="feed-notif-badge-icon like" fill="currentColor" />;
      case 'feed_comment':
        return <MessageCircle size={14} className="feed-notif-badge-icon comment" fill="currentColor" />;
      case 'feed_mention':
        return <AtSign size={14} className="feed-notif-badge-icon mention" />;
      default:
        return <Bell size={14} className="feed-notif-badge-icon" />;
    }
  };

  return (
    <div
      className="feed-modal-backdrop"
      data-testid="feed-notifications-modal"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="feed-notif-modal-container"
        data-testid="feed-notif-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="feed-notif-header">
          <div className="feed-notif-title-group">
            <Bell size={20} className="feed-notif-bell-icon" />
            <h3 className="feed-notif-title">Notificações</h3>
            {unreadCount > 0 && (
              <span className="feed-notif-unread-badge" data-testid="feed-notif-unread-count">
                {unreadCount} nova{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="feed-notif-actions-header">
            {unreadCount > 0 && (
              <button
                type="button"
                className="feed-notif-mark-all-btn"
                onClick={handleMarkAllRead}
                title="Marcar todas como lidas"
                data-testid="feed-notif-mark-all-btn"
              >
                <CheckCheck size={16} />
                <span>Marcar lidas</span>
              </button>
            )}
            <button
              type="button"
              className="feed-likes-modal-close-btn"
              onClick={onClose}
              title="Fechar"
              data-testid="feed-notif-close-btn"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="feed-notif-tabs">
          <button
            type="button"
            className={`feed-notif-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
            data-testid="feed-notif-tab-all"
          >
            Todas
          </button>
          <button
            type="button"
            className={`feed-notif-tab ${activeTab === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveTab('unread')}
            data-testid="feed-notif-tab-unread"
          >
            Não Lidas {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        {/* Lista de Notificações */}
        <div className="feed-notif-body">
          {isLoading ? (
            <div className="feed-likes-loading" data-testid="feed-notif-loading">
              <Loader2 size={24} className="feed-spinner" />
              <span>Carregando notificações...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="feed-likes-empty" data-testid="feed-notif-empty">
              <Bell size={36} className="feed-notif-empty-icon" />
              <p>Nenhuma notificação {activeTab === 'unread' ? 'não lida' : 'por aqui'}.</p>
            </div>
          ) : (
            <div className="feed-notif-list" data-testid="feed-notif-list">
              {notifications.map((notif) => {
                const initial = notif.actor_name ? notif.actor_name.charAt(0).toUpperCase() : 'M';
                return (
                  <div
                    key={notif.id}
                    className={`feed-notif-item ${notif.is_read ? 'read' : 'unread'}`}
                    onClick={() => handleNotificationClick(notif)}
                    data-testid={`feed-notif-item-${notif.id}`}
                  >
                    {/* Avatar com badge de ícone */}
                    <div className="feed-notif-avatar-wrapper">
                      <div className="feed-notif-avatar">
                        {notif.actor_avatar ? (
                          <img src={notif.actor_avatar} alt={notif.actor_name || 'Usuário'} />
                        ) : (
                          <span>{initial}</span>
                        )}
                      </div>
                      <div className="feed-notif-type-badge">{renderIcon(notif.notification_type)}</div>
                    </div>

                    {/* Conteúdo textual */}
                    <div className="feed-notif-content">
                      <div className="feed-notif-title-row">
                        <span className="feed-notif-item-title">{notif.title}</span>
                        <span className="feed-notif-item-time">{formatRelativeTime(notif.created_at)}</span>
                      </div>
                      <p className="feed-notif-item-msg">{notif.message}</p>
                    </div>

                    {/* Ações rápidas */}
                    <div className="feed-notif-item-actions">
                      {!notif.is_read && (
                        <button
                          type="button"
                          className="feed-notif-single-read-btn"
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          title="Marcar como lida"
                          data-testid={`feed-notif-mark-read-${notif.id}`}
                        >
                          <span className="feed-unread-dot" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="feed-notif-delete-btn"
                        onClick={(e) => handleDelete(notif.id, e)}
                        title="Excluir notificação"
                        data-testid={`feed-notif-del-${notif.id}`}
                      >
                        <Trash2 size={14} />
                      </button>
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
