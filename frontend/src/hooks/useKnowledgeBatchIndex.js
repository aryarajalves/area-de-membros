import { useState, useRef, useCallback } from 'react';

export function useKnowledgeBatchIndex(getAuthHeaders, onComplete) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  const [total, setTotal] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentLessonTitle, setCurrentLessonTitle] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalSuccess: 0,
    totalFailed: 0,
    totalChunks: 0,
    totalQa: 0
  });

  const cancelRef = useRef(false);

  const startBatchIndex = useCallback(async (lessonsToProcess) => {
    if (!lessonsToProcess || lessonsToProcess.length === 0) return;

    cancelRef.current = false;
    setIsModalOpen(true);
    setIsRunning(true);
    setIsCompleted(false);
    setIsCancelled(false);

    const totalCount = lessonsToProcess.length;
    setTotal(totalCount);
    setCurrentStep(0);
    setProgressPct(0);
    setLogs([]);
    setStats({ totalSuccess: 0, totalFailed: 0, totalChunks: 0, totalQa: 0 });

    let successCount = 0;
    let failedCount = 0;
    let chunksCount = 0;
    let qaCount = 0;

    for (let i = 0; i < totalCount; i++) {
      if (cancelRef.current) {
        setIsCancelled(true);
        break;
      }

      const lesson = lessonsToProcess[i];
      const lessonTitle = lesson.lesson_title || `Aula #${lesson.lesson_id}`;
      setCurrentStep(i + 1);
      setCurrentLessonTitle(lessonTitle);

      const pct = Math.round((i / totalCount) * 100);
      setProgressPct(pct);

      try {
        const headers = typeof getAuthHeaders === 'function' ? getAuthHeaders() : {};
        const res = await fetch(`/api/v1/tutor-ia/knowledge-base/lessons/${lesson.lesson_id}/index`, {
          method: 'POST',
          headers
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.detail || `Erro HTTP ${res.status}`);
        }

        const data = await res.json();
        const addedChunks = data.chunks_count || 0;
        const addedQa = data.qa_count || 5;

        successCount += 1;
        chunksCount += addedChunks;
        qaCount += addedQa;

        setLogs((prev) => [
          ...prev,
          {
            id: lesson.lesson_id,
            title: lessonTitle,
            status: 'success',
            chunks: addedChunks,
            qa_count: addedQa,
            message: data.message || `${addedChunks} fragmentos indexados.`
          }
        ]);
      } catch (err) {
        failedCount += 1;
        setLogs((prev) => [
          ...prev,
          {
            id: lesson.lesson_id,
            title: lessonTitle,
            status: 'error',
            error: err.message || 'Falha ao indexar aula.'
          }
        ]);
      }

      const updatedPct = Math.round(((i + 1) / totalCount) * 100);
      setProgressPct(updatedPct);

      setStats({
        totalSuccess: successCount,
        totalFailed: failedCount,
        totalChunks: chunksCount,
        totalQa: qaCount
      });
    }

    setIsRunning(false);
    setIsCompleted(true);
    setProgressPct(100);

    if (typeof onComplete === 'function') {
      onComplete({
        total: totalCount,
        successCount,
        failedCount,
        chunksCount,
        qaCount,
        isCancelled: cancelRef.current
      });
    }
  }, [getAuthHeaders, onComplete]);

  const cancelBatchIndex = useCallback(() => {
    cancelRef.current = true;
    setIsCancelled(true);
    setIsRunning(false);
  }, []);

  const closeModal = useCallback(() => {
    if (isRunning) return;
    setIsModalOpen(false);
  }, [isRunning]);

  return {
    isModalOpen,
    isRunning,
    isCompleted,
    isCancelled,
    total,
    currentStep,
    currentLessonTitle,
    progressPct,
    logs,
    stats,
    startBatchIndex,
    cancelBatchIndex,
    closeModal
  };
}
