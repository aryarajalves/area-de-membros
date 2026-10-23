import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function LessonNavigationBar({
  prevLesson,
  nextLesson,
  onSelectLesson,
  isLightBg = false,
  textColor = '#f8fafc',
  borderColor = 'rgba(255, 255, 255, 0.08)'
}) {
  if (!prevLesson && !nextLesson) return null;

  return (
    <div
      className="lesson-navigation-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginTop: '28px',
        paddingTop: '20px',
        borderTop: `1px solid ${borderColor}`
      }}
      data-testid="lesson-navigation-bar"
    >
      <div>
        {prevLesson && (
          <button
            type="button"
            className="secondary-btn"
            onClick={() => onSelectLesson(prevLesson)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
              color: textColor,
              border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            data-testid="prev-lesson-btn"
            title={`Voltar para aula anterior: ${prevLesson.title || ''}`}
          >
            <ChevronLeft size={16} />
            <span>Aula Anterior</span>
          </button>
        )}
      </div>

      <div>
        {nextLesson && (
          <button
            type="button"
            className="primary-btn"
            onClick={() => onSelectLesson(nextLesson)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
            }}
            data-testid="next-lesson-btn"
            title={`Avançar para próxima aula: ${nextLesson.title || ''}`}
          >
            <span>Próxima Aula</span>
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
