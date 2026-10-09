import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Bookmark,
  Gauge
} from 'lucide-react';
import { formatSecondsToTimer } from './lessonUtils';
import VideoChaptersTrack from './VideoChaptersTrack';

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
  toggleFullscreen,
  chapters = [],
  onSeekToSeconds,
  onToggleChaptersDrawer,
  isChaptersDrawerOpen = false,
  playbackRate = 1,
  onPlaybackRateChange
}) {
  const [hoveredChapter, setHoveredChapter] = useState(null);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const hasChapters = Array.isArray(chapters) && chapters.length > 0;
  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // Capítulo atualmente sendo reproduzido
  const activeChapter = hasChapters
    ? [...chapters].sort((a, b) => (a.seconds || 0) - (b.seconds || 0)).filter((c) => (c.seconds || 0) <= currentTime).pop()
    : null;
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
        {/* Tooltip de Pré-visualização do Capítulo ao passar o mouse */}
        {hoveredChapter && (
          <div
            style={{
              position: 'absolute',
              bottom: '22px',
              left: `${Math.min(90, Math.max(10, ((hoveredChapter.startSec || 0) / (effectiveDuration || 1)) * 100))}%`,
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(9, 13, 22, 0.95)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
              zIndex: 30,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            data-testid="video-chapter-hover-tooltip"
          >
            <span style={{ color: '#60a5fa' }}>{hoveredChapter.time}</span>
            <span>•</span>
            <span>{hoveredChapter.title}</span>
          </div>
        )}

        {/* Trilho Fundo (ou Trilha de Capítulos estilo YouTube) */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '5px',
            backgroundColor: hasChapters ? 'transparent' : 'rgba(255, 255, 255, 0.2)',
            borderRadius: '999px',
            overflow: hasChapters ? 'visible' : 'hidden'
          }}
        >
          {/* Se houver capítulos gerados por IA, renderiza a trilha segmentada estilo YouTube */}
          {hasChapters ? (
            <VideoChaptersTrack
              chapters={chapters}
              effectiveDuration={effectiveDuration}
              currentTime={currentTime}
              onSeekToSeconds={onSeekToSeconds}
              hoveredChapter={hoveredChapter}
              setHoveredChapter={setHoveredChapter}
            />
          ) : (
            <>
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
            </>
          )}
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
            zIndex: 10
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

            {/* Badge do Capítulo Ativo (estilo YouTube ao lado do tempo) */}
            {activeChapter && (
              <button
                type="button"
                onClick={onToggleChaptersDrawer}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  marginLeft: '4px',
                  cursor: 'pointer',
                  maxWidth: '180px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title="Clique para ver todos os capítulos"
                data-testid="video-active-chapter-badge"
              >
                <Bookmark size={11} color="#60a5fa" />
                <span data-testid="active-chapter-indicator" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeChapter.title}</span>
              </button>
            )}
          </div>
        </div>

        {/* Lado Direito: Capítulos, Volume e Tela Cheia */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Botão de Capítulos (se houver capítulos na aula) */}
          {hasChapters && (
            <button
              type="button"
              onClick={onToggleChaptersDrawer}
              title={isChaptersDrawerOpen ? 'Fechar Capítulos' : 'Ver Capítulos da Aula'}
              style={{
                background: isChaptersDrawerOpen ? 'rgba(59, 130, 246, 0.25)' : 'none',
                border: isChaptersDrawerOpen ? '1px solid rgba(59, 130, 246, 0.5)' : 'none',
                color: isChaptersDrawerOpen ? '#60a5fa' : '#ffffff',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11.5px',
                fontWeight: 600
              }}
              data-testid="btn-toggle-video-chapters"
            >
              <Bookmark size={16} />
              <span style={{ display: 'none' }}>Capítulos</span>
            </button>
          )}

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

          {/* Seletor de Velocidade de Reprodução (Playback Rate) */}
          <div style={{ position: 'relative' }} data-testid="video-speed-selector-container">
            <button
              type="button"
              onClick={() => setIsSpeedMenuOpen((prev) => !prev)}
              title="Velocidade de Reprodução"
              style={{
                background: isSpeedMenuOpen || playbackRate !== 1 ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                border: isSpeedMenuOpen || playbackRate !== 1 ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.15)',
                color: isSpeedMenuOpen || playbackRate !== 1 ? '#60a5fa' : '#ffffff',
                cursor: 'pointer',
                padding: '3px 7px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11.5px',
                fontWeight: 600,
                outline: 'none',
                transition: 'all 0.15s ease'
              }}
              data-testid="video-speed-btn"
            >
              <Gauge size={13} />
              <span data-testid="video-speed-label">{playbackRate === 1 ? '1x' : `${playbackRate}x`}</span>
            </button>

            {/* Menu Popover Flutuante de Velocidades */}
            {isSpeedMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '36px',
                  right: 0,
                  backgroundColor: 'rgba(10, 15, 29, 0.96)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  borderRadius: '10px',
                  padding: '6px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(37, 99, 235, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  minWidth: '100px',
                  zIndex: 40
                }}
                data-testid="video-speed-menu"
              >
                <div style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Velocidade
                </div>
                {speedOptions.map((speed) => {
                  const isSelected = playbackRate === speed;
                  return (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => {
                        if (onPlaybackRateChange) onPlaybackRateChange(speed);
                        setIsSpeedMenuOpen(false);
                      }}
                      data-testid={`video-speed-option-${speed}`}
                      style={{
                        background: isSelected ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                        border: 'none',
                        color: isSelected ? '#60a5fa' : '#f8fafc',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '11.5px',
                        fontWeight: isSelected ? 700 : 500,
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <span>{speed === 1 ? '1x (Normal)' : `${speed}x`}</span>
                      {isSelected && <span style={{ color: '#38bdf8', fontSize: '12px' }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
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
