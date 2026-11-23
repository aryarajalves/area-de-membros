import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Service Worker (public/sw.js)', () => {
  let fetchHandler;
  const originalSelf = globalThis.self;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    const listeners = {};
    globalThis.self = {
      location: { origin: 'https://aulas.aryaraj.shop' },
      skipWaiting: vi.fn(),
      clients: { claim: vi.fn() },
      addEventListener: (event, cb) => {
        listeners[event] = cb;
      },
    };
    globalThis.fetch = vi.fn().mockResolvedValue(new Response('ok'));

    const swCode = fs.readFileSync(path.resolve(__dirname, '../../public/sw.js'), 'utf-8');
    const runner = new Function(swCode);
    runner();
    fetchHandler = listeners.fetch;
  });

  afterEach(() => {
    globalThis.self = originalSelf;
    globalThis.fetch = originalFetch;
  });

  function dispatchFetch({ url, method = 'GET', headers = {}, destination = '' }) {
    const respondWith = vi.fn();
    const headerMap = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
    fetchHandler({
      request: {
        url,
        method,
        destination,
        headers: { has: (key) => headerMap.has(key.toLowerCase()) },
      },
      respondWith,
    });
    return respondWith;
  }

  it('nunca intercepta vídeos ou mídias cross-origin (CDN/Backblaze)', () => {
    const respondWith = dispatchFetch({
      url: 'https://media.aryaraj.shop/file/zap-voice/AreaDeMembros/videos/vid_123.mp4',
      destination: 'video',
    });
    expect(respondWith).not.toHaveBeenCalled();
  });

  it('nunca intercepta Range Requests mesmo na mesma origem', () => {
    const respondWith = dispatchFetch({
      url: 'https://aulas.aryaraj.shop/uploads/aula.mp4',
      headers: { Range: 'bytes=0-1023' },
      destination: 'video',
    });
    expect(respondWith).not.toHaveBeenCalled();
  });

  it('nunca intercepta chamadas de API ou WebSocket', () => {
    expect(dispatchFetch({ url: 'https://aulas.aryaraj.shop/api/v1/courses' })).not.toHaveBeenCalled();
    expect(dispatchFetch({ url: 'https://aulas.aryaraj.shop/ws/chat' })).not.toHaveBeenCalled();
  });

  it('mantém interceptação para GET de mesma origem (habilita instalabilidade PWA)', () => {
    const respondWith = dispatchFetch({
      url: 'https://aulas.aryaraj.shop/assets/index.js',
      destination: 'script',
    });
    expect(respondWith).toHaveBeenCalledTimes(1);
  });
});
