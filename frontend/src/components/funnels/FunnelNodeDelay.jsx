import React from 'react';
import { Hourglass, Trash2, Copy } from 'lucide-react';

export default function FunnelNodeDelay({
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
  const delaySec = data.delay_seconds ?? 2;

  const handleChangeDelay = (e) => {
    const val = Math.max(1, parseInt(e.target.value, 10) || 1);
    onUpdateData(node.id, { ...data, delay_seconds: val });
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '240px',
        backgroundColor: '#17120a',
        border: isSelected ? '2px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.4)',
        borderRadius: '14px',
        boxShadow: isSelected ? '0 10px 30px rgba(245, 158, 11, 0.3)' : '0 10px 25px rgba(0, 0, 0, 0.65)',
        color: '#f8fafc',
        padding: '12px 14px',
        userSelect: 'none',
      }}
      data-testid={`funnel-node-delay-${node.id}`}
    >
      {/* Port de Entrada */}
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          if (onStartConnect) onStartConnect(node.id, e, node, 'input');
        }}
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
          transform: isTargetActive ? 'translateY(-50%) scale(1.45)' : 'translateY(-50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: isTargetActive ? '#10b981' : '#f59e0b',
          border: isTargetActive ? '2px solid #ffffff' : '2px solid #0f172a',
          boxShadow: isTargetActive ? '0 0 14px #10b981' : '0 0 8px rgba(245, 158, 11, 0.6)',
          cursor: 'crosshair',
          zIndex: 10,
          transition: 'all 0.15s ease',
        }}
        title="Ponto de entrada (arraste ou solte para conectar)"
        data-testid={`node-input-handle-${node.id}`}
      />

      {/* Port de Saída */}
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          if (onStartConnect) onStartConnect(node.id, e, node, 'output');
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onStartConnect) onStartConnect(node.id, e, node, 'output');
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          if (onConnectTarget) onConnectTarget(node.id, 'output');
        }}
        style={{
          position: 'absolute',
          right: '-8px',
          top: '50%',
          transform: isTargetActive ? 'translateY(-50%) scale(1.3)' : 'translateY(-50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#f59e0b',
          border: '2px solid #0f172a',
          boxShadow: '0 0 10px #f59e0b',
          cursor: 'grab',
          zIndex: 10,
          transition: 'all 0.15s ease',
        }}
        title="Clique ou arraste até outro nó para conectar"
        data-testid={`node-output-handle-${node.id}`}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
          <Hourglass size={15} />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em' }}>DELAY</span>
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

      {/* Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Aguardar antes do próximo nó:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            min="1"
            max="300"
            value={delaySec}
            onChange={handleChangeDelay}
            style={{
              width: '80px',
              backgroundColor: '#020617',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '6px',
              color: '#ffffff',
              padding: '6px 8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              outline: 'none',
            }}
            data-testid={`node-delay-input-${node.id}`}
          />
          <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>segundos</span>
        </div>
      </div>
    </div>
  );
}
