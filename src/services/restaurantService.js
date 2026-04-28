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
  // Lista restaurantes
  getAllRestaurants: async (location) => {
    let url = `${API_URL}/restaurant`;

    if (location?.latitude && location?.longitude) {
      const params = new URLSearchParams();
      params.append('user_lat', location.latitude);
      params.append('user_lon', location.longitude);
      url += `?${params.toString()}`;
    }

    const response = await fetch(url);
    const data = await processResponse(response);
    return data.data || data;
  },

  // ✅ VERSÃO FINAL: API já retorna o cardápio
  getRestaurantDetails: async (restaurantId) => {
    console.log('🔗 Buscando restaurante:', restaurantId);
    
    try {
      // Adicionar timestamp para evitar cache
      const timestamp = new Date().getTime();
      const url = `${API_URL}/restaurant/${restaurantId}?_t=${timestamp}`;
      
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('📡 Status da resposta:', response.status);
      
      const data = await processResponse(response);
      const restaurant = data.data || data;
      
      console.log('🍕 Menu items recebidos:', restaurant.menu_items);
      console.log('📊 Total de itens:', restaurant.menu_items?.length || 0);
      
      return restaurant;
      
    } catch (error) {
      console.error('❌ Erro ao buscar restaurante:', error);
      throw error;
    }
  },

  // Função específica para buscar apenas o cardápio via Supabase (backup)
  getMenuItems: async (restaurantId) => {
    const { data: menuItems, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_available', true)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar cardápio: ${error.message}`);
    }

    return menuItems || [];
  },

  // Função para verificar se restaurante tem cardápio
  hasMenuItems: async (restaurantId) => {
    const { count, error } = await supabase
      .from('menu_items')
      .select('id', { count: 'exact' })
      .eq('restaurant_id', restaurantId)
      .eq('is_available', true);

    if (error) {
      return false;
    }

    return count > 0;
  }
};

export default RestaurantService;
