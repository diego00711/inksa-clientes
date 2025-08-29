// src/services/authService.js - VERSÃO CORRIGIDA E LIMPA

const API_BASE_URL = 'https://inksa-auth-flask-dev.onrender.com';
const AUTH_TOKEN_KEY = 'clientAuthToken';
const CLIENT_USER_DATA_KEY = 'clientUser';

const processResponse = async (response ) => {
  if (response.status === 401) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(CLIENT_USER_DATA_KEY);
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
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, user_type: 'cliente' }),
      });
      const data = await processResponse(response);
      // A resposta do login agora vem dentro de 'data'
      if (data && data.data && data.data.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.data.token);
        localStorage.setItem(CLIENT_USER_DATA_KEY, JSON.stringify(data.data.user));
        return data.data;
      }
      throw new Error('Token não recebido');
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  },

  async register(userData) {
    // ... (código de registro)
  },

  async logout() {
    // ... (código de logout)
  },

  async forgotPassword(email) {
    // ... (código de esqueci a senha)
  },

  async resetPassword(token, newPassword) {
    // ... (código de resetar senha)
  },

  // ✅ REMOVIDO: A função updateProfile foi removida para evitar duplicação.
  // A responsabilidade agora é 100% do ClientService.

  getToken() { return localStorage.getItem(AUTH_TOKEN_KEY); },
  getCurrentUser() { try { return JSON.parse(localStorage.getItem(CLIENT_USER_DATA_KEY)); } catch { return null; } },
  isAuthenticated() { return !!localStorage.getItem(AUTH_TOKEN_KEY); },
};

export default authService;
