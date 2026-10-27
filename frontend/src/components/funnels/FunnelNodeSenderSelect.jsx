import React from 'react';
import { UserCheck } from 'lucide-react';

export default function FunnelNodeSenderSelect({
  value,
  onChange,
  availableSenders = [],
  nodeId,
  accentColor = '#38bdf8',
}) {
  return (
    <div style={{ marginBottom: '8px' }} data-testid={`funnel-node-sender-container-${nodeId}`}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.68rem',
          fontWeight: 600,
          color: '#94a3b8',
          marginBottom: '4px',
        }}
      >
        <UserCheck size={12} color={accentColor} />
        <span>Remetente da DM:</span>
      </div>
      <select
        value={value ?? ''}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val ? Number(val) : null);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        data-testid={`funnel-node-sender-select-${nodeId}`}
        style={{
          width: '100%',
          backgroundColor: '#020617',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '6px',
          color: '#f8fafc',
          padding: '5px 8px',
          fontSize: '0.75rem',
          outline: 'none',
          boxSizing: 'border-box',
          cursor: 'pointer',
        }}
      >
        <option value="">(Padrão: Criador do Funil / Super Admin)</option>
        {availableSenders.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} ({s.role === 'superadmin' ? 'Super Admin' : 'Admin'})
          </option>
        ))}
      </select>
    </div>
  );
}
