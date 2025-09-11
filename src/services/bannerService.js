// src/services/bannerService.js

import { supabase } from './restaurantService';

class BannerService {
  // Buscar todos os banners ativos
  async getActiveBanners() {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select(`
          *,
          restaurant_profiles (
            restaurant_name,
            logo_url
          )
        `)
        .eq('is_active', true)
        .or('campaign_end_date.is.null,campaign_end_date.gte.' + new Date().toISOString())
        .order('is_sponsored', { ascending: false }) // Prioriza patrocinados
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar banners:', error);
      throw error;
    }
  }

  // Criar banner patrocinado para restaurante
  async createSponsoredBanner(bannerData) {
    try {
      const sponsoredBanner = {
        ...bannerData,
        is_sponsored: true,
        banner_type: 'sponsored',
        campaign_start_date: bannerData.campaign_start_date || new Date().toISOString(),
        click_count: 0,
        impression_count: 0
      };

      const { data, error } = await supabase
        .from('banners')
        .insert([sponsoredBanner])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Erro ao criar banner patrocinado:', error);
      throw error;
    }
  }

  // Criar banner promocional da plataforma
  async createPromotionalBanner(bannerData) {
    try {
      const promotionalBanner = {
        ...bannerData,
        is_sponsored: false,
        banner_type: 'promotional',
        click_count: 0,
        impression_count: 0
      };

      const { data, error } = await supabase
        .from('banners')
        .insert([promotionalBanner])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Erro ao criar banner promocional:', error);
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

  // Relatório de performance de banners
  async getBannerAnalytics(bannerId = null) {
    try {
      let query = supabase
        .from('banners')
        .select(`
          id,
          title,
          banner_type,
          is_sponsored,
          click_count,
          impression_count,
          cost_per_click,
          total_budget,
          campaign_start_date,
          campaign_end_date,
          restaurant_profiles (
            restaurant_name
          )
        `);

      if (bannerId) {
        query = query.eq('id', bannerId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Calcular métricas
      return data.map(banner => ({
        ...banner,
        ctr: banner.impression_count > 0 ? (banner.click_count / banner.impression_count * 100).toFixed(2) : 0,
        total_spent: banner.click_count * (banner.cost_per_click || 0),
        remaining_budget: banner.total_budget ? banner.total_budget - (banner.click_count * (banner.cost_per_click || 0)) : null
      }));
    } catch (error) {
      console.error('Erro ao buscar analytics:', error);
      throw error;
    }
  }

  // Pausar campanha quando orçamento esgotar
  async checkAndPauseCampaigns() {
    try {
      const { data: campaigns, error } = await supabase
        .from('banners')
        .select('id, click_count, cost_per_click, total_budget')
        .eq('is_sponsored', true)
        .eq('is_active', true);

      if (error) throw error;

      for (const campaign of campaigns) {
        const totalSpent = campaign.click_count * (campaign.cost_per_click || 0);
        if (campaign.total_budget && totalSpent >= campaign.total_budget) {
          await this.updateBanner(campaign.id, { is_active: false });
          console.log(`Campanha ${campaign.id} pausada - orçamento esgotado`);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar campanhas:', error);
    }
  }

  // Buscar banners por restaurante
  async getBannersByRestaurant(restaurantId) {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar banners do restaurante:', error);
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

export default new BannerService(); supabase.storage
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
