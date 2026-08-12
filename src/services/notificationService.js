// src/services/notificationService.js
//
// IMPORTANTE: Diego precisa preencher FIREBASE_CONFIG com as credenciais do projeto Firebase.
// Acesse console.firebase.google.com → seu projeto → Configurações → Adicionar app web
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA_DLxPwOxbhCSeQFs21GaK2sU51gaxJQ0",
  authDomain: "inksa-delivery.firebaseapp.com",
  projectId: "inksa-delivery",
  storageBucket: "inksa-delivery.firebasestorage.app",
  messagingSenderId: "2366391589",
  appId: "1:2366391589:web:7011af9ee2d7a3b355c6cc",
  measurementId: "G-5E4ND4JN1H"
};

const FCM_VAPID_KEY = "BOUov-X15lwK9B-Hd7er7rhnPZCzYxunkqEeeTo71A8gOxuCCQIEh_MQWNEOu7rxmIT4iaN9zim4FKurj2dwPAPc";

/**
 * Solicita permissão de notificação e obtém o FCM token.
 * Retorna null silenciosamente em qualquer falha — nunca quebra o fluxo de login.
 */
/**
 * Obtém o token FCM devolvendo {token, erro}.
 *
 * O `catch` daqui antes devolvia só `null` — e a mensagem do Firebase, que diz
 * EXATAMENTE o que falhou (chave VAPID inválida, service worker não
 * registrado, domínio não autorizado no projeto), era jogada fora. Sem ela,
 * "não gerou o token" é um beco sem saída pra quem tenta corrigir.
 */
export async function obterTokenFCM() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return { token: null, erro: 'Este navegador não expõe a API de notificação.' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { token: null, erro: `Permissão ${permission}.` };
  }

  if (!FIREBASE_CONFIG.apiKey) {
    return { token: null, erro: 'FIREBASE_CONFIG não preenchido no app.' };
  }

  try {
    const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getMessaging, getToken, isSupported } =
      await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js');

    // O próprio Firebase sabe dizer se o ambiente serve. No iOS fora da Tela
    // de Início isso é false — melhor perguntar que descobrir por exceção.
    if (typeof isSupported === 'function' && !(await isSupported())) {
      return { token: null, erro: 'O Firebase não suporta notificações neste navegador/modo.' };
    }

    // REGISTRO EXPLÍCITO do service worker. Deixar o Firebase registrar
    // sozinho falha silenciosamente no iOS: ele procura /firebase-messaging-sw.js
    // e não espera o SW ficar pronto. Passar a registration resolve a corrida.
    let registration;
    try {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
    } catch (swErr) {
      return { token: null, erro: `Service worker não registrou: ${swErr?.message || swErr}` };
    }

    // initializeApp duas vezes lança; reaproveita se já existe.
    const app = (getApps && getApps().length) ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: FCM_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) return { token: null, erro: 'O Firebase respondeu sem token.' };
    return { token, erro: null };
  } catch (e) {
    // `code` do Firebase (ex.: messaging/token-subscribe-failed) é o que
    // realmente identifica o problema — vai junto.
    const detalhe = [e?.code, e?.message].filter(Boolean).join(' — ') || String(e);
    console.warn('FCM token error:', e);
    return { token: null, erro: detalhe };
  }
}

/** Compatibilidade: os chamadores antigos esperam o token ou null. */
export async function requestNotificationPermission() {
  const { token } = await obterTokenFCM();
  return token || null;
}

/**
 * Envia o FCM token para o backend, associando-o ao usuário logado.
 * Falhas são silenciosas — nunca quebram o fluxo de autenticação.
 */
export async function saveFcmToken(token, apiBaseUrl, authHeaders) {
  if (!token) return { ok: false, motivo: 'Token não gerado.' };
  try {
    const r = await fetch(`${apiBaseUrl}/api/profile/fcm-token`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fcm_token: token, user_type: 'client' }),
    });

    // Antes esta função IGNORAVA a resposta: 401, 404 e 500 passavam como
    // sucesso e a tela dizia "Pronto! Avisos ativados" com o banco vazio.
    // Erro que se disfarça de sucesso é pior que erro — some da lista de
    // problemas sem nunca ter sido resolvido.
    let corpo = null;
    try { corpo = await r.json(); } catch { /* sem corpo */ }

    if (!r.ok) {
      const detalhe = corpo?.error || corpo?.message || `HTTP ${r.status}`;
      console.warn('FCM save token falhou:', r.status, detalhe);
      return { ok: false, status: r.status, motivo: detalhe };
    }
    // A rota devolve 200 com success:false quando a coluna não existe.
    if (corpo && corpo.success === false) {
      return { ok: false, status: 200, motivo: corpo.warning || 'Servidor recusou o token.' };
    }
    return { ok: true };
  } catch (e) {
    console.warn('FCM save token error:', e);
    return { ok: false, motivo: 'Sem conexão com o servidor.' };
  }
}
