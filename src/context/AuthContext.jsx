// src/context/AuthContext.jsx - VERSÃO CORRIGIDA COM EMAIL

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import clientService from '../services/clientService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAndSetUser = useCallback(async () => {
    const token = authService.getToken();
    if (token) {
      try {
        // ✅ BUSCA OS DADOS DE AUTENTICAÇÃO (inclui email, id do auth)
        const authData = await authService.getCurrentUser();
        
        // ✅ BUSCA O PERFIL DO CLIENTE (inclui nome, endereço, telefone, etc)
        const profileData = await clientService.getProfile();
        
        // ✅ COMBINA OS DOIS: perfil + email do auth
        const combinedUser = {
          ...profileData,           // Dados do perfil (nome, endereço, etc)
          email: authData.email,    // Email do Supabase Auth
          auth_id: authData.id,     // ID do Supabase Auth
          user_id: profileData.id   // ID do client_profile
        };
        
        console.log('✅ Usuário completo carregado:', combinedUser);
        setUser(combinedUser);
      } catch (error) {
        console.error("Falha ao buscar perfil, fazendo logout:", error);
        authService.logout();
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAndSetUser();
  }, [fetchAndSetUser]);

  const login = async (email, password) => {
    try {
      await authService.login(email, password);
      await fetchAndSetUser();
    } catch (error) {
      console.error("Erro no login (AuthContext):", error);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,                         // Objeto completo: perfil + email
    userToken: authService.getToken(), // Token para as requisições
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser: fetchAndSetUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
