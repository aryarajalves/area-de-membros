import { useState, useEffect, useRef } from 'react';

const MIN_SWITCH_DISPLAY_MS = 450;

/**
 * Hook responsável por carregar as informações auxiliares da aula selecionada
 * (transcrição, anotações e comentários) e controlar o estado do popup de
 * carregamento durante a troca entre aulas.
 */
export function useLessonSwitchLoader({ courseId, moduleId, lesson }) {
  const [notesCount, setNotesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isTranscriptionCompleted, setIsTranscriptionCompleted] = useState(false);
  const [isSwitchingLesson, setIsSwitchingLesson] = useState(false);
  const previousLessonIdRef = useRef(lesson?.id ?? null);

  useEffect(() => {
    let cancelled = false;
    const isLessonSwitch = Boolean(
      previousLessonIdRef.current !== null &&
      lesson?.id &&
      previousLessonIdRef.current !== lesson.id
    );
    previousLessonIdRef.current = lesson?.id ?? null;

    setIsTranscriptionCompleted(false);
    setNotesCount(0);
    setCommentsCount(0);

    if (!courseId || !lesson?.id) {
      setIsSwitchingLesson(false);
      return undefined;
    }

    if (isLessonSwitch) {
      setIsSwitchingLesson(true);
    }

    const minDelayPromise = isLessonSwitch
      ? new Promise((resolve) => setTimeout(resolve, MIN_SWITCH_DISPLAY_MS))
      : Promise.resolve();

    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const modId = moduleId || lesson.module_id;
    const requests = [];

    requests.push(
      fetch(`/api/v1/courses/${courseId}/lessons/${lesson.id}/notes`, { headers })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (!cancelled) setNotesCount(Array.isArray(data) ? data.length : data?.content ? 1 : 0);
        })
        .catch(() => {})
    );

    if (modId) {
      requests.push(
        fetch(`/api/v1/courses/${courseId}/modules/${modId}/lessons/${lesson.id}/transcription`, { headers })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (!cancelled) {
              const isDone = (data?.status === 'completed' || data?.status === 'ready') &&
                Boolean(data?.full_transcript || data?.summary_markdown || data?.summary_html);
              setIsTranscriptionCompleted(Boolean(isDone));
            }
          })
          .catch(() => {
            if (!cancelled) setIsTranscriptionCompleted(false);
          })
      );

      requests.push(
        fetch(`/api/v1/courses/${courseId}/modules/${modId}/lessons/${lesson.id}/comments`, { headers })
          .then((res) => (res.ok ? res.json() : []))
          .then((data) => {
            if (!cancelled) setCommentsCount(Array.isArray(data) ? data.length : 0);
          })
          .catch(() => {})
      );
    }

    Promise.allSettled([...requests, minDelayPromise]).finally(() => {
      if (!cancelled) setIsSwitchingLesson(false);
    });

    return () => {
      cancelled = true;
    };
  }, [courseId, moduleId, lesson?.id]);

  useEffect(() => {
    const handleTranscriptionStatus = (e) => {
      if (e?.detail?.lessonId === lesson?.id) {
        const isDone = e.detail.isCompleted !== undefined
          ? e.detail.isCompleted
          : (e.detail.status === 'completed' || e.detail.status === 'ready');
        setIsTranscriptionCompleted(Boolean(isDone));
      }
    };
    const handleNotesUpdated = (e) => {
      if (e?.detail?.lessonId === lesson?.id && typeof e?.detail?.count === 'number') {
        setNotesCount(e.detail.count);
      }
    };
    const handleCommentsUpdated = (e) => {
      if (e?.detail?.lessonId === lesson?.id && typeof e?.detail?.count === 'number') {
        setCommentsCount(e.detail.count);
      }
    };

    window.addEventListener('lesson-transcription-status-updated', handleTranscriptionStatus);
    window.addEventListener('lesson-notes-count-updated', handleNotesUpdated);
    window.addEventListener('lesson-comments-count-updated', handleCommentsUpdated);
    return () => {
      window.removeEventListener('lesson-transcription-status-updated', handleTranscriptionStatus);
      window.removeEventListener('lesson-notes-count-updated', handleNotesUpdated);
      window.removeEventListener('lesson-comments-count-updated', handleCommentsUpdated);
    };
  }, [lesson?.id]);

  return { notesCount, commentsCount, isTranscriptionCompleted, isSwitchingLesson };
}
