import React from 'react';
import { BookOpen, CheckCircle, Clock, Calendar, AlertCircle, History, Hourglass } from 'lucide-react';

export default function StudentCourseProgressItem({ course, isLightBg, onOpenHistory }) {
  const isCompleted = course.total_lessons > 0 && course.completed_lessons >= course.total_lessons;
  const isStarted = course.completed_lessons > 0;

  const itemBg = isLightBg ? '#f8fafc' : 'rgba(15, 23, 42, 0.55)';
  const itemBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)';
  const textTitle = isLightBg ? '#1e293b' : '#f8fafc';
  const textMuted = isLightBg ? '#64748b' : '#94a3b8';

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return '—';
    }
  };

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return '—';
    }
  };

  // Cálculo de dias restantes se não vier do backend
  const calculateDaysRemaining = () => {
    if (course.days_remaining !== undefined && course.days_remaining !== null) {
      return course.days_remaining;
    }
    if (!course.expires_at) return null;
    try {
      const exp = new Date(course.expires_at);
      const now = new Date();
      const diffMs = exp - now;
      return diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;
    } catch {
      return null;
    }
  };

  const daysLeft = calculateDaysRemaining();
  const timeProgress = course.time_progress_percent !== undefined && course.time_progress_percent !== null
    ? course.time_progress_percent
    : course.is_expired ? 100 : 50;

  return (
    <div
      className="student-course-item"
      style={{
        backgroundColor: itemBg,
        border: itemBorder,
        borderRadius: '10px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'all 0.2s ease',
      }}
      data-testid={`student-course-${course.course_id}`}
    >
      {/* Topo do Curso: Capa, Título, Ações e Badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.course_title}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                objectFit: 'cover',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          ) : (
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
              }}
            >
              <BookOpen size={20} />
            </div>
          )}

          <div>
            <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 600, color: textTitle }}>
              {course.course_title}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: textMuted, marginTop: '2px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} />
                {!course.expires_at ? 'Acesso Vitalício' : `Expira em ${formatDateOnly(course.expires_at)}`}
              </span>
              {course.is_expired && (
                <span style={{ color: '#ef4444', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <AlertCircle size={12} /> Acesso Expirado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Botão de Histórico e Badge de Conclusão */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onOpenHistory && (
            <button
              type="button"
              onClick={() => onOpenHistory(course)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                backgroundColor: isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.06)',
                border: itemBorder,
                color: textTitle,
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
              title="Ver histórico de aulas assistidas"
              data-testid={`view-course-history-btn-${course.course_id}`}
            >
              <History size={13} style={{ color: '#3b82f6' }} />
              <span>Histórico de Acesso</span>
            </button>
          )}

          {isCompleted ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <CheckCircle size={13} /> Concluído
            </span>
          ) : isStarted ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              <Clock size={13} /> Em Andamento
            </span>
          ) : (
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 500,
                backgroundColor: isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                color: textMuted,
              }}
            >
              Não Iniciado
            </span>
          )}
        </div>
      </div>

      {/* Linha do Tempo de Expiração do Curso (Caso não seja vitalício) */}
      {course.expires_at && (
        <div
          style={{
            backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(0, 0, 0, 0.25)',
            border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '10px 12px',
          }}
          data-testid={`expiration-timeline-${course.course_id}`}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', marginBottom: '6px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: textMuted }}>
              <Hourglass size={13} style={{ color: course.is_expired ? '#f87171' : daysLeft <= 7 ? '#fbbf24' : '#60a5fa' }} />
              <strong>Validade do Curso:</strong>
            </span>
            <span
              style={{
                fontWeight: 700,
                color: course.is_expired ? '#f87171' : daysLeft <= 7 ? '#fbbf24' : '#34d399',
              }}
              data-testid={`time-left-text-${course.course_id}`}
            >
              {course.is_expired ? 'Acesso Expirado' : daysLeft === 0 ? 'Expira hoje!' : `Faltam ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`}
            </span>
          </div>

          {/* Barra de Linha do Tempo */}
          <div
            style={{
              height: '6px',
              borderRadius: '999px',
              backgroundColor: isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
              marginBottom: '6px',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.min(timeProgress, 100)}%`,
                backgroundColor: course.is_expired ? '#dc2626' : daysLeft <= 7 ? '#f59e0b' : '#3b82f6',
                borderRadius: '999px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          {/* Marcadores de Datas */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: textMuted }}>
            <span>Início: {formatDateOnly(course.enrolled_at || course.created_at)}</span>
            <span>Término: {formatDateTime(course.expires_at)}</span>
          </div>
        </div>
      )}

      {/* Barra de Progresso de Aulas */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px', color: textMuted }}>
          <span>
            Progresso: <strong style={{ color: textTitle }}>{course.completed_lessons}</strong> de{' '}
            <strong style={{ color: textTitle }}>{course.total_lessons}</strong> aulas
          </span>
          <span style={{ fontWeight: 600, color: isCompleted ? '#34d399' : '#60a5fa' }}>
            {course.progress_percent}%
          </span>
        </div>
        <div
          style={{
            height: '7px',
            borderRadius: '999px',
            backgroundColor: isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(course.progress_percent, 100)}%`,
              backgroundColor: isCompleted ? '#10b981' : '#3b82f6',
              borderRadius: '999px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Até onde o aluno foi: Última aula assistida */}
      {course.last_lesson_title && (
        <div
          style={{
            fontSize: '0.8rem',
            color: textMuted,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '2px',
          }}
        >
          <span style={{ color: isLightBg ? '#475569' : '#94a3b8' }}>Última aula concluída:</span>
          <span style={{ fontWeight: 500, color: textTitle }}>{course.last_lesson_title}</span>
        </div>
      )}
    </div>
  );
}
