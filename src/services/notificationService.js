// src/services/notificationService.js
//
// DOIS CAMINHOS, um arquivo. O mesmo bundle roda no navegador/PWA e dentro do
// APK (o Capacitor carrega o site publicado via server.url), então a escolha
// tem que ser em tempo de execução:
//
//   • navegador/PWA  -> Web Push (Firebase JS SDK + VAPID + service worker)
//   • APK instalado  -> @capacitor/push-notifications (FCM nativo)
//
// Não é preferência: o WebView do Android NÃO implementa a Notification API.
// No app instalado o caminho web falha sempre, e falhava calado.
import { Capacitor } from '@capacitor/core';
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

// Certificado push da Web do projeto inksa-delivery (par de chaves de
// 23/05/2026). Chave PÚBLICA — pode ficar no bundle, é isso que o navegador
// manda pro serviço de push.
const FCM_VAPID_KEY = "BOUov-X15lwK9B-Hd7er7rhnPZCzYxunkqEeTo71A8gOxuCCQlEh_MQWNEOu7rxmlT4iaN9zim4FKurj2dwPAPc";

/**
 * Solicita permissão de notificação e obtém o FCM token.
 * Retorna null silenciosamente em qualquer falha — nunca quebra o fluxo de login.
 */
/** Roda dentro do APK/IPA (Capacitor), e não no navegador. */
export function ehAppNativo() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Token FCM pelo caminho NATIVO (@capacitor/push-notifications).
 *
 * Aqui não existe chave VAPID nem service worker: o token vem do próprio FCM
 * do Android, e o que amarra o app ao projeto Firebase é o
 * `android/app/google-services.json`. Sem esse arquivo no APK, o
 * `register()` dispara `registrationError` — ou simplesmente nunca responde,
 * daí o timeout com mensagem própria.
 *
 * O token chega por EVENTO, não por retorno da chamada. Por isso o
 * register() é envolvido numa promessa com os dois listeners e um relógio:
 * sem o timeout, um google-services.json ausente deixaria a tela girando pra
 * sempre — que é a versão silenciosa do mesmo erro.
 */
async function obterTokenNativo() {
  let PushNotifications;
  try {
    ({ PushNotifications } = await import('@capacitor/push-notifications'));
  } catch (e) {
    return { token: null, erro: `Plugin de push ausente neste APK: ${e?.message || e}` };
  }

  try {
    let perm = await PushNotifications.checkPermissions();
    // Android 13+ exige permissão em tempo de execução (POST_NOTIFICATIONS).
    if (perm.receive !== 'granted') {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== 'granted') {
      return { token: null, erro: `Permissão ${perm.receive}.` };
    }
  } catch (e) {
    return { token: null, erro: `Falha ao pedir permissão: ${e?.message || e}` };
  }

  let resolver;
  const espera = new Promise((r) => { resolver = r; });
  const inscricoes = [];
  let respondido = false;

  const finalizar = (resultado) => {
    if (respondido) return;
    respondido = true;
    clearTimeout(relogio);
    inscricoes.forEach((h) => { try { h.remove(); } catch { /* já removido */ } });
    resolver(resultado);
  };

  const relogio = setTimeout(() => finalizar({
    token: null,
    erro: 'o FCM não respondeu em 15s — normalmente é google-services.json ausente no APK.',
  }), 15000);

  try {
    inscricoes.push(await PushNotifications.addListener(
      'registration', (t) => finalizar({ token: t?.value || null, erro: t?.value ? null : 'registro sem token.' }),
    ));
    inscricoes.push(await PushNotifications.addListener(
      'registrationError', (e) => finalizar({ token: null, erro: `registro nativo falhou: ${e?.error || JSON.stringify(e)}` }),
    ));
    await PushNotifications.register();
  } catch (e) {
    finalizar({ token: null, erro: e?.message || String(e) });
  }

  return espera;
}

/**
 * Estado da permissão no app instalado: 'granted' | 'denied' | 'prompt' | null.
 *
 * Só pode ser consultado de forma assíncrona (é uma chamada ao Android), ao
 * contrário do `Notification.permission` do navegador. A tela precisa disso
 * pra não mostrar "Não disponível neste app" dentro do próprio app.
 */
export async function estadoPermissaoNativa() {
  if (!ehAppNativo()) return null;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const p = await PushNotifications.checkPermissions();
    return p?.receive || null;
  } catch {
    return null;
  }
}

/**
 * Tocar na notificação leva pra tela do pedido, não pra home.
 *
 * Equivalente nativo do `notificationclick` do firebase-messaging-sw.js. Sem
 * isto o push funciona mas entrega a pessoa na home, e ela procura sozinha o
 * pedido que motivou o aviso.
 */
