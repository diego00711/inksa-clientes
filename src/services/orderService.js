// inksa-clientes/src/services/orderService.js — VERSÃO ROBUSTA (com 204-safe)
import { CLIENT_API_URL, processResponse, createAuthHeaders } from './api';
import { apiFetch } from './apiClient.js';

/**
 * Helper: processa resposta que pode ser 204 (sem corpo) sem quebrar.
 */
const processMaybeNoContent = async (response) => {
  if (response.status === 204) {
    return { status: 'success' };
  }
  return processResponse(response);
};

/** Calcula a taxa de entrega. */
export const calculateDeliveryFee = async (deliveryData) => {
  console.log('🚚 Iniciando cálculo de frete:', deliveryData);
  try {
    const url = `${CLIENT_API_URL}/api/delivery/calculate_fee`;
    const response = await apiFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deliveryData),
    });
    let data = null;
    try { data = await response.json(); } catch { data = null; }

    // Fora da área da loja de entrega própria: recusa intencional (vem com
    // HTTP 200), tratada à parte pelo carrinho.
    if (data?.error === 'fora_da_area') {
      return { status: 'error', error: 'fora_da_area', message: data.message };
    }
    if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);

    // NUNCA inventar um preço aqui. O "R$ 5 padrão" que existia neste ponto
    // devolvia status:'success' por cima de qualquer falha — o carrinho
    // acreditava, mostrava R$ 5,00 e deixava fechar o pedido com o frete
    // errado, sem nenhum aviso. Era a origem do frete R$ 5 fixo.
    const raw = (data?.status === 'success' ? data.data : data) || {};
    const fee = Number(raw.delivery_fee);
    if (!Number.isFinite(fee)) throw new Error('Resposta sem valor de frete');

    return {
      status: 'success',
      data: {
        delivery_fee: fee,
        // O backend devolve `delivery_distance_km`. Este serviço não repassava
        // o campo e o carrinho lia `distance_km` — resultado: TODO pedido era
        // gravado com 0 km, e o repasse do entregador saía calculado sobre
        // distância zero. Aceita os dois nomes por segurança.
        delivery_distance_km: Number(raw.delivery_distance_km ?? raw.distance_km) || 0,
        delivery_type: raw.delivery_type || null,
        message: raw.message || 'Frete calculado com sucesso',
      },
    };
  } catch (err) {
    console.error('❌ Erro ao calcular frete:', err);
    return {
      status: 'error',
      error: 'calculo_falhou',
      message: 'Não foi possível calcular o frete. Tente novamente.',
    };
  }
};

/** Cria um novo pedido. */
export const createOrder = async (orderData) => {
  try {
    const url = `${CLIENT_API_URL}/api/orders`;
    const response = await apiFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...createAuthHeaders() },
      body: JSON.stringify(orderData),
    });
    return processResponse(response);
  } catch (err) {
    console.error('❌ Erro ao criar pedido:', err);
    throw err;
  }
};

/** Cria a preferência de pagamento no Mercado Pago. */
export const createPaymentPreference = async (preferenceData) => {
  const url = `${CLIENT_API_URL}/api/pagamentos/criar_preferencia`;
  const response = await apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...createAuthHeaders() },
    body: JSON.stringify(preferenceData),
  });
  return processResponse(response);
};

/** Processa pagamento com cartão (transparente, sem redirecionar) via token do MP Bricks. */
export const processCardPayment = async (payload) => {
  const url = `${CLIENT_API_URL}/api/pagamentos/processar_cartao`;
  const response = await apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...createAuthHeaders() },
    body: JSON.stringify(payload),
  });
  return processResponse(response);
};

/** Pedidos pendentes de avaliação do CLIENTE.
 *
 * Apontava para /api/reviews/orders/pending-reviews, que NUNCA existiu no
 * backend (as rotas de avaliação vivem em /api/review, singular, com outros
 * caminhos). O 404 virava lista vazia e a tela dizia "Nenhum pedido para
 * avaliar" mesmo com pedidos entregues esperando nota.
 *
 * O endpoint certo devolve um ARRAY direto de
 * { id, restaurant_id, restaurant_name, deliveryman_id, deliveryman_name, completed_at }.
 */
export const getOrdersPendingClientReview = async (signal) => {
  const url = `${CLIENT_API_URL}/api/orders/pending-client-review`;
  const response = await apiFetch(url, {
    method: 'GET',
    headers: createAuthHeaders(),
    signal,
  });
  const data = await processResponse(response);
  if (Array.isArray(data)) return data;
  return data?.pending_reviews ?? data?.orders ?? [];
};

/** ✅ Cria avaliação unificada (restaurante + entregador) */
export const createUnifiedReview = async (orderId, reviewData) => {
  const url = `${CLIENT_API_URL}/api/reviews/orders/${orderId}/review`;
  const response = await apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...createAuthHeaders() },
    body: JSON.stringify(reviewData),
  });
  return processResponse(response);
};

/** ✅ Verifica status de avaliação de um pedido */
export const getReviewStatus = async (orderId) => {
  const url = `${CLIENT_API_URL}/api/reviews/orders/${orderId}/review-status`;
  const response = await apiFetch(url, {
    method: 'GET',
    headers: createAuthHeaders(),
  });
  return processResponse(response);
};

/** ✅ NOVO: busca códigos do pedido (compatível com /api/orders/:id/codes) */
export const getOrderCodes = async (orderId) => {
  const url = `${CLIENT_API_URL}/api/orders/${orderId}/codes`;
  const response = await apiFetch(url, {
    method: 'GET',
    headers: createAuthHeaders(),
  });
  const data = await processResponse(response);

  // Normalização leve pra evitar undefined no consumo
  return {
    order_id: data?.order_id ?? orderId,
    status: data?.status ?? null,
    pickup_code: data?.pickup_code ?? null,
    delivery_code: data?.delivery_code ?? null,
  };
};

/** ✅ NOVO: excluir/arquivar pedido do cliente (204-safe) */
export const deleteOrder = async (orderId) => {
  const url = `${CLIENT_API_URL}/api/orders/${orderId}`;
  const response = await apiFetch(url, {
    method: 'DELETE',
    headers: { ...createAuthHeaders() },
  });
  return processMaybeNoContent(response);
};

/**
 * ✅ Cancela o próprio pedido (apenas enquanto o restaurante ainda não aceitou).
 * Se o pedido já estava pago online, o backend dispara o estorno automático.
 */
export const cancelOrderByClient = async (orderId) => {
  const url = `${CLIENT_API_URL}/api/orders/${orderId}/cancel-by-client`;
  const response = await apiFetch(url, {
    method: 'POST',
    headers: { ...createAuthHeaders() },
  });
  return processResponse(response);
};

/* (Opcional) export default para facilitar import agrupado */
const OrderService = {
  calculateDeliveryFee,
  createOrder,
  createPaymentPreference,
  getOrdersPendingClientReview,
  createUnifiedReview,
  getReviewStatus,
  getOrderCodes,
  deleteOrder,
  cancelOrderByClient,
};

export default OrderService;
