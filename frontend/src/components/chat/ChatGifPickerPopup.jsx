import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { CHAT_GIF_CATEGORIES, CHAT_GIFS } from './gifData';

export default function ChatGifPickerPopup({ onSelectGif, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const popupRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const filteredGifs = useMemo(() => {
    return CHAT_GIFS.filter((gif) => {
      const matchCat = activeCategory === 'all' || gif.category === activeCategory;
      if (!matchCat) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const matchTitle = gif.title.toLowerCase().includes(term);
      const matchTags = gif.tags.some((tag) => tag.toLowerCase().includes(term));
      return matchTitle || matchTags;
    });
  }, [activeCategory, searchTerm]);

  return (
    <div
      ref={popupRef}
      className="chat-gif-picker-popup"
      data-testid="chat-gif-popup"
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '12px',
        marginBottom: '10px',
        width: '360px',
        maxWidth: 'calc(100vw - 28px)',
        maxHeight: '430px',
        backgroundColor: '#0f172a',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.15)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeInUp 0.18s ease-out',
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#1e293b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '2px 6px',
              backgroundColor: '#3b82f6',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.05em',
            }}
          >
            GIF
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
            Escolher um GIF Animado
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          data-testid="close-gif-popup"
          title="Fechar"
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Busca */}
      <div style={{ padding: '10px 12px 6px 12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#1e293b',
            borderRadius: '8px',
            padding: '6px 10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar GIFs (ex: palmas, riso, parabéns)..."
            data-testid="gif-search-input"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: '0.8125rem',
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Categorias */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          padding: '6px 12px',
          overflowX: 'auto',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          scrollbarWidth: 'none',
        }}
      >
        {CHAT_GIF_CATEGORIES.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              data-testid={`gif-cat-${cat.id}`}
              style={{
                background: active ? '#2563eb' : 'rgba(255, 255, 255, 0.05)',
                color: active ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '14px',
                padding: '4px 10px',
                fontSize: '0.725rem',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Grid de GIFs */}
      <div
        data-testid="gif-grid"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          alignContent: 'start',
        }}
      >
        {filteredGifs.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '30px 10px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '0.8125rem',
            }}
          >
            Nenhum GIF encontrado para "{searchTerm}".
          </div>
        ) : (
          filteredGifs.map((gif) => (
            <button
              key={gif.id}
              type="button"
              onClick={() => onSelectGif(gif)}
              data-testid={`gif-item-${gif.id}`}
              title={gif.title}
              style={{
                position: 'relative',
                background: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: 0,
                overflow: 'hidden',
                cursor: 'pointer',
                height: '110px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.borderColor = '#38bdf8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <img
                src={gif.url}
                alt={gif.title}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '4px 6px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                  color: '#ffffff',
                  fontSize: '0.675rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'left',
                }}
              >
                {gif.title}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
