// Mantém a exportação do supabase como no código atual
import { createClient } from '@supabase/supabase-js';
import { api } from '../lib/api';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'public' },
  realtime: { params: { eventsPerSecond: 10 } },
});

const RestaurantService = {
  getAllRestaurants: async (location) => {
    const params = {};
    if (location?.latitude) params.user_lat = location.latitude;
    if (location?.longitude) params.user_lon = location.longitude;
    return api.get('/api/restaurants', { params });
  },

  getRestaurantDetails: async (restaurantId) => {
    return api.get(`/api/restaurants/${restaurantId}`);
  },
};

export default RestaurantService;