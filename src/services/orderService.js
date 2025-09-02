// src/services/orderService.js

// ✅ 1. Importa as funções auxiliares do nosso novo arquivo api.js
import { CLIENT_API_URL, processResponse, createAuthHeaders } from './api';

/**
 * Calcula a taxa de entrega.
 */
export const calculateDeliveryFee = async (deliveryData) => {
  // A URL deve ser completa, usando a variável do api.js
  const url = `${CLIENT_API_URL}/api/delivery/calculate_fee`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(deliveryData),
  });
  
  return processResponse(response);
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
      ...createAuthHeaders(), // Usa a função auxiliar para o token
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
 * ✅ 2. NOVA FUNÇÃO ADICIONADA
 * Busca os pedidos que um cliente já recebeu e que estão pendentes de avaliação.
 * @param {string} clientId - O ID do perfil do cliente.
 * @param {AbortSignal} [signal] - Para cancelar a requisição se necessário.
 */
export const getOrdersPendingClientReview = async (clientId, signal) => {
  // IMPORTANTE: Confirme se a URL do seu backend para esta funcionalidade é esta.
  const url = `${CLIENT_API_URL}/api/orders/pending-client-review`;

  const response = await fetch(url, {
    method: 'GET',
    headers: createAuthHeaders(),
    signal,
  });
  
  const data = await processResponse(response);
  // Garante que sempre retornará um array
  return data?.data ?? data ?? [];
};
