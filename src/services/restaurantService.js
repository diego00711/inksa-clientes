// Local: src/services/restaurantService.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'public' },
  realtime: { params: { eventsPerSecond: 10 } },
});

const API_BASE = import.meta.env.VITE_API_URL || 'https://inksa-auth-flask-dev.onrender.com';
const API_URL = `${API_BASE}/api`;

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

  // ✅ CORRIGIDO: Detalhes do restaurante COM cardápio
  getRestaurantDetails: async (restaurantId) => {
    console.log('🔄 Buscando detalhes do restaurante via API:', restaurantId);
    
    try {
      // Primeira tentativa: buscar via API (que pode incluir o cardápio)
      const response = await fetch(`${API_URL}/restaurant/${restaurantId}`);
      const data = await processResponse(response);
      const restaurant = data.data || data;
      
      console.log('📊 Dados da API:', restaurant);
      
      // SEMPRE busca o cardápio no Supabase (independente da API)
      console.log('🔍 Buscando cardápio no Supabase...');
      
      // Debug: primeiro vamos ver TODOS os itens desta tabela
      const { data: allItems, error: debugError } = await supabase
        .from('menu_items')
        .select('*');
      
      console.log('🗃️ TODOS os itens na tabela menu_items:', allItems);
      console.log('🗃️ Total de itens na tabela:', allItems?.length || 0);
      
      // Agora busca específico para este restaurante
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId);
        // Removemos o filtro is_available temporariamente para debug
      
      console.log('🍕 Query específica - restaurantId:', restaurantId);
      console.log('🍕 Itens encontrados para este restaurante:', menuItems);
      console.log('🍕 Erro (se houver):', menuError);
      
      if (menuError) {
        console.error('❌ Erro ao buscar cardápio no Supabase:', menuError);
      } else {
        console.log('✅ Processando itens do cardápio...');
        // Agora filtra apenas os disponíveis
        const availableItems = menuItems?.filter(item => item.is_available !== false) || [];
        console.log('✅ Itens disponíveis:', availableItems);
        restaurant.menu_items = availableItems;
      }
      
      return restaurant;
      
    } catch (error) {
      console.error('❌ Erro na API, tentando buscar diretamente no Supabase:', error);
      
      // Fallback: buscar tudo diretamente no Supabase
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurant_profiles')
        .select('*')
        .eq('id', restaurantId)
        .single();

      if (restaurantError) {
        throw new Error(`Restaurante não encontrado: ${restaurantError.message}`);
      }

      // Busca o cardápio separadamente
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .order('created_at', { ascending: true });

      if (menuError) {
        console.warn('⚠️ Erro ao buscar cardápio:', menuError);
      }

      restaurant.menu_items = menuItems || [];
      console.log('🎯 Dados finais (Supabase):', restaurant);
      
      return restaurant;
    }
  },

  // ✅ NOVO: Função específica para buscar apenas o cardápio
  getMenuItems: async (restaurantId) => {
    console.log('🍕 Buscando cardápio para restaurante:', restaurantId);
    
    const { data: menuItems, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('user_id', restaurantId)  // ✅ CORRIGIDO: user_id em vez de restaurant_id
      .eq('is_available', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar cardápio:', error);
      throw new Error(`Erro ao buscar cardápio: ${error.message}`);
    }

    console.log('✅ Cardápio encontrado:', menuItems);
    return menuItems || [];
  },

  // ✅ NOVO: Função para verificar se restaurante tem cardápio
  hasMenuItems: async (restaurantId) => {
    const { count, error } = await supabase
      .from('menu_items')
      .select('id', { count: 'exact' })
      .eq('user_id', restaurantId)  // ✅ CORRIGIDO: user_id em vez de restaurant_id
      .eq('is_available', true);

    if (error) {
      console.error('❌ Erro ao verificar cardápio:', error);
      return false;
    }

    return count > 0;
  }
};

export default RestaurantService;
