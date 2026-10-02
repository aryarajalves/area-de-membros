import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UploadQueueProvider, useUploadQueue } from './UploadQueueContext';

const mockAddToast = vi.fn();
vi.mock('./ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast
  })
}));

describe('UploadQueueContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'test-token');
  });

  it('rejects files larger than 2 GB and adds toast error', async () => {
    const wrapper = ({ children }) => <UploadQueueProvider>{children}</UploadQueueProvider>;
    const { result } = renderHook(() => useUploadQueue(), { wrapper });

    const hugeFile = new File([''], 'huge.mp4', { type: 'video/mp4' });
    Object.defineProperty(hugeFile, 'size', { value: 3 * 1024 * 1024 * 1024 });

    let uploadRes;
    await act(async () => {
      uploadRes = await result.current.startVideoUpload({ file: hugeFile });
    });

    expect(uploadRes).toBeNull();
    expect(mockAddToast).toHaveBeenCalledWith('O arquivo excede o limite máximo permitido de 2 GB.', 'error');
  });

  it('allows canceling an ongoing upload via cancelUpload', async () => {
    // Simula XMLHttpRequest que fica aberto até cancelamento
    const mockAbort = vi.fn();
    class MockXHR {
      constructor() {
        this.upload = {};
        this.open = vi.fn();
        this.setRequestHeader = vi.fn();
        this.send = vi.fn();
        this.abort = mockAbort;
      }
    }
    vi.stubGlobal('XMLHttpRequest', MockXHR);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        direct_upload: true,
        upload_url: 'https://b2.com/upload',
        final_url: 'https://b2.com/final.mp4'
      })
    });

    const wrapper = ({ children }) => <UploadQueueProvider>{children}</UploadQueueProvider>;
    const { result } = renderHook(() => useUploadQueue(), { wrapper });

    const file = new File(['video-content'], 'test.mp4', { type: 'video/mp4' });

    let uploadPromise;
    act(() => {
      uploadPromise = result.current.startVideoUpload({ file, lessonTitle: 'Aula Teste' });
    });

    // Permite que a microtask do fetch resolva e instancie o XHR
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.uploads.length).toBeGreaterThan(0);
    const uploadId = result.current.uploads[0].id;

    act(() => {
      result.current.cancelUpload(uploadId);
    });

    expect(mockAbort).toHaveBeenCalled();
    expect(result.current.uploads[0].status).toBe('cancelled');
    expect(mockAddToast).toHaveBeenCalledWith('Upload cancelado pelo usuário.', 'info');
  });
});
