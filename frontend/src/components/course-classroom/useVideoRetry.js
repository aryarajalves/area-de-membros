import { useEffect, useRef } from 'react';

const MAX_AUTO_RETRIES = 3;

/**
 * Gerencia retry automático e retomada de posição (currentTime + play)
 * em falhas transitórias de rede durante o streaming de vídeo HTML5.
 */
export function useVideoRetry({
  src,
  videoRef,
  currentTime,
  isPlaying,
  setIsLoading,
  setIsBuffering,
  setHasError,
  setIsPlaying,
}) {
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);
  const resumeStateRef = useRef({ time: 0, wasPlaying: false });

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  const resetRetryState = () => {
    retryCountRef.current = 0;
    resumeStateRef.current = { time: 0, wasPlaying: false };
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  const snapshotResumeState = () => {
    const vidTime = videoRef.current?.currentTime || 0;
    const savedTime = vidTime > 0 ? vidTime : (resumeStateRef.current.time || currentTime || 0);
    const wasPlaying = isPlaying || resumeStateRef.current.wasPlaying;
    resumeStateRef.current = { time: savedTime, wasPlaying };
  };

  const handleRetry = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    retryCountRef.current = 0;
    snapshotResumeState();
    setHasError(false);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const handleVideoError = () => {
    if (src && retryCountRef.current < MAX_AUTO_RETRIES) {
      retryCountRef.current += 1;
      snapshotResumeState();
      setIsLoading(false);
      setIsBuffering(true);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        if (videoRef.current) {
          videoRef.current.load();
        }
      }, retryCountRef.current * 800);
      return;
    }
    setIsLoading(false);
    setIsBuffering(false);
    setHasError(true);
  };

  const restorePositionIfPending = (autoPlay) => {
    if (!videoRef.current) return;
    const pendingResume = resumeStateRef.current;
    if (pendingResume.time > 0) {
      videoRef.current.currentTime = pendingResume.time;
      if (pendingResume.wasPlaying) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
      resumeStateRef.current = { time: 0, wasPlaying: false };
    } else if (autoPlay) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const markPlaybackHealthy = () => {
    retryCountRef.current = 0;
  };

  return {
    resetRetryState,
    handleRetry,
    handleVideoError,
    restorePositionIfPending,
    markPlaybackHealthy,
  };
}
