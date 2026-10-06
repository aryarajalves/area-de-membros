import React from 'react';

export default function QuizQuestionCard({
  question,
  qIndex,
  selectedOptionId,
  onSelectOption,
  submitting,
  isLightBg,
  cardBg,
  textColor,
  subTextColor,
  borderColor
}) {
  return (
    <div
      data-testid={`quiz-question-card-${question.id}`}
      style={{
        backgroundColor: cardBg,
        borderRadius: '14px',
        border: `1px solid ${borderColor}`,
        padding: '24px',
        transition: 'border-color 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flex: 1 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: 'rgba(168, 85, 247, 0.18)',
              color: '#c084fc',
              fontSize: '12.5px',
              fontWeight: 800,
              flexShrink: 0
            }}
          >
            {qIndex + 1}
          </span>
          <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 700, color: textColor, lineHeight: 1.5 }}>
            {question.question}
          </h3>
        </div>
        <span
          data-testid={`question-points-badge-${question.id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '11.5px',
            fontWeight: 700,
            color: '#a855f7',
            backgroundColor: isLightBg ? '#f3e8ff' : 'rgba(168, 85, 247, 0.12)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            padding: '2px 8px',
            borderRadius: '6px'
          }}
        >
          {question.points || 1} {(question.points || 1) === 1 ? 'ponto' : 'pontos'}
        </span>
      </div>

      {/* Alternativas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', paddingLeft: '36px' }}>
        {(question.options || []).map((opt, optIndex) => {
          const isSelected = selectedOptionId === opt.id;
          const letter = String.fromCharCode(65 + optIndex); // A, B, C, D...

          return (
            <label
              key={opt.id}
              data-testid={`option-label-${opt.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '10px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                border: isSelected ? '1.5px solid #a855f7' : `1px solid ${borderColor}`,
                backgroundColor: isSelected
                  ? (isLightBg ? '#faf5ff' : 'rgba(168, 85, 247, 0.12)')
                  : (isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.02)'),
                color: isSelected ? (isLightBg ? '#7e22ce' : '#e9d5ff') : textColor,
                fontSize: '13.5px',
                transition: 'all 0.15s ease'
              }}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={opt.id}
                checked={isSelected}
                onChange={() => onSelectOption(question.id, opt.id)}
                disabled={submitting}
                style={{ accentColor: '#a855f7', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 700, color: isSelected ? '#a855f7' : subTextColor, minWidth: '18px' }}>
                {letter})
              </span>
              <span style={{ flex: 1 }}>{opt.option_text}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
