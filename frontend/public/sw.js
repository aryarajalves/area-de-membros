// Service Worker mínimo para habilitar instalação PWA sem cachear chamadas de API

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Nunca cacheia nem intercepta chamadas de API, WebSockets ou métodos não-GET
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/ws/')
  ) {
    return;
  }

  event.respondWith(fetch(request));
});
