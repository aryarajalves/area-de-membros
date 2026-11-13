import React from 'react';

export default function ChatDmReactionBadges({
  messageId,
  reactions = [],
  isMine = false,
  onToggleReaction,
}) {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div
      data-testid={`dm-reactions-container-${messageId}`}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        marginTop: '4px',
        justifyContent: isMine ? 'flex-end' : 'flex-start',
      }}
    >
      {reactions.map((r) => {
        const titleText = r.users && r.users.length > 0
          ? `${r.users.slice(0, 3).join(', ')}${r.users.length > 3 ? ` e mais ${r.users.length - 3}` : ''}`
          : `${r.count} reação(ões)`;

        return (
          <button
            key={r.emoji}
            type="button"
            data-testid={`dm-reaction-badge-${r.emoji}-${messageId}`}
            title={titleText}
            onClick={() => onToggleReaction && onToggleReaction(messageId, r.emoji)}
            style={{
              background: r.reacted_by_me
                ? 'rgba(139, 92, 246, 0.25)'
                : 'rgba(255, 255, 255, 0.06)',
              border: r.reacted_by_me
                ? '1px solid rgba(168, 85, 247, 0.65)'
                : '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: r.reacted_by_me
                ? '0 0 8px rgba(168, 85, 247, 0.25)'
                : 'none',
              borderRadius: '999px',
              padding: '2px 7px',
              fontSize: '0.74rem',
              color: r.reacted_by_me ? '#e9d5ff' : '#cbd5e1',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span>{r.emoji}</span>
            {r.count > 1 && (
              <span style={{ fontWeight: 600, fontSize: '0.7rem' }}>
                {r.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
