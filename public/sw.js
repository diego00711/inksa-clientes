// v15 (05/09/2026): o activate abaixo apaga todo cache de nome diferente, entao
// subir este numero e o que limpa as entradas envenenadas descritas em ehFallbackDeSPA.
const CACHE_NAME = 'inksa-cliente-v15';

// O host devolve o index.html — HTTP 200, content-type text/html — para
// QUALQUER caminho que nao existe, inclusive /assets/*. Como `res.ok` e true
// nesse caso, este worker guardava a PAGINA HTML no cache sob o nome de um
// arquivo .js. E como a leitura de asset e cache-first, a partir dali o
// navegador recebia HTML no lugar de JavaScript para sempre: tela branca
// PERMANENTE, imune a recarregar, imune ao reload de vite:preloadError.
//
// Acontece na janela do deploy: o index novo entra no ar apontando para chunks
// que ainda estao subindo. Quem carrega o app nesses segundos envenena o
// proprio cache e fica travado depois que o deploy termina. Aqui isso e o
// cliente que nao consegue mais abrir o app pra pedir, e nao reclama — some.
//
// Um asset com hash no nome NUNCA e text/html. Entao isso basta pra separar.
const ehFallbackDeSPA = (res) =>
  !!res && (res.headers.get('content-type') || '').includes('text/html');

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
  // A checagem de versao do app (?__ver=) TEM que ir na rede. Se viesse do
  // cache, o app compararia o index guardado com ele mesmo e nunca veria
  // versao nova — que e exatamente o problema que ela existe pra resolver.
  if (request.url.includes('__ver=')) return;

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
      // Entrada envenenada por uma versao anterior deste worker: descarta e
      // trata como se nao existisse, senao a tela branca sobrevive ao upgrade.
      if (ehFallbackDeSPA(cached)) {
        caches.open(CACHE_NAME).then(c => c.delete(request)).catch(() => {});
        cached = null;
      }
      const network = fetch(request).then(res => {
        // So guarda o que e mesmo um asset. HTML aqui e o 404 disfarcado.
        if (res && res.ok && !ehFallbackDeSPA(res)) {
          caches.open(CACHE_NAME).then(c => c.put(request, res.clone()));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

// SEM listener de `push` aqui, de proposito. Quem recebe push e a
// registration do FCM (firebase-messaging-sw.js, no escopo dele) —
// ninguem chama pushManager.subscribe neste worker, entao este listener
// era codigo morto. Pior: dois workers capazes de desenhar notificacao e
// uma armadilha, porque no dia em que alguem inscrever este aqui, volta a
// aparecer notificacao duplicada — e o motivo estaria em outro arquivo.

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// Keep-alive: pinga o backend a cada 10 min para evitar cold start no Render
const BACKEND_HEALTH = 'https://inksa-auth-flask-dev.onrender.com/api/health';
setInterval(() => {
  fetch(BACKEND_HEALTH, { cache: 'no-store' }).catch(() => {});
}, 10 * 60 * 1000);
