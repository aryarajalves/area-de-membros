import { useEffect, useRef, useState, useCallback } from 'react';
import { captureVideoIssueInSentry } from '../../services/sentryService';

const MAX_AUTO_RETRIES = 3;
const BUFFERING_STALL_TIMEOUT_MS = 8000;

export function isExternalVideoUrl(rawSrc) {
  if (!rawSrc || typeof rawSrc !== 'string') return false;
  const trimmed = rawSrc.trim();
  return (trimmed.startsWith('http://') || trimmed.startsWith('https://'))
    && !trimmed.includes('/api/v1/courses/video-proxy')
    && !trimmed.includes('/cdn-videos/');
}

export function buildVideoProxyUrl(rawSrc) {
  if (!rawSrc || typeof rawSrc !== 'string') return rawSrc;
  const trimmed = rawSrc.trim();
  if (!trimmed || trimmed.startsWith('/api/v1/courses/video-proxy') || trimmed.startsWith('/cdn-videos/')) {
    return trimmed;
  }
  return `/api/v1/courses/video-proxy?video_url=${encodeURIComponent(trimmed)}`;
}

function reportVideoTelemetry({ eventType, title, src, videoEl, currentTime, retryAttempt = 0 }) {
  const readyState = typeof videoEl?.readyState === 'number' ? videoEl.readyState : null;
  const networkState = typeof videoEl?.networkState === 'number' ? videoEl.networkState : null;
  const errorCode = typeof videoEl?.error?.code === 'number' ? videoEl.error.code : null;
  const errorMessage = videoEl?.error?.message || null;
  const effectiveTime = typeof videoEl?.currentTime === 'number' ? videoEl.currentTime : (currentTime || 0);

  captureVideoIssueInSentry({
    eventType,
    title,
    src,
    currentTime: effectiveTime,
    readyState,
    networkState,
    errorCode,
    errorMessage,
    retryAttempt,
  });

  try {
    const token = typeof localStorage !== 'undefined'
      ? (localStorage.getItem('auth_token') || localStorage.getItem('token'))
      : null;
    if (!token || typeof fetch !== 'function') return;

    const payload = {
      event_type: eventType,
      lesson_title: title || null,
      video_url: src || null,
      current_time: effectiveTime,
      ready_state: readyState,
      network_state: networkState,
      error_code: errorCode,
      error_message: errorMessage,
      retry_attempt: retryAttempt,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    };

    Promise.resolve(
      fetch('/api/v1/logs/video-telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
    ).catch(() => {});
  } catch {
    // Nunca interrompe a reprodução por falha de telemetria
  }
}

/**
 * Gerencia retry automático, watchdog de travamento em buffering (stall)
 * e retomada de posição (currentTime + play) no streaming de vídeo HTML5.
 */
export function useVideoRetry({
  src,
  title,
  videoRef,
  currentTime,
  isPlaying,
  isBuffering = false,
  setIsLoading,
  setIsBuffering,
  setHasError,
  setIsPlaying,
}) {
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);
  const stallTimerRef = useRef(null);
  const resumeStateRef = useRef({ time: 0, wasPlaying: false });
  const isMountedRef = useRef(true);
  const [isStalledTooLong, setIsStalledTooLong] = useState(false);
  const [isUsingProxyFallback, setIsUsingProxyFallback] = useState(false);
  const [networkDiagnosis, setNetworkDiagnosis] = useState(null);

  const activeSrc = isUsingProxyFallback ? buildVideoProxyUrl(src) : src;

  const clearStallTimer = () => {
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      clearStallTimer();
    };
  }, []);

  const resetRetryState = () => {
    retryCountRef.current = 0;
    resumeStateRef.current = { time: 0, wasPlaying: false };
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    clearStallTimer();
    setIsStalledTooLong(false);
    setIsUsingProxyFallback(false);
    setNetworkDiagnosis(null);
  };

  const snapshotResumeState = (forcePlaying = false) => {
    const vidTime = videoRef.current?.currentTime || 0;
    const savedTime = vidTime > 0 ? vidTime : (resumeStateRef.current.time || currentTime || 0);
    const wasPlaying = forcePlaying || isPlaying || resumeStateRef.current.wasPlaying;
    resumeStateRef.current = { time: savedTime, wasPlaying };
  };

  const switchToProxyFallback = useCallback(() => {
    if (!src || isUsingProxyFallback) {
      if (videoRef.current) videoRef.current.load();
      return;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    clearStallTimer();
    setIsStalledTooLong(false);
    snapshotResumeState(true);
    retryCountRef.current = 0;
    setIsUsingProxyFallback(true);
    setHasError(false);
    setIsBuffering(false);
    setIsLoading(true);
    reportVideoTelemetry({
      eventType: 'VIDEO_PROXY_FALLBACK_ACTIVATED',
      title,
      src: buildVideoProxyUrl(src),
      videoEl: videoRef.current,
      currentTime,
      retryAttempt: retryCountRef.current,
    });
    setTimeout(() => {
      if (isMountedRef.current && videoRef.current) {
        videoRef.current.load();
      }
    }, 50);
  }, [src, isUsingProxyFallback, title, currentTime, videoRef, setHasError, setIsBuffering, setIsLoading]);

  useEffect(() => {
    clearStallTimer();
    if (!isBuffering || !activeSrc) {
      setIsStalledTooLong(false);
      return;
    }

    stallTimerRef.current = setTimeout(() => {
      stallTimerRef.current = null;
      setIsStalledTooLong(true);
      const attempt = retryCountRef.current < MAX_AUTO_RETRIES ? retryCountRef.current + 1 : retryCountRef.current;
      reportVideoTelemetry({
        eventType: 'BUFFERING_STALL_8S',
        title,
        src: activeSrc,
        videoEl: videoRef.current,
        currentTime,
        retryAttempt: attempt,
      });
      if (retryCountRef.current < MAX_AUTO_RETRIES && videoRef.current) {
        retryCountRef.current += 1;
        snapshotResumeState(true);
        videoRef.current.load();
      }
    }, BUFFERING_STALL_TIMEOUT_MS);

    return () => {
      clearStallTimer();
    };
  }, [isBuffering, activeSrc]);

  const handleRetry = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    clearStallTimer();
    setIsStalledTooLong(false);
    reportVideoTelemetry({
      eventType: 'MANUAL_RECONNECT',
      title,
      src: activeSrc,
      videoEl: videoRef.current,
      currentTime,
      retryAttempt: retryCountRef.current,
    });
    retryCountRef.current = 0;
    snapshotResumeState(isBuffering);
    setHasError(false);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const runDiagnosticProbe = async () => {
    if (!src || isUsingProxyFallback || typeof fetch !== 'function') return;
    try {
      const res = await fetch(`/api/v1/courses/video-stream-probe?video_url=${encodeURIComponent(src)}`);
      if (!res?.ok || typeof res.json !== 'function') return;
      const data = await res.json();
      if (!isMountedRef.current) return;
      if (data?.reachable_from_server) {
        setNetworkDiagnosis('corporate_block');
        switchToProxyFallback();
      } else {
        setNetworkDiagnosis('server_unreachable');
      }
    } catch {
      // Sonda é melhor esforço e não deve gerar novos erros
    }
  };

  const handleVideoError = () => {
    clearStallTimer();
    setIsStalledTooLong(false);
    const nextAttempt = retryCountRef.current < MAX_AUTO_RETRIES ? retryCountRef.current + 1 : retryCountRef.current;
    reportVideoTelemetry({
      eventType: 'VIDEO_STREAM_ERROR',
      title,
      src: activeSrc,
      videoEl: videoRef.current,
      currentTime,
      retryAttempt: nextAttempt,
    });
    if (activeSrc && retryCountRef.current < MAX_AUTO_RETRIES) {
      retryCountRef.current += 1;
      snapshotResumeState(isBuffering);
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
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setNetworkDiagnosis('offline');
    } else if (isExternalVideoUrl(src)) {
      setNetworkDiagnosis('corporate_block');
    } else {
      setNetworkDiagnosis('server_unreachable');
    }
    setIsLoading(false);
    setIsBuffering(false);
    setHasError(true);
    runDiagnosticProbe();
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
    } else if (pendingResume.wasPlaying || autoPlay) {
      resumeStateRef.current = { time: 0, wasPlaying: false };
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const markPlaybackHealthy = () => {
    retryCountRef.current = 0;
    clearStallTimer();
    setIsStalledTooLong(false);
  };

  return {
    activeSrc,
    isUsingProxyFallback,
    networkDiagnosis,
    switchToProxyFallback,
    resetRetryState,
    handleRetry,
    handleVideoError,
    restorePositionIfPending,
    markPlaybackHealthy,
    isStalledTooLong,
  };
}
