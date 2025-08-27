// src/services/orderService.js

const API_BASE = import.meta.env.VITE_API_URL || 'https://inksa-auth-flask-dev.onrender.com';
const API_URL = `${API_BASE}/api`;

/**
 * Calcula a taxa de entrega.
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
 */
export const createOrder = async (orderData, token) => {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Falha ao criar o pedido');
  }
  return response.json();
};

/**
 * Cria a preferência de pagamento no Mercado Pago.
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
