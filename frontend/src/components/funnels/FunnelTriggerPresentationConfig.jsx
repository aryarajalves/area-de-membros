import React from 'react';
import { Users, Sparkles } from 'lucide-react';

export default function FunnelTriggerPresentationConfig({
  nodeId,
  data = {},
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p style={{ fontSize: '0.74rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
        Dispara imediatamente quando o aluno publicar sua <strong>primeira apresentação</strong> na comunidade de membros.
      </p>

      {/* Card Visual de Boas-vindas da Comunidade */}
      <div
        style={{
          padding: '10px 12px',
          backgroundColor: '#020617',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderLeftWidth: '3px',
          borderLeftColor: '#10b981',
          borderRadius: '0 8px 8px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
        data-testid={`presentation-trigger-summary-${nodeId}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={14} color="#34d399" />
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#34d399' }}>
            Apresentação na Comunidade
          </span>
        </div>
        <span style={{ fontSize: '0.7rem', color: '#a7f3d0' }}>
          Excelente para disparar mensagens de acolhimento, dicas iniciais e incentivar networking.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.68rem', color: '#94a3b8' }}>
        <Sparkles size={11} color="#f59e0b" />
        <span>Gatilho de execução única por aluno.</span>
      </div>
    </div>
  );
}
