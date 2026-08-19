import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Phone, Star, Clock, CheckCircle, ChefHat, Bike, MapPin, Package, MessageCircle,
} from "lucide-react";
import { supabase } from "../services/restaurantService";
import { CLIENT_API_URL, createAuthHeaders } from "../services/api";
import ChatModal from "../components/ChatModal";
import LiveTrackingMap, { etaMinutes } from "../components/LiveTrackingMap";

// Extrai {lat,lng} de varias formas possiveis (objeto JSON ou campos soltos)
function parseCoord(...candidates) {
  for (const c of candidates) {
    if (!c) continue;
    const lat = c.lat ?? c.latitude ?? c.client_latitude;
    const lng = c.lng ?? c.lon ?? c.longitude ?? c.client_longitude;
    const nLat = Number(lat);
    const nLng = Number(lng);
    if (Number.isFinite(nLat) && Number.isFinite(nLng) && (nLat !== 0 || nLng !== 0)) {
      return { lat: nLat, lng: nLng };
    }
  }
  return null;
}

// ─── Stage definitions ───────────────────────────────────────────────────────
const STAGES = [
  { key: "pending",   label: "Pedido recebido",       emoji: "✅", icon: CheckCircle, msg: "A loja recebeu seu pedido." },
  { key: "preparing", label: "Loja preparando", emoji: "🍳", icon: ChefHat,     msg: "A cozinha está no trabalho!" },
  { key: "ready",     label: "Pedido pronto",          emoji: "📦", icon: Package,     msg: "Pronto! Aguardando um entregador retirar." },
  { key: "delivering",label: "Saiu para entrega",      emoji: "🛵", icon: Bike,        msg: "Seu pedido está a caminho de você!" },
  { key: "delivered", label: "Entregue!",              emoji: "🎉", icon: MapPin,      msg: "Aproveite sua refeição! 😊" },
];

// 'ready' = restaurante marcou pronto, mas AINDA NÃO há entregador → estágio
// "Pedido pronto" (não "Saiu para entrega", que só vale quando o entregador
// realmente retirou e está indo, status 'delivering'/'picked_up'/'on_the_way').
const STATUS_TO_STAGE = {
  pending: 0, accepted: 1, preparing: 1,
  ready: 2, accepted_by_delivery: 2,
  delivering: 3, picked_up: 3, on_the_way: 3, delivered: 4,
};

// ─── Countdown ───────────────────────────────────────────────────────────────
// Sem default para estimatedMinutes: o antigo "= 30" fazia a tela inventar um
// prazo quando nao havia estimativa nenhuma. Prazo ou e real ou nao aparece.
function CountdownTimer({
  estimatedMinutes,
  startedAt,
  label = "Chega em aproximadamente",
  doneLabel = "Chegou!",
  doneText = "🎉 Aqui está!",
}) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    const tick = () => {
      const start = startedAt ? new Date(startedAt).getTime() : Date.now();
      const elapsed = (Date.now() - start) / 60000;
      setRemaining(Math.max(0, estimatedMinutes - elapsed));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [estimatedMinutes, startedAt]);

  // sem estimativa real -> nao desenha nada (melhor vazio que inventado)
  if (remaining === null || !Number.isFinite(Number(estimatedMinutes))) return null;
  const mins = Math.floor(remaining);
  const secs = Math.floor((remaining - mins) * 60);
  const arrived = remaining === 0;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white text-center mb-5 shadow-lg shadow-orange-200">
      <p className="text-sm font-medium opacity-90 mb-1">
        {arrived ? doneLabel : label}
      </p>
      {arrived ? (
        <p className="text-3xl sm:text-4xl font-black">{doneText}</p>
      ) : (
        <div className="flex items-end justify-center gap-1">
          <span className="text-5xl sm:text-6xl font-black leading-none">{mins}</span>
          <span className="text-xl sm:text-2xl mb-1">min</span>
          <span className="text-xl sm:text-2xl mb-1 ml-2 opacity-70">{String(secs).padStart(2, "0")}s</span>
        </div>
      )}
    </div>
  );
}

