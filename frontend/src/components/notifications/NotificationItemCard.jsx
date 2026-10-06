import React from 'react';
import { MessageSquare, AtSign, Check, ExternalLink } from 'lucide-react';

/**
 * Formata timestamps amigáveis (ex: há 5 min, há 2 horas, há 3 dias)
 */
export function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'agora há pouco';
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
  const months = Math.floor(days / 30);
  return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
}

export default function ChatNotificationItem({
  item,
  onSelect,
  onMarkRead,
}) {
  const isMention = item.type === 'mention';
  const senderName = item.sender?.name || 'Alguém';
  const channelLabel = item.channel_type === 'general' ? 'Comunidade Geral' : 'Canal do Curso';

  return (
    <div
      data-testid={`notification-item-${item.id}`}
      onClick={() => onSelect(item)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 14px',
        borderRadius: '12px',
        backgroundColor: item.is_read ? 'rgba(255, 255, 255, 0.02)' : 'rgba(56, 189, 248, 0.07)',
        border: item.is_read
          ? '1px solid rgba(255, 255, 255, 0.05)'
          : '1px solid rgba(56, 189, 248, 0.25)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        position: 'relative',
      }}
    >
      {/* Avatar com Badge de Tipo (@ ou Balão) */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
            fontWeight: 700,
            fontSize: '0.875rem',
            overflow: 'hidden',
          }}
        >
          {item.sender?.avatar_url ? (
            <img
              src={item.sender.avatar_url}
              alt={senderName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            senderName.charAt(0).toUpperCase()
          )}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: isMention ? '#f97316' : '#10b981',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #0f172a',
          }}
        >
          {isMention ? <AtSign size={10} strokeWidth={2.5} /> : <MessageSquare size={10} strokeWidth={2.5} />}
        </div>
      </div>

      {/* Conteúdo da Notificação */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.4 }}>
          <strong style={{ color: '#ffffff' }}>{senderName}</strong>{' '}
          {isMention ? 'mencionou você no chat' : 'respondeu à sua thread'}{' '}
          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>({channelLabel})</span>
        </p>

        {item.message_text && (
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '0.8rem',
              color: '#94a3b8',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            "{item.message_text}"
          </p>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '6px',
          }}
        >
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
            {formatTimeAgo(item.created_at)}
          </span>

          {!item.is_read && onMarkRead && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(item);
              }}
              title="Marcar como lida"
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontSize: '0.72rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 4px',
              }}
            >
              <Check size={12} /> Marcar lida
            </button>
          )}
        </div>
      </div>

      {/* Ponto indicador de não lida */}
      {!item.is_read && (
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#38bdf8',
            flexShrink: 0,
            marginTop: '6px',
          }}
        />
      )}
    </div>
  );
}
