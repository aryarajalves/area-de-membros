import React, { useState, useRef, useEffect, useCallback } from 'react';
import { parseDurationToSeconds } from './lessonUtils';
import VideoControls from './VideoControls';
import VideoChaptersDrawer from './VideoChaptersDrawer';
import VideoPlayerOverlays from './VideoPlayerOverlays';

export default function CustomVideoPlayer({
  src,
  poster,
  title,
  lessonDuration,
  chapters = []
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(() => {
    try {
      const savedRate = localStorage.getItem('area_de_membros_playback_rate');
      return savedRate ? parseFloat(savedRate) || 1 : 1;
    } catch {
      return 1;
    }
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferedPercentage, setBufferedPercentage] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isChaptersDrawerOpen, setIsChaptersDrawerOpen] = useState(false);

  const hideControlsTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  // Duração de fallback a partir da aula cadastrada (caso video.duration seja Infinity/NaN em streams parciais)
  const fallbackDuration = parseDurationToSeconds(lessonDuration);

  const [activeChapters, setActiveChapters] = useState(chapters || []);
  useEffect(() => { setActiveChapters(chapters || []); }, [chapters]);
  useEffect(() => {
    const handleChaptersLoaded = (e) => {
      if (Array.isArray(e?.detail?.chapters)) setActiveChapters(e.detail.chapters);
    };
    window.addEventListener('video-chapters-loaded', handleChaptersLoaded);
    return () => window.removeEventListener('video-chapters-loaded', handleChaptersLoaded);
  }, []);

  // Feedback e reset imediato ao alternar de vídeo (0ms de latência percebida)
  useEffect(() => {
    setIsLoading(true);
    setIsBuffering(false);
    setBufferedPercentage(0);
    setHasError(false);
    setCurrentTime(0);
    setDuration(fallbackDuration || 0);
  }, [src, fallbackDuration]);

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  // Inicializa e atualiza duração ao carregar metadados do vídeo
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      // Aplica a velocidade salva ao novo vídeo carregado
      if (typeof playbackRate === 'number' && playbackRate > 0) {
        videoRef.current.playbackRate = playbackRate;
      }
      const vidDuration = videoRef.current.duration;
      if (vidDuration && !isNaN(vidDuration) && vidDuration !== Infinity) {
        setDuration(vidDuration);
      } else if (fallbackDuration > 0) {
        setDuration(fallbackDuration);
      }
    }
  };

  const handlePlaybackRateChange = useCallback((rate) => {
    const numRate = parseFloat(rate);
    if (!isNaN(numRate) && numRate > 0) {
      setPlaybackRate(numRate);
      if (videoRef.current) {
        videoRef.current.playbackRate = numRate;
      }
      try {
        localStorage.setItem('area_de_membros_playback_rate', String(numRate));
      } catch {
        // Ignora erros de localStorage
      }
    }
  }, []);

  // Se o fallbackDuration mudar e duration for 0, atualiza
  useEffect(() => {
    if (duration === 0 && fallbackDuration > 0) {
      setDuration(fallbackDuration);
    }
  }, [fallbackDuration, duration]);

  const updateBuffered = useCallback(() => {
    if (!videoRef.current) return;
    const b = videoRef.current.buffered;
    const curTime = videoRef.current.currentTime;
    const effectiveDur = duration > 0 ? duration : fallbackDuration;
    if (b && b.length > 0 && effectiveDur > 0) {
      let currentBufferedEnd = 0;
      for (let i = 0; i < b.length; i++) {
        if (b.start(i) <= curTime && curTime <= b.end(i)) {
          currentBufferedEnd = b.end(i);
          break;
        } else if (b.end(i) > currentBufferedEnd) {
          currentBufferedEnd = b.end(i);
        }
      }
      setBufferedPercentage(Math.min(100, Math.max(0, (currentBufferedEnd / effectiveDur) * 100)));
    }
  }, [duration, fallbackDuration]);

  // Atualização contínua do tempo durante a reprodução
  const handleTimeUpdate = () => {
    if (!isScrubbing && videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);
      const vidDuration = videoRef.current.duration;
      if (vidDuration && !isNaN(vidDuration) && vidDuration !== Infinity && vidDuration !== duration) {
        setDuration(vidDuration);
      }
      // Se estava em buffering e o reprodutor já tem dados prontos (HAVE_FUTURE_DATA)
      if (isBuffering && videoRef.current.readyState >= 3) {
        setIsBuffering(false);
      }
      updateBuffered();
    }
  };

  // Play / Pause com feedback visual imediato se houver necessidade de buffer
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      if (videoRef.current.readyState < 3) {
        setIsBuffering(true);
      }
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        if (videoRef.current && videoRef.current.readyState >= 3) {
          setIsBuffering(false);
        }
      }).catch(() => {
        setIsBuffering(false);
      });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setIsBuffering(false);
    }
  }, []);

  const handleSkipBackward10 = () => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, videoRef.current.currentTime - 10);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSkipForward10 = () => {
    if (!videoRef.current) return;
    const maxTime = duration > 0 ? duration : (videoRef.current.duration || 99999);
    const newTime = Math.min(maxTime, videoRef.current.currentTime + 10);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Scrubbing / Seek na barra de progresso (Clique e Arraste)
  const calculateProgressFromEvent = useCallback((e) => {
    if (!progressBarRef.current) return 0;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    return percentage;
  }, []);

  const seekToPercentage = useCallback((percentage) => {
    const effectiveDuration = duration > 0 ? duration : fallbackDuration;
    if (effectiveDuration > 0 && videoRef.current) {
      const targetTime = percentage * effectiveDuration;
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  }, [duration, fallbackDuration]);

  const handleProgressBarMouseDown = (e) => {
    setIsScrubbing(true);
    const pct = calculateProgressFromEvent(e);
    seekToPercentage(pct);

    const handleMouseMove = (moveEvent) => {
      const movePct = calculateProgressFromEvent(moveEvent);
      seekToPercentage(movePct);
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Volume e Mute
  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      const muted = val === 0;
      setIsMuted(muted);
      videoRef.current.muted = muted;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const resetHideControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    if (isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        if (!isScrubbing) setShowControls(false);
      }, 3000);
    }
  }, [isPlaying, isScrubbing]);

  const seekToSeconds = useCallback((targetSec) => {
    const effectiveDur = duration > 0 ? duration : fallbackDuration;
    const boundedTime = Math.max(0, Math.min(effectiveDur || targetSec, targetSec));
    if (videoRef.current) {
      videoRef.current.currentTime = boundedTime;
      setCurrentTime(boundedTime);
    }
  }, [duration, fallbackDuration]);

  useEffect(() => {
    const handleGlobalSeek = (e) => {
      if (typeof e?.detail?.seconds === 'number') seekToSeconds(e.detail.seconds);
    };
    window.addEventListener('video-seek-to', handleGlobalSeek);
    return () => window.removeEventListener('video-seek-to', handleGlobalSeek);
  }, [seekToSeconds]);

  const effectiveDuration = duration > 0 ? duration : fallbackDuration;
  const progressPercentage = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;
  const remainingSeconds = Math.max(0, effectiveDuration - currentTime);

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideControlsTimer}
      onMouseEnter={() => setShowControls(true)}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
      data-testid="custom-video-player-container"
    >
      <video
        ref={videoRef}
        key={src}
        src={src}
        preload="auto"
        poster={poster || undefined}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={() => {
          setIsLoading(false);
          updateBuffered();
        }}
        onTimeUpdate={handleTimeUpdate}
        onLoadStart={() => {
          setIsLoading(true);
          setIsBuffering(false);
        }}
        onWaiting={() => setIsBuffering(true)}
        onSeeking={() => setIsBuffering(true)}
        onSeeked={() => {
          setIsBuffering(false);
          updateBuffered();
        }}
        onStalled={() => {
          if (isPlaying) setIsBuffering(true);
        }}
        onProgress={updateBuffered}
        onCanPlay={() => {
          setIsLoading(false);
          setIsBuffering(false);
          updateBuffered();
        }}
        onCanPlayThrough={() => {
          setIsLoading(false);
          setIsBuffering(false);
          updateBuffered();
        }}
        onPlaying={() => {
          setIsLoading(false);
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onPause={() => {
          setIsPlaying(false);
          setIsBuffering(false);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setIsBuffering(false);
        }}
        onError={() => {
          setIsLoading(false);
          setIsBuffering(false);
          setHasError(true);
        }}
        onClick={togglePlay}
        style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }}
        data-testid="lesson-html5-video"
      >
        Seu navegador não suporta a reprodução deste vídeo.
      </video>

      {/* Overlays do Player (Poster de transição, Loading, Buffering, Play central e Erro) */}
      <VideoPlayerOverlays
        isLoading={isLoading}
        isBuffering={isBuffering}
        poster={poster}
        hasError={hasError}
        isPlaying={isPlaying}
        togglePlay={togglePlay}
        handleRetry={handleRetry}
      />

      {/* Controles do Player Modularizados */}
      <VideoControls
        showControls={showControls}
        isPlaying={isPlaying}
        isScrubbing={isScrubbing}
        currentTime={currentTime}
        effectiveDuration={effectiveDuration}
        progressPercentage={progressPercentage}
        bufferedPercentage={bufferedPercentage}
        remainingSeconds={remainingSeconds}
        volume={volume}
        isMuted={isMuted}
        isFullscreen={isFullscreen}
        progressBarRef={progressBarRef}
        togglePlay={togglePlay}
        handleSkipBackward10={handleSkipBackward10}
        handleSkipForward10={handleSkipForward10}
        handleProgressBarMouseDown={handleProgressBarMouseDown}
        toggleMute={toggleMute}
        handleVolumeChange={handleVolumeChange}
        toggleFullscreen={toggleFullscreen}
        chapters={activeChapters}
        onSeekToSeconds={seekToSeconds}
        onToggleChaptersDrawer={() => setIsChaptersDrawerOpen((prev) => !prev)}
        isChaptersDrawerOpen={isChaptersDrawerOpen}
        playbackRate={playbackRate}
        onPlaybackRateChange={handlePlaybackRateChange}
      />

      {/* Menu / Drawer Lateral de Capítulos do Vídeo (estilo YouTube) */}
      <VideoChaptersDrawer
        chapters={activeChapters}
        currentTime={currentTime}
        effectiveDuration={effectiveDuration}
        onSeekToSeconds={seekToSeconds}
        isOpen={isChaptersDrawerOpen}
        onClose={() => setIsChaptersDrawerOpen(false)}
      />
    </div>
  );
}
