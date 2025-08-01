// src/services/orderService.js

// A URL base da sua API Flask. Ajuste se for diferente.
const API_URL = 'http://127.0.0.1:5000/api';

/**
 * Calcula a taxa de entrega.
 * @param {object} deliveryData - Contém restaurant_id, client_latitude, client_longitude.
 * @returns {Promise<object>} - A resposta da API com delivery_fee e delivery_distance_km.
 */
export const calculateDeliveryFee = async (deliveryData) => {
  const response = await fetch(`${API_URL}/delivery/calculate_fee`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(deliveryData),
  });
  if (!response.ok) {
    throw new Error('Falha ao calcular o frete');
  }
  return response.json();
};

/**
 * Cria um novo pedido no banco de dados.
 * @param {object} orderData - Os dados do pedido (itens, endereço, etc.).
 * @param {string} token - O token JWT do cliente autenticado.
 * @returns {Promise<object>} - A resposta da API com o ID do pedido criado.
 */
export const createOrder = async (orderData, token) => {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // Essencial para autenticação
    },
    body: JSON.stringify(orderData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Falha ao criar o pedido');
  }
  return response.json();
};

/**
 * Cria a preferência de pagamento no Mercado Pago.
 * @param {object} preferenceData - Os dados para a preferência (ID do pedido, itens, etc.).
 * @returns {Promise<object>} - A resposta da API com o checkout_link.
 */
export const createPaymentPreference = async (preferenceData) => {
  const response = await fetch(`${API_URL}/pagamentos/criar_preferencia`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preferenceData),
  });
  if (!response.ok) {
    throw new Error('Falha ao criar a preferência de pagamento');
  }
  return response.json();
};