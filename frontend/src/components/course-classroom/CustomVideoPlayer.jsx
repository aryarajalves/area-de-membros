import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize
} from 'lucide-react';
import { formatSecondsToTimer, parseDurationToSeconds } from './lessonUtils';

export default function CustomVideoPlayer({
  src,
  poster,
  title,
  lessonDuration
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const hideControlsTimeoutRef = useRef(null);

  // Duração de fallback a partir da aula cadastrada (caso video.duration seja Infinity/NaN em streams parciais)
  const fallbackDuration = parseDurationToSeconds(lessonDuration);

  // Inicializa e atualiza duração ao carregar metadados do vídeo
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const vidDuration = videoRef.current.duration;
      if (vidDuration && !isNaN(vidDuration) && vidDuration !== Infinity) {
        setDuration(vidDuration);
      } else if (fallbackDuration > 0) {
        setDuration(fallbackDuration);
      }
    }
  };

  // Se o fallbackDuration mudar e duration for 0, atualiza
  useEffect(() => {
    if (duration === 0 && fallbackDuration > 0) {
      setDuration(fallbackDuration);
    }
  }, [fallbackDuration, duration]);

  // Atualização contínua do tempo durante a reprodução
  const handleTimeUpdate = () => {
    if (!isScrubbing && videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      const vidDuration = videoRef.current.duration;
      if (vidDuration && !isNaN(vidDuration) && vidDuration !== Infinity && vidDuration !== duration) {
        setDuration(vidDuration);
      }
    }
  };

  // Play / Pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // Retroceder 10 segundos
  const handleSkipBackward10 = () => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, videoRef.current.currentTime - 10);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Avançar 10 segundos
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

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Ocultação automática dos controles durante a reprodução
  const resetHideControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    if (isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        if (!isScrubbing) {
          setShowControls(false);
        }
      }, 3000);
    }
  }, [isPlaying, isScrubbing]);

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
        poster={poster || undefined}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
        style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }}
        data-testid="lesson-html5-video"
      >
        Seu navegador não suporta a reprodução deste vídeo.
      </video>

      {/* Overlay de Controles */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)',
          padding: '12px 16px 8px',
          opacity: showControls || !isPlaying ? 1 : 0,
          transition: 'opacity 0.25s ease',
          pointerEvents: showControls || !isPlaying ? 'auto' : 'none'
        }}
        data-testid="custom-video-controls"
      >
        {/* Barra de Progresso Interativa (Scrubbing / Seeking) */}
        <div
          ref={progressBarRef}
          onMouseDown={handleProgressBarMouseDown}
          title="Clique ou arraste para avançar ou voltar no vídeo"
          style={{
            position: 'relative',
            width: '100%',
            height: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px'
          }}
          data-testid="video-progress-bar-container"
        >
          {/* Trilho Fundo */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '5px',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              borderRadius: '999px',
              overflow: 'hidden'
            }}
          >
            {/* Barra Preenchida */}
            <div
              style={{
                width: `${progressPercentage}%`,
                height: '100%',
                backgroundColor: '#3b82f6',
                borderRadius: '999px',
                transition: isScrubbing ? 'none' : 'width 0.1s linear'
              }}
              data-testid="video-progress-filled"
            />
          </div>

          {/* Marcador Circular (Thumb) */}
          <div
            style={{
              position: 'absolute',
              left: `calc(${progressPercentage}% - 6px)`,
              width: '12px',
              height: '12px',
              backgroundColor: '#ffffff',
              borderRadius: '50%',
              boxShadow: '0 0 6px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
              transform: isScrubbing ? 'scale(1.25)' : 'scale(1)',
              transition: 'transform 0.1s ease'
            }}
            data-testid="video-progress-thumb"
          />
        </div>

        {/* Linha de Botões e Informações de Tempo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#ffffff' }}>
          {/* Lado Esquerdo: Play/Pause, -10s, +10s e Mostrador de Tempo e Tempo Restante */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Play/Pause */}
            <button
              type="button"
              onClick={togglePlay}
              title={isPlaying ? 'Pausar' : 'Reproduzir'}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              data-testid="video-play-pause-btn"
            >
              {isPlaying ? <Pause size={20} fill="#ffffff" /> : <Play size={20} fill="#ffffff" />}
            </button>

            {/* Retroceder 10 segundos */}
            <button
              type="button"
              onClick={handleSkipBackward10}
              title="Retroceder 10 segundos"
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '4px 6px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '4px'
              }}
              data-testid="skip-backward-10-btn"
            >
              <RotateCcw size={16} />
              <span>-10s</span>
            </button>

            {/* Avançar 10 segundos */}
            <button
              type="button"
              onClick={handleSkipForward10}
              title="Avançar 10 segundos"
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '4px 6px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '4px'
              }}
              data-testid="skip-forward-10-btn"
            >
              <span>+10s</span>
              <RotateCw size={16} />
            </button>

            {/* Tempo Atual / Duração Total e Tempo Restante ("quanto está faltando") */}
            <div
              style={{
                fontSize: '12px',
                color: '#e2e8f0',
                marginLeft: '6px',
                fontVariantNumeric: 'tabular-nums',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              data-testid="video-time-display"
            >
              <span>{formatSecondsToTimer(currentTime)}</span>
              <span style={{ color: '#94a3b8' }}>/</span>
              <span>{formatSecondsToTimer(effectiveDuration)}</span>
              <span
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.25)',
                  color: '#93c5fd',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  marginLeft: '4px'
                }}
                title="Tempo restante para o término do vídeo"
                data-testid="video-remaining-time"
              >
                Faltam {formatSecondsToTimer(remainingSeconds)}
              </span>
            </div>
          </div>

          {/* Lado Direito: Volume e Tela Cheia */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Controle de Volume */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={toggleMute}
                title={isMuted ? 'Desmutar' : 'Mutar'}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}
                data-testid="video-mute-btn"
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                style={{ width: '55px', height: '4px', accentColor: '#3b82f6', cursor: 'pointer' }}
                title="Ajustar Volume"
                data-testid="video-volume-slider"
              />
            </div>

            {/* Botão Tela Cheia */}
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
              data-testid="video-fullscreen-btn"
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
