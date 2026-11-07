import React from 'react';
import { Wrench, ShieldAlert, Sparkles } from 'lucide-react';

export default function TutorMaintenanceBanner({
  message,
  isManager = false,
  isLightBg = false,
}) {
  const defaultText =
    'O Tutor IA está temporariamente em manutenção para melhorias pedagógicas e atualizações. O envio de dúvidas voltará a funcionar em breve!';

  return (
    <div
      data-testid="tutor-maintenance-banner"
      style={{
        padding: '14px 16px',
        borderRadius: '12px',
        backgroundColor: isLightBg ? '#fffbeb' : 'rgba(245, 158, 11, 0.08)',
        border: isLightBg ? '1px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.28)',
        boxShadow: isLightBg
          ? '0 4px 12px rgba(245, 158, 11, 0.08)'
          : '0 8px 24px rgba(0, 0, 0, 0.45)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        margin: '6px 0 10px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: isLightBg ? '#fef3c7' : 'rgba(245, 158, 11, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
              flexShrink: 0,
            }}
          >
            <Wrench size={16} />
          </div>
          <div>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: isLightBg ? '#92400e' : '#fbbf24',
                letterSpacing: '0.02em',
              }}
            >
              Tutor IA em Manutenção Temporária
            </span>
          </div>
        </div>

        {isManager && (
          <span
            data-testid="badge-admin-maintenance-override"
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: '#38bdf8',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '2px 8px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ShieldAlert size={11} />
            <span>Acesso de Teste (Administrador)</span>
          </span>
        )}
      </div>

      <p
        data-testid="tutor-maintenance-message-text"
        style={{
          margin: 0,
          fontSize: '0.78rem',
          lineHeight: 1.5,
          color: isLightBg ? '#78350f' : '#fde68a',
        }}
      >
        {message || defaultText}
      </p>

      {!isManager && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.7rem',
            color: isLightBg ? '#b45309' : '#f59e0b',
            fontWeight: 600,
          }}
        >
          <Sparkles size={12} />
          <span>O envio de novas mensagens está temporariamente pausado. Volte em breve!</span>
        </div>
      )}
    </div>
  );
}
