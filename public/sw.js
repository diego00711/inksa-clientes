const CACHE_NAME = 'inksa-cliente-v4';

self.addEventListener('install', (event) => {
  // Nao pre-cacheia o index: ele sera cacheado (atualizado) a cada navegacao com rede
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!request.url.startsWith('http')) return;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return;
  if (request.url.includes('/api/')) return;

  // Navegacao: SEMPRE network-first + atualiza a copia offline do index.
  // Evita servir um index antigo apontando para bundles que ja sairam do ar (tela travada).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put('/', copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match('/').then(r => r || new Response('Offline', { status: 503 })))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(res => {
        if (res && res.ok) caches.open(CACHE_NAME).then(c => c.put(request, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { title: 'Inksa', body: event.data.text() }; }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Inksa Delivery', {
      body: data.body || 'Nova notificação',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// Keep-alive: pinga o backend a cada 10 min para evitar cold start no Render
const BACKEND_HEALTH = 'https://inksa-auth-flask-dev.onrender.com/api/health';
setInterval(() => {
  fetch(BACKEND_HEALTH, { cache: 'no-store' }).catch(() => {});
}, 10 * 60 * 1000);
