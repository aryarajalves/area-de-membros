import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import usePlayerKeyboardShortcuts from './usePlayerKeyboardShortcuts';

describe('usePlayerKeyboardShortcuts', () => {
  it('dispara togglePlay ao pressionar Espaço ou K', () => {
    const togglePlay = vi.fn();
    renderHook(() =>
      usePlayerKeyboardShortcuts({
        togglePlay,
        isEnabled: true
      })
    );

    // Tecla Espaço
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    window.dispatchEvent(spaceEvent);
    expect(togglePlay).toHaveBeenCalledTimes(1);
    expect(spaceEvent.defaultPrevented).toBe(true);

    // Tecla K
    const kEvent = new KeyboardEvent('keydown', { key: 'k', bubbles: true, cancelable: true });
    window.dispatchEvent(kEvent);
    expect(togglePlay).toHaveBeenCalledTimes(2);
  });

  it('dispara salto de 10s ao pressionar setas Esquerda e Direita', () => {
    const handleSkipBackward10 = vi.fn();
    const handleSkipForward10 = vi.fn();

    renderHook(() =>
      usePlayerKeyboardShortcuts({
        handleSkipBackward10,
        handleSkipForward10,
        isEnabled: true
      })
    );

    // Seta Esquerda
    const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true });
    window.dispatchEvent(leftEvent);
    expect(handleSkipBackward10).toHaveBeenCalledTimes(1);
    expect(leftEvent.defaultPrevented).toBe(true);

    // Seta Direita
    const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    window.dispatchEvent(rightEvent);
    expect(handleSkipForward10).toHaveBeenCalledTimes(1);
    expect(rightEvent.defaultPrevented).toBe(true);
  });

  it('dispara fullscreen (F), mute (M) e modo teatro (T)', () => {
    const toggleFullscreen = vi.fn();
    const toggleMute = vi.fn();
    const toggleTheaterMode = vi.fn();

    renderHook(() =>
      usePlayerKeyboardShortcuts({
        toggleFullscreen,
        toggleMute,
        toggleTheaterMode,
        isEnabled: true
      })
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', bubbles: true }));
    expect(toggleFullscreen).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true }));
    expect(toggleMute).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 't', bubbles: true }));
    expect(toggleTheaterMode).toHaveBeenCalledTimes(1);
  });

  it('ajusta volume com setas Cima e Baixo', () => {
    const handleVolumeChange = vi.fn();

    renderHook(() =>
      usePlayerKeyboardShortcuts({
        volume: 0.5,
        handleVolumeChange,
        isEnabled: true
      })
    );

    // Seta Cima -> 0.6
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
    expect(handleVolumeChange).toHaveBeenCalledWith(expect.objectContaining({
      target: { value: 0.6 }
    }));

    // Seta Baixo -> 0.4
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    expect(handleVolumeChange).toHaveBeenCalledWith(expect.objectContaining({
      target: { value: 0.4 }
    }));
  });

  it('NÃO dispara atalhos se o foco estiver em um input ou textarea', () => {
    const togglePlay = vi.fn();

    renderHook(() =>
      usePlayerKeyboardShortcuts({
        togglePlay,
        isEnabled: true
      })
    );

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    input.dispatchEvent(event);

    expect(togglePlay).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });
});
