// src/services/reviewService.js

// Supondo que você tenha um arquivo 'api.js' com estas funções.
import { CLIENT_API_URL, processResponse, createAuthHeaders } from './api';

/**
 * Envia uma avaliação para um restaurante.
 * @param {object} reviewData - Contém restaurantId, orderId, rating, etc.
 */
export async function postRestaurantReview({ restaurantId, orderId, rating, comment, tags, categories }) {
  // A URL deve corresponder ao endpoint do seu backend.
  const url = `${CLIENT_API_URL}/api/review/restaurants/${encodeURIComponent(restaurantId)}/reviews`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...createAuthHeaders(),
    },
    body: JSON.stringify({ 
      order_id: orderId, 
      rating, 
      comment,
      tags,
      category_ratings: categories,
    }),
  });

  return processResponse(response);
}

/**
 * Envia uma avaliação para um entregador.
 * @param {object} reviewData - Contém deliverymanId, orderId, rating, etc.
 */
export async function postDeliveryReview({ deliverymanId, orderId, rating, comment, tags, categories }) {
  // A URL deve corresponder ao endpoint do seu backend.
  const url = `${CLIENT_API_URL}/api/review/delivery/${encodeURIComponent(deliverymanId)}/reviews`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...createAuthHeaders(),
    },
    body: JSON.stringify({ 
      order_id: orderId, 
      rating, 
      comment,
      tags,
      category_ratings: categories,
    }),
  });

  return processResponse(response);
}
