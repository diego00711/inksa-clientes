import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { ArrowLeft, Trash2, Star, X, Loader2 } from 'lucide-react';

import AuthService from '../services/authService';
import { useToast } from '../context/ToastContext.jsx';
import { PickupCodeDisplay } from '../components/PickupCodeDisplay.jsx';
import { deleteOrder as deleteOrderApi, cancelOrderByClient } from '../services/orderService';
import { CLIENT_API_URL } from '../services/api';
import { postRestaurantReview, postDeliveryReview } from '../services/reviewService';
import { supabase } from '../services/restaurantService';

const API_URL = `${CLIENT_API_URL}/api`;

// ─── helpers ─────────────────────────────────────────────────────────────────

function getReviewedOrders() {
  try { return new Set(JSON.parse(localStorage.getItem('reviewedOrders') || '[]')); }
  catch { return new Set(); }
}

function saveReviewedOrder(orderId) {
  const s = getReviewedOrders();
  s.add(orderId);
  localStorage.setItem('reviewedOrders', JSON.stringify([...s]));
}

const STATUS_MAP = {
  awaiting_payment: 'Aguardando pagamento',
  pending: 'Pendente',
  accepted: 'Aceito',
  preparing: 'Em Preparo',
  ready: 'Pronto para Entrega',
  accepted_by_delivery: 'Entregador a Caminho',
  delivering: 'Saiu para Entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  archived: 'Arquivado',
};

const STATUS_TOAST = {
  accepted:            'Seu pedido foi aceito pelo restaurante!',
  preparing:           'Seu pedido está sendo preparado.',
  ready:               'Pedido pronto! Aguardando entregador.',
  accepted_by_delivery:'Entregador a caminho do restaurante!',
  delivering:          'Pedido saiu para entrega!',
  delivered:           'Pedido entregue! Não esqueça de avaliar.',
  cancelled:           'Seu pedido foi cancelado.',
};

const STATUS_COLORS = {
  awaiting_payment:    'bg-gray-100 text-gray-700',
  pending:             'bg-yellow-100 text-yellow-800',
  accepted:            'bg-blue-100 text-blue-800',
  preparing:           'bg-indigo-100 text-indigo-800',
  ready:               'bg-purple-100 text-purple-800',
  accepted_by_delivery:'bg-pink-100 text-pink-800',
  delivering:          'bg-orange-100 text-orange-800',
  delivered:           'bg-green-100 text-green-800',
  cancelled:           'bg-red-100 text-red-800',
};

// ─── StarPicker ───────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none"
        >
          <Star className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${s <= (hover || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );
}

// ─── ReviewModal ──────────────────────────────────────────────────────────────

