import React from 'react';
import { Octagon, Trash2, Copy, ShieldAlert } from 'lucide-react';

export default function FunnelNodeStop({
  node,
  isSelected,
  onUpdateData,
  onDeleteNode,
  onDuplicateNode,
  onConnectTarget,
  isTargetActive = false,
}) {
  const data = node.data || {};
  const cancelOther = Boolean(data.cancel_other_funnels);

  const handleToggleCancelOther = (e) => {
    onUpdateData(node.id, {
      ...data,
      cancel_other_funnels: e.target.checked,
    });
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '280px',
        backgroundColor: '#1f0d12',
        border: isSelected ? '2px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.45)',
        borderRadius: '14px',
        boxShadow: isSelected ? '0 10px 30px rgba(239, 68, 68, 0.35)' : '0 10px 25px rgba(0, 0, 0, 0.7)',
        color: '#f8fafc',
        padding: '12px 14px',
        userSelect: 'none',
        transition: 'border 0.2s ease, box-shadow 0.2s ease',
      }}
      data-testid={`funnel-node-stop-${node.id}`}
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
          backgroundColor: '#ef4444',
          border: '2px solid #0f172a',
          boxShadow: isTargetActive ? '0 0 14px #f87171' : '0 0 8px #ef4444',
          cursor: 'pointer',
          zIndex: 10,
        }}
        title="Entrada do nó"
        data-testid={`node-input-handle-${node.id}`}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}>
          <Octagon size={15} />
          <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.04em' }}>
            ENCERRAR FUNIL
          </span>
          <span
            style={{
              fontSize: '8px',
              fontWeight: 800,
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              padding: '1px 5px',
              borderRadius: '4px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
            }}
          >
            TERMINAL
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

      {/* Explicação */}
      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '8px', lineHeight: 1.3 }}>
        Finaliza a execução deste funil imediatamente para o contato.
      </div>

      {/* Checkbox cancelar outros funis */}
      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          cursor: 'pointer',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          padding: '6px 8px',
          borderRadius: '6px',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        }}
      >
        <input
          type="checkbox"
          checked={cancelOther}
          onChange={handleToggleCancelOther}
          style={{ accentColor: '#ef4444', marginTop: '2px', cursor: 'pointer' }}
          data-testid={`stop-cancel-others-${node.id}`}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#fca5a5' }}>
            Cancelar outros funis ativos
          </span>
          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
            Remove o aluno de outros funis em andamento para não receber mensagens duplicadas.
          </span>
        </div>
      </label>
    </div>
  );
}
