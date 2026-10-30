import React, { useState, useRef, useEffect } from 'react';
import { Gauge } from 'lucide-react';

export const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function PlaybackRateMenu({
  playbackRate = 1,
  onPlaybackRateChange
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Velocidade de reprodução"
        style={{
          background: 'none',
          border: 'none',
          color: '#ffffff',
          cursor: 'pointer',
          padding: '4px 6px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px',
          fontWeight: 700,
          borderRadius: '4px',
          backgroundColor: isOpen ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
          transition: 'background 0.15s ease'
        }}
        data-testid="video-speed-btn"
      >
        <Gauge size={13} />
        <span data-testid="video-speed-label">{playbackRate === 1 ? '1x' : `${playbackRate}x`}</span>
      </button>

      {/* Popover Flutuante de Velocidades */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '36px',
            right: 0,
            backgroundColor: 'rgba(10, 15, 29, 0.96)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            borderRadius: '10px',
            padding: '6px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(37, 99, 235, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            minWidth: '105px',
            zIndex: 40
          }}
          data-testid="video-speed-menu"
        >
          <div
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Velocidade
          </div>
          {SPEED_OPTIONS.map((speed) => {
            const isSelected = playbackRate === speed;
            return (
              <button
                key={speed}
                type="button"
                onClick={() => {
                  if (onPlaybackRateChange) onPlaybackRateChange(speed);
                  setIsOpen(false);
                }}
                data-testid={`video-speed-option-${speed}`}
                style={{
                  background: isSelected ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                  border: 'none',
                  color: isSelected ? '#60a5fa' : '#f8fafc',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11.5px',
                  fontWeight: isSelected ? 700 : 500,
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.15s ease'
                }}
              >
                <span>{speed === 1 ? '1x (Normal)' : `${speed}x`}</span>
                {isSelected && <span style={{ color: '#38bdf8', fontSize: '12px' }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
