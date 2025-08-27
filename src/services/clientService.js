import api from '../lib/api.js';

const ClientService = {
  /**
   * Busca os dados do perfil do cliente logado.
   */
  getProfile: async () => {
    const data = await api.get('/api/client/profile', true);
    return data.data; // Retorna o objeto do perfil
  },

  /**
   * Atualiza os dados do perfil do cliente.
   * @param {object} profileData - Objeto com os campos a serem atualizados.
   */
  updateProfile: async (profileData) => {
    const data = await api.put('/api/client/profile', profileData, true);
    return data.data;
  },

  /**
   * Faz o upload do avatar do cliente.
   * @param {File} file - O ficheiro da imagem a ser enviado.
   */
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const data = await api.post('/api/client/upload-avatar', formData, true);
    return data.avatar_url;
  },
};

export default ClientService;