// Local: src/services/restaurantService.js

// ✅ 1. IMPORTAR A FUNÇÃO PARA CRIAR O CLIENTE SUPABASE
import { createClient } from '@supabase/supabase-js';

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


// --- SEU CÓDIGO EXISTENTE (PERMANECE IGUAL) ---
const API_BASE_URL = 'http://127.0.0.1:5000'; // A URL da sua API Flask

const processResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || `Erro HTTP ${response.status}`;
    throw new Error(errorMessage);
  }
  return response.json();
};

const RestaurantService = {
  /**
   * Busca a lista de restaurantes. Se a localização for fornecida,
   * envia as coordenadas para a API para obter as distâncias.
   */
  getAllRestaurants: async (location) => {
    let url = `${API_BASE_URL}/api/restaurants`;

    if (location && location.latitude && location.longitude) {
      const params = new URLSearchParams();
      params.append('user_lat', location.latitude);
      params.append('user_lon', location.longitude);
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url);
    const data = await processResponse(response);
    return data.data; // Retorna o array de restaurantes
  },

  /**
   * Busca os detalhes completos de um restaurante, incluindo seu cardápio.
   */
  getRestaurantDetails: async (restaurantId) => {
    const response = await fetch(`${API_BASE_URL}/api/restaurants/${restaurantId}`);
    const data = await processResponse(response);
    return data.data; // Retorna o objeto do restaurante com o cardápio
  },
};

export default RestaurantService;