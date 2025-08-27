import AuthService from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'https://inksa-auth-flask-dev.onrender.com';
const API_URL = `${API_BASE}/api`;

const processResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || `Erro HTTP ${response.status}`;
    throw new Error(errorMessage);
  }
  return response.status === 204 ? null : response.json();
};

const createAuthHeaders = () => {
  const token = AuthService.getToken();
  if (!token) {
    throw new Error('Token de autenticação não encontrado.');
  }
  return { Authorization: `Bearer ${token}` };
};

const ClientService = {
  getProfile: async () => {
    const response = await fetch(`${API_URL}/auth/profile`, {
      headers: createAuthHeaders(),
      credentials: 'include',
    });
    const data = await processResponse(response);
    return data.data || data.user || data; // compatível com diferentes respostas
  },

  updateProfile: async (profileData) => {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        ...createAuthHeaders(),
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(profileData),
    });
    const data = await processResponse(response);
    return data.data || data.user || data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/auth/profile/upload-avatar`, {
      method: 'POST',
      headers: createAuthHeaders(),
      credentials: 'include',
      body: formData,
    });
    const data = await processResponse(response);
    return data.avatar_url || data.url || data;
  },
};

export default ClientService;
