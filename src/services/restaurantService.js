// Local: src/services/restaurantService.js

// ✅ 1. IMPORTAR A FUNÇÃO PARA CRIAR O CLIENTE SUPABASE
import { createClient } from '@supabase/supabase-js';
import api from '../lib/api.js';

// ✅ 2. DEFINIR AS VARIÁVEIS DE AMBIENTE DO SUPABASE PARA O FRONTEND
// Em projetos Vite (React), as variáveis de ambiente devem começar com VITE_
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ✅ 3. CRIAR E EXPORTAR A INSTÂNCIA DO SUPABASE
// A HomePage vai importar esta variável 'supabase'
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

const RestaurantService = {
  /**
   * Busca a lista de restaurantes. Se a localização for fornecida,
   * envia as coordenadas para a API para obter as distâncias.
   */
  getAllRestaurants: async (location) => {
    let endpoint = '/api/restaurants';

    if (location && location.latitude && location.longitude) {
      const params = new URLSearchParams();
      params.append('user_lat', location.latitude);
      params.append('user_lon', location.longitude);
      endpoint += `?${params.toString()}`;
    }
    
    const data = await api.get(endpoint);
    return data.data; // Retorna o array de restaurantes
  },

  /**
   * Busca os detalhes completos de um restaurante, incluindo seu cardápio.
   */
  getRestaurantDetails: async (restaurantId) => {
    const data = await api.get(`/api/restaurants/${restaurantId}`);
    return data.data; // Retorna o objeto do restaurante com o cardápio
  },
};

export default RestaurantService;