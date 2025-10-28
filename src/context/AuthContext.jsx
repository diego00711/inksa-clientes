// src/context/AuthContext.jsx - VERSÃO ULTRA-SIMPLIFICADA (USA EMAIL DO LOGIN)

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
        // 1️⃣ Pega dados salvos no localStorage (do login - TEM O EMAIL!)
        const storedAuthData = authService.getCurrentUser();
        
        // 2️⃣ Busca o perfil completo
        const profileData = await clientService.getProfile();
        
        // 3️⃣ COMBINA: perfil + email do localStorage
        const combinedUser = {
          ...profileData,
          email: storedAuthData?.email || null,  // EMAIL VEM DO LOGIN!
          user_type: storedAuthData?.user_type || 'cliente',
          id: profileData.id
        };
        
        console.log('✅ [AuthContext] Usuário montado:', combinedUser);
        console.log('✅ [AuthContext] Email do usuário:', combinedUser.email);
        
        setUser(combinedUser);
      } catch (error) {
        console.error("❌ [AuthContext] Erro ao buscar perfil:", error);
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
      console.log('✅ [AuthContext] Login bem-sucedido:', loginResponse);
      
      // Atualiza o contexto após login
      await fetchAndSetUser();
    } catch (error) {
      console.error("❌ [AuthContext] Erro no login:", error);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    userToken: authService.getToken(),
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
