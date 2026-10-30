import React from 'react';
import { Edit2, Trash2, CheckCircle2, Clock, FileText, HelpCircle, Lock } from 'lucide-react';
import { formatLessonDuration, isLessonComingSoon } from './lessonUtils';

export default function TimelineLessonItem({
  lesson,
  idx,
  isActive,
  isCompleted,
  isManager,
  isLightBg,
  textColor,
  subTextColor,
  lessonAudit = null,
  onSelectLesson,
  onOpenEditLesson,
  onPromptDeleteLesson
}) {
  const isComingSoon = isLessonComingSoon(lesson);

  const dotColor = isActive
    ? '#eab308'
    : isCompleted
    ? '#22c55e'
    : (isLightBg ? '#cbd5e1' : '#334155');

  const itemTextColor = isActive
    ? '#eab308'
    : isCompleted
    ? '#4ade80'
    : subTextColor;

  return (
    <div
      onClick={() => onSelectLesson(lesson)}
      data-testid={`lesson-item-${lesson.id}`}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '8px',
        cursor: 'pointer',
        padding: '3px 6px',
        borderRadius: '6px',
        backgroundColor: isActive ? (isLightBg ? 'rgba(234, 179, 8, 0.12)' : 'rgba(234, 179, 8, 0.14)') : 'transparent',
        transition: 'all 0.15s ease'
      }}
    >
      {/* Ponto na Linha da Timeline */}
      <span
        style={{
          position: 'absolute',
          left: '-25px',
          top: '6px',
          width: '9px',
          height: '9px',
          borderRadius: '50%',
          backgroundColor: dotColor,
          border: isActive ? '2px solid #fef08a' : 'none',
          boxShadow: isActive ? '0 0 8px rgba(234, 179, 8, 0.7)' : 'none',
          transition: 'all 0.2s ease'
        }}
      />

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {lesson.thumbnail_url ? (
            <img
              src={lesson.thumbnail_url}
              alt=""
              loading="lazy"
              decoding="async"
              style={{
                width: '18px',
                height: '18px',
                objectFit: 'cover',
                borderRadius: '3px',
                flexShrink: 0,
                marginTop: '1px',
                opacity: isActive ? 1 : 0.75
              }}
            />
          ) : lesson.content_type === 'text' ? (
            <FileText size={13} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} data-testid={`lesson-type-icon-text-${lesson.id}`} />
          ) : lesson.content_type === 'quiz' ? (
            <HelpCircle size={13} color="#a855f7" style={{ flexShrink: 0, marginTop: '2px' }} data-testid={`lesson-type-icon-quiz-${lesson.id}`} />
          ) : null}

          <span
            data-testid={`lesson-title-${lesson.id}`}
            title={`${idx + 1}. ${lesson.title}`}
            style={{
              fontSize: '13px',
              fontWeight: isActive ? 700 : 500,
              color: itemTextColor,
              textDecoration: isCompleted ? 'line-through' : 'none',
              lineHeight: 1.35,
              transition: 'color 0.15s ease',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              wordBreak: 'break-word',
              minWidth: 0
            }}
          >
            {idx + 1}. {lesson.title}
          </span>

          {isComingSoon && (
            <span
              data-testid={`lesson-coming-soon-badge-${lesson.id}`}
              style={{
                fontSize: '10px',
                fontWeight: 700,
                backgroundColor: 'rgba(234, 179, 8, 0.16)',
                color: '#eab308',
                border: '1px solid rgba(234, 179, 8, 0.35)',
                padding: '1px 6px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                flexShrink: 0,
                marginTop: '1px'
              }}
            >
              <Clock size={9} />
              <span>Em Breve</span>
            </span>
          )}

          {lesson.is_locked && !isManager && (
            <span
              data-testid={`lesson-drip-locked-badge-${lesson.id}`}
              style={{
                fontSize: '10px',
                fontWeight: 700,
                backgroundColor: 'rgba(239, 68, 68, 0.16)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                padding: '1px 6px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                flexShrink: 0,
                marginTop: '1px'
              }}
            >
              <Lock size={9} />
              <span>
                {lesson.available_at
                  ? `Libera ${new Date(lesson.available_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
                  : `Após ${lesson.release_days || 7}d`}
              </span>
            </span>
          )}

          {isManager && lesson.release_type && lesson.release_type !== 'immediate' && (
            <span
              data-testid={`lesson-drip-rule-badge-${lesson.id}`}
              style={{
                fontSize: '9.5px',
                fontWeight: 700,
                backgroundColor: 'rgba(234, 179, 8, 0.14)',
                color: '#facc15',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                padding: '1px 5px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                flexShrink: 0,
                marginTop: '1px'
              }}
            >
              <Lock size={9} />
              <span>{lesson.release_type === 'days_after' ? `${lesson.release_days || 7}d` : 'Data'}</span>
            </span>
          )}

          {isCompleted && (
            <span data-testid={`lesson-completed-icon-${lesson.id}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <CheckCircle2
                size={12}
                style={{ color: '#22c55e', flexShrink: 0 }}
                data-testid={`completed-badge-${lesson.id}`}
              />
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', fontSize: '11px', color: subTextColor, opacity: 0.85 }}>
          {!isComingSoon && (
            <>
              {lesson.duration ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Clock size={10} />
                  {formatLessonDuration(lesson.duration)}
                </span>
              ) : null}
              {lesson.attachments && lesson.attachments.length > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }} title={`${lesson.attachments.length} anexo(s)`}>
                  <FileText size={10} />
                  {lesson.attachments.length}
                </span>
              )}
              {lesson.quizzes && lesson.quizzes.length > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }} title={`${lesson.quizzes.length} quiz(zes)`}>
                  <HelpCircle size={10} />
                  Quiz
                </span>
              )}
            </>
          )}
        </div>

        {/* Tags de Diagnóstico Exclusivas do Super Admin */}
        {lessonAudit?.any_issue && (
          <div
            data-testid={`lesson-audit-tags-${lesson.id}`}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              marginTop: '4px'
            }}
          >
            {lessonAudit.unoptimized_video && (
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(234, 179, 8, 0.16)',
                  color: '#facc15',
                  border: '1px solid rgba(234, 179, 8, 0.35)'
                }}
              >
                ⚡ S/ Otimização{lessonAudit.format ? ` (.${lessonAudit.format})` : ''}
              </span>
            )}
            {lessonAudit.bad_title && (
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(192, 132, 252, 0.16)',
                  color: '#c084fc',
                  border: '1px solid rgba(192, 132, 252, 0.35)'
                }}
              >
                ✨ S/ Nome IA
              </span>
            )}
            {lessonAudit.missing_description && (
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(56, 189, 248, 0.16)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.35)'
                }}
              >
                📝 S/ Descrição
              </span>
            )}
            {lessonAudit.missing_chapters && (
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(251, 146, 60, 0.16)',
                  color: '#fb923c',
                  border: '1px solid rgba(251, 146, 60, 0.35)'
                }}
              >
                📑 S/ Capítulos
              </span>
            )}
            {lessonAudit.missing_thumbnail && (
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(244, 114, 182, 0.16)',
                  color: '#f472b6',
                  border: '1px solid rgba(244, 114, 182, 0.35)'
                }}
              >
                🖼️ S/ Thumbnail
              </span>
            )}
          </div>
        )}
      </div>

      {isManager && (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            title="Editar Aula"
            onClick={(e) => onOpenEditLesson(lesson, e)}
            data-testid={`edit-lesson-btn-${lesson.id}`}
            style={{ background: 'transparent', border: 'none', color: subTextColor, padding: '2px', cursor: 'pointer', display: 'flex' }}
          >
            <Edit2 size={12} />
          </button>
          <button
            type="button"
            title="Excluir Aula"
            onClick={(e) => onPromptDeleteLesson(lesson, e)}
            data-testid={`delete-lesson-btn-${lesson.id}`}
            style={{ background: 'transparent', border: 'none', color: '#f87171', padding: '2px', cursor: 'pointer', display: 'flex' }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
