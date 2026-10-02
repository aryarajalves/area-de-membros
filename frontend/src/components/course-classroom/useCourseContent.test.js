import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCourseContent } from './useCourseContent';

const mockAddToast = vi.fn();

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast
  })
}));

describe('useCourseContent - uploadLessonVideo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'test-token');
  });

  it('rejects video larger than 2 GB immediately', async () => {
    const { result } = renderHook(() => useCourseContent('c-1'));

    const largeFile = new File([''], 'huge_video.mp4', { type: 'video/mp4' });
    Object.defineProperty(largeFile, 'size', { value: 3 * 1024 * 1024 * 1024 }); // 3 GB

    let url;
    await act(async () => {
      url = await result.current.uploadLessonVideo(largeFile);
    });

    expect(url).toBeNull();
    expect(mockAddToast).toHaveBeenCalledWith('O vídeo excede o tamanho máximo de 2 GB.', 'error');
  });

  it('uses direct upload when presigned url is available', async () => {
    // Mock fetch para retornar presigned url
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/generate-video-upload-url')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            direct_upload: true,
            upload_url: 'https://b2.endpoint.com/upload-target',
            final_url: 'https://cdn.b2.com/video-final.mp4',
            storage_type: 'backblaze_b2'
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      });
    });

    let createdInstance = null;
    class MockXHR {
      constructor() {
        this.upload = {};
        this.status = 200;
        this.responseText = '';
        this.open = vi.fn();
        this.setRequestHeader = vi.fn();
        this.send = vi.fn(() => {
          if (this.upload.onprogress) {
            this.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 });
          }
          if (this.onload) this.onload();
        });
        createdInstance = this;
      }
    }
    vi.stubGlobal('XMLHttpRequest', MockXHR);

    const onProgress = vi.fn();
    const { result } = renderHook(() => useCourseContent('c-1'));

    const videoFile = new File(['dummy-bytes'], 'lesson.mp4', { type: 'video/mp4' });
    let uploadedUrl;

    await act(async () => {
      uploadedUrl = await result.current.uploadLessonVideo(videoFile, onProgress);
    });

    expect(createdInstance.open).toHaveBeenCalledWith('PUT', 'https://b2.endpoint.com/upload-target');
    expect(onProgress).toHaveBeenCalledWith(50);
    expect(uploadedUrl).toBe('https://cdn.b2.com/video-final.mp4');
    expect(mockAddToast).toHaveBeenCalledWith('Upload de vídeo concluído com sucesso!', 'success');
  });

  it('falls back to standard upload if presigned generation fails or returns direct_upload=false', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/generate-video-upload-url')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            direct_upload: false,
            upload_url: null,
            final_url: null,
            storage_type: 'local'
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      });
    });

    let createdInstance = null;
    class MockXHR {
      constructor() {
        this.upload = {};
        this.status = 200;
        this.responseText = JSON.stringify({ video_url: 'https://local.api/video.mp4' });
        this.open = vi.fn();
        this.setRequestHeader = vi.fn();
        this.send = vi.fn(() => {
          if (this.onload) this.onload();
        });
        createdInstance = this;
      }
    }
    vi.stubGlobal('XMLHttpRequest', MockXHR);

    const { result } = renderHook(() => useCourseContent('c-1'));

    const videoFile = new File(['dummy-bytes'], 'fallback.mp4', { type: 'video/mp4' });
    let uploadedUrl;

    await act(async () => {
      uploadedUrl = await result.current.uploadLessonVideo(videoFile);
    });

    expect(createdInstance.open).toHaveBeenCalledWith('POST', '/api/v1/courses/upload-video');
    expect(uploadedUrl).toBe('https://local.api/video.mp4');
    expect(mockAddToast).toHaveBeenCalledWith('Upload de vídeo concluído!', 'success');
  });
});
