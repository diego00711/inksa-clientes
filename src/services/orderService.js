// inksa-clientes/src/services/orderService.js - VERSÃO COMPLETA

import { CLIENT_API_URL, processResponse, createAuthHeaders } from './api';

/**
 * Calcula a taxa de entrega.
 */
export const calculateDeliveryFee = async (deliveryData) => {
  console.log('🚚 Iniciando cálculo de frete:', deliveryData);
  
  try {
    const url = `${CLIENT_API_URL}/api/delivery/calculate_fee`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deliveryData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await processResponse(response);
    
    let deliveryFee = 5.00;
    
    if (data && data.status === 'success' && data.data && typeof data.data.delivery_fee === 'number') {
      deliveryFee = data.data.delivery_fee;
    } else if (data && typeof data.delivery_fee === 'number') {
      deliveryFee = data.delivery_fee;
    }
    
    deliveryFee = Number(deliveryFee) || 5.00;
    
    return {
      status: 'success',
      data: {
        delivery_fee: deliveryFee,
        message: data?.data?.message || data?.message || 'Frete calculado com sucesso'
      }
    };
    
  } catch (error) {
    console.error('❌ Erro ao calcular frete:', error);
    
    return {
      status: 'success',
      data: {
        delivery_fee: 5.00,
        message: 'Taxa padrão aplicada (erro na conexão)'
      }
    };
  }
};

/**
 * Cria um novo pedido no banco de dados.
 */
export const createOrder = async (orderData) => {
  const url = `${CLIENT_API_URL}/api/orders`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...createAuthHeaders(),
    },
    body: JSON.stringify(orderData),
  });

  return processResponse(response);
};

/**
 * Cria a preferência de pagamento no Mercado Pago.
 */
export const createPaymentPreference = async (preferenceData) => {
  const url = `${CLIENT_API_URL}/api/pagamentos/criar_preferencia`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preferenceData),
  });

  return processResponse(response);
};

/**
 * ✅ NOVO: Busca pedidos pendentes de avaliação do CLIENTE
 * Usa o novo endpoint unificado de reviews
 */
export const getOrdersPendingClientReview = async (signal) => {
  const url = `${CLIENT_API_URL}/api/reviews/orders/pending-reviews`;

  const response = await fetch(url, {
    method: 'GET',
    headers: createAuthHeaders(),
    signal,
  });
  
  const data = await processResponse(response);
  
  // O endpoint retorna { pending_reviews: [...], total: N }
  return data?.pending_reviews ?? [];
};

/**
 * ✅ NOVO: Cria avaliação unificada (restaurante + entregador)
 */
export const createUnifiedReview = async (orderId, reviewData) => {
  const url = `${CLIENT_API_URL}/api/reviews/orders/${orderId}/review`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...createAuthHeaders(),
    },
    body: JSON.stringify(reviewData),
  });

  return processResponse(response);
};

/**
 * ✅ NOVO: Verifica status de avaliação de um pedido
 */
export const getReviewStatus = async (orderId) => {
  const url = `${CLIENT_API_URL}/api/reviews/orders/${orderId}/review-status`;

  const response = await fetch(url, {
    method: 'GET',
    headers: createAuthHeaders(),
  });

  return processResponse(response);
};
