import React from 'react';
import { Lock } from 'lucide-react';

export default function ChainedLockOverlay({ isLightBg = false }) {
  const chainCoords = [-200, -160, -120, -80, -40, 40, 80, 120, 160, 200];

  return (
    <div
      data-testid="chained-lock-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 10, 20, 0.72)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        overflow: 'hidden',
        pointerEvents: 'none',
        userSelect: 'none'
      }}
    >
      {/* SVG de Correntes Cruzadas */}
      <svg
        viewBox="0 0 360 200"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
        data-testid="chained-lock-svg"
      >
        <defs>
          <linearGradient id="chainMetalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="30%" stopColor="#f8fafc" />
            <stop offset="65%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          <linearGradient id="chainLinkFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="50%" stopColor="#475569" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="chainHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>

          <filter id="chainDropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.85" />
          </filter>
        </defs>

        {/* Diagonal 1: Canto Superior Esquerdo ao Inferior Direito */}
        <g transform="translate(180, 100) rotate(28)" filter="url(#chainDropShadow)">
          {chainCoords.map((x) => (
            <React.Fragment key={`diag1-${x}`}>
              <rect
                x={x - 17}
                y={-8}
                width="34"
                height="16"
                rx="8"
                fill="none"
                stroke="url(#chainMetalGradient)"
                strokeWidth="3.5"
              />
              <rect
                x={x - 10}
                y={-3}
                width="20"
                height="6"
                rx="3"
                fill="rgba(10, 15, 26, 0.7)"
              />
              <rect
                x={x + 11}
                y={-4.5}
                width="16"
                height="9"
                rx="4.5"
                fill="url(#chainLinkFill)"
                stroke="url(#chainHighlight)"
                strokeWidth="1.8"
              />
            </React.Fragment>
          ))}
        </g>

        {/* Diagonal 2: Canto Superior Direito ao Inferior Esquerdo */}
        <g transform="translate(180, 100) rotate(-28)" filter="url(#chainDropShadow)">
          {chainCoords.map((x) => (
            <React.Fragment key={`diag2-${x}`}>
              <rect
                x={x - 17}
                y={-8}
                width="34"
                height="16"
                rx="8"
                fill="none"
                stroke="url(#chainMetalGradient)"
                strokeWidth="3.5"
              />
              <rect
                x={x - 10}
                y={-3}
                width="20"
                height="6"
                rx="3"
                fill="rgba(10, 15, 26, 0.7)"
              />
              <rect
                x={x + 11}
                y={-4.5}
                width="16"
                height="9"
                rx="4.5"
                fill="url(#chainLinkFill)"
                stroke="url(#chainHighlight)"
                strokeWidth="1.8"
              />
            </React.Fragment>
          ))}
        </g>
      </svg>

      {/* Cadeado Central com Efeito Neon & Badge de Produto Fechado */}
      <div
        data-testid="chained-lock-center-badge"
        style={{
          position: 'relative',
          zIndex: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 18px',
          borderRadius: '16px',
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          border: '1.5px solid rgba(56, 189, 248, 0.45)',
          boxShadow: '0 0 24px rgba(56, 189, 248, 0.3), 0 8px 24px rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 14px rgba(56, 189, 248, 0.4)'
          }}
        >
          <Lock size={22} color="#38bdf8" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#f8fafc',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)'
            }}
          >
            Produto Fechado
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 500,
              color: '#94a3b8'
            }}
          >
            Acesso Restrito
          </span>
        </div>
      </div>
    </div>
  );
}
