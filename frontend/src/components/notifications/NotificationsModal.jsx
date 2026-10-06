import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  X,
  CheckCheck,
  Inbox,
  AtSign,
  MessageSquare,
  Layers,
  Loader2,
} from 'lucide-react';
import NotificationItemCard from './NotificationItemCard';

const TABS = [
  { id: 'inbox', label: 'Caixa de entrada', icon: Inbox },
  { id: 'mentions', label: 'Menções', icon: AtSign },
  { id: 'threads', label: 'Seguindo / Threads', icon: MessageSquare },
  { id: 'all', label: 'Todas', icon: Layers },
];

export default function NotificationsModal({
  isOpen,
  onClose,
  onNavigateToMessage,
}) {
  const [activeTab, setActiveTab] = useState('inbox');
  const [notifications, setNotifications] = useState([]);
  const [counts, setCounts] = useState({ inbox: 0, mentions: 0, threads: 0 });
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  // Bloqueio de scroll do body quando aberto
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const getAuthToken = () => localStorage.getItem('auth_token') || localStorage.getItem('token');

  // Buscar contadores
  const fetchCounts = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch('/api/v1/chat/notifications/counts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCounts(data);
      }
    } catch {
      // Silencioso
    }
  }, []);

  // Buscar lista de notificações
  const fetchNotifications = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/chat/notifications?tab=${activeTab}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchCounts();

      const intervalId = setInterval(() => {
        fetchNotifications();
        fetchCounts();
      }, 4000);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isOpen, fetchNotifications, fetchCounts]);

  // Marcar item individual como lido
  const handleMarkItemRead = async (item) => {
    const token = getAuthToken();
    if (!token) return;
    try {
      if (item.type === 'mention') {
        await fetch(`/api/v1/chat/mentions/${item.id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
      fetchCounts();
      window.dispatchEvent(new CustomEvent('notifications_updated'));
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
    }
  };

  // Marcar todas como lidas
  const handleMarkAllRead = async () => {
    const token = getAuthToken();
    if (!token) return;
    setMarkingAll(true);
    try {
      const res = await fetch('/api/v1/chat/notifications/mark-all-read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setCounts({ inbox: 0, mentions: 0, threads: 0, total_unread: 0 });
        window.dispatchEvent(new CustomEvent('notifications_updated'));
      }
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleSelectItem = (item) => {
    if (!item.is_read) {
      handleMarkItemRead(item);
    }
    if (onNavigateToMessage) {
      onNavigateToMessage(item);
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      data-testid="notifications-modal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          height: '620px',
          maxHeight: '90vh',
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#131d35',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Notificações
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Menções e respostas nas suas threads
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {counts.inbox > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                data-testid="mark-all-read-btn"
                title="Marcar todas como lidas"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                }}
              >
                <CheckCheck size={14} color="#38bdf8" />
                <span className="hidden sm:inline">Marcar lidas</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              data-testid="close-notifications-btn"
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                borderRadius: '6px',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Abas */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            backgroundColor: '#0c1322',
            overflowX: 'auto',
          }}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count = tab.id === 'inbox' ? counts.inbox : tab.id === 'mentions' ? counts.mentions : tab.id === 'threads' ? counts.threads : 0;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                data-testid={`tab-${tab.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      backgroundColor: isActive ? '#38bdf8' : '#334155',
                      color: isActive ? '#0f172a' : '#f8fafc',
                      padding: '1px 6px',
                      borderRadius: '9999px',
                    }}
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Lista de Notificações */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {loading ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 0',
                gap: '12px',
                color: '#94a3b8',
              }}
            >
              <Loader2 size={32} className="animate-spin" color="#38bdf8" />
              <span style={{ fontSize: '0.85rem' }}>Carregando notificações...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 0',
                gap: '10px',
                color: '#64748b',
                textAlign: 'center',
              }}
            >
              <Bell size={40} style={{ opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>
                Nenhuma notificação por aqui
              </p>
              <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                Quando alguém mencionar você ou responder às suas mensagens, você verá aqui.
              </span>
            </div>
          ) : (
            notifications.map((item) => (
              <NotificationItemCard
                key={`${item.type}-${item.id}`}
                item={item}
                onSelect={handleSelectItem}
                onMarkRead={handleMarkItemRead}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
