import React from 'react';
import { Tv, Minimize2 } from 'lucide-react';

export default function TheaterModeToggleBtn({
  isTheaterMode,
  onToggleTheaterMode,
  isLightBg = false
}) {
  return (
    <button
      type="button"
      onClick={onToggleTheaterMode}
      data-testid="theater-mode-toggle-btn"
      title={isTheaterMode ? 'Sair do Modo Teatro (exibir barra lateral)' : 'Modo Cinema / Teatro (expandir player e focar no vídeo)'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 12px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backgroundColor: isTheaterMode
          ? (isLightBg ? '#eab308' : 'rgba(234, 179, 8, 0.2)')
          : (isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)'),
        color: isTheaterMode
          ? (isLightBg ? '#0f172a' : '#facc15')
          : (isLightBg ? '#475569' : '#94a3b8'),
        border: isTheaterMode
          ? '1px solid rgba(234, 179, 8, 0.6)'
          : `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.12)'}`,
        boxShadow: isTheaterMode ? '0 0 12px rgba(234, 179, 8, 0.25)' : 'none'
      }}
    >
      {isTheaterMode ? <Minimize2 size={13} style={{ flexShrink: 0 }} /> : <Tv size={13} style={{ flexShrink: 0 }} />}
      <span>{isTheaterMode ? 'Modo Normal' : 'Modo Teatro'}</span>
    </button>
  );
}
