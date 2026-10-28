import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, Clock, FileText, HelpCircle, ChevronDown, ChevronRight, Image as ImageIcon, ArrowUpDown } from 'lucide-react';
import { formatLessonDuration, isLessonComingSoon, calculateModuleStats, calculateCourseStats } from './lessonUtils';
import CourseSidebarUpsellCard from './CourseSidebarUpsellCard';
import { fetchSidebarUpsellOffer } from '../course-management/courseUpsellApi';
import ProgressRing from './ProgressRing';

export default function ModuleTimelineSidebar({
  courseId,
  sidebarUpsellOffer,
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
  onPromptDeleteLesson,
  onOpenBatchThumbnail,
  onOpenBatchOrder
}) {
  const [sidebarOffer, setSidebarOffer] = useState(sidebarUpsellOffer || null);

  useEffect(() => {
    if (sidebarUpsellOffer !== undefined) {
      setSidebarOffer(sidebarUpsellOffer);
      return;
    }
    if (!courseId) return;
    let isMounted = true;
    fetchSidebarUpsellOffer(courseId)
      .then((data) => {
        if (isMounted && data?.has_offer && data?.offer) {
          setSidebarOffer({ ...data.offer, target_action_url: data.target_action_url });
        } else if (isMounted) {
          setSidebarOffer(null);
        }
      })
      .catch(() => {
        if (isMounted) setSidebarOffer(null);
      });
    return () => {
      isMounted = false;
    };
  }, [courseId, sidebarUpsellOffer]);

  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const lineColor = isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.16)';
  const trackColor = isLightBg ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.15)';

  const completedCount = completedLessonIds.length;
  const progressPct = totalLessonsCount > 0
    ? Number(((completedCount / totalLessonsCount) * 100).toFixed(1).replace(/\.0$/, ''))
    : 0;

  // Controle de módulos expandidos/fechados (accordion/toggle)
  const [expandedModuleIds, setExpandedModuleIds] = useState(() => {
    return selectedModule?.id ? [selectedModule.id] : [];
  });

  // Mantém sincronizado se o módulo selecionado mudar externamente
  useEffect(() => {
    if (selectedModule?.id) {
      setExpandedModuleIds((prev) => (prev.includes(selectedModule.id) ? prev : [...prev, selectedModule.id]));
    }
  }, [selectedModule?.id]);

  const handleToggleModule = (mod) => {
    const isCurrentlyExpanded = expandedModuleIds.includes(mod.id);
    if (isCurrentlyExpanded) {
      // Fecha o módulo
      setExpandedModuleIds((prev) => prev.filter((id) => id !== mod.id));
    } else {
      // Abre o módulo e notifica seleção
      setExpandedModuleIds((prev) => [...prev, mod.id]);
      if (onSelectModule) {
        onSelectModule(mod);
      }
    }
  };

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
          {(() => {
            const courseStats = calculateCourseStats(modules);
            return (
              <div style={{ fontSize: '12px', color: subTextColor, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                <span>{completedCount} de {totalLessonsCount} {totalLessonsCount === 1 ? 'aula' : 'aulas'}</span>
                {courseStats.formattedDuration && (
                  <>
                    <span>•</span>
                    <span data-testid="sidebar-course-duration" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={11} style={{ flexShrink: 0 }} /> {courseStats.formattedDuration} total
                    </span>
                  </>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Card Facultativo de Próximo Nível (Oferta no Sidebar) */}
      {sidebarOffer && (
        <CourseSidebarUpsellCard
          offer={sidebarOffer}
          courseId={courseId}
          isLightBg={isLightBg}
        />
      )}

      {/* Lista Vertical de Módulos e Aulas em Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {modules.map((mod) => {
          const isSelected = selectedModule?.id === mod.id;
          const isExpanded = expandedModuleIds.includes(mod.id);
          const modLessons = mod.lessons || [];
          const modCompleted = modLessons.filter((l) => completedLessonIds.includes(l.id)).length;
          const modPct = modLessons.length > 0 ? Math.round((modCompleted / modLessons.length) * 100) : 0;

          return (
            <div
              key={mod.id}
              data-testid={`module-item-${mod.id}`}
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              {/* Cabeçalho do Módulo (Clicável para Fechar / Abrir) */}
              <div
                onClick={() => handleToggleModule(mod)}
                data-testid={`module-toggle-btn-${mod.id}`}
                title={isExpanded ? 'Clique para fechar o módulo' : 'Clique para abrir o módulo'}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '4px 2px',
                  borderRadius: '6px',
                  transition: 'background-color 0.15s ease',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0, flex: 1 }}>
                  <div style={{ marginTop: '1px' }}>
                    <ProgressRing
                      percent={isSelected && modPct === 0 ? 25 : modPct}
                      size={24}
                      strokeWidth={2.5}
                      trackColor={trackColor}
                    />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        fontSize: '14px',
                        fontWeight: isSelected ? 700 : 600,
                        color: isSelected ? textColor : subTextColor,
                        lineHeight: 1.35,
                        transition: 'color 0.15s ease'
                      }}
                    >
                      <span style={{ wordBreak: 'break-word' }}>{mod.title}</span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isSelected ? (isLightBg ? '#0284c7' : '#38bdf8') : subTextColor,
                          padding: '2px',
                          borderRadius: '4px',
                          backgroundColor: isLightBg ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                          flexShrink: 0,
                          transition: 'all 0.2s ease'
                        }}
                        data-testid={`module-chevron-${mod.id}`}
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                    </div>
                    {(() => {
                      const modStats = calculateModuleStats(mod);
                      return (
                        <div style={{ fontSize: '11.5px', color: subTextColor, opacity: 0.85, marginTop: '2px' }}>
                          <span>{modLessons.length} {modLessons.length === 1 ? 'aula' : 'aulas'}</span>
                          {modStats.formattedDuration && (
                            <span data-testid={`sidebar-module-duration-${mod.id}`}> • {modStats.formattedDuration}</span>
                          )}
                          {!isExpanded && ' • Fechado (clique para abrir)'}
                        </div>
                      );
                    })()}
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
                      style={{ background: 'transparent', border: 'none', color: '#38bdf8', padding: '3px', cursor: 'pointer', display: 'flex' }}
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      type="button"
                      title="Trocar capa das aulas deste módulo em lote"
                      onClick={(e) => { e.stopPropagation(); onOpenBatchThumbnail?.(mod); }}
                      data-testid={`timeline-batch-thumbnail-btn-${mod.id}`}
                      style={{ background: 'transparent', border: 'none', color: '#a855f7', padding: '3px', cursor: 'pointer', display: 'flex' }}
                    >
                      <ImageIcon size={13} />
                    </button>
                    <button
                      type="button"
                      title="Reordenar aulas deste módulo em lote"
                      onClick={(e) => { e.stopPropagation(); onOpenBatchOrder?.(mod); }}
                      data-testid={`timeline-batch-order-btn-${mod.id}`}
                      style={{ background: 'transparent', border: 'none', color: '#06b6d4', padding: '3px', cursor: 'pointer', display: 'flex' }}
                    >
                      <ArrowUpDown size={13} />
                    </button>
                    <button
                      type="button"
                      title="Editar Módulo"
                      onClick={(e) => onOpenEditModule(mod, e)}
                      style={{ background: 'transparent', border: 'none', color: subTextColor, padding: '3px', cursor: 'pointer', display: 'flex' }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      title="Excluir Módulo"
                      onClick={(e) => onPromptDeleteModule(mod, e)}
                      style={{ background: 'transparent', border: 'none', color: '#f87171', padding: '3px', cursor: 'pointer', display: 'flex' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Aulas do Módulo Expandido (Linha Vertical de Timeline) */}
              {isExpanded && (
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

                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', minWidth: 0, flex: 1 }}>
                            {isCompleted && (
                              <CheckCircle2
                                size={13}
                                color="#22c55e"
                                data-testid={`lesson-completed-icon-${lesson.id}`}
                                style={{ flexShrink: 0, marginTop: '2px' }}
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
