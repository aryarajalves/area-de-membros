import React from 'react';
import { HelpCircle, Award } from 'lucide-react';

export default function QuizHeaderBanner({
  lesson,
  courseTitle,
  moduleTitle,
  passingScore,
  isManager,
  onEditLesson,
  isLightBg,
  textColor,
  subTextColor,
  borderColor
}) {
  return (
    <div
      style={{
        maxWidth: '1080px',
        margin: '0 auto 32px auto',
        borderRadius: '16px',
        padding: '36px 32px',
        background: isLightBg
          ? 'linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)'
          : 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(15, 23, 42, 0.88) 100%)',
        border: `1px solid ${borderColor}`,
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '999px',
            backgroundColor: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            color: '#c084fc',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.6px'
          }}
        >
          <HelpCircle size={13} />
          <span>Quiz Interativo de Conhecimento</span>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '999px',
            backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
            color: subTextColor,
            fontSize: '11.5px',
            fontWeight: 600
          }}
        >
          <Award size={12} />
          <span>Aprovação com {passingScore}%</span>
        </div>
      </div>

      <h1
        data-testid="quiz-lesson-title"
        style={{
          fontSize: '26px',
          fontWeight: 800,
          color: textColor,
          margin: '0 0 14px 0',
          lineHeight: 1.3
        }}
      >
        {lesson?.title}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginTop: '18px', paddingTop: '18px', borderTop: `1px solid ${borderColor}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: subTextColor }}>
          <span>Curso: <strong style={{ color: textColor }}>{courseTitle}</strong></span>
          <span>•</span>
          <span>Módulo: <strong style={{ color: textColor }}>{moduleTitle}</strong></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isManager && onEditLesson && (
            <button
              type="button"
              onClick={() => onEditLesson(lesson)}
              className="secondary-btn"
              style={{ fontSize: '12.5px', padding: '8px 14px' }}
              data-testid="edit-quiz-lesson-btn"
            >
              Configurar Perguntas do Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
