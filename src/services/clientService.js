import AuthService from './authService'; // Assumindo que o seu serviço de autenticação está aqui

const API_BASE_URL = 'http://localhost:5000/api';

// Função auxiliar para processar respostas da API
const processResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || `Erro HTTP ${response.status}`;
    throw new Error(errorMessage);
  }
  // Retorna null se não houver conteúdo, senão retorna o JSON
  return response.status === 204 ? null : response.json();
};

// Função auxiliar para criar cabeçalhos de autenticação
const createAuthHeaders = () => {
    const token = AuthService.getToken(); // Usa o seu AuthService para obter o token
    if (!token) {
        throw new Error('Token de autenticação não encontrado.');
    }
    return { 'Authorization': `Bearer ${token}` };
};

const ClientService = {
  /**
   * Busca os dados do perfil do cliente logado.
   */
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/client/profile`, {
      headers: createAuthHeaders(),
    });
    const data = await processResponse(response);
    return data.data; // Retorna o objeto do perfil
  },

  /**
   * Atualiza os dados do perfil do cliente.
   * @param {object} profileData - Objeto com os campos a serem atualizados.
   */
  updateProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/client/profile`, {
      method: 'PUT',
      headers: {
        ...createAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    const data = await processResponse(response);
    return data.data;
  },

  /**
   * Faz o upload do avatar do cliente.
   * @param {File} file - O ficheiro da imagem a ser enviado.
   */
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/client/upload-avatar`, {
      method: 'POST',
      headers: createAuthHeaders(), // O Content-Type é definido automaticamente pelo navegador para FormData
      body: formData,
    });
    const data = await processResponse(response);
    return data.avatar_url;
  },
};

export default ClientService;