import React, { useState } from 'react';
import { Trash2, Shield, Award, User, Heart, Star, Pin, FileText, ExternalLink, Video, Mic } from 'lucide-react';

function formatMessageTime(dateString) {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '';
  }
}

function getRoleBadge(role) {
  switch (role) {
    case 'superadmin':
      return {
        label: 'Super Admin',
        color: '#c084fc',
        bg: 'rgba(192, 132, 252, 0.15)',
        border: 'rgba(192, 132, 252, 0.3)',
        icon: Shield,
      };
    case 'admin':
      return {
        label: 'Instrutor',
        color: '#60a5fa',
        bg: 'rgba(96, 165, 250, 0.15)',
        border: 'rgba(96, 165, 250, 0.3)',
        icon: Award,
      };
    default:
      return {
        label: 'Aluno',
        color: '#34d399',
        bg: 'rgba(52, 211, 153, 0.12)',
        border: 'rgba(52, 211, 153, 0.25)',
        icon: User,
      };
  }
}

export default function ChatMessageItem({
  message,
  currentUser,
  onDeleteMessage,
  onToggleLike,
  onToggleFavorite,
  onTogglePin,
  isHighlighted = false,
}) {
  const [imgError, setImgError] = useState(false);
  const isOwn = message.user?.id === currentUser?.id;
  const roleBadge = getRoleBadge(message.user?.role);
  const BadgeIcon = roleBadge.icon;
  const timeFormatted = formatMessageTime(message.created_at);
  const initial = (message.user?.name || 'U').charAt(0).toUpperCase();
  const avatarUrl = (isOwn && currentUser?.avatar_url) ? currentUser.avatar_url : message.user?.avatar_url;

  return (
    <div
      id={`chat-message-${message.id}`}
      className={`chat-message-row ${isOwn ? 'own-message' : ''} ${isHighlighted ? 'chat-message-highlighted' : ''}`}
      data-testid={`chat-message-item-${message.id}`}
      data-highlighted={isHighlighted ? 'true' : 'false'}
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        marginBottom: '16px',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        padding: '6px 8px',
        borderRadius: '12px',
        backgroundColor: isHighlighted ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
        boxShadow: isHighlighted ? '0 0 0 2px #38bdf8, 0 0 20px rgba(56, 189, 248, 0.35)' : 'none',
        transition: 'all 0.35s ease',
      }}
    >
      {/* Avatar */}
      <div
        data-testid={`chat-avatar-${message.id}`}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          overflow: 'hidden',
          background: isOwn
            ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
            : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '0.9375rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
          border: isOwn ? '1px solid rgba(147, 197, 253, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {avatarUrl && !imgError ? (
          <img
            src={avatarUrl}
            alt={message.user?.name || 'Avatar'}
            onError={() => setImgError(true)}
            data-testid={`chat-avatar-img-${message.id}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        ) : (
          initial
        )}
      </div>

      {/* Conteúdo e Balão */}
      <div
        style={{
          maxWidth: '75%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOwn ? 'flex-end' : 'flex-start',
        }}
      >
        {/* Metadados: Nome, Cargo e Horário */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: isOwn ? '#93c5fd' : '#f1f5f9',
            }}
          >
            {isOwn ? 'Você' : message.user?.name || 'Usuário'}
          </span>

          <span
            style={{
              fontSize: '0.6875rem',
              padding: '1px 7px',
              borderRadius: '9999px',
              backgroundColor: roleBadge.bg,
              color: roleBadge.color,
              border: `1px solid ${roleBadge.border}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500,
            }}
          >
            <BadgeIcon size={10} />
            {roleBadge.label}
          </span>

          <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
            {timeFormatted}
          </span>

          {/* Badge de Mensagem Fixada */}
          {message.is_pinned && (
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '1px 7px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontWeight: 600,
              }}
              data-testid={`pinned-badge-${message.id}`}
            >
              <Pin size={10} fill="#38bdf8" />
              Fixada
            </span>
          )}
        </div>

        {/* Mídia Anexada (Imagem, Vídeo, Áudio ou Documento) */}
        {message.media_url && (
          <div
            style={{
              marginBottom: message.message ? '6px' : '0',
              borderRadius: '10px',
              overflow: 'hidden',
              maxWidth: '320px',
            }}
            data-testid={`chat-media-attachment-${message.id}`}
          >
            {message.media_type === 'audio' ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#1e293b',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                data-testid={`chat-media-audio-${message.id}`}
              >
                <Mic size={18} color="#10b981" />
                <audio
                  controls
                  src={message.media_url}
                  style={{ maxHeight: '36px', maxWidth: '240px' }}
                />
              </div>
            ) : message.media_type === 'video' ? (
              <div
                style={{
                  borderRadius: '10px',
                  overflow: 'hidden',
                  backgroundColor: '#000',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                data-testid={`chat-media-video-${message.id}`}
              >
                <video
                  controls
                  src={message.media_url}
                  style={{
                    width: '100%',
                    maxHeight: '220px',
                    display: 'block',
                    objectFit: 'contain',
                  }}
                />
              </div>
            ) : message.media_type === 'file' ? (
              <a
                href={message.media_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  backgroundColor: '#1e293b',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  textDecoration: 'none',
                  fontSize: '0.8125rem',
                }}
              >
                <FileText size={18} color="#ef4444" />
                <span style={{ fontWeight: 600 }}>Visualizar Documento</span>
                <ExternalLink size={14} color="#94a3b8" />
              </a>
            ) : (
              <a
                href={message.media_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Clique para abrir imagem original"
                style={{ display: 'inline-block' }}
              >
                <img
                  src={message.media_url}
                  alt="Mídia da mensagem"
                  style={{
                    maxWidth: '280px',
                    maxHeight: '240px',
                    objectFit: 'cover',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'block',
                    cursor: 'zoom-in',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  }}
                  data-testid={`chat-media-img-${message.id}`}
                />
              </a>
            )}
          </div>
        )}

        {/* Balão de Texto da Mensagem */}
        {message.message && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: isOwn
                ? '14px 4px 14px 14px'
                : '4px 14px 14px 14px',
              backgroundColor: isOwn ? '#1d4ed8' : '#1e293b',
              color: '#ffffff',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
              border: isOwn
                ? '1px solid rgba(59, 130, 246, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.07)',
            }}
          >
            {message.message}
          </div>
        )}

        {/* Barra de Ações: Curtir, Favoritar, Fixar (gestor), Excluir */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '5px',
            padding: '0 2px',
          }}
          data-testid={`chat-message-actions-${message.id}`}
        >
          {/* Botão de Curtir */}
          <button
            type="button"
            onClick={() => onToggleLike && onToggleLike(message.id)}
            title={message.liked_by_me ? 'Descurtir mensagem' : 'Curtir mensagem'}
            data-testid={`like-msg-btn-${message.id}`}
            style={{
              background: 'none',
              border: 'none',
              color: message.liked_by_me ? '#ef4444' : '#64748b',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 4px',
              fontSize: '0.75rem',
              borderRadius: '4px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!message.liked_by_me) e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              if (!message.liked_by_me) e.currentTarget.style.color = '#64748b';
            }}
          >
            <Heart
              size={13}
              color={message.liked_by_me ? '#ef4444' : 'currentColor'}
              fill={message.liked_by_me ? '#ef4444' : 'none'}
            />
            <span>{message.likes_count || 0}</span>
          </button>

          {/* Botão de Favoritar */}
          <button
            type="button"
            onClick={() => onToggleFavorite && onToggleFavorite(message.id)}
            title={message.is_favorited ? 'Remover dos favoritos' : 'Favoritar mensagem'}
            data-testid={`favorite-msg-btn-${message.id}`}
            style={{
              background: 'none',
              border: 'none',
              color: message.is_favorited ? '#f59e0b' : '#64748b',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 4px',
              borderRadius: '4px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!message.is_favorited) e.currentTarget.style.color = '#f59e0b';
            }}
            onMouseLeave={(e) => {
              if (!message.is_favorited) e.currentTarget.style.color = '#64748b';
            }}
          >
            <Star
              size={13}
              color={message.is_favorited ? '#f59e0b' : 'currentColor'}
              fill={message.is_favorited ? '#f59e0b' : 'none'}
            />
          </button>

          {/* Botão de Fixar / Desafixar (Apenas Admin/Superadmin) */}
          {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
            <button
              type="button"
              onClick={() => onTogglePin && onTogglePin(message.id)}
              title={message.is_pinned ? 'Desafixar mensagem' : 'Fixar mensagem no topo'}
              data-testid={`pin-msg-btn-${message.id}`}
              style={{
                background: 'none',
                border: 'none',
                color: message.is_pinned ? '#38bdf8' : '#64748b',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 4px',
                borderRadius: '4px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!message.is_pinned) e.currentTarget.style.color = '#38bdf8';
              }}
              onMouseLeave={(e) => {
                if (!message.is_pinned) e.currentTarget.style.color = '#64748b';
              }}
            >
              <Pin
                size={13}
                color={message.is_pinned ? '#38bdf8' : 'currentColor'}
                fill={message.is_pinned ? '#38bdf8' : 'none'}
              />
            </button>
          )}

          {/* Botão de Excluir Mensagem */}
          {message.can_delete && (
            <button
              type="button"
              onClick={() => onDeleteMessage(message.id)}
              title="Excluir mensagem"
              data-testid={`delete-msg-btn-${message.id}`}
              style={{
                background: 'none',
                border: 'none',
                padding: '2px 4px',
                color: '#64748b',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: '4px',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
