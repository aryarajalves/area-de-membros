import React from 'react';
import { GitFork, Trash2, Copy } from 'lucide-react';

export default function FunnelNodeAbSplit({
  node,
  isSelected,
  onUpdateData,
  onDeleteNode,
  onDuplicateNode,
  onStartConnect,
  onConnectTarget,
  isTargetActive = false,
}) {
  const data = node.data || {};
  const splitA = Math.max(1, Math.min(99, parseInt(data.split_a_pct ?? 50, 10)));
  const splitB = 100 - splitA;

  const handleSliderChange = (e) => {
    const val = Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 50));
    onUpdateData(node.id, { ...data, split_a_pct: val });
  };

  const handlePreset = (valA) => {
    onUpdateData(node.id, { ...data, split_a_pct: valA });
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '300px',
        backgroundColor: '#160d26',
        border: isSelected ? '2px solid #ec4899' : '1px solid rgba(236, 72, 153, 0.45)',
        borderRadius: '14px',
        boxShadow: isSelected ? '0 10px 30px rgba(236, 72, 153, 0.35)' : '0 10px 25px rgba(0, 0, 0, 0.7)',
        color: '#f8fafc',
        padding: '12px 14px',
        userSelect: 'none',
        transition: 'border 0.2s ease, box-shadow 0.2s ease',
      }}
      data-testid={`funnel-node-ab-split-${node.id}`}
    >
      {/* Port de Entrada (Esquerda) */}
      <div
        onMouseUp={(e) => {
          e.stopPropagation();
          if (onConnectTarget) onConnectTarget(node.id, 'input');
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onConnectTarget) onConnectTarget(node.id, 'input');
        }}
        style={{
          position: 'absolute',
          left: '-8px',
          top: '50%',
          transform: isTargetActive ? 'translateY(-50%) scale(1.4)' : 'translateY(-50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#ec4899',
          border: '2px solid #0f172a',
          boxShadow: isTargetActive ? '0 0 14px #f472b6' : '0 0 8px #ec4899',
          cursor: 'pointer',
          zIndex: 10,
        }}
        title="Entrada do nó"
        data-testid={`node-input-handle-${node.id}`}
      />

      {/* Port de Saída A (Superior - top 35%) */}
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          if (onStartConnect) onStartConnect(node.id, e, node, 'output_a');
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onStartConnect) onStartConnect(node.id, e, node, 'output_a');
        }}
        style={{
          position: 'absolute',
          right: '-8px',
          top: '35%',
          transform: 'translateY(-50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#38bdf8',
          border: '2px solid #0f172a',
          boxShadow: '0 0 10px #38bdf8',
          cursor: 'grab',
          zIndex: 10,
        }}
        title="Saída A: Conecte o Caminho A"
        data-testid={`node-output-handle-a-${node.id}`}
      />
      <span
        style={{
          position: 'absolute',
          right: '12px',
          top: '35%',
          transform: 'translateY(-50%)',
          fontSize: '9px',
          fontWeight: 800,
          color: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.18)',
          border: '1px solid rgba(56, 189, 248, 0.5)',
          padding: '2px 5px',
          borderRadius: '4px',
          pointerEvents: 'none',
        }}
      >
        A: {splitA}%
      </span>

      {/* Port de Saída B (Inferior - top 65%) */}
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          if (onStartConnect) onStartConnect(node.id, e, node, 'output_b');
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onStartConnect) onStartConnect(node.id, e, node, 'output_b');
        }}
        style={{
          position: 'absolute',
          right: '-8px',
          top: '65%',
          transform: 'translateY(-50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#f59e0b',
          border: '2px solid #0f172a',
          boxShadow: '0 0 10px #f59e0b',
          cursor: 'grab',
          zIndex: 10,
        }}
        title="Saída B: Conecte o Caminho B"
        data-testid={`node-output-handle-b-${node.id}`}
      />
      <span
        style={{
          position: 'absolute',
          right: '12px',
          top: '65%',
          transform: 'translateY(-50%)',
          fontSize: '9px',
          fontWeight: 800,
          color: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.18)',
          border: '1px solid rgba(245, 158, 11, 0.5)',
          padding: '2px 5px',
          borderRadius: '4px',
          pointerEvents: 'none',
        }}
      >
        B: {splitB}%
      </span>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ec4899' }}>
          <GitFork size={15} />
          <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.04em' }}>
            TESTE A/B (SPLIT)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <button
            onClick={() => onDuplicateNode(node.id)}
            title="Duplicar"
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
          >
            <Copy size={12} />
          </button>
          <button
            onClick={() => onDeleteNode(node.id)}
            title="Excluir"
            style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Barra de Divisão Visual */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '4px' }}>
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>Caminho A: {splitA}%</span>
          <span style={{ color: '#f59e0b', fontWeight: 700 }}>Caminho B: {splitB}%</span>
        </div>
        <div
          style={{
            height: '8px',
            borderRadius: '4px',
            backgroundColor: '#020617',
            overflow: 'hidden',
            display: 'flex',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ width: `${splitA}%`, backgroundColor: '#38bdf8', transition: 'width 0.2s' }} />
          <div style={{ width: `${splitB}%`, backgroundColor: '#f59e0b', transition: 'width 0.2s' }} />
        </div>
      </div>

      {/* Slider */}
      <div style={{ marginBottom: '8px' }}>
        <input
          type="range"
          min="1"
          max="99"
          value={splitA}
          onChange={handleSliderChange}
          style={{ width: '100%', accentColor: '#ec4899', cursor: 'pointer' }}
          data-testid={`ab-split-slider-${node.id}`}
        />
      </div>

      {/* Presets Rápidos */}
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
        {[
          { label: '50/50', val: 50 },
          { label: '70/30', val: 70 },
          { label: '80/20', val: 80 },
          { label: '90/10', val: 90 },
        ].map((p) => (
          <button
            key={p.label}
            onClick={() => handlePreset(p.val)}
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '0.68rem',
              fontWeight: 700,
              border: splitA === p.val ? '1px solid #ec4899' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: splitA === p.val ? 'rgba(236, 72, 153, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              color: splitA === p.val ? '#f472b6' : '#cbd5e1',
              cursor: 'pointer',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
