// src/services/bannerService.js

import { supabase } from './restaurantService';

class BannerService {
  // Buscar todos os banners ativos
  async getActiveBanners() {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar banners:', error);
      throw error;
    }
  }

  // Criar novo banner
  async createBanner(bannerData) {
    try {
      const { data, error } = await supabase
        .from('banners')
        .insert([bannerData])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Erro ao criar banner:', error);
      throw error;
    }
  }

  // Atualizar banner
  async updateBanner(id, updates) {
    try {
      const { data, error } = await supabase
        .from('banners')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Erro ao atualizar banner:', error);
      throw error;
    }
  }

  // Deletar banner
  async deleteBanner(id) {
    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao deletar banner:', error);
      throw error;
    }
  }

  // Upload de imagem para o bucket
  async uploadBannerImage(file, fileName) {
    try {
      const { data, error } = await supabase.storage
        .from('banner-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Obter URL pública da imagem
      const { data: urlData } = supabase.storage
        .from('banner-images')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      throw error;
    }
  }

  // Reordenar banners
  async reorderBanners(bannerIds) {
    try {
      const updates = bannerIds.map((id, index) => ({
        id,
        display_order: index
      }));

      const { error } = await supabase
        .from('banners')
        .upsert(updates);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao reordenar banners:', error);
      throw error;
    }
  }

  // Ativar/desativar banner
  async toggleBannerStatus(id, isActive) {
    try {
      return await this.updateBanner(id, { is_active: isActive });
    } catch (error) {
      console.error('Erro ao alterar status do banner:', error);
      throw error;
    }
  }
}

export default new BannerService();
