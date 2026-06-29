const CACHE_NAME = 'newsbi-pulse-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

// Install: cache shell. Tolerante: si un recurso falla, no abortamos todo el
// install (mejor un SW parcial que ningún SW). Solo cacheamos respuestas OK,
// porque addAll rechaza con un solo 404/redirect opaco.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          fetch(url, { cache: 'no-store' })
            .then((res) => (res && res.ok ? cache.put(url, res) : null))
            .catch(() => null)
        )
      )
    )
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for pages, cache-first for same-origin assets.
//
// IMPORTANTE: el SW solo intercepta peticiones del MISMO origen. Los iframes
// del bundler de Sandpack (sandpack.codesandbox.io) y otros recursos externos
// se sirven desde otro origin y NO pasan por aquí, así que no interferimos con
// el preview del webbuilder. Aun así, cualquier fetch que falle (red caída, CSP
// bloqueando) va envuelto en .catch() para NO generar "Uncaught (in promise)
// TypeError: Failed to fetch" en la consola, que era el error reportado.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET.
  if (request.method !== 'GET') return;

  // Skip cross-origin: los dominios externos (Sandpack, supabase, etc.) se
  // sirven directamente por el navegador; el SW no debe tocarlos. Esto evita
  // "Failed to fetch" al intentar cachea/passthrough recursos que la CSP
  // controla por otra vía. Antes el check era `!url.origin.includes(...)`,
  // que era ambiguo (un substring match) y dejaba pasar cross-origin.
  if (url.origin !== self.location.origin) return;

  // API calls: network only (no cacheamos datos del usuario).
  if (url.pathname.startsWith('/api/')) return;

  // HTML pages: network first, fallback to cache.
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Solo cacheamos respuestas OK para no guardar redirects rotos.
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          // Fallback offline: servir de cache, o la raíz cacheada. Si tampoco
          // hay, devolvemos una 504 vacía en vez de dejar la promesa rota.
          caches
            .match(request)
            .then((r) => r || caches.match('/'))
            .then((r) => r || new Response('', { status: 504, statusText: 'Gateway Timeout' }))
        )
    );
    return;
  }

  // Same-origin static assets: cache first, fallback to network.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        // SWALLOW el error: devolvemos una Response 504 vacía en vez de dejar
        // la promesa sin capturar. ESTO es lo que tiraba "Failed to fetch" en
        // la línea 56 anterior (el fetch de assets no tenía .catch()).
        .catch(() => new Response('', { status: 504, statusText: 'Gateway Timeout' }));
    })
  );
});