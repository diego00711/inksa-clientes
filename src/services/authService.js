// src/services/authService.js - VERSÃO CORRIGIDA COM getCurrentAuthUser

import { CLIENT_API_URL as API_BASE_URL } from './api';
import { apiFetch } from './apiClient.js';
const AUTH_TOKEN_KEY = 'clientAuthToken';
const CLIENT_USER_DATA_KEY = 'clientUser';
const REFRESH_TOKEN_KEY = 'clientRefreshToken';

const processResponse = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(CLIENT_USER_DATA_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.location.href = '/login';
    return null;
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const authService = {
  async login(email, password) {
    try {
      // NAO usa processResponse aqui: no login, um 401 e senha errada (nao sessao expirada)
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, expected_user_type: 'client' }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Backend retorna a mensagem amigavel no campo `error`
        throw new Error(data.error || 'Não foi possível entrar. Tente novamente.');
      }

      if (data && data.data && data.data.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.data.token);
        localStorage.setItem(CLIENT_USER_DATA_KEY, JSON.stringify(data.data.user));
        // Sem o refresh_token o apiClient não renova a sessão e o cliente cai
        // no login quando o access_token vence (~1h) — no meio de um pedido.
        if (data.data.refresh_token) {
          localStorage.setItem(REFRESH_TOKEN_KEY, data.data.refresh_token);
        }
        return data.data;
      }
      throw new Error('Não foi possível entrar. Tente novamente.');
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  },

  async register(userData) {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userData, user_type: 'client' }),
      });
      return await processResponse(response);
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  },

  async logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(CLIENT_USER_DATA_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.location.href = '/login';
  },

  async forgotPassword(email) {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return await processResponse(response);
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      throw error;
    }
  },

  async resetPassword(token, newPassword) {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      return await processResponse(response);
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      throw error;
    }
  },

  // ✅ NOVO: Busca os dados de autenticação do Supabase (inclui email)
  async getCurrentAuthUser() {
    const token = this.getToken();
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const response = await apiFetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await processResponse(response);
      return data; // Deve retornar: { id, email, ... }
    } catch (error) {
      console.error('Erro ao buscar usuário autenticado:', error);
      throw error;
    }
  },

  getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(CLIENT_USER_DATA_KEY));
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  },
};

export default authService;
