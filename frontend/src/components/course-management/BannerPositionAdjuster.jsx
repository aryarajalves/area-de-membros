import React, { useRef, useState, useCallback, useEffect } from 'react';
import { MoveVertical, Sliders, Check } from 'lucide-react';

/**
 * Componente interativo para ajustar a posição vertical da imagem do Banner Hero (estilo Netflix).
 * Permite arrastar verticalmente a imagem diretamente com o mouse ou usar slider / botões rápidos.
 */
export default function BannerPositionAdjuster({
  coverImageUrl,
  position = 50,
  onChange
}) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef(0);
  const dragStartPositionRef = useRef(position);

  const currentPos = Math.max(0, Math.min(100, Math.round(Number(position) || 50)));

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartYRef.current = e.clientY;
    dragStartPositionRef.current = currentPos;
  };

  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      setIsDragging(true);
      dragStartYRef.current = e.touches[0].clientY;
      dragStartPositionRef.current = currentPos;
    }
  };

  const handlePointerMove = useCallback((clientY) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const height = rect.height || 160;
    // Arrastar para cima revela partes inferiores (ou vice-versa)
    // Sensibilidade: mover a altura total percorre 100%
    const deltaY = clientY - dragStartYRef.current;
    const deltaPct = -(deltaY / height) * 100;
    const nextPos = Math.max(0, Math.min(100, Math.round(dragStartPositionRef.current + deltaPct)));
    if (onChange) {
      onChange(nextPos);
    }
  }, [isDragging, onChange]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (isDragging) handlePointerMove(e.clientY);
    };
    const onMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };
    const onTouchMove = (e) => {
      if (isDragging && e.touches && e.touches[0]) handlePointerMove(e.touches[0].clientY);
    };
    const onTouchEnd = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handlePointerMove]);

  if (!coverImageUrl) return null;

  return (
    <div
      className="banner-position-adjuster"
      style={{
        marginTop: '12px',
        padding: '12px',
        borderRadius: '12px',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}
      data-testid="banner-position-adjuster"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <MoveVertical size={14} style={{ color: '#38bdf8' }} />
          Enquadramento do Banner (Arrastar ou Ajustar)
        </span>
        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
          {currentPos}% {currentPos <= 20 ? '(Topo)' : currentPos >= 80 ? '(Base)' : '(Centro)'}
        </span>
      </div>

      {/* Janela de Pré-visualização com Proporção de Banner Hero */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          position: 'relative',
          width: '100%',
          height: '140px',
          borderRadius: '8px',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          backgroundImage: `linear-gradient(90deg, rgba(9, 13, 22, 0.7) 0%, rgba(9, 13, 22, 0.2) 60%), url(${coverImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: `center ${currentPos}%`,
          border: isDragging ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
          transition: isDragging ? 'none' : 'border-color 0.2s ease, background-position 0.15s ease'
        }}
        title="Clique e arraste verticalmente para enquadrar a imagem"
        data-testid="banner-drag-preview"
      >
        {/* Overlay com indicação visual de arrasto */}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            color: '#f8fafc',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            pointerEvents: 'none'
          }}
        >
          <MoveVertical size={12} />
          <span>{isDragging ? 'Reposicionando...' : 'Arraste na imagem'}</span>
        </div>
      </div>

      {/* Controle de Slider de Precisão */}
      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Sliders size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
        <input
          type="range"
          min="0"
          max="100"
          value={currentPos}
          onChange={(e) => onChange && onChange(Number(e.target.value))}
          style={{
            flex: 1,
            accentColor: '#38bdf8',
            cursor: 'pointer',
            height: '6px'
          }}
          data-testid="banner-position-slider"
          aria-label="Posição vertical da imagem do banner"
        />
        <span style={{ fontSize: '11.5px', color: '#94a3b8', width: '38px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          {currentPos}%
        </span>
      </div>

      {/* Botões de Presets Rápidos */}
      <div style={{ marginTop: '8px', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
        {[
          { label: 'Topo (0%)', val: 0 },
          { label: 'Centro (50%)', val: 50 },
          { label: 'Base (100%)', val: 100 }
        ].map((preset) => (
          <button
            key={preset.val}
            type="button"
            onClick={() => onChange && onChange(preset.val)}
            style={{
              padding: '3px 9px',
              fontSize: '11px',
              borderRadius: '6px',
              backgroundColor: currentPos === preset.val ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: currentPos === preset.val ? '#38bdf8' : '#cbd5e1',
              border: currentPos === preset.val ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontWeight: currentPos === preset.val ? 600 : 400
            }}
            data-testid={`banner-preset-${preset.val}`}
          >
            {currentPos === preset.val && <Check size={11} />}
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
