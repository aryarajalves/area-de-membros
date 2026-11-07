import React from 'react';
import { Sparkles, HelpCircle, MessageSquare } from 'lucide-react';

export default function TutorQuickPrompts({
  questions = [],
  onSelectQuestion,
  disabled = false,
  isLightBg = false,
  hasCustomQa = false,
  tutorName = 'Tutor IA'
}) {
  if (!questions || questions.length === 0) return null;

  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const chipBg = isLightBg ? '#f1f5f9' : 'rgba(124, 58, 237, 0.08)';
  const chipBorder = isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(124, 58, 237, 0.25)';
  const chipHoverBg = isLightBg ? '#e2e8f0' : 'rgba(124, 58, 237, 0.18)';

  return (
    <div
      data-testid="tutor-quick-prompts-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        maxWidth: '560px',
        margin: '0 auto',
        padding: '14px 16px',
        borderRadius: '12px',
        backgroundColor: isLightBg ? 'rgba(241, 245, 249, 0.6)' : 'rgba(15, 23, 42, 0.55)',
        border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.07)',
        backdropFilter: 'blur(8px)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} style={{ color: '#a855f7' }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: textColor, letterSpacing: '0.02em' }}>
            Dúvidas frequentes desta aula (clique para perguntar):
          </span>
        </div>
        {hasCustomQa && (
          <span
            style={{
              fontSize: '10.5px',
              padding: '2px 7px',
              borderRadius: '999px',
              backgroundColor: 'rgba(124, 58, 237, 0.15)',
              color: '#c084fc',
              fontWeight: 700,
              border: '1px solid rgba(124, 58, 237, 0.3)'
            }}
          >
            Baseado no vídeo
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {questions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectQuestion && onSelectQuestion(q)}
            data-testid={`btn-quick-prompt-${idx}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '9px 12px',
              borderRadius: '9px',
              backgroundColor: chipBg,
              border: chipBorder,
              color: textColor,
              fontSize: '12.5px',
              fontWeight: 500,
              textAlign: 'left',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              transition: 'all 0.18s ease',
              lineHeight: 1.4
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = chipHoverBg;
                e.currentTarget.style.borderColor = '#a855f7';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = chipBg;
                e.currentTarget.style.borderColor = isLightBg ? '#cbd5e1' : 'rgba(124, 58, 237, 0.25)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <MessageSquare size={13} style={{ color: '#a855f7', flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{q}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
