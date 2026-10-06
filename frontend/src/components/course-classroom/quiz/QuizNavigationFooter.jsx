import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function QuizNavigationFooter({
  prevLesson,
  nextLesson,
  onSelectLesson,
  borderColor
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '40px',
        paddingTop: '24px',
        borderTop: `1px solid ${borderColor}`
      }}
    >
      {prevLesson ? (
        <button
          type="button"
          onClick={() => onSelectLesson(prevLesson)}
          className="secondary-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
          data-testid="prev-lesson-btn"
        >
          <ChevronLeft size={16} />
          <span>Aula Anterior: {prevLesson.title}</span>
        </button>
      ) : <div />}

      {nextLesson && (
        <button
          type="button"
          onClick={() => onSelectLesson(nextLesson)}
          className="primary-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
          data-testid="next-lesson-btn"
        >
          <span>Próxima Aula: {nextLesson.title}</span>
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}
