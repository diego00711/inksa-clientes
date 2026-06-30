// src/context/AuthContext.jsx - VERSÃO ULTRA-SIMPLIFICADA (USA EMAIL DO LOGIN)

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import clientService from '../services/clientService';
import { requestNotificationPermission, saveFcmToken } from '../services/notificationService';
import { CLIENT_API_URL, createAuthHeaders } from '../services/api';
import { isTokenExpired } from '../services/apiClient';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAndSetUser = useCallback(async () => {
    const token = authService.getToken();
    // Se o token ja expirou, encerra sessao limpa antes de tentar usar
    if (token && isTokenExpired(token)) {
      console.warn('[AuthContext] Token expirado detectado na inicializacao, fazendo logout limpo.');
      authService.logout();
      setUser(null);
      setIsLoading(false);
      return;
    }
    if (token) {
      try {
        // 1️⃣ Pega dados salvos no localStorage (do login - TEM O EMAIL!)
        const storedAuthData = authService.getCurrentUser();

        // 2️⃣ Busca o perfil completo — não faz logout se não encontrado (conta recém-criada)
        let profileData = {};
        try {
          profileData = await clientService.getProfile();
        } catch (profileErr) {
          console.warn("[AuthContext] Perfil não encontrado (conta recém-criada ou erro temporário):", profileErr);
          // Não faz logout — usa dados básicos do login para permitir acesso
        }

        // 3️⃣ COMBINA: perfil + email do localStorage
        const combinedUser = {
          ...profileData,
          email: storedAuthData?.email || null,  // EMAIL VEM DO LOGIN!
          user_type: storedAuthData?.user_type || 'client',
          id: profileData.id || storedAuthData?.id
        };

        console.log('✅ [AuthContext] Usuário montado:', combinedUser);
        console.log('✅ [AuthContext] Email do usuário:', combinedUser.email);

        setUser(combinedUser);
      } catch (error) {
        console.error("❌ [AuthContext] Erro crítico ao montar usuário:", error);
        authService.logout();
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAndSetUser();
  }, [fetchAndSetUser]);

  // Verifica periodicamente se o token expirou (a cada 30s). Se sim, desloga.
  useEffect(() => {
    const checkExpiry = () => {
      const token = authService.getToken();
      if (token && isTokenExpired(token)) {
        authService.logout();
        setUser(null);
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    };
    const interval = setInterval(checkExpiry, 30_000);
    // Tambem verifica quando a aba volta a ficar visivel (Capacitor/celular)
    const onVisible = () => { if (!document.hidden) checkExpiry(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const loginResponse = await authService.login(email, password);
      console.log('✅ [AuthContext] Login bem-sucedido:', loginResponse);

      // Atualiza o contexto após login
      await fetchAndSetUser();

      // FCM: solicita permissão e salva token — falha nunca quebra o login
      try {
        const fcmToken = await requestNotificationPermission();
        if (fcmToken) await saveFcmToken(fcmToken, CLIENT_API_URL, createAuthHeaders());
      } catch (fcmErr) {
        console.warn('FCM pós-login error (ignorado):', fcmErr);
      }
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
