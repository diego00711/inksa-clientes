// src/services/ClientService.js - VERSÃO CORRIGIDA

import AuthService from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'https://inksa-auth-flask-dev.onrender.com';
const API_URL = `${API_BASE}/api`;

const processResponse = async (response ) => {
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
    // ✅ CORREÇÃO: A URL agora aponta para a rota específica do cliente.
    const response = await fetch(`${API_URL}/client/profile`, {
      headers: createAuthHeaders(),
      credentials: 'include',
    });
    const data = await processResponse(response);
    // Retorna os dados do perfil, que estão dentro da chave 'data'
    return data.data || data;
  },

  updateProfile: async (profileData) => {
    // ✅ CORREÇÃO: A URL agora aponta para a rota específica do cliente.
    const response = await fetch(`${API_URL}/client/profile`, {
      method: 'PUT',
      headers: {
        ...createAuthHeaders(),
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(profileData),
    });
    const data = await processResponse(response);
    return data.data || data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    // ✅ CORREÇÃO: A URL agora aponta para a rota específica do cliente.
    const response = await fetch(`${API_URL}/client/profile/upload-avatar`, {
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
