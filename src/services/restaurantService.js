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
  getAllRestaurants: async (location) => {
    let url = `${API_URL}/restaurants`;

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

  getRestaurantDetails: async (restaurantId) => {
    const response = await fetch(`${API_URL}/restaurants/${restaurantId}`);
    const data = await processResponse(response);
    return data.data || data;
  },
};

export default RestaurantService;
