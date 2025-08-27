// src/services/orderService.js
import api from '../lib/api.js';

/**
 * Busca todos os pedidos do cliente logado.
 * @returns {Promise<Array>} - Array com os pedidos do cliente.
 */
export const getOrders = async () => {
  const data = await api.get('/api/orders', true);
  return data.data; // Retorna o array de pedidos
};

/**
 * Deleta um pedido específico.
 * @param {string} orderId - ID do pedido a ser deletado.
 * @returns {Promise<object>} - Resposta da API.
 */
export const deleteOrder = async (orderId) => {
  return await api.delete(`/api/orders/${orderId}`, true);
};

/**
 * Calcula a taxa de entrega.
 * @param {object} deliveryData - Contém restaurant_id, client_latitude, client_longitude.
 * @returns {Promise<object>} - A resposta da API com delivery_fee e delivery_distance_km.
 */
export const calculateDeliveryFee = async (deliveryData) => {
  return await api.post('/api/delivery/calculate_fee', deliveryData);
};

/**
 * Cria um novo pedido no banco de dados.
 * @param {object} orderData - Os dados do pedido (itens, endereço, etc.).
 * @param {string} token - O token JWT do cliente autenticado.
 * @returns {Promise<object>} - A resposta da API com o ID do pedido criado.
 */
export const createOrder = async (orderData, token) => {
  return await api.post('/api/orders', orderData, true);
};

/**
 * Cria a preferência de pagamento no Mercado Pago.
 * @param {object} preferenceData - Os dados para a preferência (ID do pedido, itens, etc.).
 * @returns {Promise<object>} - A resposta da API com o checkout_link.
 */
export const createPaymentPreference = async (preferenceData) => {
  return await api.post('/api/pagamentos/criar_preferencia', preferenceData);
};