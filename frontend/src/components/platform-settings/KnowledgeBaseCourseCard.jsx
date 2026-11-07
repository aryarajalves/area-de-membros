import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  RefreshCw,
  Loader2,
  Sparkles,
  BookOpen
} from 'lucide-react';

export default function KnowledgeBaseCourseCard({
  course,
  selectedLessonIds = [],
  onToggleLesson,
  onToggleModule,
  onToggleCourse,
  indexingLessonId,
  onIndexSingleLesson,
  onOpenChunksModal,
  onGenerateQa,
  generatingQaLessonId,
  isLightBg = false,
  textColor = '#f8fafc',
  subTextColor = '#94a3b8',
  cardBg = 'rgba(255, 255, 255, 0.04)',
  cardBorder = '1px solid rgba(255, 255, 255, 0.1)',
  isExpanded = true,
  onToggleExpand
}) {
  const [expandedModules, setExpandedModules] = useState(() => {
    // Todos os módulos abertos por padrão
    const init = {};
    (course.modules || []).forEach((m) => {
      init[m.module_id] = true;
    });
    return init;
  });

  const toggleModuleExpand = (modId) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  // Coleta todas as aulas do curso
  const allCourseLessons = (course.modules || []).flatMap((m) => m.lessons || []);
  const allCourseLessonIds = allCourseLessons.map((l) => l.lesson_id);
  const isCourseAllSelected =
    allCourseLessonIds.length > 0 &&
    allCourseLessonIds.every((id) => selectedLessonIds.includes(id));
  const isCoursePartiallySelected =
    allCourseLessonIds.some((id) => selectedLessonIds.includes(id)) && !isCourseAllSelected;

  const pct =
    course.total_lessons > 0
      ? Math.round((course.indexed_lessons / course.total_lessons) * 100)
      : 0;

  return (
    <div
      style={{
        borderRadius: '12px',
        backgroundColor: cardBg,
        border: cardBorder,
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}
      data-testid={`course-card-${course.course_id}`}
    >
      {/* Cabeçalho do Curso */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)',
          borderBottom: isExpanded ? cardBorder : 'none',
          cursor: 'pointer'
        }}
        onClick={onToggleExpand}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          {/* Checkbox do Curso */}
          <div onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isCourseAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isCoursePartiallySelected;
              }}
              onChange={() => onToggleCourse(allCourseLessons, isCourseAllSelected)}
              data-testid={`checkbox-course-${course.course_id}`}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0d9488' }}
              title="Selecionar todas as aulas deste curso"
            />
          </div>

          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0d9488 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0
            }}
          >
            {isExpanded ? <FolderOpen size={18} /> : <Folder size={18} />}
          </div>

          <div style={{ minWidth: 0 }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {course.course_title}
            </h4>
            <span style={{ fontSize: '12px', color: subTextColor }}>
              {course.total_lessons} aulas • {course.modules?.length || 0} módulos • {course.total_chunks} chunks no RAG
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Barra de Progresso RAG */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: pct === 100 ? '#10b981' : '#0d9488' }}>
              {course.indexed_lessons} / {course.total_lessons} aulas ({pct}%)
            </span>
            <div style={{ width: '110px', height: '5px', borderRadius: '999px', backgroundColor: isLightBg ? '#e2e8f0' : 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct === 100 ? '#10b981' : '#0d9488', borderRadius: '999px', transition: 'width 0.3s ease' }} />
            </div>
          </div>

          <div style={{ color: subTextColor, padding: '4px' }}>
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
        </div>
      </div>

      {/* Corpo com Módulos e Aulas */}
      {isExpanded && (
        <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(course.modules || []).map((mod) => {
            const modLessons = mod.lessons || [];
            const modLessonIds = modLessons.map((l) => l.lesson_id);
            const isModAllSelected =
              modLessonIds.length > 0 &&
              modLessonIds.every((id) => selectedLessonIds.includes(id));
            const isModPartiallySelected =
              modLessonIds.some((id) => selectedLessonIds.includes(id)) && !isModAllSelected;
            const isModExpanded = expandedModules[mod.module_id] ?? true;

            return (
              <div
                key={mod.module_id}
                style={{
                  borderRadius: '10px',
                  border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.07)',
                  backgroundColor: isLightBg ? '#ffffff' : 'rgba(0, 0, 0, 0.2)',
                  overflow: 'hidden'
                }}
                data-testid={`module-accordion-${mod.module_id}`}
              >
                {/* Cabeçalho do Módulo */}
                <div
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer',
                    borderBottom: isModExpanded ? (isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.05)') : 'none'
                  }}
                  onClick={() => toggleModuleExpand(mod.module_id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isModAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isModPartiallySelected;
                        }}
                        onChange={() => onToggleModule(modLessons, isModAllSelected)}
                        data-testid={`checkbox-module-${mod.module_id}`}
                        style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#0d9488' }}
                        title="Selecionar todas as aulas deste módulo"
                      />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: textColor }}>
                      {mod.module_title}
                    </span>
                    <span style={{ fontSize: '11.5px', color: subTextColor }}>
                      ({modLessons.length} {modLessons.length === 1 ? 'aula' : 'aulas'})
                    </span>
                  </div>

                  <div style={{ color: subTextColor }}>
                    {isModExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </div>
                </div>

                {/* Lista de Aulas do Módulo */}
                {isModExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {modLessons.map((l) => {
                      const isSelected = selectedLessonIds.includes(l.lesson_id);
                      return (
                        <div
                          key={l.lesson_id}
                          style={{
                            padding: '11px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '10px',
                            borderBottom: isLightBg ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.04)',
                            backgroundColor: isSelected
                              ? (isLightBg ? 'rgba(13, 148, 136, 0.06)' : 'rgba(13, 148, 136, 0.1)')
                              : 'transparent'
                          }}
                          data-testid={`lesson-row-${l.lesson_id}`}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => onToggleLesson(l.lesson_id)}
                              data-testid={`checkbox-lesson-${l.lesson_id}`}
                              style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#0d9488' }}
                            />
                            <div style={{ minWidth: 0 }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: textColor, display: 'block' }}>
                                {l.lesson_title}
                              </span>
                              <span style={{ fontSize: '11px', color: subTextColor, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={11} /> {l.duration_str || '00:00'}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* Badges de Status */}
                            {l.is_indexed ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: '#10b981',
                                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                    padding: '3px 7px',
                                    borderRadius: '6px'
                                  }}
                                  title={`${l.chunks_count} fragmentos da transcrição`}
                                >
                                  <CheckCircle2 size={11} />
                                  {l.chunks_count} chunks
                                </span>
                                {l.qa_count > 0 ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      color: '#a855f7',
                                      backgroundColor: 'rgba(168, 85, 247, 0.12)',
                                      padding: '3px 7px',
                                      borderRadius: '6px'
                                    }}
                                    title={`${l.qa_count} perguntas e respostas geradas pela IA`}
                                  >
                                    <Sparkles size={11} />
                                    {l.qa_count} Q&A
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      fontSize: '10.5px',
                                      fontWeight: 600,
                                      color: '#f59e0b',
                                      backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                      padding: '3px 6px',
                                      borderRadius: '6px'
                                    }}
                                    title="Esta aula ainda não possui perguntas e respostas pedagógicas da IA"
                                  >
                                    Sem Q&A
                                  </span>
                                )}
                              </div>
                            ) : l.has_transcription ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#f59e0b',
                                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                  padding: '3px 8px',
                                  borderRadius: '6px'
                                }}
                              >
                                <AlertCircle size={12} />
                                Pendente RAG
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', color: subTextColor }}>Sem transcrição</span>
                            )}

                            {/* Ação Ver Chunks */}
                            {l.is_indexed && (
                              <button
                                type="button"
                                onClick={() => onOpenChunksModal(l)}
                                data-testid={`btn-view-chunks-${l.lesson_id}`}
                                style={{
                                  padding: '5px 9px',
                                  borderRadius: '6px',
                                  backgroundColor: 'transparent',
                                  border: cardBorder,
                                  color: subTextColor,
                                  fontSize: '11.5px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Eye size={12} />
                                <span>Ver Chunks</span>
                              </button>
                            )}

                            {/* Ação Dedicada: Gerar / Re-gerar 5 Perguntas e Respostas */}
                            {l.has_transcription && onGenerateQa && (
                              <button
                                type="button"
                                disabled={generatingQaLessonId === l.lesson_id}
                                onClick={() => onGenerateQa(l.lesson_id)}
                                data-testid={`btn-generate-qa-${l.lesson_id}`}
                                title={l.qa_count > 0 ? 'Re-gerar 5 perguntas e respostas pedagógicas via IA' : 'Gerar 5 perguntas e respostas pedagógicas via IA'}
                                style={{
                                  padding: '5px 9px',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(168, 85, 247, 0.12)',
                                  border: '1px solid rgba(168, 85, 247, 0.35)',
                                  color: '#c084fc',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  cursor: generatingQaLessonId === l.lesson_id ? 'not-allowed' : 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                {generatingQaLessonId === l.lesson_id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Sparkles size={12} />
                                )}
                                <span>{generatingQaLessonId === l.lesson_id ? 'Gerando...' : l.qa_count > 0 ? 'Re-gerar Q&A' : '⚡ Gerar 5 Q&A'}</span>
                              </button>
                            )}

                            {/* Ação Indexar / Re-indexar */}
                            {l.has_transcription && (
                              <button
                                type="button"
                                disabled={indexingLessonId === l.lesson_id}
                                onClick={() => onIndexSingleLesson(l.lesson_id)}
                                data-testid={`btn-reindex-${l.lesson_id}`}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  backgroundColor: '#0d9488',
                                  color: '#fff',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  border: 'none',
                                  cursor: indexingLessonId === l.lesson_id ? 'not-allowed' : 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                {indexingLessonId === l.lesson_id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <RefreshCw size={12} />
                                )}
                                <span>{l.is_indexed ? 'Re-indexar' : 'Indexar'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
