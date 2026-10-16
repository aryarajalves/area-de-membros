import React from 'react';
import { UserX, BookOpen, CheckCircle2 } from 'lucide-react';

export default function FunnelTriggerInactivityConfig({
  nodeId,
  data,
  courses = [],
  loadingCourses = false,
  onUpdateData,
}) {
  const inactiveDays = data.inactive_days !== undefined ? parseInt(data.inactive_days, 10) : 7;

  const handleSelectDays = (val) => {
    onUpdateData(nodeId, {
      ...data,
      trigger_event: 'student_inactivity',
      inactive_days: val,
    });
  };

  const handleCustomDays = (e) => {
    const val = Math.max(1, parseInt(e.target.value, 10) || 1);
    onUpdateData(nodeId, {
      ...data,
      trigger_event: 'student_inactivity',
      inactive_days: val,
    });
  };

  const handleSelectCourse = (e) => {
    const val = e.target.value;
    const selectedCourseId = val ? parseInt(val, 10) : null;
    const found = courses.find((c) => c.id === selectedCourseId);
    onUpdateData(nodeId, {
      ...data,
      trigger_event: 'student_inactivity',
      course_id: selectedCourseId,
      course_title: found ? found.title : 'Todos os Cursos',
    });
  };

  const selectedCourseTitle = data.course_id
    ? courses.find((c) => c.id === data.course_id)?.title || data.course_title || `Curso #${data.course_id}`
    : 'Todos os Cursos';

  return (
    <>
      <p style={{ fontSize: '0.74rem', color: '#cbd5e1', margin: '0 0 10px 0', lineHeight: 1.4 }}>
        Dispara automaticamente quando o aluno estiver sem assistir aulas ou sem atividade por X dias.
      </p>

      {/* Seletor de Período de Inatividade */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
          <UserX size={12} color="#ec4899" />
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Dias de inatividade:</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
          {[3, 7, 14, 30].map((d) => {
            const isAct = inactiveDays === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => handleSelectDays(d)}
                style={{
                  padding: '6px 2px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isAct ? '1.5px solid #ec4899' : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isAct ? 'rgba(236, 72, 153, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                  color: isAct ? '#fbcfe8' : '#cbd5e1',
                  textAlign: 'center',
                }}
                data-testid={`trigger-inactivity-btn-${d}-${nodeId}`}
              >
                {d} dias
              </button>
            );
          })}
        </div>
      </div>

      {/* Campo Numérico Personalizado */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            min="1"
            max="365"
            value={inactiveDays}
            onChange={handleCustomDays}
            style={{
              width: '75px',
              padding: '6px 8px',
              borderRadius: '6px',
              backgroundColor: '#0a0703',
              border: '1px solid rgba(236, 72, 153, 0.4)',
              color: '#fbcfe8',
              fontSize: '0.8rem',
              fontWeight: 700,
              outline: 'none',
              textAlign: 'center',
            }}
            data-testid={`trigger-inactivity-custom-input-${nodeId}`}
          />
          <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
            dias consecutivos sem assistir aulas
          </span>
        </div>
      </div>

      {/* Seletor de Curso */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
          <BookOpen size={12} color="#ec4899" />
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
            border: '1px solid rgba(236, 72, 153, 0.4)',
            color: '#fbcfe8',
            fontSize: '0.78rem',
            fontWeight: 600,
            outline: 'none',
            cursor: 'pointer',
          }}
          data-testid={`trigger-inactivity-course-select-${nodeId}`}
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
          backgroundColor: 'rgba(236, 72, 153, 0.1)',
          borderLeft: '3px solid #ec4899',
          borderRadius: '0 6px 6px 0',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '6px',
        }}
      >
        <CheckCircle2 size={13} color="#f472b6" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span style={{ fontSize: '0.7rem', color: '#fbcfe8', lineHeight: 1.35 }}>
          Disparará mensagem de resgate após {inactiveDays} dia(s) sem aulas em &quot;{selectedCourseTitle}&quot;.
        </span>
      </div>
    </>
  );
}
