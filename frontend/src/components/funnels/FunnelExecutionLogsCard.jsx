import React, { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

export default function FunnelExecutionLogsCard({ logs, status }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!logs) return;
    navigator.clipboard.writeText(logs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        backgroundColor: '#0a0f1d',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        borderRadius: '12px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
      data-testid="execution-logs-card"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={15} style={{ color: '#a78bfa' }} />
          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#e2e8f0' }}>
            Logs da Execução
          </span>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '10px',
              backgroundColor: status === 'running' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: status === 'running' ? '#fbbf24' : '#34d399',
              border: status === 'running' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            {status === 'running' ? 'Em andamento' : 'Concluído'}
          </span>
        </div>

        {logs && (
          <button
            type="button"
            onClick={handleCopy}
            title="Copiar logs"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: copied ? '#34d399' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 8px',
              fontSize: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
            }}
            data-testid="copy-logs-btn"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>
        )}
      </div>

      <div
        style={{
          padding: '12px 14px',
          backgroundColor: '#050811',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '8px',
          fontSize: '0.74rem',
          color: logs ? '#cbd5e1' : '#64748b',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.5',
          maxHeight: '140px',
          overflowY: 'auto',
        }}
        data-testid="execution-logs"
      >
        {logs || 'Nenhum log adicional registrado para esta execução.'}
      </div>
    </div>
  );
}
