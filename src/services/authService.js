// Hotfix: force a base URL to guarantee requests reach the backend from Vercel
const API_BASE_URL = 'https://inksa-auth-flask-dev.onrender.com';
const AUTH_TOKEN_KEY = 'clientAuthToken';
const CLIENT_USER_DATA_KEY = 'clientUser';

const processResponse = async (response) => {
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
      if (data && data.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        localStorage.setItem(CLIENT_USER_DATA_KEY, JSON.stringify(data.user));
        return data;
      }
      throw new Error('Token não recebido');
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  },

  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...userData, user_type: 'cliente' }),
    });
    const data = await processResponse(response);
    if (data && data.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(CLIENT_USER_DATA_KEY, JSON.stringify(data.user));
    }
    return data;
  },

  async logout() {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
      }
    } catch (e) {
      console.error('Erro no logout:', e);
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(CLIENT_USER_DATA_KEY);
      window.location.href = '/login';
    }
  },

  async forgotPassword(email) {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return processResponse(response);
  },

  async resetPassword(token, newPassword) {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword }),
    });
    return processResponse(response);
  },

  async updateProfile(profileData) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    const data = await processResponse(response);
    if (data?.user) localStorage.setItem(CLIENT_USER_DATA_KEY, JSON.stringify(data.user));
    return data;
  },

  getToken() { return localStorage.getItem(AUTH_TOKEN_KEY); },
  getCurrentUser() { try { return JSON.parse(localStorage.getItem(CLIENT_USER_DATA_KEY)); } catch { return null; } },
  isAuthenticated() { return !!localStorage.getItem(AUTH_TOKEN_KEY); },
};

export default authService;
