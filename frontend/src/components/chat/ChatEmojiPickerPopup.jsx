import React from 'react';

const COMMON_EMOJIS = [
  '😀', '😂', '🔥', '🚀', '👏', '❤️', '👍', '🙌', 
  '💡', '🎯', '🎉', '💪', '🙏', '✨', '😎', '🤝',
  '👀', '💯', '🤩', '☕', '📚', '✅', '⭐', '💻'
];

export default function ChatEmojiPickerPopup({ onSelectEmoji, onClose }) {
  return (
    <div
      data-testid="chat-emoji-picker-popup"
      style={{
        position: 'absolute',
        bottom: '50px',
        left: '40px',
        backgroundColor: '#0f172a',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '12px',
        padding: '10px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
        zIndex: 100,
        width: '260px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          paddingBottom: '6px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>
          Escolher Emoji
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '0.875rem',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '6px',
        }}
      >
        {COMMON_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              onSelectEmoji(emoji);
              onClose();
            }}
            data-testid={`emoji-btn-${emoji}`}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
