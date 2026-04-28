import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Star, X, Loader2 } from 'lucide-react';

import AuthService from '../services/authService';
import { useToast } from '../context/ToastContext.jsx';
import { PickupCodeDisplay } from '../components/PickupCodeDisplay.jsx';
import { deleteOrder as deleteOrderApi } from '../services/orderService';
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
          <Star className={`w-8 h-8 transition-colors ${s <= (hover || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
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
              className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-orange-300"
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
              className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-orange-300"
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
  const addToast = useToast();

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
      addToast(err.message || 'Erro ao carregar os pedidos.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

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
          if (msg) addToast(msg, updated.status === 'cancelled' ? 'error' : 'success');
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
      addToast('Pedido excluído com sucesso!', 'success');
    } catch (err) {
      addToast(err.message || 'Falha ao excluir o pedido.', 'error');
    }
  };

  const handleReviewDone = () => {
    setReviewedIds(getReviewedOrders());
    setReviewingOrder(null);
    addToast('Obrigado pela sua avaliação!', 'success');
  };

  const renderContent = () => {
    if (loading) return <p className="text-center text-gray-500 py-10">Carregando seus pedidos...</p>;
    if (error) return <p className="text-center text-red-500 py-10">Erro: {error}</p>;
    if (orders.length === 0) return <p className="text-center text-gray-500 py-10">Você ainda não fez nenhum pedido.</p>;

    return orders.map(order => {
      const isDelivered = order.status === 'delivered';
      const alreadyReviewed = reviewedIds.has(order.id);
      const canDelete = ['delivered', 'cancelled'].includes(order.status);

      return (
        <div key={order.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Pedido em {order.restaurant_name}</h2>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{order.id}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
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
            <p className="text-gray-700 text-sm"><strong>Total:</strong> R$ {parseFloat(order.total_amount).toFixed(2)}</p>
            <p className="text-gray-700 text-sm">
              <strong>Data:</strong>{' '}
              {order.created_at ? new Date(order.created_at).toLocaleString('pt-BR') : '--'}
            </p>
          </div>

          <PickupCodeDisplay orderId={order.id} orderStatus={order.status} />

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
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-semibold">
          <ArrowLeft size={18} />
          Voltar para a página inicial
        </Link>
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Meus Pedidos</h1>
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
