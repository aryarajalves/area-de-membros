import React from 'react';
import { Award, BookOpen, CheckCircle2, GitFork } from 'lucide-react';

export default function FunnelTriggerProgressConfig({
  nodeId,
  data,
  courses = [],
  loadingCourses = false,
  onUpdateData,
}) {
  // Suporta lista de marcos ou valor único legado
  const rawMilestones = Array.isArray(data.milestones)
    ? data.milestones
    : (data.milestone ? (data.milestone === 'all' ? ['25', '50', '75', '100'] : [String(data.milestone)]) : ['100']);
  const milestones = rawMilestones.length > 0 ? rawMilestones : ['100'];

  const handleToggleMilestone = (val) => {
    let next;
    if (milestones.includes(val)) {
      // Se já estava selecionado, desmarca a menos que seja o único
      if (milestones.length > 1) {
        next = milestones.filter((m) => m !== val);
      } else {
        next = milestones; // mantém ao menos um ativo
      }
    } else {
      next = [...milestones, val].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    }

    onUpdateData(nodeId, {
      ...data,
      trigger_event: 'progress_milestone',
      milestones: next,
      milestone: next.length === 4 ? 'all' : next[0],
    });
  };

  const handleSelectCourse = (e) => {
    const val = e.target.value;
    const selectedCourseId = val ? parseInt(val, 10) : null;
    const found = courses.find((c) => c.id === selectedCourseId);
    onUpdateData(nodeId, {
      ...data,
      trigger_event: 'progress_milestone',
      course_id: selectedCourseId,
      course_title: found ? found.title : 'Todos os Cursos',
    });
  };

  const selectedCourseTitle = data.course_id
    ? courses.find((c) => c.id === data.course_id)?.title || data.course_title || `Curso #${data.course_id}`
    : 'Todos os Cursos';

  const milestonesLabel = milestones
    .map((m) => `${m}%`)
    .join(', ');

  return (
    <>
      <p style={{ fontSize: '0.74rem', color: '#cbd5e1', margin: '0 0 10px 0', lineHeight: 1.4 }}>
        Dispara automaticamente quando o aluno atingir a porcentagem configurada. Você pode selecionar mais de um marco!
      </p>

      {/* Seletor Múltiplo do Marco com Saídas Ramificadas */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Award size={12} color="#a855f7" />
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Porcentagens ativas (Múltipla Seleção):</span>
          </div>
          <span style={{ fontSize: '0.65rem', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <GitFork size={10} />
            <span>Saídas ramificadas</span>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          {[
            { id: '25', label: '🥉 25% do Curso' },
            { id: '50', label: '🥈 50% do Curso' },
            { id: '75', label: '🥇 75% do Curso' },
            { id: '100', label: '🏆 100% Conclusão' },
          ].map((item) => {
            const isAct = milestones.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleToggleMilestone(item.id)}
                style={{
                  padding: '7px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isAct ? '1.5px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isAct ? 'rgba(168, 85, 247, 0.28)' : 'rgba(255, 255, 255, 0.03)',
                  color: isAct ? '#e9d5ff' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
                data-testid={`trigger-milestone-btn-${item.id}-${nodeId}`}
                title={`Clique para ativar/desativar saída de ${item.id}%`}
              >
                <span>{item.label}</span>
                {isAct && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#a855f7',
                      boxShadow: '0 0 6px #a855f7',
                      display: 'inline-block'
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Seletor de Curso */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
          <BookOpen size={12} color="#a855f7" />
          <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Curso alvo:</label>
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
            border: '1px solid rgba(168, 85, 247, 0.4)',
            color: '#e9d5ff',
            fontSize: '0.78rem',
            fontWeight: 600,
            outline: 'none',
            cursor: 'pointer',
          }}
          data-testid={`trigger-progress-course-select-${nodeId}`}
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
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          borderLeft: '3px solid #a855f7',
          borderRadius: '0 6px 6px 0',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '6px',
        }}
      >
        <CheckCircle2 size={13} color="#c084fc" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span style={{ fontSize: '0.7rem', color: '#e9d5ff', lineHeight: 1.35 }}>
          Cada marco ativado ({milestonesLabel}) possui seu próprio conector na direita para seguir fluxos personalizados em &quot;{selectedCourseTitle}&quot;.
        </span>
      </div>
    </>
  );
}
