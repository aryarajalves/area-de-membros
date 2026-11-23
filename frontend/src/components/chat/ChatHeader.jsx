import React, { useState, useEffect, useRef } from 'react';
import { Globe, BookOpen, Star, Pin, X, ArrowLeft, FolderOpen, AtSign, Mail, Users, MoreHorizontal } from 'lucide-react';

export default function ChatHeader({
  selectedChannel,
  currentUser,
  pinnedMessage,
  favoritesOnly = false,
  onToggleFavoritesOnly,
  onOpenMediaGallery,
  onOpenMentions,
  onOpenDm,
  onToggleMembers,
  isMembersOpen = true,
  onUnpinMessage,
  onBack,
  onJumpToMessage,
  onBackToChannels,
}) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);

  useEffect(() => {
    if (!isMoreMenuOpen) return;

    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setIsMoreMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMoreMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMoreMenuOpen]);

  if (!selectedChannel) return null;

  const isGeneral = selectedChannel.type === 'general';
  const Icon = isGeneral ? Globe : BookOpen;
  const isManager = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  const secondaryActions = [
    {
      key: 'favorites',
      testId: 'chat-filter-favorites-btn',
      label: favoritesOnly ? 'Favoritas (Ativo)' : 'Favoritas',
      title: favoritesOnly ? 'Ver todas as mensagens' : 'Ver apenas mensagens favoritas',
      icon: <Star size={14} fill={favoritesOnly ? '#fbbf24' : 'none'} color={favoritesOnly ? '#fbbf24' : '#94a3b8'} />,
      color: favoritesOnly ? '#fbbf24' : '#e2e8f0',
      activeBg: favoritesOnly ? 'rgba(245, 158, 11, 0.14)' : 'transparent',
      onClick: onToggleFavoritesOnly,
      visible: true,
    },
    {
      key: 'media',
      testId: 'chat-open-media-gallery-btn',
      label: 'Mídias & Arquivos',
      title: 'Abrir galeria de fotos, vídeos, áudios e documentos do canal',
      icon: <FolderOpen size={14} color="#38bdf8" />,
      color: '#e2e8f0',
      activeBg: 'transparent',
      onClick: onOpenMediaGallery,
      visible: true,
    },
    {
      key: 'mentions',
      testId: 'chat-open-mentions-btn',
      label: 'Menções',
      title: 'Ver mensagens onde fui marcado',
      icon: <AtSign size={14} color="#c084fc" />,
      color: '#e2e8f0',
      activeBg: 'transparent',
      onClick: onOpenMentions,
      visible: Boolean(onOpenMentions),
    },
    {
      key: 'dms',
      testId: 'chat-open-dm-btn',
      label: 'DMs',
      title: 'Ver Mensagens Diretas (DMs / Inbox)',
      icon: <Mail size={14} color="#38bdf8" />,
      color: '#e2e8f0',
      activeBg: 'transparent',
      onClick: onOpenDm,
      visible: Boolean(onOpenDm),
    },
    {
      key: 'back',
      testId: 'chat-header-back-btn',
      label: 'Voltar aos Cursos',
      title: 'Voltar aos Cursos',
      icon: <ArrowLeft size={14} color="#60a5fa" />,
      color: '#cbd5e1',
      activeBg: 'transparent',
      onClick: onBack,
      visible: Boolean(onBack),
    },
  ].filter((item) => item.visible);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <header
        className="chat-header"
        data-testid="chat-active-header"
        style={{
          padding: '14px 20px',
          backgroundColor: '#0f172a',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div
          className="chat-header-left"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: 'fit-content',
            flexShrink: 0,
          }}
        >
          {onBackToChannels && (
            <button
              type="button"
              onClick={onBackToChannels}
              className="chat-mobile-back-channels-btn"
              data-testid="chat-back-to-channels-btn"
              title="Voltar para a lista de canais"
            >
              <ArrowLeft size={16} />
              <span>Canais</span>
            </button>
          )}

          <div
            className="chat-header-icon-box"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: isGeneral ? 'rgba(37, 99, 235, 0.2)' : 'rgba(139, 92, 246, 0.2)',
              color: isGeneral ? '#60a5fa' : '#c084fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: isGeneral
                ? '1px solid rgba(37, 99, 235, 0.35)'
                : '1px solid rgba(139, 92, 246, 0.35)',
              flexShrink: 0,
            }}
          >
            <Icon size={20} />
          </div>

          <div className="chat-header-title-container" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="chat-header-title-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
              <h1
                data-testid="chat-header-title"
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  margin: 0,
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                {selectedChannel.name}
              </h1>
              {isGeneral && (
                <span
                  className="chat-header-badge"
                  style={{
                    fontSize: '0.6875rem',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: '#93c5fd',
                    fontWeight: 600,
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Comunidade
                </span>
              )}
            </div>
            <p
              data-testid="chat-header-desc"
              style={{
                fontSize: '0.8125rem',
                color: '#94a3b8',
                margin: '3px 0 0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '520px',
              }}
              title={selectedChannel.description || 'Canal de bate-papo e troca de ideias'}
            >
              {selectedChannel.description || 'Canal de bate-papo e troca de ideias'}
            </p>
          </div>
        </div>

        {/* Controles da Direita: Membros, Indicador Ao Vivo e Menu "Mais" */}
        <div
          className="chat-header-actions"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
            flexWrap: 'nowrap',
            justifyContent: 'flex-end',
          }}
        >
          {/* Botão para Alternar Barra Lateral de Membros */}
          {onToggleMembers && (
            <button
              type="button"
              onClick={onToggleMembers}
              className={`chat-header-action-btn ${isMembersOpen ? 'active' : ''}`}
              data-testid="chat-open-members-sidebar-btn"
              title={isMembersOpen ? 'Ocultar barra de membros' : 'Ver membros que podem ver este chat'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: isMembersOpen ? 'rgba(59, 130, 246, 0.22)' : 'rgba(59, 130, 246, 0.08)',
                border: isMembersOpen ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(59, 130, 246, 0.2)',
                color: isMembersOpen ? '#93c5fd' : '#60a5fa',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Users size={13} />
              <span className="chat-header-btn-text">Membros</span>
            </button>
          )}

          {/* Indicador Ao Vivo */}
          <div
            className="chat-header-live-indicator"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span
              className="chat-header-live-text"
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#34d399',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              Chat Ativo
            </span>
          </div>

          {/* Botão "Mais" com Dropdown para Ações Secundárias */}
          <div ref={moreMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen((prev) => !prev)}
              className={`chat-header-action-btn ${isMoreMenuOpen ? 'active' : ''}`}
              data-testid="chat-header-more-btn"
              aria-expanded={isMoreMenuOpen}
              aria-haspopup="menu"
              title="Mais opções do canal"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: isMoreMenuOpen ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.06)',
                border: isMoreMenuOpen ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid rgba(255, 255, 255, 0.12)',
                color: isMoreMenuOpen ? '#e0f2fe' : '#cbd5e1',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <MoreHorizontal size={14} />
              <span className="chat-header-btn-text">Mais</span>
              {favoritesOnly && (
                <span
                  data-testid="chat-header-more-active-dot"
                  title="Filtro de favoritas ativo"
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#fbbf24',
                    boxShadow: '0 0 6px #fbbf24',
                  }}
                />
              )}
            </button>

            {isMoreMenuOpen && (
              <div
                role="menu"
                data-testid="chat-header-more-menu"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: '210px',
                  padding: '6px',
                  borderRadius: '12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.55)',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                {secondaryActions.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    role="menuitem"
                    data-testid={action.testId}
                    title={action.title}
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      if (action.onClick) action.onClick();
                    }}
                    className="chat-header-action-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: action.activeBg,
                      color: action.color,
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = action.activeBg;
                    }}
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Banner de Mensagem Fixada (apenas mensagens do canal, nunca respostas de thread) */}
      {pinnedMessage && !pinnedMessage.parent_id && (
        <div
          data-testid="chat-pinned-message-banner"
          onClick={() => onJumpToMessage && onJumpToMessage(pinnedMessage.id)}
          title="Clique para ir até a mensagem fixada"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 24px',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
            color: '#e0f2fe',
            fontSize: '0.8125rem',
            cursor: onJumpToMessage ? 'pointer' : 'default',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (onJumpToMessage) e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.16)';
          }}
          onMouseLeave={(e) => {
            if (onJumpToMessage) e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.08)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <Pin size={14} color="#38bdf8" fill="#38bdf8" style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 700, color: '#38bdf8', flexShrink: 0 }}>
              Mensagem Fixada:
            </span>
            <span style={{ fontWeight: 600, color: '#ffffff', flexShrink: 0 }}>
              {pinnedMessage.user?.name || 'Usuário'}:
            </span>
            <span
              style={{
                color: '#bae6fd',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {pinnedMessage.message || (pinnedMessage.media_url ? '[Mídia Anexa]' : '')}
            </span>
          </div>

          {isManager && onUnpinMessage && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUnpinMessage(pinnedMessage.id);
              }}
              title="Desafixar mensagem"
              data-testid="unpin-message-banner-btn"
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px 4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                borderRadius: '4px',
                transition: 'color 0.15s ease',
                flexShrink: 0,
                marginLeft: '12px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              <X size={14} />
              <span>Desafixar</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
