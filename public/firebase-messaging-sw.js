/* firebase-messaging-sw.js — service worker do Firebase Cloud Messaging.
 *
 * POR QUE ESTE ARQUIVO EXISTE: o `getToken()` do FCM procura um service worker
 * com EXATAMENTE este nome na raiz do site. Sem ele, o getToken lança, o
 * `catch` do notificationService devolve null em silêncio, e nenhum token é
 * salvo. Era por isso que havia ZERO tokens no banco (19 clientes, 14
 * parceiros, 6 entregadores) e TODO push do backend morria no
 * `_get_fcm_token` retornando None — inclusive os avisos de pedido.
 *
 * A config é a mesma de src/services/notificationService.js. Precisa estar
 * repetida aqui: service worker roda fora do bundle e não importa do app.
 *
 * ⚠️ Web Push NÃO funciona dentro do WebView do Android (APK instalado). Este
 * arquivo cobre navegador e PWA. Pro app instalado é preciso
 * @capacitor/push-notifications + google-services.json + AAB novo.
 */
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA_DLxPwOxbhCSeQFs21GaK2sU51gaxJQ0",
  authDomain: "inksa-delivery.firebaseapp.com",
  projectId: "inksa-delivery",
  storageBucket: "inksa-delivery.firebasestorage.app",
  messagingSenderId: "2366391589",
  appId: "1:2366391589:web:7011af9ee2d7a3b355c6cc",
});

const messaging = firebase.messaging();

// Push recebido com o app FECHADO ou em segundo plano.
messaging.onBackgroundMessage((payload) => {
  const n = payload.notification || {};
  const d = payload.data || {};
  self.registration.showNotification(n.title || 'Inksa Delivery', {
    body: n.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    // tag agrupa por pedido: aviso novo do MESMO pedido substitui o anterior
    // em vez de empilhar 4 notificações do mesmo acompanhamento.
    tag: d.order_id || d.tag || 'inksa',
    data: d,
  });
});

// Tocar na notificação: leva pra tela certa em vez de só abrir a home.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const d = event.notification.data || {};
  const destino = d.url || (d.order_id ? `/pedido/${d.order_id}/acompanhar` : '/');
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      // Já tem uma aba do app aberta? Reaproveita em vez de abrir outra.
      for (const c of lista) {
        if (c.url.includes(self.location.origin) && 'focus' in c) {
          c.navigate(destino);
          return c.focus();
        }
      }
      return clients.openWindow(destino);
    })
  );
});
