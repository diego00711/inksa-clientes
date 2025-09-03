// src/services/reviewService.js

// Importa as funções auxiliares de 'api.js'
import { CLIENT_API_URL, createAuthHeaders, processResponse } from './api';

/**
 * Busca as avaliações que o cliente logado recebeu.
 * @returns {Promise<object>} Um objeto contendo a lista de avaliações, a média e o total.
 */
export async function getClientReviewsReceived() {
  // Chama a nova rota que criamos no backend
  const response = await fetch(
    `${CLIENT_API_URL}/api/review/clients/my-reviews`, 
    {
      headers: createAuthHeaders(),
    }
  );
  return processResponse(response);
}

/**
 * Envia uma nova avaliação para um restaurante.
 * @param {object} reviewData - Dados da avaliação.
 * @returns {Promise<object>} A resposta da API.
 */
export async function postRestaurantReview(reviewData) {
  const response = await fetch(
    `${CLIENT_API_URL}/api/review/restaurants/${reviewData.restaurantId}/reviews`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...createAuthHeaders(),
      },
      body: JSON.stringify(reviewData),
    }
  );
  return processResponse(response);
}

/**
 * Envia uma nova avaliação para um entregador.
 * @param {object} reviewData - Dados da avaliação.
 * @returns {Promise<object>} A resposta da API.
 */
export async function postDeliveryReview(reviewData) {
  const response = await fetch(
    `${CLIENT_API_URL}/api/review/delivery/${reviewData.deliverymanId}/reviews`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...createAuthHeaders(),
      },
      body: JSON.stringify(reviewData),
    }
  );
  return processResponse(response);
}
