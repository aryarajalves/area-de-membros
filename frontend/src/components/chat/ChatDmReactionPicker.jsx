import React, { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';

const POPULAR_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏'];

export default function ChatDmReactionPicker({
  messageId,
  isMine = false,
  onSelectReaction,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (emoji) => {
    if (onSelectReaction) {
      onSelectReaction(messageId, emoji);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        data-testid={`dm-reaction-btn-${messageId}`}
        title="Reagir com emoji"
        style={{
          background: 'transparent',
          border: 'none',
          color: isOpen ? '#38bdf8' : '#64748b',
          cursor: 'pointer',
          padding: '1px 3px',
          borderRadius: '4px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.15s ease, transform 0.15s ease',
          transform: isOpen ? 'scale(1.15)' : 'scale(1)',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.color = '#38bdf8';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.color = '#64748b';
        }}
      >
        <Smile size={13} />
      </button>

      {isOpen && (
        <div
          data-testid={`dm-reaction-picker-${messageId}`}
          style={{
            position: 'absolute',
            bottom: '24px',
            [isMine ? 'right' : 'left']: '0',
            backgroundColor: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 12px rgba(56, 189, 248, 0.15)',
            borderRadius: '24px',
            padding: '4px 6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            zIndex: 40,
            animation: 'fadeInReaction 0.15s ease-out',
          }}
        >
          {POPULAR_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              data-testid={`dm-emoji-btn-${emoji}-${messageId}`}
              onClick={() => handleSelect(emoji)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.05rem',
                padding: '3px 5px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.12s ease, background-color 0.12s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.3)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
