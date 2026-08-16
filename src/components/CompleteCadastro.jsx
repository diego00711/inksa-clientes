import { useEffect, useState } from 'react';
import { useNavigate, useLocation as useRotaAtual } from 'react-router-dom';
import { MapPin, Phone, Bell, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { CLIENT_API_URL, createAuthHeaders } from '../services/api';
import { requestNotificationPermission, saveFcmToken } from '../services/notificationService';

const ADIADO_ATE = 'inksa_cadastro_adiado_ate';
const ADIAR_DIAS = 7;

/**
 * Card de "Complete seu cadastro" na Home.
 *
 * POR QUE NÃO PROMETE OFERTA. A ideia original era "termine o cadastro pra
 * receber as ofertas dos parceiros perto de você". Só que o push de cupom vai
 * SÓ pra quem já pediu naquela loja (trava deliberada em coupons_routes.py):
 * quem acabou de completar o cadastro receberia zero ofertas. Aviso que promete
 * e não cumpre ensina a pessoa a ignorar aviso — e aí o dia em que a gente
 * tiver algo real pra dizer, ninguém lê.
 *
 * Então cada item diz o que QUEBRA sem ele, que é verdade hoje:
 *  • endereço — sem ele (e com GPS negado) a home lista lojas que talvez não
 *    entreguem ali, e a pessoa só descobre quando o checkout recusa por área.
 *  • telefone — o entregador recebe client_phone no pedido. Sem telefone, ele
 *    não tem como ligar quando não acha a porta.
 *  • avisos  — status do próprio pedido.
 *
 * Só na Home: numa tela de tarefa (carrinho, acompanhar pedido) isto é ruído.
 * Some sozinho quando não falta mais nada — não precisa de "concluir".
 */
/**
 * Decide O QUE falta. Separado do desenho de propósito: é a parte que erra
 * calado (cobrar de quem já cadastrou, ou não cobrar de quem não cadastrou) e
 * a única que dá pra conferir sem um cliente logado na tela.
 *
 * Devolve as CHAVES do que falta, na ordem em que aparecem.
 */
export function faltando({ telefone, temEnderecoSalvo, permissaoPush, recusouAvisos }) {
  const itens = [];
  if (temEnderecoSalvo === false) itens.push('endereco');
  if (!String(telefone || '').trim()) itens.push('telefone');
  if (permissaoPush === 'default' && !recusouAvisos) itens.push('avisos');
  return itens;
}

export function CompleteCadastro() {
  const { isAuthenticated, user } = useAuth();
  const { temEnderecoSalvo } = useLocation();
  const { pathname } = useRotaAtual();
  const navigate = useNavigate();

  const [permissaoPush, setPermissaoPush] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
  );
  const [ativandoPush, setAtivandoPush] = useState(false);
  const [adiado, setAdiado] = useState(true); // começa escondido: evita piscar

  useEffect(() => {
    const ate = Number(localStorage.getItem(ADIADO_ATE) || 0);
    setAdiado(Date.now() < ate);
  }, []);

  if (!isAuthenticated || pathname !== '/') return null;

  const suportaPush = permissaoPush !== 'unsupported';
  // temEnderecoSalvo === null significa "ainda não sei" (a lista não voltou);
  // 'denied' é definitivo no navegador, insistir só ocupa a tela; e quem já
  // respondeu "agora não" ao pedido de avisos não é perguntado de novo aqui —
  // trocar a embalagem pra refazer a mesma pergunta é insistência.
  const falta = faltando({
    telefone: user?.phone,
    temEnderecoSalvo,
    permissaoPush,
    recusouAvisos: localStorage.getItem('inksa_push_dispensado') === '1',
  });

  const itens = [
    falta.includes('endereco') && {
      chave: 'endereco',
      icone: MapPin,
      titulo: 'Seu endereço',
      texto: 'Sem ele mostramos lojas que talvez não entreguem aí.',
      rotulo: 'Cadastrar',
      acao: () => navigate('/perfil#enderecos'),
    },
    falta.includes('telefone') && {
      chave: 'telefone',
      icone: Phone,
      titulo: 'Seu telefone',
      texto: 'É por ele que o entregador liga se não achar sua porta.',
      rotulo: 'Cadastrar',
      acao: () => navigate('/perfil'),
    },
    falta.includes('avisos') && suportaPush && {
      chave: 'avisos',
      icone: Bell,
      titulo: 'Avisos do pedido',
      texto: 'Saiba quando a loja aceitar e quando o entregador sair.',
      rotulo: ativandoPush ? 'Ativando…' : 'Ativar',
      acao: async () => {
        // O navegador exige gesto do usuário pra abrir o diálogo — por isso
        // isto é um botão, e não algo que roda ao carregar a tela.
        setAtivandoPush(true);
        try {
          const token = await requestNotificationPermission();
          if (token) await saveFcmToken(token, CLIENT_API_URL, createAuthHeaders());
        } catch { /* best-effort: o motivo aparece em Perfil > Notificações */ }
        setPermissaoPush(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
        setAtivandoPush(false);
      },
    },
  ].filter(Boolean);

  const total = 2 + (suportaPush ? 1 : 0); // endereço + telefone (+ avisos)
  const prontos = total - itens.length;

  if (itens.length === 0 || adiado) return null;

  const adiar = () => {
    localStorage.setItem(ADIADO_ATE, String(Date.now() + ADIAR_DIAS * 86400000));
    setAdiado(true);
  };

  return (
    <div className="mx-4 mt-3 overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-gray-800">Complete seu cadastro</p>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
              {prontos} de {total}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-gray-600">
            Assim mostramos só quem entrega no seu endereço — e o entregador
            consegue te achar.
          </p>
        </div>
        <button onClick={adiar} aria-label="Agora não" className="shrink-0 text-gray-400">
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="divide-y divide-gray-100 border-t border-gray-100">
        {itens.map(({ chave, icone: Icone, titulo, texto, rotulo, acao }) => (
          <li key={chave}>
            <button
              onClick={acao}
              disabled={chave === 'avisos' && ativandoPush}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-orange-50/60 disabled:opacity-60"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-100">
                <Icone className="h-4 w-4 text-orange-600" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-gray-800">{titulo}</span>
                <span className="block text-xs text-gray-500">{texto}</span>
              </span>
              <span className="flex shrink-0 items-center gap-0.5 text-sm font-bold text-orange-600">
                {rotulo}
                <ChevronRight className="h-4 w-4" />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
