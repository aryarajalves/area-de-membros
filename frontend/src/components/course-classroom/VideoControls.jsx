import React from 'react';
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
import { formatSecondsToTimer } from './lessonUtils';

export default function VideoControls({
  showControls,
  isPlaying,
  isScrubbing,
  currentTime,
  effectiveDuration,
  progressPercentage,
  bufferedPercentage = 0,
  remainingSeconds,
  volume,
  isMuted,
  isFullscreen,
  progressBarRef,
  togglePlay,
  handleSkipBackward10,
  handleSkipForward10,
  handleProgressBarMouseDown,
  toggleMute,
  handleVolumeChange,
  toggleFullscreen
}) {
  return (
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
        pointerEvents: showControls || !isPlaying ? 'auto' : 'none',
        zIndex: 15
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
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '999px',
            overflow: 'hidden'
          }}
        >
          {/* Barra de Buffer (Progresso de Download à frente) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: `${Math.min(100, Math.max(0, bufferedPercentage))}%`,
              backgroundColor: 'rgba(255, 255, 255, 0.45)',
              borderRadius: '999px',
              transition: 'width 0.2s ease',
              zIndex: 1
            }}
            data-testid="video-buffered-bar"
          />

          {/* Barra Preenchida (Progresso atual de reprodução) */}
          <div
            style={{
              position: 'relative',
              width: `${progressPercentage}%`,
              height: '100%',
              backgroundColor: '#3b82f6',
              borderRadius: '999px',
              transition: isScrubbing ? 'none' : 'width 0.1s linear',
              zIndex: 2
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
            transition: 'transform 0.1s ease',
            zIndex: 3
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
  );
}
