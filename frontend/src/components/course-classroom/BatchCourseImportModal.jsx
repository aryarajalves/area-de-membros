import React, { useState, useRef, useEffect } from 'react';
import { FolderUp, Folder, Sparkles, X, Play, Loader2, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { parseFilesToModules, getFilesFromDataTransferItems, relinkModuleExistingTarget } from '../../services/batchImportService';
import BatchModuleItem from './BatchModuleItem';
import BatchDropzoneArea from './BatchDropzoneArea';
import BatchToolbar from './BatchToolbar';
import { useBatchImportProcess } from './useBatchImportProcess';

export default function BatchCourseImportModal({
  isOpen, onClose, courseId, existingModules = [], onImportCompleted
}) {
  const { addToast } = useToast();
  const folderInputRef = useRef(null);

  const [modulesList, setModulesList] = useState([]);
  const [folderName, setFolderName] = useState('');
  const [expandedModuleIds, setExpandedModuleIds] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Hook isolado que gerencia fila de uploads, capas, criação, IA e reimportações
  const {
    isImporting,
    currentProcessingTitle,
    overallProgress,
    handleStartBatchImport,
    handleCancelQueue,
    handleRetryLesson,
    handleRetryModule,
    handleRetryFailedLessons
  } = useBatchImportProcess({
    courseId,
    modulesList,
    setModulesList,
    onImportCompleted,
    addToast
  });

  // Limpeza de estado para que sempre abra vazio ao fechar/reabrir
  const resetBatchState = () => {
    setModulesList([]);
    setFolderName('');
    setExpandedModuleIds({});
    setIsDragging(false);
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const handleClose = () => {
    if (isImporting) handleCancelQueue();
    resetBatchState();
    onClose?.();
  };

  useEffect(() => {
    if (!isOpen) resetBatchState();
  }, [isOpen]);

  if (!isOpen) return null;

  // Totalizadores
  const totalLessonsCount = modulesList.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  const selectedLessonsCount = modulesList.reduce(
    (acc, m) => acc + (m.lessons?.filter((l) => l.selected).length || 0),
    0
  );
  const failedLessonsCount = modulesList.reduce(
    (acc, m) => acc + (m.lessons?.filter((l) => l.status === 'error').length || 0),
    0
  );

  // Processamento unificado dos arquivos da pasta
  const processFilesList = (files) => {
    const parsed = parseFilesToModules(files, existingModules);
    if (parsed.length === 0) {
      addToast('Nenhum vídeo (.mp4, .webm, .mov, .mkv) foi encontrado na pasta.', 'error');
      return;
    }

    const firstRel = files[0].webkitRelativePath || files[0].name || '';
    const rootName = firstRel.split('/')[0] || 'Pasta Selecionada';
    setFolderName(rootName);
    setModulesList(parsed);

    const initialExpanded = {};
    parsed.forEach((m) => {
      initialExpanded[m.id] = true;
    });
    setExpandedModuleIds(initialExpanded);

    addToast(`${parsed.length} módulo(s) e ${files.length} arquivo(s) analisados com sucesso!`, 'success');
  };

  const handleFolderSelect = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFilesList(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isImporting) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isImporting) return;
    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;
    try {
      const files = await getFilesFromDataTransferItems(items);
      if (!files || files.length === 0) {
        addToast('Nenhum arquivo de vídeo foi encontrado na pasta arrastada.', 'error');
        return;
      }
      processFilesList(files);
    } catch (err) {
      addToast(`Erro ao ler arquivos da pasta: ${err.message}`, 'error');
    }
  };

  const handleToggleModule = (moduleId, shouldSelect) => {
    if (isImporting) return;
    setModulesList((prev) =>
      prev.map((mod) => (mod.id !== moduleId ? mod : {
        ...mod,
        selected: shouldSelect,
        lessons: mod.lessons.map((l) => ({ ...l, selected: shouldSelect }))
      }))
    );
  };

  const handleToggleLesson = (moduleId, lessonId) => {
    if (isImporting) return;
    setModulesList((prev) =>
      prev.map((mod) => {
        if (mod.id !== moduleId) return mod;
        const updatedLessons = mod.lessons.map((l) => (l.id === lessonId ? { ...l, selected: !l.selected } : l));
        return { ...mod, selected: updatedLessons.some((l) => l.selected), lessons: updatedLessons };
      })
    );
  };

  const handleSetAllSelected = (selectState) => {
    if (isImporting) return;
    setModulesList((prev) =>
      prev.map((mod) => ({
        ...mod,
        selected: selectState,
        lessons: mod.lessons.map((l) => ({ ...l, selected: selectState }))
      }))
    );
  };

  const handleExpandAll = (expand) => {
    const nextState = {};
    modulesList.forEach((m) => { nextState[m.id] = expand; });
    setExpandedModuleIds(nextState);
  };

  const handleToggleAccordion = (moduleId) =>
    setExpandedModuleIds((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));

  // Handlers para anexar e remover capa de módulo
  const handleSetModuleCover = (moduleId, file, previewUrl) => {
    setModulesList((prev) =>
      prev.map((mod) => (mod.id === moduleId ? { ...mod, coverFile: file, coverPreviewUrl: previewUrl } : mod))
    );
  };

  const handleRemoveModuleCover = (moduleId) => {
    setModulesList((prev) =>
      prev.map((mod) => (mod.id === moduleId ? { ...mod, coverFile: null, coverPreviewUrl: null } : mod))
    );
  };

  // Handlers para anexar e remover capa de aula
  const handleSetLessonCover = (moduleId, lessonId, file, previewUrl) => {
    setModulesList((prev) =>
      prev.map((mod) => {
        if (mod.id !== moduleId) return mod;
        return {
          ...mod,
          lessons: mod.lessons.map((l) =>
            l.id === lessonId ? { ...l, coverFile: file, coverPreviewUrl: previewUrl } : l
          )
        };
      })
    );
  };

  const handleRemoveLessonCover = (moduleId, lessonId) => {
    setModulesList((prev) =>
      prev.map((mod) => {
        if (mod.id !== moduleId) return mod;
        return {
          ...mod,
          lessons: mod.lessons.map((l) =>
            l.id === lessonId ? { ...l, coverFile: null, coverPreviewUrl: null } : l
          )
        };
      })
    );
  };

  // Aplica capa para todas as aulas de todos os módulos
  const handleApplyCoverToAllLessons = (file, previewUrl) => {
    setModulesList((prev) =>
      prev.map((mod) => ({
        ...mod,
        lessons: mod.lessons.map((l) => ({ ...l, coverFile: file, coverPreviewUrl: previewUrl }))
      }))
    );
    addToast('Capa aplicada a todas as aulas de todos os módulos!', 'success');
  };

  // Aplica capa para todas as aulas de um módulo específico
  const handleApplyCoverToModuleLessons = (moduleId, file, previewUrl) => {
    setModulesList((prev) =>
      prev.map((mod) => (mod.id !== moduleId ? mod : {
        ...mod,
        lessons: mod.lessons.map((l) => ({ ...l, coverFile: file, coverPreviewUrl: previewUrl }))
      }))
    );
    addToast('Capa aplicada para todas as aulas deste módulo!', 'success');
  };

  // Replica a capa de uma aula específica para todas as outras aulas
  const handleReplicateLessonCover = (sourceLesson) => {
    if (!sourceLesson?.coverFile || !sourceLesson?.coverPreviewUrl) return;
    setModulesList((prev) =>
      prev.map((mod) => ({
        ...mod,
        lessons: mod.lessons.map((l) => ({ ...l, coverFile: sourceLesson.coverFile, coverPreviewUrl: sourceLesson.coverPreviewUrl }))
      }))
    );
    addToast('Capa replicada com sucesso para todas as aulas!', 'success');
  };

  const handleUpdateModuleOrder = (moduleId, newOrder) => {
    setModulesList((prev) =>
      prev.map((mod) => (mod.id === moduleId ? { ...mod, orderIndex: newOrder } : mod))
    );
  };

  const handleLinkExistingModule = (moduleId, targetExistingModuleId) => {
    const targetModule = targetExistingModuleId
      ? existingModules.find((em) => em.id === targetExistingModuleId)
      : null;
    setModulesList((prev) =>
      prev.map((mod) => (mod.id === moduleId ? relinkModuleExistingTarget(mod, targetModule) : mod))
    );
    if (targetModule) {
      addToast(`Módulo vinculado a "${targetModule.title}"`, 'info');
    } else {
      addToast('Módulo configurado para criar um novo no curso', 'info');
    }
  };

  return (
    <div
      data-testid="batch-import-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
    >
      <div
        data-testid="batch-import-modal"
        style={{
          width: '100%',
          maxWidth: isMaximized ? '97vw' : '960px',
          height: isMaximized ? '96vh' : '90vh',
          maxHeight: isMaximized ? '96vh' : '90vh',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8fafc',
          transition: 'all 0.2s ease-in-out'
        }}
      >
        {/* Cabeçalho */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderUp size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Importação em Lote de Aulas</span>
                <span style={{ fontSize: '11px', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '2px 8px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={11} /> IA Automática
                </span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#94a3b8' }}>
                Arraste a pasta do computador ou selecione para criar módulos, aulas e transcrever automaticamente com IA.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              data-testid="toggle-maximize-batch-modal-btn"
              title={isMaximized ? 'Restaurar tamanho' : 'Maximizar tela cheia'}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s ease' }}
            >
              {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            <button
              type="button"
              onClick={handleClose}
              disabled={isImporting}
              data-testid="close-batch-modal-btn"
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: isImporting ? 'not-allowed' : 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isImporting ? 0.4 : 1 }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Barra de Ações Superior */}
        <BatchToolbar
          folderInputRef={folderInputRef}
          onFolderSelect={handleFolderSelect}
          folderName={folderName}
          modulesList={modulesList}
          isImporting={isImporting}
          onExpandAll={handleExpandAll}
          onSetAllSelected={handleSetAllSelected}
          onApplyCoverToAllLessons={handleApplyCoverToAllLessons}
        />

        {/* Barra de Progresso Global */}
        {isImporting && (
          <div style={{ flexShrink: 0, padding: '12px 24px', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderBottom: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{currentProcessingTitle || 'Processando aulas em lote...'}</span>
              <span style={{ color: '#818cf8', fontWeight: 700 }}>
                {overallProgress.current} de {overallProgress.total} aulas ({Math.round((overallProgress.current / (overallProgress.total || 1)) * 100)}%)
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.round((overallProgress.current / (overallProgress.total || 1)) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}

        {/* Conteúdo Central: Lista de Módulos e Aulas ou Dropzone */}
        <div
          data-testid="batch-modules-scroll-container"
          className="custom-scrollbar"
          style={{
            flex: '1 1 0%',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(129, 140, 248, 0.7) rgba(15, 23, 42, 0.8)'
          }}
        >
          {modulesList.length === 0 ? (
            <BatchDropzoneArea
              isDragging={isDragging}
              isImporting={isImporting}
              onOpenFolderPicker={() => folderInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />
          ) : (
            modulesList.map((mod) => (
              <BatchModuleItem
                key={mod.id}
                mod={mod}
                isExpanded={!!expandedModuleIds[mod.id]}
                isImporting={isImporting}
                existingModules={existingModules}
                onToggleAccordion={handleToggleAccordion}
                onToggleModule={handleToggleModule}
                onToggleLesson={handleToggleLesson}
                onUpdateModuleOrder={handleUpdateModuleOrder}
                onLinkExistingModule={handleLinkExistingModule}
                onSetModuleCover={handleSetModuleCover}
                onRemoveModuleCover={handleRemoveModuleCover}
                onApplyCoverToModuleLessons={handleApplyCoverToModuleLessons}
                onSetLessonCover={handleSetLessonCover}
                onRemoveLessonCover={handleRemoveLessonCover}
                onReplicateLessonCover={handleReplicateLessonCover}
                onRetryLesson={handleRetryLesson}
                onRetryModule={handleRetryModule}
              />
            ))
          )}
        </div>

        {/* Rodapé do Modal */}
        <div style={{ flexShrink: 0, padding: '16px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            {modulesList.length > 0 && (
              <span>
                Total: <strong style={{ color: '#f8fafc' }}>{selectedLessonsCount}</strong> de {totalLessonsCount} aula(s) selecionada(s)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Botão de Reimportar Falhas */}
            {failedLessonsCount > 0 && !isImporting && (
              <button
                type="button"
                onClick={handleRetryFailedLessons}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.45)', color: '#fca5a5', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                data-testid="retry-failed-lessons-btn"
              >
                <RotateCcw size={14} />
                <span>Reimportar Falhas ({failedLessonsCount})</span>
              </button>
            )}

            {isImporting ? (
              <button
                type="button"
                onClick={handleCancelQueue}
                style={{ padding: '9px 18px', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                data-testid="cancel-batch-btn"
              >
                Interromper Envio
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                style={{ padding: '9px 18px', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                data-testid="close-batch-btn"
              >
                Fechar
              </button>
            )}

            <button
              type="button"
              onClick={() => handleStartBatchImport()}
              disabled={isImporting || selectedLessonsCount === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                background: selectedLessonsCount > 0 && !isImporting ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : '#334155',
                color: selectedLessonsCount > 0 && !isImporting ? '#ffffff' : '#64748b',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: selectedLessonsCount > 0 && !isImporting ? 'pointer' : 'not-allowed',
                boxShadow: selectedLessonsCount > 0 && !isImporting ? '0 4px 14px rgba(99, 102, 241, 0.4)' : 'none'
              }}
              data-testid="start-batch-import-btn"
            >
              {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
              <span>{isImporting ? 'Importando Aulas...' : `Iniciar Importação em Lote (${selectedLessonsCount})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