function ReviewModal({ order, onClose, onDone }) {
  const [step, setStep] = useState('restaurant'); // 'restaurant' | 'delivery' | 'done'
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [restaurantComment, setRestaurantComment] = useState('');
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [deliveryComment, setDeliveryComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const hasDelivery = !!order.delivery_id;

  const submitRestaurant = async () => {
    if (!restaurantRating) { setErrorMsg('Selecione uma nota para o restaurante.'); return; }
    if (!order.restaurant_id) { setErrorMsg('ID do restaurante não disponível.'); return; }
    setLoading(true);
    setErrorMsg('');
    try {
      await postRestaurantReview({
        restaurantId: order.restaurant_id,
        orderId: order.id,
        rating: restaurantRating,
        comment: restaurantComment,
      });
      if (hasDelivery) {
        setStep('delivery');
      } else {
        saveReviewedOrder(order.id);
        onDone();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao enviar avaliação do restaurante.');
    } finally {
      setLoading(false);
    }
  };

  const submitDelivery = async () => {
    if (!deliveryRating) { setErrorMsg('Selecione uma nota para o entregador.'); return; }
    setLoading(true);
    setErrorMsg('');
    try {
      await postDeliveryReview({
        deliverymanId: order.delivery_id,
        orderId: order.id,
        rating: deliveryRating,
        comment: deliveryComment,
      });
      saveReviewedOrder(order.id);
      onDone();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao enviar avaliação do entregador.');
    } finally {
      setLoading(false);
    }
  };

  const skipDelivery = () => {
    saveReviewedOrder(order.id);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>

        {step === 'restaurant' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Avalie o restaurante</h2>
            <p className="text-sm text-gray-500 mb-5">{order.restaurant_name}</p>

            <div className="flex justify-center mb-4">
              <StarPicker value={restaurantRating} onChange={setRestaurantRating} />
            </div>

            <textarea
              value={restaurantComment}
              onChange={e => setRestaurantComment(e.target.value)}
              placeholder="Deixe um comentário (opcional)..."
              className="w-full border border-gray-200 rounded-lg p-3 text-base resize-none h-20 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />

            {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}

            <button
              onClick={submitRestaurant}
              disabled={loading}
              className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="animate-spin w-4 h-4" />}
              {hasDelivery ? 'Próximo: avaliar entregador' : 'Enviar avaliação'}
            </button>
          </div>
        )}

        {step === 'delivery' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Avalie o entregador</h2>
            <p className="text-sm text-gray-500 mb-5">Como foi a experiência de entrega?</p>

            <div className="flex justify-center mb-4">
              <StarPicker value={deliveryRating} onChange={setDeliveryRating} />
            </div>

            <textarea
              value={deliveryComment}
              onChange={e => setDeliveryComment(e.target.value)}
              placeholder="Deixe um comentário (opcional)..."
              className="w-full border border-gray-200 rounded-lg p-3 text-base resize-none h-20 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />

            {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}

            <button
              onClick={submitDelivery}
              disabled={loading}
              className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="animate-spin w-4 h-4" />}
              Enviar avaliação
            </button>
            <button onClick={skipDelivery} className="mt-2 w-full text-sm text-gray-400 hover:text-gray-600 py-2">
              Pular avaliação do entregador
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MyOrdersPage ─────────────────────────────────────────────────────────────

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [reviewedIds, setReviewedIds] = useState(getReviewedOrders);
  const { addToast } = useToast();

  const fetchOrders = useCallback(async () => {
    try {
      const authToken = AuthService.getToken();
      if (!authToken) { AuthService.logout(); return; }

      const response = await fetch(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${authToken}` },
        credentials: 'include',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível buscar os pedidos.');
      setOrders(Array.isArray(result) ? result : (result.data || []));
    } catch (err) {
      setError(err.message);
      addToast('error', err.message || 'Erro ao carregar os pedidos.');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const { pulling, refreshing } = usePullToRefresh(fetchOrders);

  // Polling
  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 10000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  // Supabase Realtime — notifica mudança de status
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('order-status-client')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
        const updated = payload.new;
        setOrders(prev => {
          const existing = prev.find(o => o.id === updated.id);
          if (!existing || existing.status === updated.status) return prev;
          const msg = STATUS_TOAST[updated.status];
          if (msg) addToast(updated.status === 'cancelled' ? 'error' : 'success', msg);
          return prev.map(o => o.id === updated.id ? { ...o, status: updated.status } : o);
        });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [addToast]);

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Tem certeza que deseja excluir este pedido?')) return;
    try {
      await deleteOrderApi(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      addToast('success', 'Pedido excluído com sucesso!');
    } catch (err) {
      addToast('error', err.message || 'Falha ao excluir o pedido.');
    }
  };

  const [cancelingId, setCancelingId] = useState(null);
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Deseja mesmo cancelar este pedido? Se já estiver pago, o estorno é solicitado automaticamente.')) return;
    setCancelingId(orderId);
    try {
      await cancelOrderByClient(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      addToast('success', 'Pedido cancelado com sucesso.');
    } catch (err) {
      addToast('error', err.message || 'Não foi possível cancelar o pedido.');
    } finally {
      setCancelingId(null);
    }
  };

  const handleReviewDone = () => {
    setReviewedIds(getReviewedOrders());
    setReviewingOrder(null);
    addToast('success', 'Obrigado pela sua avaliação!');
  };

  const renderContent = () => {
    if (loading) return (
      // FIX: replace plain text with spinner for better UX
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent" />
        <p className="text-gray-500 text-sm">Carregando seus pedidos...</p>
      </div>
    );
    if (error) return (
      // FIX: styled error state with retry button
      <div className="text-center py-12 bg-white rounded-lg shadow-md border border-red-100 p-8">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-red-600 font-semibold mb-2">Não foi possível carregar os pedidos</p>
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <button
          onClick={fetchOrders}
          className="px-5 py-2 bg-orange-500 text-white text-sm font-semibold rounded-full hover:bg-orange-600 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
    if (orders.length === 0) return (
      // FIX: styled empty state
      <div className="text-center py-16 bg-white rounded-lg shadow-md border border-gray-100 p-8">
        <div className="text-5xl mb-4">🛍️</div>
        <p className="text-gray-700 font-semibold text-lg">Nenhum pedido ainda</p>
        <p className="text-gray-400 text-sm mt-1">Faça seu primeiro pedido e ele aparecerá aqui.</p>
      </div>
    );

    return orders.map(order => {
      const isDelivered = order.status === 'delivered';
      const alreadyReviewed = reviewedIds.has(order.id);
      const canDelete = ['delivered', 'cancelled'].includes(order.status);
      const canCancel = ['awaiting_payment', 'pending'].includes(order.status);

      return (
        <div key={order.id} className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 mb-4 sm:mb-6">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-xl font-bold text-gray-800 break-words">Pedido em {order.restaurant_name}</h2>
              <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{order.id}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
              <span className={`px-3 py-1 text-sm font-bold rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                {STATUS_MAP[order.status] || order.status}
              </span>
              {canDelete && (
                <button onClick={() => handleDeleteOrder(order.id)} className="text-gray-400 hover:text-red-600" title="Excluir pedido">
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4 space-y-1">
            {/* FIX: guard against NaN when total_amount is undefined */}
            <p className="text-gray-700 text-sm"><strong>Total:</strong> R$ {(parseFloat(order.total_amount) || 0).toFixed(2)}</p>
            <p className="text-gray-700 text-sm">
              <strong>Data:</strong>{' '}
              {order.created_at ? new Date(order.created_at).toLocaleString('pt-BR') : '--'}
            </p>
          </div>

          <PickupCodeDisplay orderId={order.id} orderStatus={order.status} />

          {canCancel && (
            <button
              onClick={() => handleCancelOrder(order.id)}
              disabled={cancelingId === order.id}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2.5 rounded-lg border border-red-200 transition-colors text-sm disabled:opacity-60"
            >
              {cancelingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              Cancelar pedido
            </button>
          )}

          {isDelivered && !alreadyReviewed && (
            <button
              onClick={() => setReviewingOrder(order)}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 font-semibold py-2.5 rounded-lg border border-orange-200 transition-colors text-sm"
            >
              <Star className="w-4 h-4" />
              Avaliar pedido
            </button>
          )}
          {isDelivered && alreadyReviewed && (
            <p className="mt-4 text-center text-xs text-green-600 font-medium">Avaliação enviada</p>
          )}
        </div>
      );
    });
  };

  return (
    <div className="bg-amber-50 min-h-screen py-8 px-4">
      {(pulling || refreshing) && (
        <div className="flex justify-center py-3">
          <div className="w-6 h-6 border-2 border-[#FF6F00] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-semibold">
          <ArrowLeft size={18} />
          Voltar para a página inicial
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-6 sm:mb-8">Meus Pedidos</h1>
        <div>{renderContent()}</div>
      </div>

      {reviewingOrder && (
        <ReviewModal
          order={reviewingOrder}
          onClose={() => setReviewingOrder(null)}
          onDone={handleReviewDone}
        />
      )}
    </div>
  );
};

export default MyOrdersPage;
