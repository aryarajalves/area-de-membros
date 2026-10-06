import React from 'react';
import { Plus, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export default function FunnelCanvasZoomControls({
  zoom,
  setZoom,
  pan = { x: 0, y: 0 },
  setPan,
  onZoomIn,
  onZoomOut,
  onOpenAddMenu,
}) {
  const handleZoomIn = (e) => {
    e.stopPropagation();
    if (onZoomIn) {
      onZoomIn();
    } else {
      setZoom((z) => Math.min(Number((z + 0.15).toFixed(2)), 2.0));
    }
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    if (onZoomOut) {
      onZoomOut();
    } else {
      setZoom((z) => Math.max(Number((z - 0.15).toFixed(2)), 0.3));
    }
  };

  const handleReset = (e) => {
    e.stopPropagation();
    setZoom(1);
    if (setPan) setPan({ x: 0, y: 0 });
  };

  const zoomPercent = Math.round(zoom * 100);

  return (
    <>
      {/* Botão no Centro Inferior "+ Clique para adicionar novos nós" */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenAddMenu(e);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '30px',
            backgroundColor: '#0f172a',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            color: '#cbd5e1',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.6)',
          }}
          data-testid="add-node-canvas-btn"
        >
          <Plus size={15} color="#a78bfa" />
          <span>+ Clique para adicionar novos nós</span>
        </button>
      </div>

      {/* Controles de Zoom no Canto Inferior Esquerdo */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          padding: '6px 10px',
          zIndex: 20,
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5)',
          userSelect: 'none',
        }}
        data-testid="funnel-zoom-controls"
      >
        <button
          type="button"
          onClick={handleZoomOut}
          title="Diminuir Zoom (-)"
          data-testid="zoom-out-btn"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ZoomOut size={16} />
        </button>

        <span
          data-testid="zoom-percentage"
          style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#cbd5e1',
            minWidth: '42px',
            textAlign: 'center',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {zoomPercent}%
        </span>

        <button
          type="button"
          onClick={handleZoomIn}
          title="Aumentar Zoom (+)"
          data-testid="zoom-in-btn"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ZoomIn size={16} />
        </button>

        <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255, 255, 255, 0.15)', margin: '0 2px' }} />

        <button
          type="button"
          onClick={handleReset}
          title="Restaurar Visualização (100% e Posição Inicial)"
          data-testid="zoom-reset-btn"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </>
  );
}
