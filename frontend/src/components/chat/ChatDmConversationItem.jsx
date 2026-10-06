import React from 'react';

export default function ChatDmConversationItem({
  item,
  onSelect,
}) {
  return (
    <div
      onClick={() => onSelect(item.contact)}
      data-testid={`dm-conversation-item-${item.contact.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 14px',
        borderRadius: '12px',
        backgroundColor: item.unread_count > 0 ? 'rgba(56, 189, 248, 0.08)' : '#1e293b',
        border: item.unread_count > 0 ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          backgroundColor: 'rgba(56, 189, 248, 0.2)',
          color: '#38bdf8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {item.contact.avatar_url ? (
          <img
            src={item.contact.avatar_url}
            alt={item.contact.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          (item.contact.name || 'U').charAt(0).toUpperCase()
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '4px',
          }}
        >
          <span
            style={{
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#f8fafc',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.contact.name}
          </span>
          {item.last_message_at && (
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              {new Date(item.last_message_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
              })}
            </span>
          )}
        </div>
        <p
          style={{
            margin: 0,
            fontSize: '0.78rem',
            color: item.unread_count > 0 ? '#e2e8f0' : '#94a3b8',
            fontWeight: item.unread_count > 0 ? 600 : 400,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.last_message || 'Nenhuma mensagem de texto'}
        </p>
      </div>

      {item.unread_count > 0 && (
        <span
          style={{
            backgroundColor: '#38bdf8',
            color: '#0f172a',
            fontWeight: 700,
            fontSize: '0.7rem',
            padding: '2px 8px',
            borderRadius: '9999px',
          }}
        >
          {item.unread_count}
        </span>
      )}
    </div>
  );
}
