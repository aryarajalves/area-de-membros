import React from 'react';

export default function EventAccessRuleSelector({
  targetType,
  onChangeTargetType,
  courseId,
  onChangeCourseId,
  courses = [],
}) {
  return (
    <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: '#e2e8f0', marginBottom: '10px' }}>
        Quem pode acessar este evento?
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: '#cbd5e1' }}>
          <input
            type="radio"
            name="target_type"
            checked={targetType === 'all'}
            onChange={() => onChangeTargetType('all')}
          />
          <span>🌐 <strong>Liberado para Todos os Alunos</strong> da plataforma</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: '#cbd5e1' }}>
          <input
            type="radio"
            name="target_type"
            checked={targetType === 'course'}
            onChange={() => onChangeTargetType('course')}
          />
          <span>🔒 <strong>Exclusivo para Alunos de um Curso Específico</strong> (Upsell para os demais)</span>
        </label>
      </div>

      {targetType === 'course' && (
        <div style={{ marginTop: '12px' }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#93c5fd', marginBottom: '4px' }}>
            Selecione o Curso Necessário *
          </label>
          <select
            data-testid="event-course-select"
            value={courseId}
            onChange={(e) => onChangeCourseId(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              background: '#0f172a',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: '#fff',
              fontSize: '0.88rem',
            }}
          >
            <option value="">Selecione um curso...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
