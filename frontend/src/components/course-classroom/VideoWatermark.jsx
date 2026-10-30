import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';

const POSITIONS = [
  { top: '12%', left: '8%', bottom: 'auto', right: 'auto' },
  { top: '12%', right: '8%', bottom: 'auto', left: 'auto' },
  { bottom: '16%', left: '8%', top: 'auto', right: 'auto' },
  { bottom: '16%', right: '8%', top: 'auto', left: 'auto' },
  { top: '42%', left: '18%', bottom: 'auto', right: 'auto' },
  { top: '42%', right: '18%', bottom: 'auto', left: 'auto' },
];

export default function VideoWatermark({ studentIdentifier }) {
  const [identifier, setIdentifier] = useState(studentIdentifier || '');
  const [positionIndex, setPositionIndex] = useState(0);

  useEffect(() => {
    if (!identifier) {
      try {
        const savedUser = localStorage.getItem('auth_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setIdentifier(parsed.email || parsed.name || '');
        }
      } catch {
        // Ignora erro
      }
    }
  }, [identifier]);

  // Altera a posição a cada 20 segundos de forma intermitente e suave
  useEffect(() => {
    const interval = setInterval(() => {
      setPositionIndex((prev) => (prev + 1) % POSITIONS.length);
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  if (!identifier) return null;

  const currentPos = POSITIONS[positionIndex] || POSITIONS[0];

  return (
    <div
      data-testid="video-watermark-overlay"
      style={{
        position: 'absolute',
        top: currentPos.top,
        bottom: currentPos.bottom,
        left: currentPos.left,
        right: currentPos.right,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 8,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 8px',
        borderRadius: '6px',
        backgroundColor: 'rgba(0, 0, 0, 0.28)',
        color: '#ffffff',
        opacity: 0.22,
        fontSize: '11px',
        fontFamily: 'monospace',
        letterSpacing: '0.5px',
        transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Shield size={10} style={{ opacity: 0.7 }} />
      <span>{identifier}</span>
    </div>
  );
}
