// src/context/AuthContext.jsx - VERSÃO FINAL CORRIGIDA COM EMAIL

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
        // ✅ OPÇÃO 1: Tenta buscar dados de auth (se o backend tiver /api/auth/me)
        let authData = null;
        try {
          authData = await authService.getCurrentAuthUser();
          console.log('✅ Dados de autenticação obtidos:', authData);
        } catch (error) {
          console.log('⚠️ Endpoint /api/auth/me não disponível, usando dados do localStorage');
          // Fallback: pega os dados do localStorage (salvos no login)
          const storedUser = authService.getCurrentUser();
          authData = storedUser;
        }
        
        // ✅ OPÇÃO 2: Busca o perfil do cliente
        const profileData = await clientService.getProfile();
        console.log('✅ Perfil do cliente obtido:', profileData);
        
        // ✅ COMBINA: perfil + email
        const combinedUser = {
          ...profileData,                    // Dados do perfil (nome, endereço, etc)
          email: authData?.email,            // Email do Supabase Auth
          id: profileData.id || authData?.id // ID do client_profile
        };
        
        console.log('✅ Usuário completo montado:', combinedUser);
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
      const loginResponse = await authService.login(email, password);
      console.log('✅ Login realizado:', loginResponse);
      
      // Após o login, busca o perfil completo
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
    user,                              // Objeto completo: perfil + email
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
