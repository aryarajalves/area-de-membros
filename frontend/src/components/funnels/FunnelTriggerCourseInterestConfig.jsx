import React from 'react';
import { BookOpen, CheckCircle2 } from 'lucide-react';

export default function FunnelTriggerCourseInterestConfig({
  nodeId,
  data,
  courses = [],
  loadingCourses = false,
  onUpdateData,
}) {
  const handleSelectCourse = (e) => {
    const val = e.target.value;
    const selectedCourseId = val ? parseInt(val, 10) : null;
    const found = courses.find((c) => c.id === selectedCourseId);
    onUpdateData(nodeId, {
      ...data,
      trigger_event: 'course_interest',
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
        Dispara <strong>1 única vez</strong> quando o aluno tentar acessar um curso que ele ainda não possui.
      </p>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
          <BookOpen size={12} color="#facc15" />
          <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
            Qual curso ativará o gatilho:
          </label>
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
            border: '1px solid rgba(234, 179, 8, 0.4)',
            color: '#fef08a',
            fontSize: '0.78rem',
            fontWeight: 600,
            outline: 'none',
            cursor: 'pointer',
          }}
          data-testid={`trigger-course-select-${nodeId}`}
        >
          <option value="">🌟 Todos os Cursos (Qualquer um)</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          padding: '8px 10px',
          backgroundColor: 'rgba(234, 179, 8, 0.08)',
          borderLeft: '3px solid #eab308',
          borderRadius: '0 6px 6px 0',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '6px',
        }}
      >
        <CheckCircle2 size={13} color="#facc15" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span style={{ fontSize: '0.7rem', color: '#fef08a', lineHeight: 1.35 }}>
          {data.course_id
            ? `Disparará 1 única vez quando o aluno clicar no curso "${selectedCourseTitle}".`
            : 'Disparará 1 única vez quando o aluno clicar em qualquer curso que não possua.'}
        </span>
      </div>
    </>
  );
}
