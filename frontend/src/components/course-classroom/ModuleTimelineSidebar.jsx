import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Image as ImageIcon, ArrowUpDown, Lock, Clock, Trophy } from 'lucide-react';
import { calculateModuleStats, calculateCourseStats } from './lessonUtils';
import CourseSidebarUpsellCard from './CourseSidebarUpsellCard';
import { fetchSidebarUpsellOffer } from '../course-management/courseUpsellApi';
import ProgressRing from './ProgressRing';
import TimelineLessonItem from './TimelineLessonItem';
import { formatUnlockDate } from './ModuleCardLockOverlay';
import SuperAdminLessonAuditFilterBar, { useSuperAdminLessonAudit } from './SuperAdminLessonAuditFilterBar';

export default function ModuleTimelineSidebar({
  courseId,
  sidebarUpsellOffer,
  modules = [],
  selectedModule,
  activeLesson,
  completedLessonIds = [],
  totalLessonsCount = 0,
  isManager = false,
  currentUser = null,
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

  const {
    isSuperAdmin,
    activeFilter,
    setActiveFilter,
    auditByLessonId,
    counts,
    filteredFlatLessons,
    unoptimizedItems,
    matchesFilter,
    refreshAudit
  } = useSuperAdminLessonAudit(courseId, modules, currentUser);

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

  const [expandedModuleIds, setExpandedModuleIds] = useState(() => {
    return selectedModule?.id ? [selectedModule.id] : (modules[0]?.id ? [modules[0].id] : []);
  });

  useEffect(() => {
    if (selectedModule?.id) {
      setExpandedModuleIds((prev) => (prev.includes(selectedModule.id) ? prev : [...prev, selectedModule.id]));
    }
  }, [selectedModule?.id]);

  const handleToggleModule = (mod) => {
    if (mod.is_locked && !isManager) return;

    const isCurrentlyExpanded = expandedModuleIds.includes(mod.id);
    if (isCurrentlyExpanded) {
      setExpandedModuleIds((prev) => prev.filter((id) => id !== mod.id));
    } else {
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

      {/* Painel de Filtros Rápidos de Auditoria (Exclusivo Super Admin) */}
      <SuperAdminLessonAuditFilterBar
        isSuperAdmin={isSuperAdmin}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        counts={counts}
        filteredFlatLessons={filteredFlatLessons}
        unoptimizedItems={unoptimizedItems}
        onRefreshAudit={refreshAudit}
        activeLessonId={activeLesson?.id}
        onSelectLesson={onSelectLesson}
      />

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
          const isLocked = mod.is_locked && !isManager;
          const isSelected = selectedModule?.id === mod.id;
          const modLessons = mod.lessons || [];
          const visibleLessonsWithIdx = modLessons
            .map((lesson, idx) => ({ lesson, idx }))
            .filter(({ lesson }) => matchesFilter(lesson));

          if (isSuperAdmin && activeFilter !== 'all' && visibleLessonsWithIdx.length === 0) {
            return null;
          }

          const isExpanded = !isLocked && ((isSuperAdmin && activeFilter !== 'all') || expandedModuleIds.includes(mod.id));
          const modCompleted = modLessons.filter((l) => completedLessonIds.includes(l.id)).length;
          const modPct = modLessons.length > 0 ? Math.round((modCompleted / modLessons.length) * 100) : 0;

          return (
            <div
              key={mod.id}
              data-testid={`module-item-${mod.id}`}
              style={{ display: 'flex', flexDirection: 'column', opacity: isLocked ? 0.75 : 1 }}
            >
              {/* Cabeçalho do Módulo */}
              <div
                onClick={() => handleToggleModule(mod)}
                data-testid={`module-toggle-btn-${mod.id}`}
                title={isLocked ? (mod.locked_reason === 'elo' ? `Exclusivo para o Elo ${mod.required_tier || 'Superior'}` : 'Módulo bloqueado por agendamento') : (isExpanded ? 'Clique para fechar o módulo' : 'Clique para abrir o módulo')}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '10px',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  padding: '4px 2px',
                  borderRadius: '6px',
                  transition: 'background-color 0.15s ease',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0, flex: 1 }}>
                  <div style={{ marginTop: '1px' }}>
                    {isLocked ? (
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: mod.locked_reason === 'elo' ? `${mod.required_tier_color || '#f59e0b'}22` : 'rgba(234, 179, 8, 0.15)',
                          border: `1px solid ${mod.locked_reason === 'elo' ? (mod.required_tier_color || '#f59e0b') : 'rgba(234, 179, 8, 0.4)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: mod.locked_reason === 'elo' ? (mod.required_tier_color || '#f59e0b') : '#eab308'
                        }}
                        data-testid={`module-locked-icon-${mod.id}`}
                      >
                        {mod.locked_reason === 'elo' ? <Trophy size={12} /> : <Lock size={12} />}
                      </div>
                    ) : (
                      <ProgressRing
                        percent={isSelected && modPct === 0 ? 25 : modPct}
                        size={24}
                        strokeWidth={2.5}
                        trackColor={trackColor}
                      />
                    )}
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
                        {isLocked ? (
                          mod.locked_reason === 'elo' ? (
                            <Trophy size={13} style={{ color: mod.required_tier_color || '#f59e0b' }} />
                          ) : (
                            <Lock size={13} style={{ color: '#eab308' }} />
                          )
                        ) : isExpanded ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                      </span>
                    </div>

                    {isLocked ? (
                      <div
                        style={{
                          fontSize: '11px',
                          color: mod.locked_reason === 'elo' ? (mod.required_tier_color || '#f59e0b') : '#eab308',
                          fontWeight: 600,
                          marginTop: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        data-testid={`module-locked-text-${mod.id}`}
                      >
                        {mod.locked_reason === 'elo' ? '🏆' : '🔒'} {formatUnlockDate(mod.available_at, mod.release_days, mod.locked_reason, mod.required_tier)}
                      </div>
                    ) : (
                      (() => {
                        const modStats = calculateModuleStats(mod);
                        return (
                          <div style={{ fontSize: '11.5px', color: subTextColor, opacity: 0.85, marginTop: '2px' }}>
                            <span>
                              {isSuperAdmin && activeFilter !== 'all'
                                ? `${visibleLessonsWithIdx.length} de ${modLessons.length} aulas filtradas`
                                : `${modLessons.length} ${modLessons.length === 1 ? 'aula' : 'aulas'}`}
                            </span>
                            {modStats.formattedDuration && (
                              <span data-testid={`sidebar-module-duration-${mod.id}`}> • {modStats.formattedDuration}</span>
                            )}
                            {!isExpanded && ' • Fechado (clique para abrir)'}
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>

                {isManager && (
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      title="Adicionar Aula a este Módulo"
                      onClick={(e) => { e.stopPropagation(); onOpenCreateLesson(mod, e); }}
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
                      onClick={(e) => { e.stopPropagation(); onOpenEditModule(mod, e); }}
                      style={{ background: 'transparent', border: 'none', color: subTextColor, padding: '3px', cursor: 'pointer', display: 'flex' }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      title="Excluir Módulo"
                      onClick={(e) => { e.stopPropagation(); onPromptDeleteModule(mod, e); }}
                      style={{ background: 'transparent', border: 'none', color: '#f87171', padding: '3px', cursor: 'pointer', display: 'flex' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Aulas do Módulo Expandido */}
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
                  {visibleLessonsWithIdx.length === 0 ? (
                    <div style={{ fontSize: '12.5px', color: subTextColor, fontStyle: 'italic', padding: '4px 0' }}>
                      Nenhuma aula cadastrada neste módulo.
                    </div>
                  ) : (
                    visibleLessonsWithIdx.map(({ lesson, idx }) => (
                      <TimelineLessonItem
                        key={lesson.id}
                        lesson={lesson}
                        idx={idx}
                        isActive={activeLesson?.id === lesson.id}
                        isCompleted={completedLessonIds.includes(lesson.id)}
                        isManager={isManager}
                        isLightBg={isLightBg}
                        textColor={textColor}
                        subTextColor={subTextColor}
                        lessonAudit={isSuperAdmin ? auditByLessonId[lesson.id] : null}
                        onSelectLesson={onSelectLesson}
                        onOpenEditLesson={(l, e) => onOpenEditLesson(mod, l, e)}
                        onPromptDeleteLesson={(l, e) => onPromptDeleteLesson(mod, l, e)}
                      />
                    ))
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
