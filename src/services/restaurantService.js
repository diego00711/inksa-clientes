import { createClient } from '@supabase/supabase-js';
import { CLIENT_API_URL } from './api';
import { apiFetch } from './apiClient.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'public' },
  realtime: { params: { eventsPerSecond: 10 } },
});

const API_URL = `${CLIENT_API_URL}/api`;

const processResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || `Erro HTTP ${response.status}`;
    throw new Error(errorMessage);
  }
  return response.json();
};

const RestaurantService = {
  // Lista restaurantes paginados — GET /api/restaurants/ (pública, sem auth)
  // Retorna { items, hasMore }.
  getAllRestaurants: async (location, { limit = 20, offset = 0 } = {}) => {
    try {
      const params = new URLSearchParams();
      if (location?.latitude && location?.longitude) {
        params.append('user_lat', location.latitude);
        params.append('user_lon', location.longitude);
      }
      params.append('limit', limit);
      params.append('offset', offset);
      const url = `${API_URL}/restaurants?${params.toString()}`;
      const response = await apiFetch(url);
      const data = await processResponse(response);
      const items = Array.isArray(data) ? data : (data.data || []);
      const hasMore = typeof data?.has_more === 'boolean' ? data.has_more : false;
      return { items, hasMore };
    } catch (err) {
      console.error('❌ Erro ao listar restaurantes:', err);
      throw err;
    }
  },

  // Busca restaurante + cardápio em paralelo — GET /api/restaurants/{id} + /menu (públicas)
  getRestaurantDetails: async (restaurantId) => {
    try {
      const [restaurantRes, menuRes] = await Promise.all([
        apiFetch(`${API_URL}/restaurants/${restaurantId}`),
        apiFetch(`${API_URL}/restaurants/${restaurantId}/menu`),
      ]);

      const restaurantData = await processResponse(restaurantRes);
      const restaurant = restaurantData.data || restaurantData;

      let menu_items = [];
      if (menuRes.ok) {
        const menuData = await menuRes.json();
        const categories = menuData.categories || [];
        menu_items = categories.flatMap((cat) =>
          (cat.items || []).map((item) => ({ ...item, category: cat.name }))
        );
      }

      return { ...restaurant, menu_items };
    } catch (err) {
      console.error('❌ Erro ao buscar detalhes do restaurante:', err);
      throw err;
    }
  },

  // Busca apenas o cardápio agrupado — GET /api/restaurants/{id}/menu (pública)
  // Retorna array flat (mesmo formato anterior) para compatibilidade.
  getMenuItems: async (restaurantId) => {
    const response = await apiFetch(`${API_URL}/restaurants/${restaurantId}/menu`);
    if (!response.ok) throw new Error(`Erro ao buscar cardápio: HTTP ${response.status}`);
    const data = await response.json();
    const categories = data.categories || [];
    return categories.flatMap((cat) =>
      (cat.items || []).map((item) => ({ ...item, category: cat.name }))
    );
  },

  // Verifica se restaurante tem itens disponíveis — GET /api/restaurants/{id}/menu (pública)
  hasMenuItems: async (restaurantId) => {
    try {
      const response = await apiFetch(`${API_URL}/restaurants/${restaurantId}/menu`);
      if (!response.ok) return false;
      const data = await response.json();
      return (data.categories || []).some((cat) => cat.items?.length > 0);
    } catch {
      return false;
    }
  },
};

export default RestaurantService;
