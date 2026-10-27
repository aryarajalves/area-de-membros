import React from 'react';
import { MessageSquareText, BookOpen } from 'lucide-react';

export default function FunnelTriggerTestimonialConfig({
  nodeId,
  data = {},
  courses = [],
  loadingCourses = false,
  onUpdateData,
}) {
  const selectedCourseId = data.course_id;

  const handleCourseChange = (e) => {
    const val = e.target.value;
    if (!val || val === 'all') {
      onUpdateData(nodeId, {
        ...data,
        course_id: null,
        course_title: 'Todos os Cursos',
      });
    } else {
      const cId = parseInt(val, 10);
      const found = courses.find((c) => c.id === cId);
      onUpdateData(nodeId, {
        ...data,
        course_id: cId,
        course_title: found ? found.title : `Curso #${cId}`,
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p style={{ fontSize: '0.74rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
        Dispara automaticamente quando o aluno enviar seu <strong>primeiro depoimento</strong> ou avaliação.
      </p>

      {/* Seletor de Curso */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#38bdf8',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Filtrar por Curso:
        </label>
        <select
          value={selectedCourseId || 'all'}
          onChange={handleCourseChange}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          disabled={loadingCourses}
          data-testid={`select-testimonial-course-${nodeId}`}
          style={{
            width: '100%',
            padding: '7px 10px',
            borderRadius: '6px',
            backgroundColor: '#020617',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#e0f2fe',
            fontSize: '0.75rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="all">🌟 Qualquer Curso (Qualquer 1º Depoimento)</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Resumo do Gatilho */}
      <div
        style={{
          padding: '8px 10px',
          backgroundColor: '#020617',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderLeftWidth: '3px',
          borderLeftColor: '#38bdf8',
          borderRadius: '0 6px 6px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
        data-testid={`testimonial-trigger-summary-${nodeId}`}
      >
        <MessageSquareText size={14} color="#38bdf8" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.72rem', color: '#e0f2fe' }}>
          Ativa no 1º depoimento: <strong>{data.course_title || 'Qualquer Curso'}</strong>
        </span>
      </div>
    </div>
  );
}
