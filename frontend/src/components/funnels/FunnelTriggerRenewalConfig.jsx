import React from 'react';
import { Hourglass, BookOpen, CheckCircle2 } from 'lucide-react';

export default function FunnelTriggerRenewalConfig({
  nodeId,
  data,
  courses = [],
  loadingCourses = false,
  onUpdateData,
}) {
  const daysBefore = data.days_before !== undefined ? parseInt(data.days_before, 10) : 7;

  const handleSelectDaysBefore = (val) => {
    onUpdateData(nodeId, {
      ...data,
      trigger_event: 'renewal_warning',
      days_before: val,
    });
  };

  const handleSelectCourse = (e) => {
    const val = e.target.value;
    const selectedCourseId = val ? parseInt(val, 10) : null;
    const found = courses.find((c) => c.id === selectedCourseId);
    onUpdateData(nodeId, {
      ...data,
      trigger_event: 'renewal_warning',
      course_id: selectedCourseId,
      course_title: found ? found.title : 'Todos os Cursos',
    });
  };

  const selectedCourseTitle = data.course_id
    ? courses.find((c) => c.id === data.course_id)?.title || data.course_title || `Curso #${data.course_id}`
    : 'Todos os Cursos';

  const daysLabel =
    daysBefore === 0
      ? 'no dia do vencimento (acesso expirado)'
      : `${daysBefore} dia(s) antes do vencimento`;

  return (
    <>
      <p style={{ fontSize: '0.74rem', color: '#cbd5e1', margin: '0 0 10px 0', lineHeight: 1.4 }}>
        Dispara automaticamente quando o prazo de acesso do aluno estiver próximo do fim ou vencer.
      </p>

      {/* Seletor de Antecedência */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
          <Hourglass size={12} color="#f43f5e" />
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Momento do aviso:</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {[
            { days: 7, label: '⏳ 7 dias antes' },
            { days: 3, label: '⚠️ 3 dias antes' },
            { days: 0, label: '🛑 No vencimento' },
          ].map((item) => {
            const isAct = daysBefore === item.days;
            return (
              <button
                key={item.days}
                type="button"
                onClick={() => handleSelectDaysBefore(item.days)}
                style={{
                  padding: '6px 4px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isAct ? '1.5px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isAct ? 'rgba(244, 63, 94, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                  color: isAct ? '#fecdd3' : '#cbd5e1',
                  textAlign: 'center',
                }}
                data-testid={`trigger-renewal-btn-${item.days}-${nodeId}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Seletor de Curso */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
          <BookOpen size={12} color="#f43f5e" />
          <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Curso a monitorar:</label>
        </div>
        <select
          value={data.course_id || ''}
          onChange={handleSelectCourse}
          disabled={loadingCourses}
          style={{
            width: '100%',
            padding: '7px 10px',
            borderRadius: '6px',
            backgroundColor: '#0a0703',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#fecdd3',
            fontSize: '0.78rem',
            fontWeight: 600,
            outline: 'none',
            cursor: 'pointer',
          }}
          data-testid={`trigger-renewal-course-select-${nodeId}`}
        >
          <option value="">🌟 Todos os Cursos (Qualquer um)</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      {/* Caixa Resumo */}
      <div
        style={{
          padding: '8px 10px',
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          borderLeft: '3px solid #f43f5e',
          borderRadius: '0 6px 6px 0',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '6px',
        }}
      >
        <CheckCircle2 size={13} color="#fb7185" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span style={{ fontSize: '0.7rem', color: '#fecdd3', lineHeight: 1.35 }}>
          Disparará automaticamente {daysLabel} do curso &quot;{selectedCourseTitle}&quot;.
        </span>
      </div>
    </>
  );
}
