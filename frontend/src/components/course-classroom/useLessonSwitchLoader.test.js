import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLessonSwitchLoader } from './useLessonSwitchLoader';

describe('useLessonSwitchLoader', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('fecha automaticamente o popup de troca de aula após o timeout máximo de 4 segundos mesmo se a rede travar', async () => {
    // Simula requisições que nunca respondem (rede travada)
    global.fetch = vi.fn(() => new Promise(() => {}));

    const { result, rerender } = renderHook(
      ({ lesson }) => useLessonSwitchLoader({ courseId: 1, moduleId: 2, lesson }),
      { initialProps: { lesson: { id: 10, module_id: 2 } } }
    );

    expect(result.current.isSwitchingLesson).toBe(false);

    // Troca para a aula 11 -> abre modal de carregamento
    rerender({ lesson: { id: 11, module_id: 2 } });
    expect(result.current.isSwitchingLesson).toBe(true);

    // Após 4000ms o safety timeout garante fechamento do modal
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current.isSwitchingLesson).toBe(false);
  });
});
