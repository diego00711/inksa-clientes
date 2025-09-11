// bannerService.js - Atualizado para usar o backend Flask
const API_URL = import.meta.env.VITE_API_URL || 'https://inksa-auth-flask-dev.onrender.com';

class BannerService {
  constructor() {
    this.baseURL = `${API_URL}/api/banners`;
  }

  // Obter token de autenticação
  getAuthToken() {
    return localStorage.getItem('token');
  }

  // Headers com autenticação
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  // ========== MÉTODOS PÚBLICOS ==========

  // Listar banners (público para clientes, completo para admin)
  async getBanners() {
    try {
      const response = await fetch(this.baseURL, {
        method: 'GET',
        headers: this.getHeaders(false), // Não exige auth para clientes
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar banners: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Erro ao buscar banners:', error);
      // Retornar banners padrão em caso de erro
      return this.getDefaultBanners();
    }
  }

  // Obter um banner específico
  async getBanner(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'GET',
        headers: this.getHeaders(false),
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar banner: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Erro ao buscar banner:', error);
      throw error;
    }
  }

  // ========== MÉTODOS ADMIN ==========

  // Criar novo banner (apenas admin)
  async createBanner(bannerData) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(bannerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ao criar banner: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Erro ao criar banner:', error);
      throw error;
    }
  }

  // Atualizar banner (apenas admin)
  async updateBanner(id, bannerData) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(true),
        body: JSON.stringify(bannerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ao atualizar banner: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Erro ao atualizar banner:', error);
      throw error;
    }
  }

  // Deletar banner (apenas admin)
  async deleteBanner(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(true),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ao deletar banner: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Erro ao deletar banner:', error);
      throw error;
    }
  }

  // Ativar/Desativar banner (apenas admin)
  async toggleBannerStatus(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}/toggle-status`, {
        method: 'PUT',
        headers: this.getHeaders(true),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ao alterar status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Erro ao alterar status do banner:', error);
      throw error;
    }
  }

  // Reordenar banners (apenas admin)
  async reorderBanners(bannerOrders) {
    try {
      const response = await fetch(`${this.baseURL}/reorder`, {
        method: 'PUT',
        headers: this.getHeaders(true),
        body: JSON.stringify({ banner_orders: bannerOrders }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ao reordenar banners: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Erro ao reordenar banners:', error);
      throw error;
    }
  }

  // Obter estatísticas dos banners (apenas admin)
  async getBannerStats() {
    try {
      const response = await fetch(`${this.baseURL}/stats`, {
        method: 'GET',
        headers: this.getHeaders(true),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ao buscar estatísticas: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  // ========== MÉTODOS DE UPLOAD ==========

  // Upload de imagem (se você tiver um endpoint separado para upload)
  async uploadImage(file) {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_URL}/api/upload/banner-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erro no upload: ${response.status}`);
      }

      const data = await response.json();
      return data.url; // URL da imagem upada
    } catch (error) {
      console.error('Erro no upload da imagem:', error);
      throw error;
    }
  }

  // ========== FALLBACKS ==========

  // Banners padrão caso a API falhe
  getDefaultBanners() {
    return [
      {
        id: 'default-1',
        title: 'Bem-vindo ao Inksa Delivery!',
        subtitle: 'Peça comida deliciosa com facilidade',
        image_url: '/default-banner-1.jpg',
        link_url: '/',
        display_order: 0
      },
      {
        id: 'default-2',
        title: 'Promoções Especiais',
        subtitle: 'Descontos incríveis te esperando',
        image_url: '/default-banner-2.jpg',
        link_url: '/promocoes',
        display_order: 1
      }
    ];
  }

  // Validar dados do banner antes do envio
  validateBannerData(data) {
    const errors = [];

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Título é obrigatório');
    }

    if (!data.image_url || data.image_url.trim().length === 0) {
      errors.push('URL da imagem é obrigatória');
    }

    if (data.title && data.title.length > 255) {
      errors.push('Título deve ter no máximo 255 caracteres');
    }

    if (data.subtitle && data.subtitle.length > 500) {
      errors.push('Subtítulo deve ter no máximo 500 caracteres');
    }

    if (data.link_url && !this.isValidUrl(data.link_url)) {
      errors.push('URL do link deve ser válida');
    }

    if (data.image_url && !this.isValidUrl(data.image_url)) {
      errors.push('URL da imagem deve ser válida');
    }

    return errors;
  }

  // Validar se é uma URL válida
  isValidUrl(string) {
    try {
      // Aceitar URLs relativas (começando com /) ou absolutas
      if (string.startsWith('/')) {
        return true;
      }
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Limpar cache (se você implementar cache no frontend)
  clearCache() {
    // Implementar se necessário
    localStorage.removeItem('banners_cache');
  }
}

// Exportar instância singleton
export default new BannerService();
