import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Phone, Star, Clock, CheckCircle, ChefHat, Bike, MapPin, Package,
} from "lucide-react";
import { supabase } from "../services/restaurantService";
import { CLIENT_API_URL, createAuthHeaders } from "../services/api";

// ─── Stage definitions ───────────────────────────────────────────────────────
const STAGES = [
  { key: "pending",   label: "Pedido recebido",       emoji: "✅", icon: CheckCircle, msg: "Restaurante recebeu seu pedido." },
  { key: "preparing", label: "Restaurante preparando", emoji: "🍳", icon: ChefHat,     msg: "A cozinha está no trabalho!" },
  { key: "ready",     label: "Saiu para entrega",      emoji: "🛵", icon: Bike,        msg: "A caminho de você!" },
  { key: "delivering",label: "Entregador próximo",     emoji: "📍", icon: MapPin,      msg: "Seu entregador está quase lá!" },
  { key: "delivered", label: "Entregue!",              emoji: "🎉", icon: Package,     msg: "Aproveite sua refeição! 😊" },
];

const STATUS_TO_STAGE = {
  pending: 0, accepted: 1, preparing: 1,
  ready: 2, accepted_by_delivery: 2,
  delivering: 3, delivered: 4,
};

// ─── Countdown ───────────────────────────────────────────────────────────────
function CountdownTimer({ estimatedMinutes = 30, startedAt }) {
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

  if (remaining === null) return null;
  const mins = Math.floor(remaining);
  const secs = Math.floor((remaining - mins) * 60);
  const arrived = remaining === 0;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white text-center mb-5 shadow-lg shadow-orange-200">
      <p className="text-sm font-medium opacity-90 mb-1">
        {arrived ? "Chegou!" : "Chega em aproximadamente"}
      </p>
      {arrived ? (
        <p className="text-4xl font-black">🎉 Aqui está!</p>
      ) : (
        <div className="flex items-end justify-center gap-1">
          <span className="text-6xl font-black leading-none">{mins}</span>
          <span className="text-2xl mb-1">min</span>
          <span className="text-2xl mb-1 ml-2 opacity-70">{String(secs).padStart(2, "0")}s</span>
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
      <div className="absolute bottom-8 left-5 text-2xl" title="Restaurante">🏪</div>

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
      <div className="absolute top-3 left-5 text-xs font-bold text-gray-600 bg-white/80 px-2 py-0.5 rounded-full">Restaurante</div>
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

  // Realtime: order status
  useEffect(() => {
    if (!orderId) return;
    const ch = supabase
      .channel(`order-track-${orderId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        if (payload.new?.status) applyStatus(payload.new.status);
        setOrder((prev) => ({ ...prev, ...payload.new }));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orderId, applyStatus]);

  // Realtime: driver location
  useEffect(() => {
    if (!order?.delivery_id) return;
    const ch = supabase
      .channel(`driver-loc-${order.delivery_id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "delivery_profiles",
        filter: `user_id=eq.${order.delivery_id}`,
      }, (payload) => {
        setDriver((prev) => ({
          ...prev,
          current_lat: payload.new?.current_lat,
          current_lng: payload.new?.current_lng,
        }));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [order?.delivery_id]);

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

  const isDelivered = currentStage >= 4;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div>
          <h1 className="font-bold text-gray-800 text-base">Acompanhar Pedido</h1>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            #{orderId?.substring(0, 8).toUpperCase()}
          </p>
        </div>
        {!isDelivered && (
          <div className="ml-auto flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-orange-600">Ao vivo</span>
          </div>
        )}
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Countdown */}
        {!isDelivered && (
          <CountdownTimer
            estimatedMinutes={order?.estimated_delivery_minutes || 30}
            startedAt={order?.created_at}
          />
        )}

        {isDelivered && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white text-center mb-5 shadow-lg">
            <div className="text-5xl mb-2">🎉</div>
            <p className="text-2xl font-black">Pedido Entregue!</p>
            <p className="text-sm opacity-90 mt-1">Aproveite sua refeição!</p>
          </div>
        )}

        {/* Track visual */}
        <div className="mb-5">
          <TrackMap stage={currentStage} />
        </div>

        {/* Driver card */}
        <DriverCard driver={driver} />

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-md p-5 mb-5 border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Histórico do pedido</p>
          <Timeline currentStage={currentStage} />
        </div>

        {/* Order summary */}
        {order?.items?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-5 mb-5 border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Seu pedido</p>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm text-gray-700">
                  <span>{item.quantity}× {item.name}</span>
                  <span className="font-semibold">R$ {(+item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold text-gray-800">
                <span>Total</span>
                <span>R$ {(+order.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Rate button */}
        {isDelivered && (
          <Link
            to="/avaliacoes"
            className="block w-full text-center bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-200 hover:shadow-xl transition-all duration-300 text-lg"
          >
            ⭐ Avaliar Pedido
          </Link>
        )}
      </div>
    </div>
  );
}
