import { useState, useRef } from 'react';
import {
  uploadVideoWithProgress,
  uploadThumbnailFile,
  createModuleIfNotExists,
  saveLessonInModule,
  createLessonInModule,
  triggerLessonAiTranscription,
  generateModuleAiOverview
} from '../../services/batchImportService';
import { getVideoFileDuration, formatSecondsToClock } from './lessonUtils';

/**
 * Hook customizado para orquestração da fila de importação em lote de cursos.
 * Suporta upload de capa de módulo, upload de capa de aula, upload de vídeo no Backblaze B2,
 * criação de módulo/aula e acionamento da IA.
 */
export function useBatchImportProcess({
  courseId,
  modulesList,
  setModulesList,
  onImportCompleted,
  addToast
}) {
  const [isImporting, setIsImporting] = useState(false);
  const [currentProcessingTitle, setCurrentProcessingTitle] = useState('');
  const [overallProgress, setOverallProgress] = useState({ current: 0, total: 0 });
  const shouldCancelRef = useRef(false);
  const activeUploadAbortRef = useRef(null);

  const selectedLessonsCount = modulesList.reduce(
    (acc, m) => acc + (m.lessons?.filter((l) => l.selected).length || 0),
    0
  );

  const updateLessonState = (moduleId, lessonId, partialUpdates) => {
    setModulesList((prev) =>
      prev.map((mod) => {
        if (mod.id !== moduleId) return mod;
        return {
          ...mod,
          lessons: mod.lessons.map((l) =>
            l.id === lessonId ? { ...l, ...partialUpdates } : l
          )
        };
      })
    );
  };

  const updateModuleState = (moduleId, partialUpdates) => {
    setModulesList((prev) =>
      prev.map((mod) => (mod.id === moduleId ? { ...mod, ...partialUpdates } : mod))
    );
  };

  const handleCancelQueue = () => {
    shouldCancelRef.current = true;
    if (activeUploadAbortRef.current) {
      try {
        activeUploadAbortRef.current();
      } catch (e) {
        console.warn('Erro ao abortar upload ativo:', e);
      }
      activeUploadAbortRef.current = null;
    }
    setIsImporting(false);
    setCurrentProcessingTitle('Envio cancelado.');
    addToast('Envio de vídeos interrompido imediatamente!', 'info');
  };

  const handleStartBatchImport = async (overrideModulesList = null) => {
    const activeList = overrideModulesList || modulesList;

    const lessonsToProcessCount = activeList.reduce(
      (acc, m) =>
        acc + (m.lessons?.filter((l) => l.selected && l.status !== 'completed').length || 0),
      0
    );

    if (lessonsToProcessCount === 0) {
      addToast('Todas as aulas selecionadas já foram concluídas ou nenhuma foi marcada.', 'info');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      addToast('Sessão expirada. Faça login novamente.', 'error');
      return;
    }

    setIsImporting(true);
    shouldCancelRef.current = false;
    setOverallProgress({ current: 0, total: lessonsToProcessCount });

    const moduleMapCache = {};
    let completedCount = 0;

    try {
      for (let mIdx = 0; mIdx < activeList.length; mIdx++) {
        if (shouldCancelRef.current) break;
        const currentMod = activeList[mIdx];
        const selectedLessons = currentMod.lessons.filter((l) => l.selected && l.status !== 'completed');
        if (selectedLessons.length === 0) continue;

        let targetModuleId = currentMod.existingModuleId || moduleMapCache[currentMod.title];

        // 1. Upload da capa do Módulo caso o usuário tenha anexado
        let moduleImageUrl = null;
        if (currentMod.coverFile) {
          try {
            setCurrentProcessingTitle(`Enviando capa do módulo: ${currentMod.title}...`);
            moduleImageUrl = await uploadThumbnailFile(currentMod.coverFile, token);
          } catch (coverErr) {
            console.warn(`Aviso ao subir capa do módulo ${currentMod.title}:`, coverErr);
            addToast(`Falha ao subir capa do módulo ${currentMod.title}, continuando sem capa...`, 'warning');
          }
        }

        const chosenOrder = currentMod.orderIndex !== undefined && currentMod.orderIndex !== null
          ? currentMod.orderIndex
          : mIdx;

        if (!targetModuleId) {
          setCurrentProcessingTitle(`Criando módulo: ${currentMod.title}...`);
          try {
            const modResult = await createModuleIfNotExists(
              courseId,
              currentMod.title,
              chosenOrder,
              token,
              currentMod.existingModuleId,
              moduleImageUrl
            );
            targetModuleId = modResult.id;
            moduleMapCache[currentMod.title] = targetModuleId;
            currentMod.existingModuleId = targetModuleId;
            currentMod.isExisting = true;
            updateModuleState(currentMod.id, { existingModuleId: targetModuleId, isExisting: true });
          } catch (modErr) {
            addToast(`Falha no módulo ${currentMod.title}: ${modErr.message}`, 'error');
            continue;
          }
        } else {
          // Se o módulo já existia, sincroniza a ordem manual ou a capa caso tenham sido alteradas
          await createModuleIfNotExists(courseId, currentMod.title, chosenOrder, token, targetModuleId, moduleImageUrl);
        }

        // 2. Itera sobre as aulas selecionadas do módulo
        for (let lIdx = 0; lIdx < currentMod.lessons.length; lIdx++) {
          if (shouldCancelRef.current) break;
          const lesson = currentMod.lessons[lIdx];
          if (!lesson.selected || lesson.status === 'completed') continue;

          // Upload de capa da aula caso exista
          let lessonThumbnailUrl = null;
          if (lesson.coverFile) {
            try {
              setCurrentProcessingTitle(`Enviando capa da aula: ${lesson.title}...`);
              lessonThumbnailUrl = await uploadThumbnailFile(lesson.coverFile, token);
            } catch (lessonCoverErr) {
              console.warn(`Aviso ao subir capa da aula ${lesson.title}:`, lessonCoverErr);
            }
          }

          // Lista de vídeos para a aula (suporta faixas multilíngues)
          const videoList = lesson.videoFiles && lesson.videoFiles.length > 0
            ? lesson.videoFiles
            : [{ language: 'pt', language_label: 'Português', file: lesson.file }];

          updateLessonState(currentMod.id, lesson.id, {
            status: 'uploading',
            progress: 0,
            progressDetail: null,
            errorMessage: null
          });

          let uploadedVideoUrl = null;
          const uploadedVideosPayload = [];
          let hasUploadError = false;

          for (let vIdx = 0; vIdx < videoList.length; vIdx++) {
            if (shouldCancelRef.current) break;
            const vf = videoList[vIdx];
            const langLabel = vf.language_label || vf.language;
            const progressPrefix = videoList.length > 1 ? ` (${langLabel})` : '';

            setCurrentProcessingTitle(
              `[${completedCount + 1}/${selectedLessonsCount}] Subindo vídeo: ${lesson.title}${progressPrefix}`
            );

            try {
              const vUrl = await uploadVideoWithProgress(
                vf.file,
                token,
                (prog) => {
                  const pct = typeof prog === 'object' ? prog.percent : prog;
                  const detail = prog && prog.loadedFormatted
                    ? `${prog.loadedFormatted} / ${prog.totalFormatted}`
                    : '';
                  updateLessonState(currentMod.id, lesson.id, {
                    progress: pct,
                    progressDetail: detail
                  });
                },
                activeUploadAbortRef
              );

              uploadedVideosPayload.push({
                language: vf.language,
                language_label: vf.language_label,
                video_url: vUrl,
                order_index: vIdx
              });

              if (!uploadedVideoUrl || vf.language === 'pt') {
                uploadedVideoUrl = vUrl;
              }
            } catch (uploadErr) {
              if (shouldCancelRef.current || uploadErr?.message === 'UPLOAD_ABORTED' || uploadErr?.name === 'AbortError') {
                updateLessonState(currentMod.id, lesson.id, {
                  status: 'pending',
                  progress: 0,
                  progressDetail: null,
                  errorMessage: null
                });
                break;
              }
              updateLessonState(currentMod.id, lesson.id, {
                status: 'error',
                progressDetail: null,
                errorMessage: `Erro no upload (${langLabel}): ${uploadErr.message}`
              });
              hasUploadError = true;
              break;
            } finally {
              activeUploadAbortRef.current = null;
            }
          }

          if (shouldCancelRef.current) break;

          if (hasUploadError || !uploadedVideoUrl) {
            continue;
          }

          const isUpdatingLesson = !!(lesson.isExisting && lesson.existingLessonId);
          setCurrentProcessingTitle(
            isUpdatingLesson
              ? `Atualizando aula: ${lesson.title}...`
              : `Cadastrando aula: ${lesson.title}...`
          );
          updateLessonState(currentMod.id, lesson.id, {
            status: isUpdatingLesson ? 'updating_lesson' : 'creating_lesson'
          });

          // Detecta duração estimada no formato cronômetro exato (ex: 15:30)
          let autoDuration = null;
          try {
            const primaryFile = lesson.file || videoList[0]?.file;
            if (primaryFile) {
              const durSec = await getVideoFileDuration(primaryFile);
              if (durSec > 0) {
                autoDuration = formatSecondsToClock(durSec);
              }
            }
          } catch (durErr) {
            console.warn(`Aviso ao ler duração da aula ${lesson.title}:`, durErr);
          }

          let savedLesson = null;
          try {
            if (isUpdatingLesson) {
              savedLesson = await saveLessonInModule(
                courseId,
                targetModuleId,
                lesson.title,
                uploadedVideoUrl,
                lIdx,
                token,
                lessonThumbnailUrl,
                autoDuration,
                uploadedVideosPayload,
                lesson.existingLessonId,
                lesson.importIdentifier || lesson.fileName || lesson.title
              );
            } else {
              savedLesson = await createLessonInModule(
                courseId,
                targetModuleId,
                lesson.title,
                uploadedVideoUrl,
                lIdx,
                token,
                lessonThumbnailUrl,
                autoDuration,
                uploadedVideosPayload,
                lesson.importIdentifier || lesson.fileName || lesson.title
              );
            }
          } catch (saveErr) {
            updateLessonState(currentMod.id, lesson.id, {
              status: 'error',
              errorMessage: `Erro ao ${isUpdatingLesson ? 'atualizar' : 'criar'} aula: ${saveErr.message}`
            });
            continue;
          }

          const targetLessonId = savedLesson?.id || lesson.existingLessonId;

          setCurrentProcessingTitle(`Disparando IA: ${lesson.title}...`);
          updateLessonState(currentMod.id, lesson.id, {
            status: 'transcribing',
            createdLessonId: targetLessonId
          });

          await triggerLessonAiTranscription(
            courseId,
            targetModuleId,
            targetLessonId,
            uploadedVideoUrl,
            token
          );

          completedCount += 1;
          updateLessonState(currentMod.id, lesson.id, {
            status: 'completed',
            progress: 100
          });
          setOverallProgress({ current: completedCount, total: lessonsToProcessCount });
        }

        // 3. Ao finalizar todas as aulas do módulo, gera automaticamente título e descrição inteligentes com IA
        if (targetModuleId && !shouldCancelRef.current) {
          try {
            setCurrentProcessingTitle(`Gerando título e descrição IA para o módulo: ${currentMod.title}...`);
            const aiOverview = await generateModuleAiOverview(courseId, targetModuleId, token);
            if (aiOverview && aiOverview.title) {
              addToast(`Módulo atualizado pela IA: "${aiOverview.title}"`, 'success');
            }
          } catch (aiModErr) {
            console.warn(`Aviso ao gerar título/descrição IA do módulo ${currentMod.title}:`, aiModErr);
          }
        }
      }

      if (shouldCancelRef.current) {
        addToast(`Importação interrompida. ${completedCount} aula(s) processadas.`, 'info');
      } else {
        addToast(`Importação em lote concluída! ${completedCount} aula(s) processadas.`, 'success');
      }

      if (onImportCompleted) {
        await onImportCompleted();
      }
    } catch (err) {
      if (!shouldCancelRef.current) {
        addToast(`Erro no processo: ${err.message}`, 'error');
      }
    } finally {
      activeUploadAbortRef.current = null;
      setIsImporting(false);
      setCurrentProcessingTitle('');
    }
  };

  const handleRetryLesson = (moduleId, lessonId) => {
    if (isImporting) return;
    const updated = modulesList.map((mod) => {
      if (mod.id !== moduleId) return mod;
      return {
        ...mod,
        lessons: mod.lessons.map((l) =>
          l.id === lessonId
            ? { ...l, status: 'pending', selected: true, progress: 0, errorMessage: null }
            : l
        )
      };
    });
    setModulesList(updated);
    handleStartBatchImport(updated);
  };

  const handleRetryModule = (moduleId) => {
    if (isImporting) return;
    const updated = modulesList.map((mod) => {
      if (mod.id !== moduleId) return mod;
      return {
        ...mod,
        lessons: mod.lessons.map((l) =>
          l.status === 'error'
            ? { ...l, status: 'pending', selected: true, progress: 0, errorMessage: null }
            : l
        )
      };
    });
    setModulesList(updated);
    handleStartBatchImport(updated);
  };

  const handleRetryFailedLessons = () => {
    if (isImporting) return;
    const updated = modulesList.map((mod) => ({
      ...mod,
      lessons: mod.lessons.map((l) =>
        l.status === 'error'
          ? { ...l, status: 'pending', selected: true, progress: 0, errorMessage: null }
          : l
      )
    }));
    setModulesList(updated);
    handleStartBatchImport(updated);
  };

  return {
    isImporting,
    currentProcessingTitle,
    overallProgress,
    handleStartBatchImport,
    handleCancelQueue,
    handleRetryLesson,
    handleRetryModule,
    handleRetryFailedLessons
  };
}
