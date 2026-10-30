import { useEffect } from 'react';

/**
 * Hook de atalhos de teclado para o Player de Vídeo e Classroom:
 * - Espaço ou K: Play / Pausa
 * - Seta Esquerda ou J: Voltar 10 segundos
 * - Seta Direita ou L: Avançar 10 segundos
 * - F: Alternar Tela Cheia (Fullscreen)
 * - M: Alternar Mudo (Mute)
 * - Seta Cima: Aumentar Volume em 10%
 * - Seta Baixo: Diminuir Volume em 10%
 * - T: Alternar Modo Teatro (Player Expandido)
 */
export default function usePlayerKeyboardShortcuts({
  togglePlay,
  handleSkipBackward10,
  handleSkipForward10,
  toggleFullscreen,
  toggleMute,
  volume,
  handleVolumeChange,
  toggleTheaterMode,
  resetHideControlsTimer,
  isEnabled = true
}) {
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e) => {
      // Ignora se o usuário estiver digitando em campos de formulário, comentários ou notas
      const activeEl = document.activeElement;
      const tag = activeEl?.tagName?.toLowerCase();
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        activeEl?.isContentEditable
      ) {
        return;
      }

      const key = e.key;

      // Play / Pause: Espaço ou K
      if (key === ' ' || key === 'Spacebar' || key === 'k' || key === 'K') {
        e.preventDefault();
        togglePlay?.();
        resetHideControlsTimer?.();
        return;
      }

      // Voltar 10s: Seta Esquerda ou J
      if (key === 'ArrowLeft' || key === 'j' || key === 'J') {
        e.preventDefault();
        handleSkipBackward10?.();
        resetHideControlsTimer?.();
        return;
      }

      // Avançar 10s: Seta Direita ou L
      if (key === 'ArrowRight' || key === 'l' || key === 'L') {
        e.preventDefault();
        handleSkipForward10?.();
        resetHideControlsTimer?.();
        return;
      }

      // Tela Cheia: F
      if (key === 'f' || key === 'F') {
        e.preventDefault();
        toggleFullscreen?.();
        resetHideControlsTimer?.();
        return;
      }

      // Mudo: M
      if (key === 'm' || key === 'M') {
        e.preventDefault();
        toggleMute?.();
        resetHideControlsTimer?.();
        return;
      }

      // Aumentar Volume: Seta Cima (+10%)
      if (key === 'ArrowUp') {
        e.preventDefault();
        if (handleVolumeChange) {
          const currentVol = typeof volume === 'number' ? volume : 1;
          const nextVol = Math.min(1, Math.round((currentVol + 0.1) * 10) / 10);
          handleVolumeChange({ target: { value: nextVol } });
        }
        resetHideControlsTimer?.();
        return;
      }

      // Diminuir Volume: Seta Baixo (-10%)
      if (key === 'ArrowDown') {
        e.preventDefault();
        if (handleVolumeChange) {
          const currentVol = typeof volume === 'number' ? volume : 1;
          const nextVol = Math.max(0, Math.round((currentVol - 0.1) * 10) / 10);
          handleVolumeChange({ target: { value: nextVol } });
        }
        resetHideControlsTimer?.();
        return;
      }

      // Modo Teatro: T
      if (key === 't' || key === 'T') {
        e.preventDefault();
        toggleTheaterMode?.();
        resetHideControlsTimer?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isEnabled,
    togglePlay,
    handleSkipBackward10,
    handleSkipForward10,
    toggleFullscreen,
    toggleMute,
    volume,
    handleVolumeChange,
    toggleTheaterMode,
    resetHideControlsTimer
  ]);
}
