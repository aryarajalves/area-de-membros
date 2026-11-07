import React from 'react';
import { Sparkles } from 'lucide-react';
import TutorQuickPrompts from './TutorQuickPrompts';

export default function TutorEmptyState({
  textColor,
  subTextColor,
  suggestedQuestions,
  onSelectQuestion,
  disabled,
  isLightBg,
  tutorName
}) {
  return (
    <div
      data-testid="tutor-empty-state"
      style={{
        padding: '24px 16px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '14px',
        color: subTextColor
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'rgba(124, 58, 237, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a855f7'
          }}
        >
          <Sparkles size={20} />
        </div>
        <h5 style={{ margin: 0, fontSize: '14.5px', fontWeight: 600, color: textColor }}>
          Como posso te ajudar com esta aula hoje?
        </h5>
        <p style={{ margin: 0, fontSize: '12.5px', maxWidth: '440px', lineHeight: 1.5 }}>
          Tire dúvidas de conceitos, peça exemplos práticos ou clique em uma das perguntas da aula abaixo:
        </p>
      </div>

      {/* Quick Prompts específicos da aula */}
      <TutorQuickPrompts
        questions={suggestedQuestions?.questions || []}
        hasCustomQa={suggestedQuestions?.hasCustomQa}
        onSelectQuestion={onSelectQuestion}
        disabled={disabled}
        isLightBg={isLightBg}
        tutorName={tutorName}
      />
    </div>
  );
}
