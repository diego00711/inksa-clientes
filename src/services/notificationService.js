// src/services/notificationService.js
//
// IMPORTANTE: Diego precisa preencher FIREBASE_CONFIG com as credenciais do projeto Firebase.
// Acesse console.firebase.google.com → seu projeto → Configurações → Adicionar app web
const FIREBASE_CONFIG = {
  // apiKey: "",
  // authDomain: "",
  // projectId: "",
  // storageBucket: "",
  // messagingSenderId: "",
  // appId: ""
};

// Diego: preencha com a chave VAPID do Firebase
// (console.firebase.google.com → Configurações do Projeto → Cloud Messaging → Certificados Web Push)
const FCM_VAPID_KEY = "";

/**
 * Solicita permissão de notificação e obtém o FCM token.
 * Retorna null silenciosamente em qualquer falha — nunca quebra o fluxo de login.
 */
export async function requestNotificationPermission() {
  // 1. Verifica se browser suporta Notifications e ServiceWorker
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;

  // 2. Pede permissão ao usuário
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  // 3. Se FIREBASE_CONFIG não estiver preenchido, avisa no console e retorna null graciosamente
  if (!FIREBASE_CONFIG.apiKey) {
    console.warn('FCM: FIREBASE_CONFIG não configurado. Preencha src/services/notificationService.js');
    return null;
  }

  try {
    // 4. Importa Firebase dinamicamente para não quebrar se não configurado
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getMessaging, getToken } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js');

    const app = initializeApp(FIREBASE_CONFIG);
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: FCM_VAPID_KEY });
    return token || null;
  } catch (e) {
    console.warn('FCM token error:', e);
    return null;
  }
}

/**
 * Envia o FCM token para o backend, associando-o ao usuário logado.
 * Falhas são silenciosas — nunca quebram o fluxo de autenticação.
 */
export async function saveFcmToken(token, apiBaseUrl, authHeaders) {
  if (!token) return;
  try {
    await fetch(`${apiBaseUrl}/api/profile/fcm-token`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fcm_token: token, user_type: 'client' }),
    });
  } catch (e) {
    console.warn('FCM save token error:', e);
  }
}
