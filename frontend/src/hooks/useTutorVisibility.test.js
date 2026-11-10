import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTutorVisibility } from './useTutorVisibility';

describe('useTutorVisibility Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('retorna isTutorVisible = true imediatamente para superadmin e admin sem chamar fetch', () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    const { result: resAdmin } = renderHook(() =>
      useTutorVisibility({ id: 1, role: 'admin' })
    );
    expect(resAdmin.current.isTutorVisible).toBe(true);
    expect(resAdmin.current.loading).toBe(false);

    const { result: resSuper } = renderHook(() =>
      useTutorVisibility({ id: 2, role: 'superadmin' })
    );
    expect(resSuper.current.isTutorVisible).toBe(true);
    expect(resSuper.current.loading).toBe(false);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('retorna isTutorVisible = false para aluno quando API responde is_visible: false (modo Oculto/Privado)', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        is_visible: false,
        access_mode: 'private_team',
        can_ask: false
      })
    });

    const { result } = renderHook(() =>
      useTutorVisibility({ id: 42, role: 'aluno' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.isTutorVisible).toBe(false);
    });
  });

  it('retorna isTutorVisible = true para aluno quando API responde is_visible: true (modo Liberado para Todos)', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        is_visible: true,
        access_mode: 'public',
        can_ask: true
      })
    });

    const { result } = renderHook(() =>
      useTutorVisibility({ id: 42, role: 'aluno' })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.isTutorVisible).toBe(true);
    });
  });

  it('reage ao evento customizado tutor-settings-updated atualizando a visibilidade em tempo real', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        is_visible: true,
        access_mode: 'public'
      })
    });

    const { result } = renderHook(() =>
      useTutorVisibility({ id: 42, role: 'aluno' })
    );

    await waitFor(() => {
      expect(result.current.isTutorVisible).toBe(true);
    });

    act(() => {
      window.dispatchEvent(
        new CustomEvent('tutor-settings-updated', {
          detail: { is_visible: false, access_mode: 'private_team' }
        })
      );
    });

    expect(result.current.isTutorVisible).toBe(false);
  });
});
