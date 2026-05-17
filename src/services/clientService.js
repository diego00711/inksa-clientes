// src/services/ClientService.js - VERSÃO CORRIGIDA

import AuthService from './authService';
import { CLIENT_API_URL } from './api';

const API_URL = `${CLIENT_API_URL}/api`;

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
    try {
      const response = await fetch(`${API_URL}/client/profile`, {
        headers: createAuthHeaders(),
        credentials: 'include',
      });
      const data = await processResponse(response);
      return data.data || data;
    } catch (err) {
      console.error('❌ Erro ao buscar perfil:', err);
      throw err;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await fetch(`${API_URL}/client/profile`, {
        method: 'PUT',
        headers: { ...createAuthHeaders(), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });
      const data = await processResponse(response);
      return data.data || data;
    } catch (err) {
      console.error('❌ Erro ao atualizar perfil:', err);
      throw err;
    }
  },

  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_URL}/client/profile/upload-avatar`, {
        method: 'POST',
        headers: createAuthHeaders(),
        credentials: 'include',
        body: formData,
      });
      const data = await processResponse(response);
      return data.avatar_url || data.url || data;
    } catch (err) {
      console.error('❌ Erro ao fazer upload do avatar:', err);
      throw err;
    }
  },
};

export default ClientService;
