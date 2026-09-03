// src/components/BarraLocalizacao.jsx
//
// O FRETE ANTES DO CARRINHO.
//
// Até aqui a localização só existia dentro do carrinho: a pessoa escolhia os
// itens, montava o pedido e só no fim descobria o frete — ou que a loja nem
// alcança o endereço dela. É o pior momento possível para perder alguém,
// porque ela já investiu o esforço de escolher.
//
// Vale ainda mais para quem chega pelo link do Instagram ou do WhatsApp: essa
// pessoa não conhece a Inksa, não tem conta, e desiste ao primeiro atrito.
//
// ── DUAS REGRAS QUE NÃO SE NEGOCIAM ───────────────────────────────────────
//
// 1. NUNCA BLOQUEIA. Quem ignorar a barra navega o cardápio inteiro do mesmo
//    jeito. Um muro aqui perderia exatamente o tráfego que a campanha de
//    rádio começa a trazer.
//
// 2. GPS SÓ NO TOQUE. O Safari do iPhone exige gesto do usuário para liberar
//    a localização — pedir sozinho ao carregar a página simplesmente não
//    funciona lá. E é de iPhone que vem boa parte do nosso tráfego.
//
// O que ela NÃO faz: pedir nome, telefone ou e-mail. Dado pessoal é custo
// para o cliente e benefício para a loja; localização é benefício imediato
// para ele — mostra se dá para entregar e quanto custa. Misturar as duas
// coisas transformaria isto no cadastro que a gente acabou de tirar do
// caminho.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, LocateFixed, Loader2, X, ChevronRight, AlertTriangle } from 'lucide-react';
import { obterCoordenadas, qualidade } from '../utils/localizacao';
import { lerLocal, salvarLocal, rotuloDoLocal } from '../utils/localCliente';
import { calculateDeliveryFee } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import AddressService, { formatAddress } from '../services/addressService';

