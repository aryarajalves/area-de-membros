import React, { useState, useMemo } from 'react';
import { EMOJI_CATEGORIES, ALL_EMOJIS } from './emojiData';

export default function ChatEmojiPickerPopup({ onSelectEmoji, onClose }) {
  const [activeCategoryId, setActiveCategoryId] = useState('smileys');
  const [searchQuery, setSearchQuery] = useState('');

  const displayedEmojis = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (trimmed) {
      // Se usuário digitou algo na busca, filtra do acervo completo
      return ALL_EMOJIS.filter((emoji) => emoji.includes(trimmed));
    }
    const currentCategory = EMOJI_CATEGORIES.find((cat) => cat.id === activeCategoryId);
    return currentCategory ? currentCategory.emojis : ALL_EMOJIS;
  }, [activeCategoryId, searchQuery]);

  return (
    <div
      data-testid="chat-emoji-picker-popup"
      style={{
        position: 'absolute',
        bottom: '52px',
        left: '20px',
        backgroundColor: '#0b1120',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: '14px',
        padding: '12px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        zIndex: 200,
        width: '320px',
        maxWidth: 'calc(100vw - 32px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Header com Título e Fechar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#f1f5f9',
            letterSpacing: '0.2px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>Escolher Emoji</span>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
            ({displayedEmojis.length})
          </span>
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar seletor de emojis"
          data-testid="close-emoji-picker-btn"
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '1.1rem',
            lineHeight: 1,
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease, background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ×
        </button>
      </div>

      {/* Abas de Categorias */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          padding: '3px',
          borderRadius: '9px',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        {EMOJI_CATEGORIES.map((cat) => {
          const isActive = activeCategoryId === cat.id && !searchQuery.trim();
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategoryId(cat.id);
                setSearchQuery('');
              }}
              title={cat.name}
              data-testid={`emoji-category-tab-${cat.id}`}
              style={{
                flex: 1,
                border: 'none',
                background: isActive ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                borderRadius: '7px',
                padding: '5px 0',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.2)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {cat.icon}
            </button>
          );
        })}
      </div>

      {/* Grid de Emojis Rolável e Perfeitamente Contido */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
          maxHeight: '210px',
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: '2px',
          boxSizing: 'border-box',
          width: '100%',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(59, 130, 246, 0.35) transparent',
        }}
      >
        {displayedEmojis.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '24px 8px',
              color: '#64748b',
              fontSize: '0.82rem',
            }}
          >
            Nenhum emoji encontrado.
          </div>
        ) : (
          displayedEmojis.map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              type="button"
              onClick={() => {
                onSelectEmoji(emoji);
                onClose();
              }}
              data-testid={`emoji-btn-${emoji}`}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.28rem',
                cursor: 'pointer',
                aspectRatio: '1 / 1',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                boxSizing: 'border-box',
                padding: 0,
                transition: 'background-color 0.12s ease, transform 0.12s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.transform = 'scale(1.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {emoji}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
