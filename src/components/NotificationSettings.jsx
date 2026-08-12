import { useEffect, useState } from 'react';
import { Bell, BellOff, CheckCircle2, AlertTriangle, Share } from 'lucide-react';
import { CLIENT_API_URL, createAuthHeaders } from '../services/api';
import {
  obterTokenFCM,
  saveFcmToken,
  ehAppNativo,
  estadoPermissaoNativa,
} from '../services/notificationService';

/**
 * Estado das notificações, com o MOTIVO quando não dá pra ativar.
 *
 * Substitui o banner que "simplesmente não aparecia": ele tinha 5 portas de
 * saída silenciosas (não autenticado, API ausente, já negado, já dispensado,
 * já concedido) e nenhuma dizia nada. Debugar isso no celular é impossível —
 * e o cliente também ficava sem entender.
 *
 * Aqui SEMPRE tem algo na tela, e cada estado diz o que fazer.
 */
function ehIOS() {
  if (typeof navigator === 'undefined') return false;
  // iPad moderno se declara MacIntel — o maxTouchPoints denuncia.
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function naTelaDeInicio() {
  if (typeof window === 'undefined') return false;
  return window.navigator.standalone === true
    || window.matchMedia?.('(display-mode: standalone)')?.matches === true;
}

function diagnosticar() {
  if (typeof window === 'undefined') {
    return { estado: 'indisponivel', titulo: 'Indisponível', texto: '' };
  }

  // APP INSTALADO: o WebView não tem a Notification API, então todo o
  // diagnóstico abaixo daria "Não disponível neste app" — dentro do próprio
  // app, mandando a pessoa abrir no Chrome. Aqui quem responde é o Android, e
  // a resposta é assíncrona: fica 'checando' até o efeito de montagem voltar.
  if (ehAppNativo()) {
    return { estado: 'checando', titulo: 'Verificando…', texto: 'Consultando as permissões do aparelho.' };
  }

  // A ausência da Notification API tem DUAS causas bem diferentes, e mandar a
  // instrução errada faz a pessoa desistir:
  //
  //  - iPhone/iPad: o Safari só expõe a API depois que o site vira ícone na
  //    Tela de Início (exigência da Apple desde o iOS 16.4).
  //  - Android: o WebView do app instalado não implementa a API.
  if (!('Notification' in window)) {
    if (ehIOS()) {
      return {
        estado: 'ios',
        titulo: naTelaDeInicio() ? 'Atualize o iOS' : 'Falta adicionar à Tela de Início',
        texto: naTelaDeInicio()
          ? 'Avisos no iPhone exigem iOS 16.4 ou mais novo. Atualize o aparelho e volte aqui.'
          : 'No iPhone os avisos só funcionam pelo ícone na tela: toque em Compartilhar (o quadrado '
            + 'com a seta), escolha "Adicionar à Tela de Início", abra o Inksa por esse ícone e '
            + 'volte nesta tela.',
      };
    }
    return {
      estado: 'indisponivel',
      titulo: 'Não disponível neste app',
      texto: 'Abra clientes.inksadelivery.com.br no Chrome para ativar os avisos. '
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
           + 'endereço, vá em Permissões, Notificações, Permitir — e recarregue a página.',
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
  // null = sem falha conhecida · string = motivo da falha de registro
  const [falhaRegistro, setFalhaRegistro] = useState(null);

  // App instalado: resolve o 'checando' perguntando a permissão ao Android.
  useEffect(() => {
    if (!ehAppNativo()) return undefined;
    let vivo = true;
    (async () => {
      const p = await estadoPermissaoNativa();
      if (!vivo) return;
      if (p === 'granted') {
        setDiag({ estado: 'ativo', titulo: 'Avisos ativados', texto: 'Você recebe o andamento dos seus pedidos.' });
      } else if (p === 'denied') {
        setDiag({
          estado: 'bloqueado',
          titulo: 'Avisos bloqueados',
          texto: 'Você negou a permissão. Para reativar: Ajustes do Android → Apps → Inksa Cliente → '
               + 'Notificações → permitir. Depois volte aqui.',
        });
      } else {
        setDiag({
          estado: 'pedir',
          titulo: 'Avisos desativados',
          texto: 'Ative para saber quando a loja aceitar seu pedido, quando sair para entrega e quando estiver chegando.',
        });
      }
    })();
    return () => { vivo = false; };
  }, []);

  // Já autorizado: registra no servidor e MOSTRA o resultado.
  //
  // Este caminho era mudo — engolia tudo num catch vazio. Como quem já
  // concedeu a permissão cai direto no verde, sem botão e sem mensagem, a
  // falha ficava invisível: a tela dizia "Avisos ativados" com o banco vazio.
  // "Permissão concedida" e "servidor tem o token" são coisas diferentes, e
  // só a segunda faz o push chegar.
  useEffect(() => {
    if (diag.estado !== 'ativo') return undefined;
    let vivo = true;
    (async () => {
      try {
        const { token, erro } = await obterTokenFCM();
        if (!token) {
          if (vivo) setFalhaRegistro(erro || 'O Firebase não gerou o token neste aparelho.');
          return;
        }
        const r = await saveFcmToken(token, CLIENT_API_URL, createAuthHeaders());
        if (vivo) setFalhaRegistro(r?.ok ? null : (r?.motivo || 'Erro desconhecido ao salvar.'));
      } catch (e) {
        if (vivo) setFalhaRegistro(e?.message || 'Falha inesperada ao registrar.');
      }
    })();
    return () => { vivo = false; };
  }, [diag.estado]);

  const ativar = async () => {
    setOcupado(true);
    setMsg(null);
    try {
      // Usa obterTokenFCM (não o wrapper antigo): aqui o MOTIVO da falha
      // importa mais que em qualquer outro lugar — é o clique da pessoa.
      const { token, erro } = await obterTokenFCM();
      if (token) {
        // O resultado do salvamento MANDA na mensagem. Antes a tela dizia
        // "Pronto!" sem olhar a resposta do servidor — e o banco ficava vazio.
        const r = await saveFcmToken(token, CLIENT_API_URL, createAuthHeaders());
        setFalhaRegistro(r?.ok ? null : (r?.motivo || 'Erro desconhecido ao salvar.'));
        setMsg(r?.ok
          ? { ok: true, txt: 'Pronto! Avisos ativados.' }
          : { ok: false, txt: `Não conseguimos salvar: ${r?.motivo || 'erro desconhecido'}` });
      } else {
        const motivo = erro || 'O Firebase não gerou o token neste aparelho.';
        setFalhaRegistro(motivo);
        setMsg({ ok: false, txt: motivo });
      }
    } catch (e) {
      const motivo = e?.message || 'Falha inesperada.';
      setFalhaRegistro(motivo);
      setMsg({ ok: false, txt: `Não foi possível ativar: ${motivo}` });
    }
    setDiag(diagnosticar());
    setOcupado(false);
  };

  // Permissão concedida MAS servidor sem o token = não chega push nenhum.
  // Mostrar verde aqui seria a mesma mentira de antes.
  const registroFalhou = diag.estado === 'ativo' && !!falhaRegistro;
  const visual = registroFalhou
    ? {
        estado: 'bloqueado',
        titulo: 'Quase lá — não conseguimos registrar',
        texto: `A permissão está concedida, mas o servidor não recebeu seu aparelho. Motivo: ${falhaRegistro}`,
      }
    : diag;

  const cor = visual.estado === 'ativo'
    ? { caixa: 'border-green-200 bg-green-50', icone: 'text-green-600', titulo: 'text-green-900', texto: 'text-green-800' }
    // 'ios' é instrução, não erro: azul, porque tem caminho e o cliente
    // resolve sozinho seguindo o texto.
    : visual.estado === 'ios'
    ? { caixa: 'border-blue-200 bg-blue-50', icone: 'text-blue-600', titulo: 'text-blue-900', texto: 'text-blue-800' }
    : visual.estado === 'bloqueado'
    ? { caixa: 'border-amber-200 bg-amber-50', icone: 'text-amber-600', titulo: 'text-amber-900', texto: 'text-amber-800' }
    : visual.estado === 'indisponivel' || visual.estado === 'checando'
    ? { caixa: 'border-gray-200 bg-gray-50', icone: 'text-gray-500', titulo: 'text-gray-800', texto: 'text-gray-600' }
    : { caixa: 'border-orange-200 bg-orange-50', icone: 'text-orange-600', titulo: 'text-orange-900', texto: 'text-orange-800' };

  const Icone = visual.estado === 'ativo' ? CheckCircle2
    : visual.estado === 'ios' ? Share
    : visual.estado === 'bloqueado' ? AlertTriangle
    : visual.estado === 'indisponivel' || visual.estado === 'checando' ? BellOff : Bell;

  const mostrarBotao = diag.estado === 'pedir' || registroFalhou;

  return (
    <div className="border-t pt-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Notificações</h2>
      <div className={`rounded-xl border p-4 ${cor.caixa}`}>
        <div className="flex items-start gap-3">
          <Icone className={`h-5 w-5 mt-0.5 shrink-0 ${cor.icone}`} />
          <div className="min-w-0 flex-1">
            <p className={`font-semibold ${cor.titulo}`}>{visual.titulo}</p>
            <p className={`text-sm mt-0.5 ${cor.texto}`}>{visual.texto}</p>

            {mostrarBotao && (
              <button
                type="button"
                onClick={ativar}
                disabled={ocupado}
                className="mt-3 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {ocupado ? 'Ativando…' : registroFalhou ? 'Tentar de novo' : 'Ativar avisos'}
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