// ─── Timeline ────────────────────────────────────────────────────────────────
function Timeline({ currentStage }) {
  return (
    <div>
      {STAGES.map((stage, idx) => {
        const done = idx < currentStage;
        const active = idx === currentStage;
        return (
          <div key={stage.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center text-lg flex-shrink-0 transition-all duration-500
                  ${done ? "bg-green-500 shadow-md shadow-green-200 text-white"
                    : active ? "bg-orange-500 shadow-lg shadow-orange-300 animate-pulse text-white"
                    : "bg-gray-100 text-gray-400"}`}
              >
                {done ? "✓" : stage.emoji}
              </div>
              {idx < STAGES.length - 1 && (
                <div className={`w-0.5 my-1 flex-1 min-h-[2rem] transition-all duration-700
                  ${done ? "bg-green-400" : "bg-gray-200"}`} />
              )}
            </div>

            <div className={`pb-5 pt-2 flex-1 min-h-[3rem] transition-opacity duration-300 ${!done && !active ? "opacity-40" : ""}`}>
              <p className={`font-bold text-sm ${active ? "text-orange-600" : done ? "text-green-700" : "text-gray-500"}`}>
                {stage.label}
              </p>
              {active && <p className="text-xs text-gray-500 mt-0.5">{stage.msg}</p>}
              {done && <p className="text-xs text-green-600 mt-0.5">Concluído ✓</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Animated track "map" ─────────────────────────────────────────────────────
function TrackMap({ stage }) {
  const positions = [5, 28, 52, 76, 95];
  const pct = positions[Math.min(stage, 4)];

  return (
    <div className="bg-gradient-to-b from-green-100 to-blue-50 h-40 relative overflow-hidden rounded-2xl">
      {/* Road */}
      <div className="absolute bottom-10 left-4 right-4 h-8 bg-gray-600 rounded-full shadow-inner flex items-center px-3 gap-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-white/40 rounded-full" />
        ))}
      </div>

      {/* Restaurant marker */}
      <div className="absolute bottom-8 left-5 text-2xl" title="Loja">🏪</div>

      {/* Driver emoji animating */}
      <div
        className="absolute bottom-9 text-2xl transition-all duration-1000 ease-in-out"
        style={{ left: `calc(${pct}% - 14px)` }}
      >
        🛵
      </div>

      {/* You marker */}
      <div className="absolute bottom-8 right-5 text-2xl" title="Você">📍</div>

      {/* Labels */}
      <div className="absolute top-3 left-5 text-xs font-bold text-gray-600 bg-white/80 px-2 py-0.5 rounded-full">Loja</div>
      <div className="absolute top-3 right-5 text-xs font-bold text-gray-600 bg-white/80 px-2 py-0.5 rounded-full">Você</div>
    </div>
  );
}

// ─── Driver card ──────────────────────────────────────────────────────────────
function DriverCard({ driver }) {
  if (!driver) return null;
  const initials = ((driver.first_name || driver.name || "?")[0]).toUpperCase();

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 mb-5 border border-gray-100">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Seu Entregador</p>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 overflow-hidden">
          {driver.avatar_url
            ? <img src={driver.avatar_url} alt="" className="w-full h-full object-cover" />
            : initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 truncate">
            {driver.first_name || driver.name || "Entregador"} {driver.last_name || ""}
          </p>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="text-sm font-semibold text-gray-700">{(+driver.rating || 5).toFixed(1)}</span>
          </div>
          {driver.vehicle_plate && (
            <p className="text-xs text-gray-500 mt-0.5">🛵 {driver.vehicle_plate}</p>
          )}
        </div>
        {driver.phone && (
          <a
            href={`tel:${driver.phone}`}
            className="w-11 h-11 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors flex-shrink-0 shadow-md"
          >
            <Phone className="w-5 h-5" />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="p-4 max-w-md mx-auto animate-pulse">
      <div className="h-32 bg-orange-200 rounded-2xl mb-5" />
      <div className="h-40 bg-gray-200 rounded-2xl mb-5" />
      <div className="h-20 bg-gray-200 rounded-2xl mb-5" />
      <div className="h-64 bg-gray-100 rounded-2xl" />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [driver, setDriver] = useState(null);
  const [currentStage, setCurrentStage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [delivererLocation, setDelivererLocation] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);

  const applyStatus = useCallback((status) => {
    setCurrentStage(STATUS_TO_STAGE[status] ?? 0);
  }, []);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`${CLIENT_API_URL}/api/orders/${orderId}`, {
        headers: { ...createAuthHeaders(), Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Pedido não encontrado");
      const json = await res.json();
      const ord = json.data ?? json;
      setOrder(ord);
      applyStatus(ord.status);

      if (ord.delivery_id) {
        const dr = await fetch(`${CLIENT_API_URL}/api/delivery/public-profile/${ord.delivery_id}`, {
          headers: createAuthHeaders(),
        }).catch(() => null);
        if (dr?.ok) {
          const dj = await dr.json();
          setDriver(dj.data ?? dj);
        }
      }
    } catch (e) {
      setError(e.message || "Erro ao carregar pedido.");
    } finally {
      setLoading(false);
    }
  }, [orderId, applyStatus]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // Atualização periódica (polling) do status. O realtime abaixo depende de RLS
  // e de o cliente estar autenticado no supabase-js; como aqui a auth é via
  // backend (o supabase-js roda anônimo), os eventos de `orders` podem não
  // chegar — e o cliente ficava tendo que sair e voltar pra ver o status mudar.
  // O polling garante o avanço sozinho. Para quando entregue/falhou.
  useEffect(() => {
    if (currentStage >= 4 || order?.status === 'delivery_failed'
        || ['cancelled', 'canceled'].includes(order?.status)) return;
    const id = setInterval(fetchOrder, 6000);
    const onVis = () => { if (document.visibilityState === 'visible') fetchOrder(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, [fetchOrder, currentStage, order?.status]);

  // Aviso de nova mensagem do entregador (estilo WhatsApp) mesmo com o chat
  // fechado: checa as mensagens a cada 8s; se chegou uma nova do entregador,
  // acende o badge do botão "Falar com entregador". Usa o endpoint autenticado
  // (o realtime do Supabase não entrega o chat aqui).
  const lastChatIdRef = useRef(null);
  // Marca que a linha de base já foi definida. Antes usávamos só o id da última
  // mensagem: com a conversa VAZIA saíamos antes de definir a base, então a
  // PRIMEIRA mensagem do entregador era tratada como "base" e não acendia o
  // aviso — só a segunda acendia. Com esta flag a base é definida na primeira
  // resposta mesmo sem mensagem nenhuma, e a 1ª mensagem já avisa.
  const baselineDoneRef = useRef(false);
  useEffect(() => {
    lastChatIdRef.current = null;
    baselineDoneRef.current = false;
    if (!orderId || !order?.delivery_id) return;
    let alive = true;
    const check = async () => {
      try {
        const res = await fetch(`${CLIENT_API_URL}/api/chat/${orderId}/messages`, { headers: createAuthHeaders() });
        if (!alive || !res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.messages || data?.data || []);
        const last = list.length ? list[list.length - 1] : null;
        if (!baselineDoneRef.current) {
          baselineDoneRef.current = true;
          lastChatIdRef.current = last?.id ?? null;
          return;
        }
        if (!last) return;
        if (last.id !== lastChatIdRef.current) {
          lastChatIdRef.current = last.id;
          const fromDriver = (last.sender_type || last.sender) === 'delivery';
          if (fromDriver && !chatOpen) {
            setChatUnread((n) => n + 1);
            try {
              const ctx = new (window.AudioContext || window.webkitAudioContext)();
              const o = ctx.createOscillator(); const g = ctx.createGain();
              o.connect(g); g.connect(ctx.destination);
              o.frequency.value = 880; o.type = 'sine';
              g.gain.setValueAtTime(0.2, ctx.currentTime);
              g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
              o.start(); o.stop(ctx.currentTime + 0.25);
            } catch { /* sem som se o browser bloquear */ }
          }
        }
      } catch { /* silencioso */ }
    };
    check();
    const id = setInterval(check, 5000);
    return () => { alive = false; clearInterval(id); };
  }, [orderId, order?.delivery_id, chatOpen]);

  // Realtime: order status
  // ── Realtime do Supabase REMOVIDO (auditoria de 18/08/2026) ────────────────
  //
  // Havia aqui uma inscrição em postgres_changes que NUNCA entregou um evento
  // sequer. A política de RLS resolve o dono comparando auth.uid() com colunas
  // que apontam pro PERFIL, não pro usuário do auth — medido no banco:
  // client_profiles.id = user_id em 0 de 24, delivery_profiles em 0 de 6 (só
  // restaurant_profiles casa, 17 de 17). E nenhum app chama
  // supabase.auth.setSession: todos conectam como anon puro, então auth.uid()
  // é NULL e nenhuma política casa.
  //
  // Provado com a chave anon do pacote publicado:
  //   GET /rest/v1/orders  ->  0 linhas
  //   GET /rest/v1/chat_messages  ->  0 linhas
  //   GET /rest/v1/delivery_tracking  ->  0 linhas
  // Sem leitura não há evento: o canal conectava e ficava mudo.
  //
  // Isso está CERTO em segurança (nenhum anônimo lê pedido ou conversa alheia).
  // O problema era o canal existir e PARECER que funcionava — em 18/08 essa
  // aparência me levou a afrouxar o polling de 6s pra 20s "porque o realtime
  // cobre". Não cobria.
  //
  // O que ele prometia já vem por dois caminhos que funcionam: o POLLING desta
  // mesma tela (app aberto) e o PUSH do FCM (app em segundo plano).
  //
  // PRA RESSUSCITAR seriam DUAS coisas, nesta ordem: (1) os apps abrirem sessão
  // no Supabase com setSession e (2) reescrever as políticas pra resolver o
  // perfil (client_id IN (SELECT id FROM client_profiles WHERE user_id =
  // auth.uid())). Mexer só numa das duas não liga nada.


  // Realtime: driver location
  // ── Realtime REMOVIDO (auditoria de 18/08/2026) ────────────────────────────
  // Canal que nunca entregou evento: a RLS compara auth.uid() com colunas que
  // apontam pro PERFIL, e os apps conectam como anon puro (sem setSession),
  // então auth.uid() é NULL. Testado com a chave anon publicada: leitura de
  // orders / delivery_profiles / delivery_tracking devolve 0 linhas — e sem
  // leitura não há evento. Quem entrega isso é o polling desta mesma tela.
  // Detalhes completos e o caminho pra ressuscitar: ver a nota no ChatModal.


  // Realtime: localização do entregador via delivery_tracking
  // ── Realtime REMOVIDO (auditoria de 18/08/2026) ────────────────────────────
  // Canal que nunca entregou evento: a RLS compara auth.uid() com colunas que
  // apontam pro PERFIL, e os apps conectam como anon puro (sem setSession),
  // então auth.uid() é NULL. Testado com a chave anon publicada: leitura de
  // orders / delivery_profiles / delivery_tracking devolve 0 linhas — e sem
  // leitura não há evento. Quem entrega isso é o polling desta mesma tela.
  // Detalhes completos e o caminho pra ressuscitar: ver a nota no ChatModal.


  // ── Coordenadas para o mapa ao vivo ─────────────────────────────────────────
  const driverPos = useMemo(
    () => parseCoord(
      delivererLocation,
      driver ? { lat: driver.current_lat, lng: driver.current_lng } : null,
    ),
    [delivererLocation, driver],
  );
  const destPos = useMemo(
    () => parseCoord(order?.delivery_address, order),
    [order],
  );
  const restaurantPos = useMemo(
    () => parseCoord(
      order ? { lat: order.restaurant_latitude, lng: order.restaurant_longitude } : null,
      order?.restaurant_address,
    ),
    [order],
  );
  const hasLiveMap = !!(driverPos || destPos || restaurantPos);
  // ETA dinamico real (entregador -> destino) quando ambos conhecidos
  const liveEta = useMemo(
    () => (driverPos && destPos ? etaMinutes(driverPos, destPos) : null),
    [driverPos, destPos],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 bg-white shadow-sm px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-5 w-32 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <Skeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{error}</h2>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full font-semibold"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // Estados TERMINAIS negativos: recusado/cancelado (restaurante não aceitou,
  // pagamento não confirmou, cliente cancelou) OU entrega não realizada
  // (delivery_failed). Tela dedicada em vez de deixar a linha do tempo travada
  // em "Pedido recebido" com o banner por cima (confuso), ou quebrar e ficar
  // branca.
  const isCancelled = ['cancelled', 'canceled'].includes(order?.status);
  const isDeliveryFailed = order?.status === 'delivery_failed';
  if (isCancelled || isDeliveryFailed) {
    const reason = String(order?.cancellation_reason || '');
    const isPaymentIssue = isCancelled && /payment|pagamento|expired|overdue|rejeit|reject/i.test(reason);
    const wasPaidOnline = order?.status_pagamento === 'approved';
    const headline = isDeliveryFailed
      ? 'Entrega não realizada'
      : isPaymentIssue ? 'Pedido não confirmado' : 'Pedido recusado';
    const message = isDeliveryFailed
      ? 'Tivemos um problema ao entregar seu pedido. Nossa equipe está cuidando do caso.'
      : isPaymentIssue
        ? 'O pagamento não foi confirmado, então o pedido foi cancelado.'
        : 'A loja não pôde aceitar seu pedido no momento. Sentimos muito pelo transtorno.';
    const emoji = isDeliveryFailed ? '⚠️' : '🚫';
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 bg-white shadow-sm px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="font-bold text-gray-800 text-base">Acompanhar Pedido</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              #{orderId?.substring(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="p-4 max-w-md mx-auto">
          <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-6 text-white text-center mb-5 shadow-lg">
            <div className="text-5xl mb-2">{emoji}</div>
            <p className="text-xl sm:text-2xl font-black">{headline}</p>
            <p className="text-sm opacity-90 mt-2">{message}</p>
            {wasPaidOnline && (
              <p className="text-sm opacity-90 mt-2">
                Como o pagamento já havia sido feito, o reembolso será processado automaticamente.
              </p>
            )}
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors"
          >
            Voltar ao início
          </button>
          <button
            onClick={() => navigate('/meus-pedidos')}
            className="w-full mt-3 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Ver meus pedidos
          </button>
        </div>
      </div>
    );
  }

  const isDelivered = currentStage >= 4;
  const isFailed = order?.status === 'delivery_failed';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div>
          <h1 className="font-bold text-gray-800 text-base">Acompanhar Pedido</h1>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            #{orderId?.substring(0, 8).toUpperCase()}
          </p>
        </div>
        {!isDelivered && !isFailed && (
          <div className="ml-auto flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-orange-600">Ao vivo</span>
          </div>
        )}
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Entrega não realizada */}
        {isFailed && (
          <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-6 text-white text-center mb-5 shadow-lg">
            <div className="text-5xl mb-2">⚠️</div>
            <p className="text-xl sm:text-2xl font-black">Entrega não realizada</p>
            <p className="text-sm opacity-90 mt-1">
              Tivemos um problema ao entregar seu pedido. Nossa equipe está cuidando do caso e, se houver reembolso, ele será processado automaticamente.
            </p>
          </div>
        )}

        {/* Countdown — so aparece com numero REAL, nunca inventado.
            1) entregador a caminho: ETA calculado do GPS dele ate o destino
            2) sem entregador ainda: o tempo de PREPARO que o restaurante
               informou ao aceitar (orders.estimated_prep_time) — rotulado como
               preparo, nao como chegada, porque nao inclui o trajeto
            3) restaurante ainda nao aceitou/nao informou: nada.
            Antes daqui o fallback era "estimated_delivery_minutes || 30" — e a
            coluna nao existe, entao TODO pedido mostrava 30 min inventados. */}
        {!isDelivered && !isFailed && (
          liveEta != null ? (
            <CountdownTimer estimatedMinutes={liveEta} startedAt={Date.now()} />
          ) : order?.estimated_prep_time ? (
            <CountdownTimer
              estimatedMinutes={order.estimated_prep_time}
              startedAt={order.accepted_at || order.created_at}
              label="Fica pronto em aproximadamente"
              doneLabel="Preparo concluído"
              doneText="👨‍🍳 Saindo da cozinha!"
            />
          ) : null
        )}

        {isDelivered && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white text-center mb-5 shadow-lg">
            <div className="text-5xl mb-2">🎉</div>
            <p className="text-xl sm:text-2xl font-black">Pedido Entregue!</p>
            <p className="text-sm opacity-90 mt-1">Aproveite sua refeição!</p>
          </div>
        )}

        {/* Track visual — mapa real ao vivo quando ha coordenadas, senao animacao */}
        {!isFailed && (
          <div className="mb-5">
            {hasLiveMap && !isDelivered ? (
              <LiveTrackingMap driver={driverPos} restaurant={restaurantPos} destination={destPos} />
            ) : (
              <TrackMap stage={currentStage} />
            )}
          </div>
        )}

        {/* Driver card */}
        <DriverCard driver={driver} />

        {/* Código de entrega — o cliente mostra ao entregador na hora da entrega
            pra confirmar o recebimento. Fica aqui na própria tela de
            acompanhamento pra não precisar sair pra outra tela. Só aparece
            enquanto o pedido está em andamento (some depois de entregue/falhado)
            e quando o backend devolve o código (só pro dono do pedido). */}
        {order?.delivery_code && !isDelivered && !isFailed && (
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 mb-5 text-white text-center shadow-lg shadow-orange-200">
            <p className="text-xs font-bold uppercase tracking-widest opacity-90 mb-1">
              🔑 Código de entrega
            </p>
            <p className="text-4xl font-black tracking-[0.35em] pl-[0.35em] my-1">
              {String(order.delivery_code).toUpperCase()}
            </p>
            <p className="text-xs opacity-90 mt-1">
              {/* Pode ser entregador Inksa ou o motoboy da própria loja — o
                  código confirma o recebimento nos dois casos. */}
              Mostre este código a quem entregar o pedido para confirmar o recebimento.
            </p>
          </div>
        )}

        {/* Localização do entregador — card informativo quando em rota */}
        {delivererLocation?.latitude && delivererLocation?.longitude && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-5 flex items-center gap-3">
            <span className="text-2xl">📍</span>
            <div>
              <p className="font-semibold text-orange-700 text-sm">Entregador localizado</p>
              <p className="text-xs text-orange-600 mt-0.5">Atualizando posição a cada 10 segundos...</p>
            </div>
          </div>
        )}

        {/* Botão de chat com entregador — aparece assim que há um entregador
            atribuído (delivery_id) e o pedido ainda está em andamento. Antes só
            aparecia em 'delivering', então o cliente não via o chat enquanto o
            entregador estava indo buscar no restaurante (accepted_by_delivery),
            mesmo o entregador já podendo mandar mensagem. */}
        {order?.delivery_id && !isDelivered && !isFailed && (
          <button
            onClick={() => { setChatOpen(true); setChatUnread(0); }}
            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-[#FF6F00] text-[#FF6F00] font-bold py-3 min-h-[44px] rounded-2xl mb-5 hover:bg-orange-50 transition-colors shadow-sm relative"
          >
            <MessageCircle className="w-5 h-5" />
            Falar com entregador
            {chatUnread > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                {chatUnread > 9 ? '9+' : chatUnread}
              </span>
            )}
          </button>
        )}

        {/* Chat modal */}
        <ChatModal
          orderId={orderId}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          senderType="client"
          onUnreadChange={(n) => { if (!chatOpen) setChatUnread(n); }}
        />

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-md p-5 mb-5 border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Histórico do pedido</p>
          <Timeline currentStage={currentStage} />
        </div>

        {/* Order summary — separa os produtos da taxa de entrega (padrão iFood):
            mais claro e igualmente transparente. A taxa aparece rotulada, não
            como um item "1× Taxa de Entrega" (que confundia). Os itens são
            gravados como {title, unit_price, quantity}. */}
        {order?.items?.length > 0 && (() => {
          const isFee = (it) =>
            !it.menu_item_id && /taxa|entrega|frete/i.test(it.title || it.name || '');
          const lineTotal = (it) =>
            (Number(it.unit_price ?? it.price ?? 0) || 0) * (Number(it.quantity ?? 1) || 1);
          const produtos = order.items.filter((it) => !isFee(it));
          const subtotal = produtos.reduce((s, it) => s + lineTotal(it), 0);
          const feeFromItems = order.items.filter(isFee).reduce((s, it) => s + lineTotal(it), 0);
          const deliveryFee = Number.isFinite(+order.delivery_fee) && +order.delivery_fee > 0
            ? +order.delivery_fee
            : feeFromItems;
          const total = +order.total_amount || (subtotal + deliveryFee);
          return (
            <div className="bg-white rounded-2xl shadow-md p-5 mb-5 border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Seu pedido</p>
              <div className="space-y-2">
                {produtos.map((item, i) => {
                  const nome = item.title || item.name || item.product_name || 'Item';
                  const qtd = Number(item.quantity ?? 1) || 1;
                  return (
                    <div key={i} className="flex justify-between gap-2 text-sm text-gray-700">
                      <span className="min-w-0 break-words">{qtd}× {nome}</span>
                      <span className="font-semibold whitespace-nowrap">R$ {lineTotal(item).toFixed(2)}</span>
                    </div>
                  );
                })}

                <div className="border-t pt-2 flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Taxa de entrega</span>
                    <span>R$ {deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-gray-800">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Rate button */}
        {isDelivered && (
          <Link
            to="/avaliacoes"
            className="block w-full text-center bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 min-h-[44px] rounded-2xl shadow-lg shadow-orange-200 hover:shadow-xl transition-all duration-300 text-base sm:text-lg"
          >
            ⭐ Avaliar Pedido
          </Link>
        )}
      </div>
    </div>
  );
}
