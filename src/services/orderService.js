// inksa-clientes/src/services/orderService.js - VERSÃO COMPLETA
import { CLIENT_API_URL, processResponse, createAuthHeaders } from './api';

/** Calcula a taxa de entrega. */
export const calculateDeliveryFee = async (deliveryData) => {
  console.log('🚚 Iniciando cálculo de frete:', deliveryData);
  try {
    const url = `${CLIENT_API_URL}/api/delivery/calculate_fee`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deliveryData),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await processResponse(response);

    let deliveryFee = 5.0;
    if (data?.status === 'success' && typeof data?.data?.delivery_fee === 'number') {
      deliveryFee = data.data.delivery_fee;
    } else if (typeof data?.delivery_fee === 'number') {
      deliveryFee = data.delivery_fee;
    }
    return { status: 'success', data: { delivery_fee: Number(deliveryFee) || 5.0, message: data?.data?.message || data?.message || 'Frete calculado com sucesso' } };
  } catch (err) {
    console.error('❌ Erro ao calcular frete:', err);
    return { status: 'success', data: { delivery_fee: 5.0, message: 'Taxa padrão aplicada (erro na conexão)' } };
  }
};

/** Cria um novo pedido. */
export const createOrder = async (orderData) => {
  const url = `${CLIENT_API_URL}/api/orders`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...createAuthHeaders() },
    body: JSON.stringify(orderData),
  });
  return processResponse(response);
};

/** Cria a preferência de pagamento no Mercado Pago. */
export const createPaymentPreference = async (preferenceData) => {
  const url = `${CLIENT_API_URL}/api/pagamentos/criar_preferencia`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferenceData),
  });
  return processResponse(response);
};

/** ✅ Pedidos pendentes de avaliação do CLIENTE */
export const getOrdersPendingClientReview = async (signal) => {
  const url = `${CLIENT_API_URL}/api/reviews/orders/pending-reviews`;
  const response = await fetch(url, { method: 'GET', headers: createAuthHeaders(), signal });
  const data = await processResponse(response);
  return data?.pending_reviews ?? [];
};

/** ✅ Cria avaliação unificada (restaurante + entregador) */
export const createUnifiedReview = async (orderId, reviewData) => {
  const url = `${CLIENT_API_URL}/api/reviews/orders/${orderId}/review`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...createAuthHeaders() },
    body: JSON.stringify(reviewData),
  });
  return processResponse(response);
};

/** ✅ Verifica status de avaliação de um pedido */
export const getReviewStatus = async (orderId) => {
  const url = `${CLIENT_API_URL}/api/reviews/orders/${orderId}/review-status`;
  const response = await fetch(url, { method: 'GET', headers: createAuthHeaders() });
  return processResponse(response);
};

/** ✅ NOVO: busca códigos do pedido (compatível com /api/orders/:id/codes) */
export const getOrderCodes = async (orderId) => {
  const url = `${CLIENT_API_URL}/api/orders/${orderId}/codes`;
  const response = await fetch(url, { method: 'GET', headers: createAuthHeaders() });
  return processResponse(response);
};

/** ✅ NOVO: excluir/arquivar pedido do cliente */
export const deleteOrder = async (orderId) => {
  const url = `${CLIENT_API_URL}/api/orders/${orderId}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { ...createAuthHeaders() },
  });
  return processResponse(response);
};
