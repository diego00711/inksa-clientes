import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CLIENT_API_URL, createAuthHeaders } from '../services/api';
import { requestNotificationPermission, saveFcmToken } from '../services/notificationService';

/**
 * Registra o token de push de quem JÁ autorizou. Não desenha nada.
 *
 * Por que existe: a permissão só era pedida dentro do `login()`. Como a sessão
 * restaura do localStorage, quem já tinha conta NUNCA era perguntado — e como
 * todo mundo já tinha conta, ninguém foi. Resultado: zero tokens no banco.
 * Este efeito cobre o caso "o navegador autorizou, mas o servidor não tem o
 * token" — que acontece ao trocar de aparelho ou limpar dados do site.
 *
 * O PEDIDO visível mora no card "Complete seu cadastro" (CompleteCadastro.jsx),
 * junto com endereço e telefone. Eram dois cards concorrendo pelo mesmo topo de
 * tela; virou um só, com a conta do que falta. Aqui ficou a metade calada, que
 * precisa rodar pra todo mundo — inclusive pra quem já completou o cadastro e
 * por isso não vê card nenhum.
 *
 * O gesto do usuário continua obrigatório pro diálogo de permissão abrir: por
 * isso o pedido é um botão lá, e aqui só entra quem já autorizou antes.
 */
export function NotificationPrompt() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    if (Notification.permission !== 'granted') return;

    // Já autorizou antes: só falta o servidor ter o token. Não precisa de
    // gesto nem de banner — resolve sozinho, calado.
    (async () => {
      try {
        const token = await requestNotificationPermission();
        if (token) await saveFcmToken(token, CLIENT_API_URL, createAuthHeaders());
      } catch { /* best-effort */ }
    })();
  }, [isAuthenticated]);

  return null;
}
