import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bookmark,
  X,
  HelpCircle,
  GraduationCap,
  MessageSquare,
  MessagesSquare,
  Clock,
  User,
  Trash2,
  ExternalLink,
  Loader2,
} from 'lucide-react';

const TABS = [
  { id: 'duvidas', label: 'Dúvidas', icon: HelpCircle },
  { id: 'aulas', label: 'Aulas', icon: GraduationCap },
  { id: 'comentarios', label: 'Comentários', icon: MessageSquare },
  { id: 'mensagens', label: 'Mensagens', icon: MessagesSquare },
];

function formatTimeAgo(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'agora há pouco';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `há ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `há ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
    return date.toLocaleDateString('pt-BR');
  } catch {
    return '';
  }
}

export default function FavoritesDropdown({
  isOpen,
  onClose,
  onNavigate,
}) {
  const [activeTab, setActiveTab] = useState('duvidas');
  const [data, setData] = useState({
    topics: [],
    lessons: [],
    comments: [],
    messages: [],
    counts: { topics: 0, lessons: 0, comments: 0, messages: 0, total: 0 },
  });
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const getAuthToken = () => localStorage.getItem('auth_token') || localStorage.getItem('token');

  const fetchFavorites = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/favorites', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Erro ao buscar favoritos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchFavorites();
    }
  }, [isOpen, fetchFavorites]);

  // Atualiza automaticamente caso outros componentes emitam 'favorites_updated'
  useEffect(() => {
    const handleUpdate = () => {
      fetchFavorites();
    };
    window.addEventListener('favorites_updated', handleUpdate);
    return () => {
      window.removeEventListener('favorites_updated', handleUpdate);
    };
  }, [fetchFavorites]);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRemoveFavorite = async (e, type, item) => {
    e.stopPropagation();
    const token = getAuthToken();
    try {
      if (type === 'lessons') {
        await fetch(`/api/v1/favorites/lessons/${item.id}/toggle`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } else if (type === 'comments') {
        await fetch(`/api/v1/favorites/comments/${item.id}/toggle`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } else if (type === 'duvidas') {
        await fetch(`/api/v1/support/topics/${item.id}/pin`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } else if (type === 'mensagens') {
        await fetch(`/api/v1/chat/messages/${item.id}/favorite`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      }
      fetchFavorites();
      window.dispatchEvent(new CustomEvent('favorites_updated'));
    } catch (err) {
      console.error('Erro ao remover favorito:', err);
    }
  };

  const handleItemClick = (type, item) => {
    if (onNavigate) {
      onNavigate(type, item);
      onClose();
    }
  };

  const currentItems =
    activeTab === 'duvidas'
      ? data.topics || []
      : activeTab === 'aulas'
      ? data.lessons || []
      : activeTab === 'comentarios'
      ? data.comments || []
      : data.messages || [];

  return (
    <div
      ref={containerRef}
      className="favorites-dropdown"
      data-testid="favorites-dropdown"
      style={{
        position: 'absolute',
        top: '100%',
        right: '0',
        marginTop: '10px',
        width: '380px',
        maxWidth: '92vw',
        maxHeight: '520px',
        backgroundColor: '#0f172a',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
        animation: 'fadeInDropdown 0.2s ease-out',
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#111827',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bookmark size={17} color="#38bdf8" fill="#38bdf8" />
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            Favoritos
          </h3>
          <span
            data-testid="favorites-total-count"
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(56, 189, 248, 0.18)',
              color: '#38bdf8',
            }}
          >
            {data.counts?.total || 0}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          data-testid="close-favorites-dropdown-btn"
          title="Fechar"
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Abas */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#0a0f1d',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count =
            tab.id === 'duvidas'
              ? data.counts?.topics
              : tab.id === 'aulas'
              ? data.counts?.lessons
              : tab.id === 'comentarios'
              ? data.counts?.comments
              : data.counts?.messages;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              data-testid={`fav-tab-${tab.id}`}
              style={{
                flex: 1,
                padding: '10px 8px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid #38bdf8' : '2px solid transparent',
                color: isActive ? '#38bdf8' : '#94a3b8',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  style={{
                    fontSize: '0.625rem',
                    padding: '1px 5px',
                    borderRadius: '9999px',
                    backgroundColor: isActive ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                    color: isActive ? '#38bdf8' : '#cbd5e1',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lista de Itens */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', color: '#64748b', gap: '8px' }}>
            <Loader2 size={20} className="animate-spin text-blue-400" />
            <span style={{ fontSize: '0.8125rem' }}>Carregando favoritos...</span>
          </div>
        ) : currentItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
            <Bookmark size={30} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
            <p style={{ fontSize: '0.8125rem', margin: 0, fontWeight: 500, color: '#94a3b8' }}>
              Nenhum item favoritado em {TABS.find((t) => t.id === activeTab)?.label}
            </p>
            <span style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
              Clique no ícone de favorito ao visualizar o conteúdo para salvar aqui.
            </span>
          </div>
        ) : (
          currentItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(activeTab, item)}
              data-testid={`fav-item-${activeTab}-${item.id}`}
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
              }}
            >
              {/* Ícone ou Avatar */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: activeTab === 'aulas' ? '8px' : '50%',
                  backgroundColor:
                    activeTab === 'duvidas'
                      ? 'rgba(56, 189, 248, 0.15)'
                      : activeTab === 'aulas'
                      ? 'rgba(99, 102, 241, 0.15)'
                      : activeTab === 'comentarios'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(16, 185, 129, 0.15)',
                  color:
                    activeTab === 'duvidas'
                      ? '#38bdf8'
                      : activeTab === 'aulas'
                      ? '#818cf8'
                      : activeTab === 'comentarios'
                      ? '#fbbf24'
                      : '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {item.author?.avatar_url || item.thumbnail_url ? (
                  <img
                    src={item.author?.avatar_url || item.thumbnail_url}
                    alt="Miniatura"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : activeTab === 'aulas' ? (
                  <GraduationCap size={16} />
                ) : (
                  (item.author?.name || 'U').charAt(0).toUpperCase()
                )}
              </div>

              {/* Informações Centrais */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#f8fafc',
                    margin: '0 0 2px 0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={item.title || item.content || item.message}
                >
                  {item.title || item.content || item.message}
                </h4>

                {/* Subtítulo com detalhes */}
                <p
                  style={{
                    fontSize: '0.6875rem',
                    color: '#94a3b8',
                    margin: '0 0 4px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.35,
                  }}
                >
                  {activeTab === 'aulas' ? (
                    <>
                      {item.course_title ? <strong style={{ color: '#cbd5e1' }}>{item.course_title}</strong> : ''}
                      {item.module_title ? ` • Módulo: ${item.module_title}` : ''}
                      {item.description ? ` • ${item.description}` : ''}
                    </>
                  ) : (
                    <>
                      {item.course_title ? `${item.course_title} • ` : ''}
                      {item.content || item.description || item.message || ''}
                    </>
                  )}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.625rem', color: '#64748b' }}>
                  {item.author?.name && (
                    <span style={{ color: '#cbd5e1', fontWeight: 500 }}>
                      {item.author.name}
                    </span>
                  )}
                  {item.duration && (
                    <span>• {item.duration}</span>
                  )}
                  {item.created_at && (
                    <span>• {formatTimeAgo(item.created_at)}</span>
                  )}
                </div>
              </div>

              {/* Ação de Desfavoritar */}
              <button
                type="button"
                onClick={(e) => handleRemoveFavorite(e, activeTab, item)}
                data-testid={`remove-fav-btn-${item.id}`}
                title="Remover dos favoritos"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
