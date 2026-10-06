import React, { useState, useEffect, useCallback } from 'react';
import { Bookmark, Menu } from 'lucide-react';
import FavoritesDropdown from '../favorites/FavoritesDropdown';

export default function TopNavbar({
  user,
  onNavigateTab,
  onOpenMobileMenu,
  onNavigateToItem,
  bgColor = '#090d16',
}) {
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const getAuthToken = () => localStorage.getItem('auth_token') || localStorage.getItem('token');

  const fetchTotalCount = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch('/api/v1/favorites', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setTotalCount(json.counts?.total || 0);
      }
    } catch {
      // Silencioso
    }
  }, []);

  useEffect(() => {
    fetchTotalCount();
    const handleUpdate = () => {
      fetchTotalCount();
    };
    window.addEventListener('favorites_updated', handleUpdate);
    return () => {
      window.removeEventListener('favorites_updated', handleUpdate);
    };
  }, [fetchTotalCount]);

  const handleNavigateFromFavorites = (type, item) => {
    setIsFavoritesOpen(false);
    if (onNavigateToItem) {
      onNavigateToItem(type, item);
      return;
    }

    if (type === 'duvidas') {
      if (onNavigateTab) onNavigateTab('support');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open_support_topic', { detail: { topicId: item.id } }));
      }, 100);
    } else if (type === 'aulas' || type === 'comentarios') {
      if (onNavigateTab) onNavigateTab('courses');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open_course_lesson', { detail: { courseId: item.course_id, lessonId: item.id || item.lesson_id } }));
      }, 100);
    } else if (type === 'mensagens') {
      if (onNavigateTab) onNavigateTab('chat');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('jump_to_chat_message', { detail: { messageId: item.id } }));
      }, 100);
    }
  };

  return (
    <header
      className="global-top-navbar mobile-header"
      data-testid="mobile-header"
      style={{
        width: '100%',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 50,
        position: 'sticky',
        top: 0,
        flexShrink: 0,
      }}
    >
      {/* Lado Esquerdo: Menu Mobile ou Título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="mobile-menu-btn"
            data-testid="mobile-menu-toggle-btn"
            aria-label="Abrir menu lateral"
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Menu size={20} />
          </button>
        )}
        <div className="mobile-header-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9' }}>
            Área de Membros
          </span>
        </div>
      </div>

      {/* Lado Direito: Botão Favoritos, Dropdown e Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
        <button
          type="button"
          onClick={() => setIsFavoritesOpen((prev) => !prev)}
          data-testid="global-favorites-btn"
          title="Favoritos"
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 12px',
            borderRadius: '10px',
            backgroundColor: isFavoritesOpen ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: isFavoritesOpen ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
            color: isFavoritesOpen ? '#38bdf8' : '#e2e8f0',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Bookmark size={16} fill={isFavoritesOpen || totalCount > 0 ? '#38bdf8' : 'none'} color="#38bdf8" />
          <span className="hidden sm:inline">Favoritos</span>

          {totalCount > 0 && (
            <span
              data-testid="navbar-favorites-badge"
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '9999px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                marginLeft: '2px',
              }}
            >
              {totalCount}
            </span>
          )}
        </button>

        {/* Dropdown de Favoritos */}
        <FavoritesDropdown
          isOpen={isFavoritesOpen}
          onClose={() => setIsFavoritesOpen(false)}
          onNavigate={handleNavigateFromFavorites}
        />

        {/* Avatar do Usuário */}
        <div
          data-testid="mobile-header-avatar"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name || 'Avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            (user?.name || 'U').charAt(0).toUpperCase()
          )}
        </div>
      </div>
    </header>
  );
}
