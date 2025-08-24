// services/authService.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://inksa-auth-flask-dev.onrender.com';
const AUTH_TOKEN_KEY = 'clientAuthToken';
const CLIENT_USER_DATA_KEY = 'clientUser';

const processResponse = async (response) => {
    if (response.status === 401) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(CLIENT_USER_DATA_KEY);
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
        throw new Error('Sessão expirada ou não autorizada. Por favor, faça login novamente.');
    }
    if (!response.ok) {
        try {
            const errorData = await response.json();
            const errorMessage = errorData.message || errorData.error || `Erro ${response.status}`;
            throw new Error(errorMessage);
        } catch (jsonError) {
            throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }
    }
    if (response.status === 204) {
        return null;
    }
    return response.json();
};

const createAuthHeaders = () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
        throw new Error('Usuário não autenticado. Token não encontrado.');
    }
    return { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

const AuthService = {
    /**
     * ✅ CORRIGIDO: Realiza o login do usuário.
     * @param {string} email - O email do usuário.
     * @param {string} password - A senha do usuário.
     * @returns {Promise<object>} - Os dados da resposta do login, incluindo token e dados do usuário.
     */
    login: async (email, password) => {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        
        const data = await processResponse(response);
        
        // ✅ CORREÇÃO: Acessar token através de data.session
        if (data.session && data.session.access_token) {
            localStorage.setItem(AUTH_TOKEN_KEY, data.session.access_token);
            localStorage.setItem(CLIENT_USER_DATA_KEY, JSON.stringify(data.user));
            
            // ✅ Também salvar refresh token se necessário
            if (data.session.refresh_token) {
                localStorage.setItem('clientRefreshToken', data.session.refresh_token);
            }
        } else {
            throw new Error('Login falhou: Token de acesso não recebido.');
        }
        return data;
    },

    /**
     * Realiza o registo de um novo usuário.
     * @param {object} userData - Os dados do usuário para registo (email, password, firstName, lastName).
     * @returns {Promise<object>} - Os dados da resposta do registo.
     */
    register: async (userData) => {
        const dataToSend = {
            email: userData.email,
            password: userData.password,
            name: `${userData.firstName} ${userData.lastName}`,
            user_type: 'client' // ✅ backend espera user_type
        };
        
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend),
        });
        return processResponse(response);
    },

    /**
     * Solicita redefinição de senha.
     * @param {string} email - O email do usuário.
     * @returns {Promise<null>}
     */
    forgotPassword: async (email) => {
        const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        return processResponse(response);
    },

    /**
     * Realiza o logout do usuário, removendo o token e os dados do localStorage.
     */
    logout: () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(CLIENT_USER_DATA_KEY);
        localStorage.removeItem('clientRefreshToken');
        window.location.href = '/login';
    },

    /**
     * Verifica se o usuário está autenticado (tem um token no localStorage).
     * @returns {boolean} - True se autenticado, false caso contrário.
     */
    isAuthenticated: () => !!localStorage.getItem(AUTH_TOKEN_KEY),

    /**
     * Obtém o token de autenticação armazenado.
     * @returns {string|null} - O token ou null se não existir.
     */
    getToken: () => localStorage.getItem(AUTH_TOKEN_KEY),

    /**
     * ✅ CORRIGIDO: Obtém os dados do usuário armazenados localmente.
     * @returns {object|null} - Os dados do usuário ou null se não existir.
     */
    getUser: () => {
        const userData = localStorage.getItem(CLIENT_USER_DATA_KEY);
        if (!userData) return null;
        
        try {
            const user = JSON.parse(userData);
            // ✅ Converter estrutura do backend para frontend se necessário
            return {
                ...user,
                // Se o frontend espera firstName/lastName mas backend retorna name
                firstName: user.firstName || user.name?.split(' ')[0] || '',
                lastName: user.lastName || user.name?.split(' ')[1] || '',
                // Garantir compatibilidade
                fullName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()
            };
        } catch (e) {
            console.error('Erro ao parsear dados do usuário:', e);
            return null;
        }
    },

    /**
     * Busca os dados do perfil do usuário logado na API.
     * @returns {Promise<object>} - Os dados do perfil do usuário.
     */
    getProfile: async () => {
        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
            headers: createAuthHeaders(),
        });
        return processResponse(response);
    },
    
    /**
     * Atualiza os dados do perfil do usuário.
     * @param {object} profileData - Objeto com os campos a serem atualizados.
     * @returns {Promise<object>} - Os dados do perfil atualizados.
     */
    updateProfile: async (profileData) => {
        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
            method: 'PUT',
            headers: createAuthHeaders(),
            body: JSON.stringify(profileData),
        });
        
        const data = await processResponse(response);
        
        // ✅ Atualizar dados locais do usuário
        if (AuthService.isAuthenticated()) {
            const currentUserData = AuthService.getUser();
            if (currentUserData) {
                const updatedUserData = { 
                    ...currentUserData, 
                    ...data.user || data // Depende da estrutura da resposta
                };
                localStorage.setItem(CLIENT_USER_DATA_KEY, JSON.stringify(updatedUserData));
            }
        }
        return data;
    },

    /**
     * Faz o upload do avatar do usuário.
     * @param {File} file - O ficheiro da imagem a ser enviado.
     * @returns {Promise<object>} - A resposta da API, contendo a URL do avatar.
     */
    uploadAvatar: async (file) => {
        const token = AuthService.getToken();
        if (!token) {
            throw new Error('Usuário não autenticado. Token não encontrado.');
        }
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE_URL}/api/auth/avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // ✅ Não definir Content-Type, o browser fará automaticamente com boundary
            },
            body: formData,
        });
        
        const data = await processResponse(response);
        
        // ✅ Atualizar avatar localmente
        const currentUserData = AuthService.getUser();
        if (currentUserData) {
            const updatedUserData = { 
                ...currentUserData, 
                avatar_url: data.avatar_url || data.url 
            };
            localStorage.setItem(CLIENT_USER_DATA_KEY, JSON.stringify(updatedUserData));
        }
        
        return data;
    },
    
    /**
     * Cria um novo pedido para o cliente logado.
     * @param {object} orderData - Os dados do pedido.
     * @returns {Promise<object>} - Os detalhes do pedido criado.
     */
    createOrder: async (orderData) => {
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: createAuthHeaders(),
            body: JSON.stringify(orderData),
        });
        return processResponse(response);
    },

    /**
     * Busca os pedidos do cliente logado.
     * @returns {Promise<Array<object>>} - Uma lista de pedidos.
     */
    getMyOrders: async () => {
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
            headers: createAuthHeaders(),
        });
        return processResponse(response);
    },

    /**
     * Deleta um pedido específico.
     * @param {string} orderId - O ID do pedido a ser deletado.
     * @returns {Promise<null>} - Retorna null em caso de sucesso (status 204).
     */
    deleteOrder: async (orderId) => {
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
            method: 'DELETE',
            headers: createAuthHeaders(),
        });
        return processResponse(response);
    },

    /**
     * ✅ NOVO: Atualiza token com refresh token
     */
    refreshToken: async () => {
        const refreshToken = localStorage.getItem('clientRefreshToken');
        if (!refreshToken) {
            throw new Error('Refresh token não disponível');
        }
        
        const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
        
        const data = await processResponse(response);
        
        if (data.session && data.session.access_token) {
            localStorage.setItem(AUTH_TOKEN_KEY, data.session.access_token);
            if (data.session.refresh_token) {
                localStorage.setItem('clientRefreshToken', data.session.refresh_token);
            }
            return data.session.access_token;
        }
        
        throw new Error('Falha ao atualizar token');
    },

    /**
     * ✅ NOVO: Verifica e atualiza token expirado automaticamente
     */
    withAuthRetry: async (fetchFunction) => {
        try {
            return await fetchFunction();
        } catch (error) {
            if (error.message.includes('401') || error.message.includes('não autorizada')) {
                try {
                    await AuthService.refreshToken();
                    return await fetchFunction(); // Tenta novamente com novo token
                } catch (refreshError) {
                    AuthService.logout();
                    throw refreshError;
                }
            }
            throw error;
        }
    }
};

export default AuthService;
