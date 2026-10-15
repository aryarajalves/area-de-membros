import React, { useState, useEffect } from 'react';
import { Zap, Target, Copy, Trash2, Clock, Calendar, CheckCircle2, BookOpen } from 'lucide-react';

export default function FunnelNodeTrigger({
  node,
  isSelected,
  onUpdateData,
  onDeleteNode,
  onDuplicateNode,
  onStartConnect,
  onConnectTarget,
  isTargetActive = false,
}) {
  const data = node.data || {};
  const isCourseInterest = data.trigger_event === 'course_interest';
  const daysAfter = parseInt(data.days_after, 10) || 0;
  const delayType = data.delay_type || (daysAfter === 0 ? 'immediate' : [7, 14, 21].includes(daysAfter) ? `${daysAfter}_days` : 'custom');

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    if (!isCourseInterest) return;
    let isMounted = true;
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/api/v1/courses', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const list = await res.json();
          if (isMounted) setCourses(Array.isArray(list) ? list : []);
        }
      } catch {
        /* fallback silencioso */
      } finally {
        if (isMounted) setLoadingCourses(false);
      }
    };
    fetchCourses();
    return () => {
      isMounted = false;
    };
  }, [isCourseInterest]);

  const handleSelectPreset = (presetDays, type) => {
    onUpdateData(node.id, {
      ...data,
      trigger_event: 'student_created',
      delay_type: type,
      days_after: presetDays,
    });
  };

  const handleCustomDaysChange = (e) => {
    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
    onUpdateData(node.id, {
      ...data,
      trigger_event: 'student_created',
      delay_type: val === 0 ? 'immediate' : 'custom',
      days_after: val,
    });
  };

  const handleSelectCourse = (e) => {
    const val = e.target.value;
    const selectedCourseId = val ? parseInt(val, 10) : null;
    const found = courses.find((c) => c.id === selectedCourseId);
    onUpdateData(node.id, {
      ...data,
      trigger_event: 'course_interest',
      course_id: selectedCourseId,
      course_title: found ? found.title : 'Todos os Cursos',
    });
  };

  const selectedCourseTitle = data.course_id
    ? (courses.find((c) => c.id === data.course_id)?.title || data.course_title || `Curso #${data.course_id}`)
    : 'Todos os Cursos';

  return (
    <div
      style={{
        position: 'relative',
        width: '320px',
        backgroundColor: '#181408',
        border: isSelected ? '2px solid #eab308' : '1px solid rgba(234, 179, 8, 0.45)',
        borderRadius: '14px',
        boxShadow: isSelected
          ? '0 10px 30px rgba(234, 179, 8, 0.35)'
          : '0 10px 25px rgba(0, 0, 0, 0.7)',
        color: '#f8fafc',
        padding: '14px',
        userSelect: 'none',
        transition: 'border 0.2s ease, box-shadow 0.2s ease',
      }}
      data-testid={`funnel-node-trigger-${node.id}`}
    >
      {/* Port de Saída (Conexão para a sequência de mensagens) */}
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          if (onStartConnect) onStartConnect(node.id, e, node, 'output');
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onStartConnect) onStartConnect(node.id, e, node, 'output');
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          if (onConnectTarget) onConnectTarget(node.id, 'output');
        }}
        style={{
          position: 'absolute',
          right: '-8px',
          top: '50%',
          transform: isTargetActive ? 'translateY(-50%) scale(1.3)' : 'translateY(-50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#eab308',
          border: '2px solid #0f172a',
          boxShadow: '0 0 10px #eab308',
          cursor: 'grab',
          zIndex: 10,
          transition: 'all 0.15s ease',
        }}
        title="Clique ou arraste para conectar ao próximo passo do funil"
        data-testid={`node-output-handle-${node.id}`}
      />

      {/* Header do Nó */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          borderBottom: '1px solid rgba(234, 179, 8, 0.2)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: 'rgba(234, 179, 8, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#facc15',
            }}
          >
            {isCourseInterest ? <Target size={14} /> : <Zap size={14} />}
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#facc15', letterSpacing: '0.04em' }}>
              {isCourseInterest ? 'INTERESSE EM CURSO' : 'ALUNO CRIADO'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#eab308',
              backgroundColor: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              borderRadius: '10px',
              padding: '2px 6px',
            }}
          >
            GATILHO
          </span>

          {data.is_start && (
            <span
              style={{
                fontSize: '0.65rem',
                backgroundColor: '#10b981',
                color: '#ffffff',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 700,
              }}
              data-testid={`funnel-node-start-badge-${node.id}`}
            >
              ▶ INÍCIO
            </span>
          )}

          <button
            onClick={() => onDuplicateNode && onDuplicateNode(node.id)}
            title="Duplicar nó"
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
          >
            <Copy size={13} />
          </button>
          <button
            onClick={() => onDeleteNode && onDeleteNode(node.id)}
            title="Excluir nó"
            style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Conteúdo Conforme Tipo do Gatilho */}
      {isCourseInterest ? (
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
              data-testid={`trigger-course-select-${node.id}`}
            >
              <option value="">🌟 Todos os Cursos (Qualquer um)</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          {/* Caixa Resumo Informativa */}
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
      ) : (
        <>
          <p style={{ fontSize: '0.75rem', color: '#cbd5e1', margin: '0 0 10px 0', lineHeight: 1.4 }}>
            Dispara esta sequência de mensagens quando uma nova conta de aluno for criada.
          </p>

          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
              <Clock size={12} color="#facc15" />
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Momento do disparo:</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleSelectPreset(0, 'immediate')}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: delayType === 'immediate' || daysAfter === 0
                    ? '1.5px solid #eab308'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: delayType === 'immediate' || daysAfter === 0
                    ? 'rgba(234, 179, 8, 0.2)'
                    : 'rgba(255, 255, 255, 0.03)',
                  color: delayType === 'immediate' || daysAfter === 0 ? '#fef08a' : '#cbd5e1',
                }}
                data-testid={`trigger-preset-immediate-${node.id}`}
              >
                ⚡ Imediatamente
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset(7, '7_days')}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: delayType === '7_days' && daysAfter === 7
                    ? '1.5px solid #eab308'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: delayType === '7_days' && daysAfter === 7
                    ? 'rgba(234, 179, 8, 0.2)'
                    : 'rgba(255, 255, 255, 0.03)',
                  color: delayType === '7_days' && daysAfter === 7 ? '#fef08a' : '#cbd5e1',
                }}
                data-testid={`trigger-preset-7d-${node.id}`}
              >
                📅 7 dias depois
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset(14, '14_days')}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: delayType === '14_days' && daysAfter === 14
                    ? '1.5px solid #eab308'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: delayType === '14_days' && daysAfter === 14
                    ? 'rgba(234, 179, 8, 0.2)'
                    : 'rgba(255, 255, 255, 0.03)',
                  color: delayType === '14_days' && daysAfter === 14 ? '#fef08a' : '#cbd5e1',
                }}
                data-testid={`trigger-preset-14d-${node.id}`}
              >
                📅 14 dias depois
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset(21, '21_days')}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: delayType === '21_days' && daysAfter === 21
                    ? '1.5px solid #eab308'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: delayType === '21_days' && daysAfter === 21
                    ? 'rgba(234, 179, 8, 0.2)'
                    : 'rgba(255, 255, 255, 0.03)',
                  color: delayType === '21_days' && daysAfter === 21 ? '#fef08a' : '#cbd5e1',
                }}
                data-testid={`trigger-preset-21d-${node.id}`}
              >
                📅 21 dias depois
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              backgroundColor: '#0a0703',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              borderRadius: '8px',
              marginBottom: '10px',
            }}
          >
            <Calendar size={13} color="#facc15" />
            <span style={{ fontSize: '0.73rem', color: '#94a3b8' }}>Personalizar dias:</span>
            <input
              type="number"
              min="0"
              max="365"
              value={daysAfter}
              onChange={handleCustomDaysChange}
              style={{
                width: '60px',
                backgroundColor: '#181408',
                border: '1px solid rgba(234, 179, 8, 0.5)',
                borderRadius: '6px',
                color: '#fef08a',
                padding: '4px 6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                textAlign: 'center',
                outline: 'none',
              }}
              data-testid={`trigger-days-input-${node.id}`}
            />
            <span style={{ fontSize: '0.73rem', color: '#cbd5e1' }}>dias</span>
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
              {daysAfter === 0
                ? 'O funil iniciará imediatamente assim que o aluno for cadastrado.'
                : `O funil iniciará automaticamente ${daysAfter} dia(s) após o cadastro.`}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
