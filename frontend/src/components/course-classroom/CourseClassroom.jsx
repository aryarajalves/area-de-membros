import React, { useState } from 'react';
import { ArrowLeft, Plus, FolderPlus, X } from 'lucide-react';
import { useCourseContent } from './useCourseContent';
import LessonPlayer from './LessonPlayer';
import LessonTextViewer from './LessonTextViewer';
import LessonQuizViewer from './LessonQuizViewer';
import NetflixHeroAndModules from './NetflixHeroAndModules';
import ModuleTimelineSidebar from './ModuleTimelineSidebar';
import { ModuleModal, LessonModal, ConfirmDeleteModal } from './ModuleLessonModals';

export default function CourseClassroom({ course: initialCourse, currentUser, onBack }) {
  const isManager = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';
  const {
    course,
    modules,
    activeLesson,
    setActiveLesson,
    loading,
    actionLoading,
    completedLessonIds,
    handleToggleLessonComplete,
    handleSaveModule,
    handleDeleteModule,
    handleSaveLesson,
    handleDeleteLesson,
    uploadLessonVideo,
    uploadLessonThumbnail,
    prevLesson,
    nextLesson,
    totalLessonsCount
  } = useCourseContent(initialCourse.id);

  // Módulo escolhido pelo usuário (inicia fechado/null até clicar em um módulo)
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  // Modais
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);

  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState(null);
  const [targetModuleTitle, setTargetModuleTitle] = useState('');
  const [editingLesson, setEditingLesson] = useState(null);

  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    type: null, // 'module' | 'lesson'
    id: null,
    parentId: null,
    title: '',
    message: ''
  });

  const handleSelectModule = (mod) => {
    setSelectedModuleId(mod.id);
    const modLessons = mod.lessons || [];
    if (modLessons.length > 0) {
      const alreadyInMod = modLessons.some((l) => l.id === activeLesson?.id);
      if (!alreadyInMod) {
        setActiveLesson(modLessons[0]);
      }
    } else {
      setActiveLesson(null);
    }
  };

  const handleStartCourse = () => {
    const firstModWithLessons = modules.find((m) => m.lessons && m.lessons.length > 0) || modules[0];
    if (firstModWithLessons) {
      setSelectedModuleId(firstModWithLessons.id);
      if (firstModWithLessons.lessons?.length > 0) {
        setActiveLesson(firstModWithLessons.lessons[0]);
      }
    }
  };

  const handleSelectLessonAndModule = (lesson) => {
    setActiveLesson(lesson);
    if (lesson?.module_id) {
      setSelectedModuleId(lesson.module_id);
    } else {
      const parentMod = modules.find((m) => m.lessons?.some((l) => l.id === lesson?.id));
      if (parentMod) setSelectedModuleId(parentMod.id);
    }
  };

  // Handlers Módulos
  const handleOpenCreateModule = () => {
    setEditingModule(null);
    setModuleModalOpen(true);
  };

  const handleOpenEditModule = (mod, e) => {
    if (e) e.stopPropagation();
    setEditingModule(mod);
    setModuleModalOpen(true);
  };

  const handlePromptDeleteModule = (mod, e) => {
    if (e) e.stopPropagation();
    setDeleteModalState({
      isOpen: true,
      type: 'module',
      id: mod.id,
      title: `Excluir Módulo: ${mod.title}?`,
      message: 'Ao excluir este módulo, todas as aulas cadastradas nele também serão apagadas permanentemente.'
    });
  };

  // Handlers Aulas
  const handleOpenCreateLesson = (mod, e) => {
    if (e) e.stopPropagation();
    setEditingLesson(null);
    setTargetModuleId(mod.id);
    setTargetModuleTitle(mod.title);
    setLessonModalOpen(true);
  };

  const handleOpenEditLesson = (mod, lesson, e) => {
    if (e) e.stopPropagation();
    setEditingLesson(lesson);
    setTargetModuleId(mod.id);
    setTargetModuleTitle(mod.title);
    setLessonModalOpen(true);
  };

  const handlePromptDeleteLesson = (mod, lesson, e) => {
    if (e) e.stopPropagation();
    setDeleteModalState({
      isOpen: true,
      type: 'lesson',
      id: lesson.id,
      parentId: mod.id,
      title: `Excluir Aula: ${lesson.title}?`,
      message: 'Esta aula será removida permanentemente deste módulo.'
    });
  };

  // Confirmação de exclusão unificada
  const handleConfirmDelete = async () => {
    if (deleteModalState.type === 'module') {
      const ok = await handleDeleteModule(deleteModalState.id);
      if (ok) {
        if (selectedModuleId === deleteModalState.id) setSelectedModuleId(null);
        setDeleteModalState({ isOpen: false });
      }
    } else if (deleteModalState.type === 'lesson') {
      const ok = await handleDeleteLesson(deleteModalState.parentId, deleteModalState.id);
      if (ok) setDeleteModalState({ isOpen: false });
    }
  };

  const selectedModule = modules.find((m) => m.id === selectedModuleId) || null;
  const bgColor = initialCourse?.bg_color || course?.bg_color || '#090d16';
  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes((bgColor || '').toLowerCase());
  const textColor = isLightBg ? '#0f172a' : '#ffffff';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';

  return (
    <div
      className={`classroom-container ${!isLightBg ? 'classroom-dark-theme' : ''}`}
      data-testid="course-classroom-container"
      style={{
        backgroundColor: bgColor,
        '--classroom-modal-bg': isLightBg ? '#ffffff' : (bgColor === '#000000' ? '#0f172a' : bgColor),
        width: '100%',
        maxWidth: '100%',
        margin: 0,
        minHeight: '100vh',
        padding: '24px 36px',
        boxSizing: 'border-box',
        transition: 'background-color 0.3s ease'
      }}
    >
      {/* Top Bar Cinemática com Botão Voltar Estilizado e Ações */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', paddingBottom: '16px', borderBottom: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onBack}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, color: isLightBg ? '#0f172a' : '#f8fafc', backgroundColor: isLightBg ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.08)', border: isLightBg ? '1px solid rgba(15, 23, 42, 0.15)' : '1px solid rgba(255, 255, 255, 0.16)', borderRadius: '999px', backdropFilter: 'blur(10px)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', transition: 'all 0.2s ease' }}
            data-testid="back-to-courses-btn"
          >
            <ArrowLeft size={16} color={isLightBg ? '#0f172a' : '#eab308'} />
            <span>Voltar aos Cursos</span>
          </button>

          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: textColor, letterSpacing: '-0.01em' }}>
              {course?.title || initialCourse.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px' }}>
              <span style={{ fontSize: '12.5px', color: subTextColor }}>
                {modules.length} Módulo(s) • {totalLessonsCount} Aula(s)
              </span>
            </div>
          </div>
        </div>

        {isManager && (
          <button
            type="button"
            className="primary-btn"
            onClick={handleOpenCreateModule}
            data-testid="create-module-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', fontSize: '13px' }}
          >
            <FolderPlus size={16} />
            <span>Novo Módulo</span>
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          Carregando conteúdo do curso...
        </div>
      ) : (
        <>
          <NetflixHeroAndModules
            course={course || initialCourse}
            modules={modules}
            selectedModuleId={selectedModuleId}
            activeLesson={activeLesson}
            completedLessonIds={completedLessonIds}
            isManager={isManager}
            bgColor={bgColor}
            onSelectModule={handleSelectModule}
            onStartCourse={handleStartCourse}
            onOpenCreateModule={handleOpenCreateModule}
            onOpenEditModule={handleOpenEditModule}
            onPromptDeleteModule={handlePromptDeleteModule}
            onOpenCreateLesson={handleOpenCreateLesson}
          />

          {/* Seção Inferior: Aparece quando o usuário aperta em um módulo escolhido */}
          {selectedModule && (
            <div
              style={{
                marginTop: '32px',
                paddingTop: '28px',
                borderTop: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)'
              }}
              data-testid="selected-module-section"
            >
              {/* Barra Superior Rápida da Aula / Módulo Selecionado */}
              <div
                style={{
                  maxWidth: '1080px',
                  margin: '0 auto 18px auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: '#eab308',
                      color: '#0f172a',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      textTransform: 'uppercase'
                    }}
                  >
                    Módulo em Reprodução
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: textColor }}>
                    {selectedModule.title}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isManager && (
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={(e) => handleOpenCreateLesson(selectedModule, e)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '12.5px' }}
                    >
                      <Plus size={14} />
                      <span>Adicionar Aula</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedModuleId(null)}
                    title="Fechar visualização de aula"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: subTextColor,
                      borderRadius: '8px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px'
                    }}
                  >
                    <X size={14} />
                    <span>Fechar</span>
                  </button>
                </div>
              </div>

              {/* Visualizador da Aula: Texto, Quiz ou Vídeo */}
              {activeLesson?.content_type === 'text' ? (
                <LessonTextViewer
                  lesson={activeLesson}
                  courseTitle={course?.title || initialCourse.title}
                  moduleTitle={selectedModule.title}
                  courseId={course?.id || initialCourse.id}
                  moduleId={selectedModule.id}
                  currentUser={currentUser}
                  prevLesson={prevLesson}
                  nextLesson={nextLesson}
                  onSelectLesson={handleSelectLessonAndModule}
                  isCompleted={completedLessonIds?.includes(activeLesson?.id)}
                  onToggleComplete={handleToggleLessonComplete}
                  isLightBg={isLightBg}
                  onCloseModule={() => setSelectedModuleId(null)}
                  onEditLesson={(lessonToEdit) => handleOpenEditLesson(selectedModule, lessonToEdit)}
                  rightSidebar={
                    <ModuleTimelineSidebar
                      modules={modules}
                      selectedModule={selectedModule}
                      activeLesson={activeLesson}
                      completedLessonIds={completedLessonIds}
                      totalLessonsCount={totalLessonsCount}
                      isManager={isManager}
                      isLightBg={isLightBg}
                      onSelectModule={handleSelectModule}
                      onSelectLesson={setActiveLesson}
                      onOpenCreateLesson={handleOpenCreateLesson}
                      onOpenEditModule={handleOpenEditModule}
                      onPromptDeleteModule={handlePromptDeleteModule}
                      onOpenEditLesson={handleOpenEditLesson}
                      onPromptDeleteLesson={handlePromptDeleteLesson}
                    />
                  }
                />
              ) : activeLesson?.content_type === 'quiz' ? (
                <LessonQuizViewer
                  lesson={activeLesson}
                  courseTitle={course?.title || initialCourse.title}
                  moduleTitle={selectedModule.title}
                  courseId={course?.id || initialCourse.id}
                  moduleId={selectedModule.id}
                  currentUser={currentUser}
                  prevLesson={prevLesson}
                  nextLesson={nextLesson}
                  onSelectLesson={handleSelectLessonAndModule}
                  isCompleted={completedLessonIds?.includes(activeLesson?.id)}
                  onToggleComplete={handleToggleLessonComplete}
                  isLightBg={isLightBg}
                  onCloseModule={() => setSelectedModuleId(null)}
                  onEditLesson={(lessonToEdit) => handleOpenEditLesson(selectedModule, lessonToEdit)}
                  rightSidebar={
                    <ModuleTimelineSidebar
                      modules={modules}
                      selectedModule={selectedModule}
                      activeLesson={activeLesson}
                      completedLessonIds={completedLessonIds}
                      totalLessonsCount={totalLessonsCount}
                      isManager={isManager}
                      isLightBg={isLightBg}
                      onSelectModule={handleSelectModule}
                      onSelectLesson={setActiveLesson}
                      onOpenCreateLesson={handleOpenCreateLesson}
                      onOpenEditModule={handleOpenEditModule}
                      onPromptDeleteModule={handlePromptDeleteModule}
                      onOpenEditLesson={handleOpenEditLesson}
                      onPromptDeleteLesson={handlePromptDeleteLesson}
                    />
                  }
                />
              ) : (
                <LessonPlayer
                  lesson={activeLesson}
                  courseTitle={course?.title || initialCourse.title}
                  moduleTitle={selectedModule.title}
                  courseId={course?.id || initialCourse.id}
                  moduleId={selectedModule.id}
                  currentUser={currentUser}
                  prevLesson={prevLesson}
                  nextLesson={nextLesson}
                  onSelectLesson={handleSelectLessonAndModule}
                  isCompleted={completedLessonIds?.includes(activeLesson?.id)}
                  onToggleComplete={handleToggleLessonComplete}
                  isLightBg={isLightBg}
                  onCloseModule={() => setSelectedModuleId(null)}
                  onEditLesson={(lessonToEdit) => handleOpenEditLesson(selectedModule, lessonToEdit)}
                  rightSidebar={
                    <ModuleTimelineSidebar
                      modules={modules}
                      selectedModule={selectedModule}
                      activeLesson={activeLesson}
                      completedLessonIds={completedLessonIds}
                      totalLessonsCount={totalLessonsCount}
                      isManager={isManager}
                      isLightBg={isLightBg}
                      onSelectModule={handleSelectModule}
                      onSelectLesson={setActiveLesson}
                      onOpenCreateLesson={handleOpenCreateLesson}
                      onOpenEditModule={handleOpenEditModule}
                      onPromptDeleteModule={handlePromptDeleteModule}
                      onOpenEditLesson={handleOpenEditLesson}
                      onPromptDeleteLesson={handlePromptDeleteLesson}
                    />
                  }
                />
              )}
            </div>
          )}
        </>
      )}

      {/* Modais de Módulo e Aula */}
      <ModuleModal
        isOpen={moduleModalOpen}
        onClose={() => setModuleModalOpen(false)}
        editingModule={editingModule}
        loading={actionLoading}
        bgColor={bgColor}
        onUploadThumbnail={uploadLessonThumbnail}
        onSave={async (payload) => {
          const ok = await handleSaveModule(editingModule?.id, payload);
          if (ok) setModuleModalOpen(false);
        }}
      />

      <LessonModal
        isOpen={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        editingLesson={editingLesson}
        moduleTitle={targetModuleTitle}
        courseId={course?.id || initialCourse.id}
        loading={actionLoading}
        bgColor={bgColor}
        onUploadVideo={uploadLessonVideo}
        onUploadThumbnail={uploadLessonThumbnail}
        onSave={async (payload) => {
          const ok = await handleSaveLesson(targetModuleId, editingLesson?.id, payload);
          if (ok) {
            setSelectedModuleId(targetModuleId);
            setLessonModalOpen(false);
          }
        }}
      />

      <ConfirmDeleteModal
        isOpen={deleteModalState.isOpen}
        title={deleteModalState.title}
        message={deleteModalState.message}
        loading={actionLoading}
        bgColor={bgColor}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalState({ isOpen: false })}
      />
    </div>
  );
}
