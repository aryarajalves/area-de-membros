import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useUrlNavigation } from './useUrlNavigation';

describe('useUrlNavigation hook', () => {
  let originalLocation;
  let dispatchEventSpy;

  beforeEach(() => {
    vi.useFakeTimers();
    originalLocation = window.location;
    dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
  });

  afterEach(() => {
    vi.useRealTimers();
    dispatchEventSpy.mockRestore();
    window.location = originalLocation;
  });

  it('does nothing when search parameters are empty', () => {
    delete window.location;
    window.location = new URL('http://localhost:3010/');

    const onSelectTab = vi.fn();
    renderHook(() => useUrlNavigation({ user: { role: 'admin' }, onSelectTab }));

    expect(onSelectTab).not.toHaveBeenCalled();
    expect(dispatchEventSpy).not.toHaveBeenCalled();
  });

  it('selects tab when ?tab=support is in URL', () => {
    delete window.location;
    window.location = new URL('http://localhost:3010/?tab=support');

    const onSelectTab = vi.fn();
    renderHook(() => useUrlNavigation({ user: { role: 'aluno' }, onSelectTab }));

    expect(onSelectTab).toHaveBeenCalledWith('support');
  });

  it('redirects aluno to courses tab if attempting to access forbidden tab', () => {
    delete window.location;
    window.location = new URL('http://localhost:3010/?tab=funnels');

    const onSelectTab = vi.fn();
    renderHook(() => useUrlNavigation({ user: { role: 'aluno' }, onSelectTab }));

    expect(onSelectTab).toHaveBeenCalledWith('courses');
  });

  it('dispatches open_course_lesson event when courseId and lessonId are in search params', () => {
    delete window.location;
    window.location = new URL('http://localhost:3010/?tab=courses&courseId=42&lessonId=99');

    const onSelectTab = vi.fn();
    renderHook(() => useUrlNavigation({ user: { role: 'aluno' }, onSelectTab }));

    expect(onSelectTab).toHaveBeenCalledWith('courses');

    vi.advanceTimersByTime(300);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'open_course_lesson',
        detail: {
          courseId: 42,
          lessonId: 99,
        },
      })
    );
  });

  it('cleans up query parameters from URL via replaceState after processing navigation', () => {
    delete window.location;
    window.location = new URL('http://localhost:3010/?tab=courses&courseId=1&lessonId=44');

    const replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});

    const onSelectTab = vi.fn();
    renderHook(() => useUrlNavigation({ user: { role: 'admin' }, onSelectTab }));

    expect(replaceStateSpy).toHaveBeenCalledWith({}, expect.any(String), '/');
    replaceStateSpy.mockRestore();
  });

  it('only processes navigation parameters once and ignores subsequent re-renders', () => {
    delete window.location;
    window.location = new URL('http://localhost:3010/?tab=support');

    const onSelectTab = vi.fn();
    const { rerender } = renderHook(
      ({ user, onSelectTab }) => useUrlNavigation({ user, onSelectTab }),
      { initialProps: { user: { role: 'admin' }, onSelectTab } }
    );

    expect(onSelectTab).toHaveBeenCalledTimes(1);
    expect(onSelectTab).toHaveBeenCalledWith('support');

    // Simula re-renderização (ex: clique na barra lateral mudando props)
    rerender({ user: { role: 'admin' }, onSelectTab: vi.fn() });

    // Não deve chamar novamente
    expect(onSelectTab).toHaveBeenCalledTimes(1);
  });
});
