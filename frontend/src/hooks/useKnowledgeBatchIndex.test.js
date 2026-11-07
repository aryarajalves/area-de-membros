import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useKnowledgeBatchIndex } from './useKnowledgeBatchIndex';

describe('useKnowledgeBatchIndex hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default closed state and empty stats', () => {
    const { result } = renderHook(() => useKnowledgeBatchIndex());

    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isCompleted).toBe(false);
    expect(result.current.progressPct).toBe(0);
    expect(result.current.total).toBe(0);
    expect(result.current.logs).toEqual([]);
  });

  it('iterates through lessons, updates progress percentage and stats on success', async () => {
    const mockGetHeaders = vi.fn().mockReturnValue({ Authorization: 'Bearer test' });
    const mockOnComplete = vi.fn();

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/lessons/1/index')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', chunks_count: 10, qa_count: 5, message: 'OK 1' })
        });
      }
      if (url.includes('/lessons/2/index')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', chunks_count: 8, qa_count: 5, message: 'OK 2' })
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    const { result } = renderHook(() => useKnowledgeBatchIndex(mockGetHeaders, mockOnComplete));

    const lessons = [
      { lesson_id: 1, lesson_title: 'Aula de Teste 1' },
      { lesson_id: 2, lesson_title: 'Aula de Teste 2' }
    ];

    await act(async () => {
      await result.current.startBatchIndex(lessons);
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isCompleted).toBe(true);
    expect(result.current.progressPct).toBe(100);
    expect(result.current.stats.totalSuccess).toBe(2);
    expect(result.current.stats.totalChunks).toBe(18);
    expect(result.current.logs.length).toBe(2);

    expect(mockOnComplete).toHaveBeenCalledWith({
      total: 2,
      successCount: 2,
      failedCount: 0,
      chunksCount: 18,
      qaCount: 10,
      isCancelled: false
    });
  });

  it('handles lesson failure gracefully and continues with remaining lessons', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/lessons/1/index')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ detail: 'Falha na transcrição' })
        });
      }
      if (url.includes('/lessons/2/index')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', chunks_count: 12, qa_count: 5 })
        });
      }
      return Promise.reject(new Error('Unknown'));
    });

    const { result } = renderHook(() => useKnowledgeBatchIndex());

    const lessons = [
      { lesson_id: 1, lesson_title: 'Aula Falha' },
      { lesson_id: 2, lesson_title: 'Aula Sucesso' }
    ];

    await act(async () => {
      await result.current.startBatchIndex(lessons);
    });

    expect(result.current.stats.totalSuccess).toBe(1);
    expect(result.current.stats.totalFailed).toBe(1);
    expect(result.current.stats.totalChunks).toBe(12);
    expect(result.current.logs[0].status).toBe('error');
    expect(result.current.logs[1].status).toBe('success');
  });

  it('allows cancelling batch indexing', () => {
    const { result } = renderHook(() => useKnowledgeBatchIndex());

    act(() => {
      result.current.cancelBatchIndex();
    });

    expect(result.current.isCancelled).toBe(true);
    expect(result.current.isRunning).toBe(false);
  });
});
