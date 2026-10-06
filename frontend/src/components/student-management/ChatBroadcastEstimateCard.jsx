import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';

export default function ChatBroadcastEstimateCard({ estimate, estimating }) {
  const formatEstimatedTime = (seconds) => {
    if (!seconds || seconds <= 0) return '0 segundos';
    if (seconds < 60) return `~${seconds} segundos`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `~${mins} min ${secs} seg` : `~${mins} minutos`;
  };

  return (
    <div
      style={{
        backgroundColor: 'rgba(139, 92, 246, 0.08)',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        borderRadius: '12px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}
      data-testid="broadcast-estimate-card"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            color: '#a78bfa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Clock size={19} />
        </div>
        <div>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
            Destinatários Calculados:
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
            {estimating ? (
              <RefreshCw size={16} className="spin" style={{ display: 'inline' }} />
            ) : (
              `${estimate.total_recipients} ${estimate.total_recipients === 1 ? 'aluno' : 'alunos'}`
            )}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
          Intervalo: <strong>1s por mensagem</strong>
        </div>
        <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#c4b5fd' }}>
          Duração estimada: {formatEstimatedTime(estimate.estimated_duration_seconds)}
        </div>
      </div>
    </div>
  );
}
