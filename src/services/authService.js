// services/authService.js - INKSA CLIENTES
import api from '../lib/api.js';

const AUTH_TOKEN_KEY = 'clientAuthToken';
const CLIENT_USER_DATA_KEY = 'clientUser';

const authService = {
    async login(email, password) {
        try {
            const data = await api.post('/api/auth/login', {
                email, 
                password,
                user_type: 'cliente' 
            });
            
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
        try {
            const data = await api.post('/api/auth/register', {
                ...userData,
                user_type: 'cliente'
            });
            
            if (data && data.token) {
                localStorage.setItem(AUTH_TOKEN_KEY, data.token);
                localStorage.setItem(CLIENT_USER_DATA_KEY, JSON.stringify(data.user));
                return data;
            }
            
            return data;
        } catch (error) {
            console.error('Erro no registro:', error);
            throw error;
        }
    },

    async logout() {
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (token) {
                await api.post('/api/auth/logout', null, true);
            }
        } catch (error) {
            console.error('Erro no logout:', error);
        } finally {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(CLIENT_USER_DATA_KEY);
            window.location.href = '/login';
        }
    },

    async forgotPassword(email) {
        try {
            return await api.post('/api/auth/forgot-password', { email });
        } catch (error) {
            console.error('Erro ao solicitar recuperação de senha:', error);
            throw error;
        }
    },

    async resetPassword(token, newPassword) {
        try {
            return await api.post('/api/auth/reset-password', { 
                token, 
                new_password: newPassword 
            });
        } catch (error) {
            console.error('Erro ao resetar senha:', error);
            throw error;
        }
    },

    async updateProfile(profileData) {
        try {
            const data = await api.put('/api/auth/profile', profileData, true);
            
            if (data && data.user) {
                localStorage.setItem(CLIENT_USER_DATA_KEY, JSON.stringify(data.user));
            }
            
            return data;
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            throw error;
        }
    },

    getToken() {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    },

    getCurrentUser() {
        const userStr = localStorage.getItem(CLIENT_USER_DATA_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated() {
        return !!localStorage.getItem(AUTH_TOKEN_KEY);
    }
};

export default authService;
