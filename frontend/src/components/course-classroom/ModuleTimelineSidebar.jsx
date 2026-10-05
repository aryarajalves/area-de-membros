import React from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, Clock, FileText, HelpCircle } from 'lucide-react';
import { formatLessonDuration, isLessonComingSoon } from './lessonUtils';

function ProgressRing({ percent = 0, size = 24, strokeWidth = 2.5, activeColor = '#eab308', trackColor = 'rgba(255,255,255,0.14)' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      {clamped > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={clamped === 100 ? '#22c55e' : activeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export default function ModuleTimelineSidebar({
  modules = [],
  selectedModule,
  activeLesson,
  completedLessonIds = [],
  totalLessonsCount = 0,
  isManager = false,
  isLightBg = false,
  onSelectModule,
  onSelectLesson,
  onOpenCreateLesson,
  onOpenEditModule,
  onPromptDeleteModule,
  onOpenEditLesson,
  onPromptDeleteLesson
}) {
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const lineColor = isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.16)';
  const trackColor = isLightBg ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.15)';

  const completedCount = completedLessonIds.length;
  const progressPct = totalLessonsCount > 0
    ? Number(((completedCount / totalLessonsCount) * 100).toFixed(1).replace(/\.0$/, ''))
    : 0;

  return (
    <aside
      data-testid="module-timeline-sidebar"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
        padding: '8px 4px'
      }}
    >
      {/* Bloco de Progresso Geral no Topo */}
      <div
        data-testid="timeline-overall-progress"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <ProgressRing percent={progressPct} size={26} strokeWidth={2.5} trackColor={trackColor} />
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: textColor }}>
            Meu Progresso - {progressPct}%
          </div>
          <div style={{ fontSize: '12px', color: subTextColor, marginTop: '2px' }}>
            {completedCount} de {totalLessonsCount} {totalLessonsCount === 1 ? 'aula' : 'aulas'}
          </div>
        </div>
      </div>

      {/* Lista Vertical de Módulos e Aulas em Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {modules.map((mod) => {
          const isSelected = selectedModule?.id === mod.id;
          const modLessons = mod.lessons || [];
          const modCompleted = modLessons.filter((l) => completedLessonIds.includes(l.id)).length;
          const modPct = modLessons.length > 0 ? Math.round((modCompleted / modLessons.length) * 100) : 0;

          return (
            <div
              key={mod.id}
              data-testid={`module-item-${mod.id}`}
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              {/* Cabeçalho do Módulo */}
              <div
                onClick={() => onSelectModule(mod)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '10px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0 }}>
                  <div style={{ marginTop: '1px' }}>
                    <ProgressRing
                      percent={isSelected && modPct === 0 ? 25 : modPct}
                      size={24}
                      strokeWidth={2.5}
                      trackColor={trackColor}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: isSelected ? 700 : 600,
                        color: isSelected ? textColor : subTextColor,
                        lineHeight: 1.35,
                        transition: 'color 0.15s ease'
                      }}
                    >
                      {mod.title}
                    </div>
                    {!isSelected && (
                      <div style={{ fontSize: '11.5px', color: subTextColor, opacity: 0.8, marginTop: '2px' }}>
                        {modLessons.length} {modLessons.length === 1 ? 'aula' : 'aulas'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Botões de Gestão do Módulo para Admin/SuperAdmin */}
                {isManager && (
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      title="Adicionar Aula neste Módulo"
                      onClick={(e) => onOpenCreateLesson(mod, e)}
                      data-testid={`timeline-add-lesson-btn-${mod.id}`}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#38bdf8',
                        padding: '3px',
                        cursor: 'pointer',
                        display: 'flex'
                      }}
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      type="button"
                      title="Editar Módulo"
                      onClick={(e) => onOpenEditModule(mod, e)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: subTextColor,
                        padding: '3px',
                        cursor: 'pointer',
                        display: 'flex'
                      }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      title="Excluir Módulo"
                      onClick={(e) => onPromptDeleteModule(mod, e)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#f87171',
                        padding: '3px',
                        cursor: 'pointer',
                        display: 'flex'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Aulas do Módulo Ativo (Linha Vertical de Timeline) */}
              {isSelected && (
                <div
                  style={{
                    marginLeft: '11.5px',
                    paddingLeft: '20px',
                    borderLeft: `1.5px solid ${lineColor}`,
                    marginTop: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {modLessons.length === 0 ? (
                    <div style={{ fontSize: '12.5px', color: subTextColor, fontStyle: 'italic', padding: '4px 0' }}>
                      Nenhuma aula cadastrada neste módulo.
                    </div>
                  ) : (
                    modLessons.map((lesson, idx) => {
                      const isActive = activeLesson?.id === lesson.id;
                      const isCompleted = completedLessonIds.includes(lesson.id);
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
                          key={lesson.id}
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

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1, flexWrap: 'wrap' }}>
                            {isCompleted && (
                              <CheckCircle2
                                size={13}
                                color="#22c55e"
                                data-testid={`lesson-completed-icon-${lesson.id}`}
                                style={{ flexShrink: 0 }}
                              />
                            )}
                            {lesson.thumbnail_url ? (
                              <img
                                src={lesson.thumbnail_url}
                                alt=""
                                data-testid={`lesson-thumb-${lesson.id}`}
                                style={{
                                  width: '28px',
                                  height: '18px',
                                  objectFit: 'cover',
                                  borderRadius: '3px',
                                  flexShrink: 0,
                                  opacity: isActive ? 1 : 0.75
                                }}
                              />
                            ) : lesson.content_type === 'text' ? (
                              <FileText size={13} color="#38bdf8" style={{ flexShrink: 0 }} data-testid={`lesson-type-icon-text-${lesson.id}`} />
                            ) : lesson.content_type === 'quiz' ? (
                              <HelpCircle size={13} color="#a855f7" style={{ flexShrink: 0 }} data-testid={`lesson-type-icon-quiz-${lesson.id}`} />
                            ) : null}
                            <span
                              data-testid={`lesson-title-${lesson.id}`}
                              style={{
                                fontSize: '13px',
                                fontWeight: isActive ? 700 : 500,
                                color: itemTextColor,
                                textDecoration: isCompleted ? 'line-through' : 'none',
                                lineHeight: 1.4,
                                transition: 'color 0.15s ease'
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
                                  gap: '3px'
                                }}
                              >
                                <Clock size={9} />
                                <span>Em Breve</span>
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                            {lesson.duration && (
                              <span
                                data-testid={`lesson-duration-${lesson.id}`}
                                style={{ fontSize: '11px', color: subTextColor, opacity: 0.75 }}
                              >
                                {formatLessonDuration(lesson.duration)}
                              </span>
                            )}
                            {isManager && (
                              <>
                                <button
                                  type="button"
                                  title="Editar Aula"
                                  onClick={(e) => onOpenEditLesson(mod, lesson, e)}
                                  data-testid={`edit-lesson-btn-${lesson.id}`}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: subTextColor,
                                    padding: '2px',
                                    cursor: 'pointer',
                                    display: 'flex'
                                  }}
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  type="button"
                                  title="Excluir Aula"
                                  onClick={(e) => onPromptDeleteLesson(mod, lesson, e)}
                                  data-testid={`delete-lesson-btn-${lesson.id}`}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#f87171',
                                    padding: '2px',
                                    cursor: 'pointer',
                                    display: 'flex'
                                  }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