let listenersDeAcaoProntos = false;
export async function configurarAcoesDePush(navegarPara) {
  if (!ehAppNativo() || listenersDeAcaoProntos) return;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    await PushNotifications.addListener('pushNotificationActionPerformed', (acao) => {
      const d = acao?.notification?.data || {};
      const destino = d.url || (d.order_id ? `/pedido/${d.order_id}/acompanhar` : '/');
      try { navegarPara(destino); } catch { window.location.href = destino; }
    });
    listenersDeAcaoProntos = true;
  } catch (e) {
    console.warn('Push: não consegui registrar o listener de toque:', e);
  }
}

/**
 * Confere o FORMATO da chave VAPID antes de usar. Devolve null se está boa,
 * ou a descrição do defeito.
 *
 * Existe porque a chave que ficou aqui por semanas era inválida: 88
 * caracteres em vez de 87, decodificando em 66 bytes em vez de 65. O
 * navegador só reclamava lá no fim, com "applicationServerKey must contain a
 * valid P-256 public key" — depois de pedir permissão, registrar service
 * worker e falar com o Firebase. Uma chave errada é um erro de configuração,
 * e erro de configuração tem que aparecer no primeiro passo, não no último.
 *
 * VAPID válida = ponto P-256 não comprimido: 65 bytes (0x04 + X32 + Y32),
 * que em base64url sem padding dá exatamente 87 caracteres.
 */
function defeitoDaChaveVapid(k) {
  if (typeof k !== 'string' || !k) return 'está vazia';
  if (k.length !== 87) return `tem ${k.length} caracteres (o correto são 87)`;
  let bin;
  try {
    bin = atob(k.replace(/-/g, '+').replace(/_/g, '/'));
  } catch {
    return 'não é base64url válido';
  }
  if (bin.length !== 65) return `decodifica em ${bin.length} bytes (o correto são 65)`;
  if (bin.charCodeAt(0) !== 0x04) return 'não começa com o byte 0x04 de chave pública não comprimida';
  return null;
}

/**
 * Espera o service worker recém-registrado ficar ATIVO.
 *
 * getToken() chama pushManager.subscribe na registration; com o worker ainda
 * em 'installing' a inscrição falha de um jeito genérico. Timeout de 10s para
 * não travar a tela caso o SW nunca ative.
 */
function esperarAtivar(registration, limiteMs = 10000) {
  if (registration.active) return Promise.resolve(registration);
  const sw = registration.installing || registration.waiting;
  if (!sw) return Promise.resolve(registration);
  return new Promise((resolve, reject) => {
    const relogio = setTimeout(
      () => reject(new Error('o service worker não ativou em 10s')),
      limiteMs,
    );
    sw.addEventListener('statechange', () => {
      if (sw.state === 'activated') { clearTimeout(relogio); resolve(registration); }
      if (sw.state === 'redundant') {
        clearTimeout(relogio);
        reject(new Error('o service worker virou redundante (outro SW tomou o escopo)'));
      }
    });
  });
}

/**
 * Obtém o token FCM devolvendo {token, erro}.
 *
 * O `catch` daqui antes devolvia só `null` — e a mensagem do Firebase, que diz
 * EXATAMENTE o que falhou (chave VAPID inválida, service worker não
 * registrado, domínio não autorizado no projeto), era jogada fora. Sem ela,
 * "não gerou o token" é um beco sem saída pra quem tenta corrigir.
 */
export async function obterTokenFCM() {
  // No APK instalado o caminho web NUNCA funciona — o WebView não tem a
  // Notification API. Desviar aqui, antes de qualquer checagem de navegador.
  if (ehAppNativo()) return obterTokenNativo();

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

  const defeito = defeitoDaChaveVapid(FCM_VAPID_KEY);
  if (defeito) {
    return {
      token: null,
      erro: `a chave VAPID do app ${defeito}. Copie de novo em Firebase → `
          + 'Configurações do projeto → Cloud Messaging → Certificados push da Web.',
    };
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
    //
    // ESCOPO SEPARADO, e isso é essencial: o app já registra /sw.js (PWA) no
    // escopo '/' a cada load, em main.jsx. Dois SCRIPTS diferentes no MESMO
    // escopo não coexistem — o último registro substitui o anterior. Registrar
    // o FCM em '/' derrubaria o PWA, e o próximo load derrubaria o FCM de
    // volta, num revezamento em que o push nunca sobrevive. Este é o escopo
    // que o próprio Firebase usa internamente.
    let registration;
    try {
      registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
        { scope: '/firebase-cloud-messaging-push-scope' },
      );
      // navigator.serviceWorker.ready NÃO serve aqui: ele resolve com o SW que
      // controla ESTA página (o do PWA), não com este. Espera o certo.
      await esperarAtivar(registration);
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
