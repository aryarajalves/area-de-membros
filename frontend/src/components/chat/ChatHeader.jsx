import React from 'react';
import { Globe, BookOpen, Star, Pin, X } from 'lucide-react';

export default function ChatHeader({
  selectedChannel,
  currentUser,
  pinnedMessage,
  favoritesOnly = false,
  onToggleFavoritesOnly,
  onUnpinMessage,
}) {
  if (!selectedChannel) return null;

  const isGeneral = selectedChannel.type === 'general';
  const Icon = isGeneral ? Globe : BookOpen;
  const isManager = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <header
        className="chat-header"
        data-testid="chat-active-header"
        style={{
          padding: '16px 24px',
          backgroundColor: '#0f172a',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
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
            }}
          >
            <Icon size={20} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1
                data-testid="chat-header-title"
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {selectedChannel.name}
              </h1>
              {isGeneral && (
                <span
                  style={{
                    fontSize: '0.6875rem',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: '#93c5fd',
                    fontWeight: 600,
                    border: '1px solid rgba(59, 130, 246, 0.3)',
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
              }}
            >
              {selectedChannel.description || 'Canal de bate-papo e troca de ideias'}
            </p>
          </div>
        </div>

        {/* Controles da Direita: Filtro de Favoritas e Indicador Ao Vivo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Botão de Alternar Filtro de Favoritas */}
          <button
            type="button"
            onClick={onToggleFavoritesOnly}
            data-testid="chat-filter-favorites-btn"
            title={favoritesOnly ? 'Ver todas as mensagens' : 'Ver apenas mensagens favoritas'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: favoritesOnly ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: favoritesOnly ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
              color: favoritesOnly ? '#fbbf24' : '#94a3b8',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Star size={13} fill={favoritesOnly ? '#fbbf24' : 'none'} />
            <span>{favoritesOnly ? '⭐ Favoritas' : 'Favoritas'}</span>
          </button>

          {/* Indicador Ao Vivo */}
          <div
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
              }}
            />
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#34d399',
                letterSpacing: '0.02em',
              }}
            >
              Chat Ativo
            </span>
          </div>
        </div>
      </header>

      {/* Banner de Mensagem Fixada */}
      {pinnedMessage && (
        <div
          data-testid="chat-pinned-message-banner"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 24px',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
            color: '#e0f2fe',
            fontSize: '0.8125rem',
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
              onClick={() => onUnpinMessage(pinnedMessage.id)}
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
