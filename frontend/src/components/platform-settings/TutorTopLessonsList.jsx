import React from 'react';
import { BookOpen } from 'lucide-react';

export default function TutorTopLessonsList({
  topLessons = [],
  textColor = '#f8fafc',
  subTextColor = '#94a3b8',
  innerCardBg = 'rgba(2, 6, 23, 0.6)',
  innerCardBorder = '1px solid rgba(255, 255, 255, 0.08)'
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h5
          style={{
            margin: 0,
            fontSize: '14.5px',
            fontWeight: 700,
            color: textColor,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <BookOpen size={16} color="#c084fc" />
          <span>Aulas com Mais Dúvidas (Foco para Revisão Pedagógica)</span>
        </h5>
        <span style={{ fontSize: '12px', color: subTextColor }}>Top aulas mais questionadas</span>
      </div>

      {topLessons.length === 0 ? (
        <div
          data-testid="empty-top-lessons"
          style={{
            backgroundColor: innerCardBg,
            border: innerCardBorder,
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            color: subTextColor,
            fontSize: '13px'
          }}
        >
          Ainda não há dúvidas registradas pelos alunos nas aulas.
        </div>
      ) : (
        <div
          data-testid="top-questioned-lessons-list"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          {topLessons.map((item, index) => (
            <div
              key={item.lesson_id}
              data-testid={`top-lesson-item-${item.lesson_id}`}
              style={{
                backgroundColor: innerCardBg,
                border: innerCardBorder,
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: index === 0 ? 'rgba(234, 179, 8, 0.2)' : 'rgba(168, 85, 247, 0.15)',
                    color: index === 0 ? '#eab308' : '#c084fc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                >
                  #{index + 1}
                </span>
                <div>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: textColor, display: 'block' }}>
                    {item.lesson_title}
                  </span>
                  <span style={{ fontSize: '11.5px', color: subTextColor }}>
                    {item.course_title}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: 'rgba(168, 85, 247, 0.15)',
                    color: '#c084fc',
                    padding: '3px 9px',
                    borderRadius: '6px',
                    border: '1px solid rgba(168, 85, 247, 0.3)'
                  }}
                >
                  {item.questions_count} {item.questions_count === 1 ? 'dúvida' : 'dúvidas'}
                </span>
                {item.dislikes_count > 0 && (
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 600,
                      backgroundColor: 'rgba(249, 115, 22, 0.15)',
                      color: '#f97316',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(249, 115, 22, 0.3)'
                    }}
                  >
                    {item.dislikes_count} {item.dislikes_count === 1 ? 'dislike' : 'dislikes'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
