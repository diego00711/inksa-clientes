// src/services/reviewService.js

// Importa as funções auxiliares de 'api.js'
import { CLIENT_API_URL, createAuthHeaders, processResponse } from './api';
import { apiFetch } from './apiClient.js';

/**
 * Busca as avaliações que o cliente logado recebeu.
 * @returns {Promise<object>} Um objeto contendo a lista de avaliações, a média e o total.
 */
export async function getClientReviewsReceived() {
  try {
    const response = await apiFetch(
      `${CLIENT_API_URL}/api/review/clients/my-reviews`,
      { headers: createAuthHeaders() }
    );
    return processResponse(response);
  } catch (err) {
    console.error('❌ Erro ao buscar avaliações recebidas:', err);
    throw err;
  }
}

/**
 * Envia uma nova avaliação para um restaurante.
 * @param {object} reviewData - Dados da avaliação.
 * @returns {Promise<object>} A resposta da API.
 */
export async function postRestaurantReview(reviewData) {
  try {
    const response = await apiFetch(
      `${CLIENT_API_URL}/api/review/restaurants/${reviewData.restaurantId}/reviews`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...createAuthHeaders() },
        body: JSON.stringify(reviewData),
      }
    );
    return processResponse(response);
  } catch (err) {
    console.error('❌ Erro ao enviar avaliação do restaurante:', err);
    throw err;
  }
}

/**
 * Envia uma nova avaliação para um entregador.
 * @param {object} reviewData - Dados da avaliação.
 * @returns {Promise<object>} A resposta da API.
 */
export async function postDeliveryReview(reviewData) {
  try {
    const response = await apiFetch(
      `${CLIENT_API_URL}/api/review/delivery/${reviewData.deliverymanId}/reviews`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...createAuthHeaders() },
        body: JSON.stringify(reviewData),
      }
    );
    return processResponse(response);
  } catch (err) {
    console.error('❌ Erro ao enviar avaliação do entregador:', err);
    throw err;
  }
}
