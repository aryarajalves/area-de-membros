// Service Worker mínimo para habilitar instalação PWA sem cachear APIs nem interceptar mídias/cross-origin

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Nunca intercepta cross-origin (CDN/Backblaze), Range Requests (streaming), APIs, WebSockets ou não-GET
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    request.headers.has('range') ||
    request.destination === 'video' ||
    request.destination === 'audio' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/ws/')
  ) {
    return;
  }

  event.respondWith(fetch(request));
});
