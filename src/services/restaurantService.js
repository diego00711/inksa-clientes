import { createClient } from '@supabase/supabase-js';
import { CLIENT_API_URL } from './api';

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
  // Lista restaurantes — GET /api/restaurants/ (pública, sem auth)
  getAllRestaurants: async (location) => {
    const params = new URLSearchParams();
    if (location?.latitude && location?.longitude) {
      params.append('user_lat', location.latitude);
      params.append('user_lon', location.longitude);
    }
    const qs = params.toString();
    const url = `${API_URL}/restaurants${qs ? `?${qs}` : ''}`;

    const response = await fetch(url);
    const data = await processResponse(response);
    return data.data || data;
  },

  // Busca restaurante + cardápio em paralelo — GET /api/restaurants/{id} + /menu (públicas)
  // Retorna objeto com menu_items flat para manter compatibilidade com RestaurantDetailsPage.
  getRestaurantDetails: async (restaurantId) => {
    const [restaurantRes, menuRes] = await Promise.all([
      fetch(`${API_URL}/restaurants/${restaurantId}`),
      fetch(`${API_URL}/restaurants/${restaurantId}/menu`),
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
  },

  // Busca apenas o cardápio agrupado — GET /api/restaurants/{id}/menu (pública)
  // Retorna array flat (mesmo formato anterior) para compatibilidade.
  getMenuItems: async (restaurantId) => {
    const response = await fetch(`${API_URL}/restaurants/${restaurantId}/menu`);
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
      const response = await fetch(`${API_URL}/restaurants/${restaurantId}/menu`);
      if (!response.ok) return false;
      const data = await response.json();
      return (data.categories || []).some((cat) => cat.items?.length > 0);
    } catch {
      return false;
    }
  },
};

export default RestaurantService;
