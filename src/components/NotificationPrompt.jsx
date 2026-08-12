import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CLIENT_API_URL, createAuthHeaders } from '../services/api';
import { requestNotificationPermission, saveFcmToken } from '../services/notificationService';

const DISPENSADO = 'inksa_push_dispensado';

/**
 * Pede permissão de notificação DEPOIS do login, no app já aberto.
 *
 * Por que existe: a permissão só era pedida dentro do `login()`. Como a sessão
 * restaura do localStorage, quem já tinha conta NUNCA era perguntado — e como
 * todo mundo já tinha conta, ninguém foi. Resultado: zero tokens no banco.
 *
 * E o Chrome exige GESTO DO USUÁRIO pra abrir o diálogo de permissão: chamar
 * no carregamento da página é ignorado sem erro. Por isso é um botão, não uma
 * chamada automática.
 *
 * O texto explica o benefício antes de pedir. Prompt de permissão sem contexto
 * é negado na hora — e negação é PERMANENTE: o navegador não pergunta de novo,
 * e o cliente perde os avisos do próprio pedido pra sempre.
 */
export function NotificationPrompt() {
  const { isAuthenticated } = useAuth();
  const [mostrar, setMostrar] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    const permissao = Notification.permission;

    // Já autorizou antes: só falta o servidor ter o token. Não precisa de
    // gesto nem de banner — resolve sozinho, calado.
    if (permissao === 'granted') {
      (async () => {
        try {
          const token = await requestNotificationPermission();
          if (token) await saveFcmToken(token, CLIENT_API_URL, createAuthHeaders());
        } catch { /* best-effort */ }
      })();
      return;
    }

    // 'denied' é definitivo: insistir só ocupa a tela.
    if (permissao !== 'default') return;
    if (localStorage.getItem(DISPENSADO) === '1') return;

    setMostrar(true);
  }, [isAuthenticated]);

  const ativar = async () => {
    setOcupado(true);
    try {
      const token = await requestNotificationPermission();
      if (token) await saveFcmToken(token, CLIENT_API_URL, createAuthHeaders());
    } catch { /* silencioso */ }
    setOcupado(false);
    setMostrar(false);
  };

  const dispensar = () => {
    localStorage.setItem(DISPENSADO, '1');
    setMostrar(false);
  };

  if (!mostrar) return null;

  return (
    <div className="mx-4 mt-3 rounded-2xl border border-orange-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-100">
          <Bell className="h-5 w-5 text-orange-600" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-800">Avisamos quando seu pedido sair?</p>
          <p className="mt-0.5 text-sm text-gray-600">
            Você recebe quando a loja aceitar, quando o entregador sair e quando
            estiver chegando. Sem propaganda.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={ativar}
              disabled={ocupado}
              className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {ocupado ? 'Ativando…' : 'Ativar avisos'}
            </button>
            <button
              onClick={dispensar}
              className="rounded-xl px-3 py-2 text-sm font-medium text-gray-500"
            >
              Agora não
            </button>
          </div>
        </div>
        <button onClick={dispensar} aria-label="Fechar" className="shrink-0 text-gray-400">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
