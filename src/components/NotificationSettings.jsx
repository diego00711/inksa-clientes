import { useEffect, useState } from 'react';
import { Bell, BellOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { CLIENT_API_URL, createAuthHeaders } from '../services/api';
import { requestNotificationPermission, saveFcmToken } from '../services/notificationService';

/**
 * Estado das notificações, com o MOTIVO quando não dá pra ativar.
 *
 * Substitui o banner que "simplesmente não aparecia": ele tinha 5 portas de
 * saída silenciosas (não autenticado, API ausente, já negado, já dispensado,
 * já concedido) e nenhuma delas dizia nada. Debugar isso no celular é
 * impossível — e o cliente também ficava sem entender.
 *
 * Aqui SEMPRE tem alguma coisa na tela, e cada estado explica o que fazer.
 */
function diagnosticar() {
  // WebView do app instalado não implementa a API de notificação. É a causa
  // mais provável de "abri e não pediu nada" — e some sem erro nenhum.
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      estado: 'indisponivel',
      titulo: 'Não disponível neste app',
      texto: 'Abra clientes.inksadelivery.com.br no Chrome ou Safari para ativar os avisos. '
           + 'A versão instalada ainda não suporta notificações.',
    };
  }
  if (!('serviceWorker' in navigator)) {
    return {
      estado: 'indisponivel',
      titulo: 'Navegador sem suporte',
      texto: 'Este navegador não suporta notificações. Tente pelo Chrome.',
    };
  }
  if (!window.isSecureContext) {
    return {
      estado: 'indisponivel',
      titulo: 'Conexão não segura',
      texto: 'Notificações só funcionam em HTTPS.',
    };
  }
  const p = Notification.permission;
  if (p === 'granted') {
    return { estado: 'ativo', titulo: 'Avisos ativados', texto: 'Você recebe o andamento dos seus pedidos.' };
  }
  if (p === 'denied') {
    return {
      estado: 'bloqueado',
      titulo: 'Avisos bloqueados',
      texto: 'Você negou a permissão neste navegador. Para reativar: toque no cadeado ao lado do '
           + 'endereço → Permissões → Notificações → Permitir, e recarregue a página.',
    };
  }
  return {
    estado: 'pedir',
    titulo: 'Avisos desativados',
    texto: 'Ative para saber quando a loja aceitar seu pedido, quando sair para entrega e quando estiver chegando.',
  };
}

export function NotificationSettings() {
  const [diag, setDiag] = useState(() => diagnosticar());
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState(null);

  // Já autorizado: garante que o servidor tem o token (pode ter sido concedido
  // antes de existir a rota que salva).
  useEffect(() => {
    if (diag.estado !== 'ativo') return;
    (async () => {
      try {
        const token = await requestNotificationPermission();
        if (token) await saveFcmToken(token, CLIENT_API_URL, createAuthHeaders());
      } catch { /* best-effort */ }
    })();
  }, [diag.estado]);

  const ativar = async () => {
    setOcupado(true);
    setMsg(null);
    try {
      const token = await requestNotificationPermission();
      if (token) {
        await saveFcmToken(token, CLIENT_API_URL, createAuthHeaders());
        setMsg({ ok: true, txt: 'Pronto! Avisos ativados.' });
      } else {
        // Sem token com permissão concedida = Firebase falhou. Dizer isso é
        // melhor que fingir sucesso.
        setMsg({
          ok: false,
          txt: Notification.permission === 'granted'
            ? 'Permissão concedida, mas não conseguimos registrar. Tente recarregar a página.'
            : 'Permissão não concedida.',
        });
      }
    } catch (e) {
      setMsg({ ok: false, txt: 'Não foi possível ativar agora.' });
    }
    setDiag(diagnosticar());
    setOcupado(false);
  };

  const cor = diag.estado === 'ativo'
    ? { caixa: 'border-green-200 bg-green-50', icone: 'text-green-600', titulo: 'text-green-900', texto: 'text-green-800' }
    : diag.estado === 'bloqueado'
    ? { caixa: 'border-amber-200 bg-amber-50', icone: 'text-amber-600', titulo: 'text-amber-900', texto: 'text-amber-800' }
    : diag.estado === 'indisponivel'
    ? { caixa: 'border-gray-200 bg-gray-50', icone: 'text-gray-500', titulo: 'text-gray-800', texto: 'text-gray-600' }
    : { caixa: 'border-orange-200 bg-orange-50', icone: 'text-orange-600', titulo: 'text-orange-900', texto: 'text-orange-800' };

  const Icone = diag.estado === 'ativo' ? CheckCircle2
    : diag.estado === 'bloqueado' ? AlertTriangle
    : diag.estado === 'indisponivel' ? BellOff : Bell;

  return (
    <div className="border-t pt-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Notificações</h2>
      <div className={`rounded-xl border p-4 ${cor.caixa}`}>
        <div className="flex items-start gap-3">
          <Icone className={`h-5 w-5 mt-0.5 shrink-0 ${cor.icone}`} />
          <div className="min-w-0 flex-1">
            <p className={`font-semibold ${cor.titulo}`}>{diag.titulo}</p>
            <p className={`text-sm mt-0.5 ${cor.texto}`}>{diag.texto}</p>

            {diag.estado === 'pedir' && (
              <button
                type="button"
                onClick={ativar}
                disabled={ocupado}
                className="mt-3 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {ocupado ? 'Ativando…' : 'Ativar avisos'}
              </button>
            )}

            {msg && (
              <p className={`mt-2 text-sm font-medium ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>
                {msg.txt}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
