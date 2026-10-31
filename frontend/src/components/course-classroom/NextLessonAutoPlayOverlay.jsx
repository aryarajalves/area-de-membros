import React, { useState, useEffect } from 'react';
import { Play, X, FastForward } from 'lucide-react';

export default function NextLessonAutoPlayOverlay({
  nextLesson,
  onPlayNext,
  onCancel,
  countdownSeconds = 5
}) {
  const [secondsLeft, setSecondsLeft] = useState(countdownSeconds);

  useEffect(() => {
    setSecondsLeft(countdownSeconds);
  }, [nextLesson, countdownSeconds]);

  useEffect(() => {
    if (!nextLesson) return undefined;

    if (secondsLeft <= 0) {
      onPlayNext?.();
      return undefined;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, nextLesson, onPlayNext]);

  if (!nextLesson) return null;

  const total = Math.max(1, countdownSeconds);
  const progressPct = ((total - secondsLeft) / total) * 100;

  return (
    <div
      data-testid="next-lesson-autoplay-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        zIndex: 40,
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      <div
        data-testid="next-lesson-autoplay-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          borderRadius: '18px',
          background: 'linear-gradient(165deg, rgba(15, 23, 42, 0.95) 0%, rgba(9, 13, 24, 0.98) 100%)',
          border: '1px solid rgba(234, 179, 8, 0.45)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 35px rgba(234, 179, 8, 0.15)',
          padding: '24px',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* Topo do card com contagem regressiva */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#eab308',
                boxShadow: '0 0 10px #eab308'
              }}
            />
            <span
              data-testid="autoplay-countdown-label"
              style={{
                fontSize: '12.5px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#facc15'
              }}
            >
              Próxima aula em {secondsLeft}s...
            </span>
          </div>

          <button
            type="button"
            onClick={onCancel}
            data-testid="autoplay-cancel-x-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease'
            }}
            title="Cancelar reprodução automática"
          >
            <X size={18} />
          </button>
        </div>

        {/* Barra de progresso circular/linear estilo Netflix */}
        <div
          style={{
            width: '100%',
            height: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '999px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #eab308 0%, #facc15 100%)',
              transition: 'width 1s linear'
            }}
          />
        </div>

        {/* Detalhes da próxima aula */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          {nextLesson.thumbnail_url ? (
            <img
              src={nextLesson.thumbnail_url}
              alt={nextLesson.title}
              style={{
                width: '84px',
                height: '52px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                flexShrink: 0
              }}
            />
          ) : (
            <div
              style={{
                width: '84px',
                height: '52px',
                borderRadius: '8px',
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#eab308'
              }}
            >
              <FastForward size={22} />
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              A seguir
            </span>
            <h4
              data-testid="autoplay-next-lesson-title"
              style={{
                fontSize: '14.5px',
                fontWeight: 700,
                color: '#ffffff',
                margin: '2px 0 0 0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {nextLesson.title}
            </h4>
          </div>
        </div>

        {/* Botões de Ação: Assistir Agora vs Cancelar */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={onPlayNext}
            data-testid="autoplay-play-now-btn"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '11px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              border: '1px solid rgba(234, 179, 8, 0.65)',
              background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
              color: '#0f172a',
              boxShadow: '0 4px 14px rgba(234, 179, 8, 0.3)'
            }}
          >
            <Play size={15} fill="#0f172a" />
            <span>Assistir Agora</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            data-testid="autoplay-cancel-btn"
            style={{
              padding: '11px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: 'rgba(30, 41, 59, 0.85)',
              color: '#cbd5e1',
              border: '1px solid rgba(148, 163, 184, 0.25)'
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