export default function BarraLocalizacao({ restaurantId, deliveryType = 'platform' }) {
  const { isAuthenticated } = useAuth();
  const [local, setLocal] = useState(() => lerLocal());
  const [cotacao, setCotacao] = useState(null);   // {km, frete} | {foraDaArea:true}
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState(null);
  const [escondida, setEscondida] = useState(false);
  const [enderecos, setEnderecos] = useState([]);
  const [listando, setListando] = useState(false);

  // Endereços salvos: alternativa de um toque para quem já tem conta, sem
  // precisar do GPS. Falha em silêncio — é atalho, não requisito.
  useEffect(() => {
    if (!isAuthenticated) return;
    AddressService.list()
      .then((l) => setEnderecos(Array.isArray(l) ? l.filter((a) => a.latitude && a.longitude) : []))
      .catch(() => setEnderecos([]));
  }, [isAuthenticated]);

  // Com localização em mãos, cota o frete SEM itens: o servidor devolve a
  // distância e a taxa base. Por isso a tela diz "a partir de" — item pesado
  // (ração, bebida em caixa) sobe o valor, e prometer o número cheio aqui
  // seria anunciar um preço que o carrinho não vai confirmar.
  useEffect(() => {
    if (!local || !restaurantId) return;
    let vivo = true;
    setErro(null);
    calculateDeliveryFee({
      restaurant_id: restaurantId,
      client_latitude: local.lat,
      client_longitude: local.lng,
      items: [],
    })
      .then((r) => {
        if (!vivo) return;
        if (r?.error === 'fora_da_area') { setCotacao({ foraDaArea: true, mensagem: r.message }); return; }
        // Mesma caixa de aviso: para o cliente, "não dá para entregar aqui" e
        // "esta loja não tem endereço" terminam no mesmo lugar — ele não vai
        // conseguir pedir. Esconder isso o faria montar um carrinho à toa.
        if (r?.error === 'loja_sem_endereco') { setCotacao({ foraDaArea: true, mensagem: r.message }); return; }
        const km = Number(r?.data?.delivery_distance_km);
        const frete = Number(r?.data?.delivery_fee);
        if (!Number.isFinite(frete)) { setCotacao(null); return; }
        setCotacao({ km: Number.isFinite(km) ? km : null, frete });
      })
      // Silêncio proposital: falhar a cotação prévia não pode virar mensagem
      // de erro numa tela que a pessoa abriu para ver comida. O carrinho
      // calcula de novo, e lá o erro tem consequência.
      .catch(() => { if (vivo) setCotacao(null); });
    return () => { vivo = false; };
  }, [local, restaurantId]);

  const usarGps = async () => {
    setBuscando(true);
    setErro(null);
    try {
      const c = await obterCoordenadas();
      // Mesma trava do carrinho: posição imprecisa não vira endereço de
      // entrega. Aqui é só uma estimativa, mas um frete calculado a 600 m do
      // lugar errado gera a expectativa errada — e a pessoa cobra o valor que
      // viu primeiro.
      if (qualidade(c.precisao) === 'ruim') {
        setErro(`Seu aparelho localizou você com ${c.precisao} m de margem — impreciso demais. `
              + 'Tente perto de uma janela ou use um endereço salvo.');
        return;
      }
      const novo = { lat: c.lat, lng: c.lng, precisao: c.precisao, origem: 'gps' };
      salvarLocal(novo);
      setLocal(novo);
    } catch (e) {
      setErro(e?.message || 'Não consegui pegar sua localização.');
    } finally {
      setBuscando(false);
    }
  };

  const usarEndereco = (a) => {
    const novo = {
      lat: Number(a.latitude), lng: Number(a.longitude),
      endereco: formatAddress ? formatAddress(a) : (a.street || ''),
      origem: 'endereco',
    };
    salvarLocal(novo);
    setLocal(novo);
    setListando(false);
  };

  if (escondida) return null;

  // ── JÁ SABEMOS ONDE ELE ESTÁ ────────────────────────────────────────────
  if (local) {
    if (cotacao?.foraDaArea) {
      return (
        <div className="mx-4 mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-900">
                Esta loja não entrega no seu endereço
              </p>
              <p className="text-sm text-amber-800 mt-0.5">
                {cotacao.mensagem || 'Você está fora da área de entrega dela.'}{' '}
                <Link to="/" className="font-semibold underline">Ver lojas que entregam aí</Link>
              </p>
              <button type="button" onClick={() => { setLocal(null); setCotacao(null); }}
                      className="mt-1 text-xs font-semibold text-amber-900 underline">
                Não é meu endereço, trocar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-4 mt-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <MapPin className="h-4 w-4 text-orange-600 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            {cotacao ? (
              <p className="text-sm text-gray-900">
                Frete <strong>a partir de R$ {cotacao.frete.toFixed(2).replace('.', ',')}</strong>
                {cotacao.km != null && (
                  <span className="text-gray-500"> · {cotacao.km.toFixed(1).replace('.', ',')} km</span>
                )}
              </p>
            ) : (
              <p className="text-sm text-gray-500">Calculando o frete…</p>
            )}
            <p className="text-xs text-gray-400 truncate">{rotuloDoLocal(local)}</p>
          </div>
          <button type="button" onClick={() => { setLocal(null); setCotacao(null); }}
                  className="shrink-0 text-xs font-semibold text-orange-600 hover:underline">
            trocar
          </button>
        </div>
      </div>
    );
  }

  // ── AINDA NÃO SABEMOS ───────────────────────────────────────────────────
  return (
    <div className="mx-4 mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
      <div className="flex items-start gap-2.5">
        <MapPin className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">
            {deliveryType === 'platform'
              ? 'Onde você está? Assim já te mostro o frete'
              : 'Onde você está? Assim já vejo se esta loja entrega aí'}
          </p>

          {erro && <p className="text-xs text-red-600 mt-1">{erro}</p>}

          {listando && enderecos.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {enderecos.slice(0, 4).map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={() => usarEndereco(a)}
                          className="w-full text-left text-sm text-gray-800 bg-white border border-orange-200 rounded-lg px-3 py-2 hover:border-orange-400 flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate">
                      {formatAddress ? formatAddress(a) : a.street}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={usarGps}
                disabled={buscando}
                className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 min-h-[40px]"
              >
                {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                {buscando ? 'Localizando…' : 'Usar minha localização'}
              </button>

              {enderecos.length > 0 ? (
                <button type="button" onClick={() => setListando(true)}
                        className="text-sm font-semibold text-orange-700 hover:underline">
                  usar um endereço salvo
                </button>
              ) : isAuthenticated ? (
                <Link to="/perfil" className="text-sm font-semibold text-orange-700 hover:underline">
                  digitar um endereço
                </Link>
              ) : null}
            </div>
          )}

          <p className="text-xs text-gray-500 mt-2">
            Serve só para calcular a entrega. Você pode ver o cardápio sem isso.
          </p>
        </div>

        {/* Dispensar é um direito, não uma armadilha: quem fecha continua
            navegando, e o carrinho pergunta de novo na hora certa. */}
        <button type="button" onClick={() => setEscondida(true)} aria-label="Fechar"
                className="shrink-0 rounded p-1 text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
