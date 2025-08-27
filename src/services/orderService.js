import { api } from '../lib/api';

export const calculateDeliveryFee = async (deliveryData) => {
  return api.post('/api/delivery/calculate_fee', deliveryData);
};

export const createOrder = async (orderData) => {
  return api.post('/api/orders', orderData, { auth: true });
};

export const createPaymentPreference = async (preferenceData) => {
  return api.post('/api/pagamentos/criar_preferencia', preferenceData);
};

export const getOrders = async () => {
  return api.get('/api/orders', { auth: true });
};

export const deleteOrder = async (orderId) => {
  return api.del(`/api/orders/${orderId}`, { auth: true });
};