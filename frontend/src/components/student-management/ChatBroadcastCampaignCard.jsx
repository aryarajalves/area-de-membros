import React from 'react';
import { Eye } from 'lucide-react';
import { formatBrasiliaDateTime } from './studentDateUtils';

export default function ChatBroadcastCampaignCard({ camp, onSelect, formatDuration }) {
  return (
    <div
      onClick={() => onSelect(camp.id)}
      style={{
        padding: '16px 18px',
        borderRadius: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        transition: 'all 0.15s ease',
      }}
      data-testid={`campaign-card-${camp.id}`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
              {camp.title}
            </h4>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 600,
                backgroundColor: camp.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                color: camp.status === 'completed' ? '#34d399' : '#a78bfa',
                border: `1px solid ${camp.status === 'completed' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`,
              }}
            >
              {camp.status === 'completed' ? 'Concluído' : 'Processando'}
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '3px' }}>
            Disparado em: {formatBrasiliaDateTime(camp.created_at)} • Por: {camp.created_by_name || 'Admin'}
          </div>
        </div>

        <button
          type="button"
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: '#c4b5fd',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Eye size={13} /> Ver Detalhes
        </button>
      </div>

      <div style={{ fontSize: '0.84rem', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        "{camp.message}"
      </div>

      {/* Barra de Progresso e Métricas */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.8rem', color: '#94a3b8' }}>
        <div>
          Público: <strong style={{ color: '#f8fafc' }}>{camp.filter_target_name || camp.filter_type}</strong> ({camp.sent_count}/{camp.total_recipients} alunos)
        </div>
        <div>
          Duração: <strong style={{ color: '#a78bfa' }}>{formatDuration(camp.duration_seconds)}</strong>
        </div>
        <div>
          Visualizações: <strong style={{ color: '#38bdf8' }}>{camp.read_count} leram ({camp.read_percentage}%)</strong>
        </div>
      </div>
    </div>
  );
}
