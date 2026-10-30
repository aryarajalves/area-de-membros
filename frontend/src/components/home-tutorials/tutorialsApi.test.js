import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadTutorialVideoApi } from './tutorialsApi';

describe('tutorialsApi uploadTutorialVideoApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uploads video successfully and calls onProgress callback', async () => {
    const mockFile = new File(['fake video data'], 'aula.mp4', { type: 'video/mp4' });
    const progressCalls = [];
    const onProgress = (percent, loaded, total) => {
      progressCalls.push({ percent, loaded, total });
    };

    class MockXHR {
      constructor() {
        this.open = vi.fn();
        this.setRequestHeader = vi.fn();
        this.upload = {};
        this.status = 200;
        this.responseText = '';
        this.onload = null;
        this.onerror = null;
        this.ontimeout = null;
      }

      send() {
        if (this.upload && this.upload.onprogress) {
          this.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 });
          this.upload.onprogress({ lengthComputable: true, loaded: 100, total: 100 });
        }
        this.status = 200;
        this.responseText = JSON.stringify({
          video_url: 'https://b2.com/video.mp4',
          video_key: 'AreaDeMembros/tutorials/video.mp4',
        });
        if (this.onload) this.onload();
      }
    }

    vi.stubGlobal('XMLHttpRequest', MockXHR);

    const result = await uploadTutorialVideoApi(mockFile, 'mock-jwt-token', onProgress);

    expect(progressCalls).toEqual([
      { percent: 50, loaded: 50, total: 100 },
      { percent: 100, loaded: 100, total: 100 },
    ]);
    expect(result).toEqual({
      video_url: 'https://b2.com/video.mp4',
      video_key: 'AreaDeMembros/tutorials/video.mp4',
    });
  });

  it('rejects with error when server returns HTTP error status', async () => {
    const mockFile = new File(['fake'], 'erro.mp4', { type: 'video/mp4' });

    class MockXHR {
      constructor() {
        this.open = vi.fn();
        this.setRequestHeader = vi.fn();
        this.upload = {};
        this.status = 413;
        this.responseText = JSON.stringify({ detail: 'Arquivo muito grande.' });
        this.onload = null;
        this.onerror = null;
      }

      send() {
        if (this.onload) this.onload();
      }
    }

    vi.stubGlobal('XMLHttpRequest', MockXHR);

    await expect(uploadTutorialVideoApi(mockFile, 'token')).rejects.toThrow('Arquivo muito grande.');
  });

  it('rejects with network error when onerror is triggered', async () => {
    const mockFile = new File(['fake'], 'rede.mp4', { type: 'video/mp4' });

    class MockXHR {
      constructor() {
        this.open = vi.fn();
        this.setRequestHeader = vi.fn();
        this.upload = {};
        this.onload = null;
        this.onerror = null;
      }

      send() {
        if (this.onerror) this.onerror();
      }
    }

    vi.stubGlobal('XMLHttpRequest', MockXHR);

    await expect(uploadTutorialVideoApi(mockFile, 'token')).rejects.toThrow(
      'Erro de conexão ao enviar o arquivo de vídeo. Verifique sua rede.'
    );
  });
});
