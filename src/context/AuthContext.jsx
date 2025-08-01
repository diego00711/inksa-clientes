// src/context/AuthContext.jsx

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import AuthService from '../services/authService';

const supabaseUrl = "https://jbritstgkpznuivfupnz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impicml0c3Rna3B6bnVpdmZ1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTg5MzUsImV4cCI6MjA2NjY5NDkzNX0.W0xkWhbWrZ3FeAOYaBqB1FXhwbareYXHWI-RzRLHQ04";

export const supabase = createClient(supabaseUrl, supabaseKey);

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ CORREÇÃO: 'refreshUser' agora é assíncrona e busca os dados completos do perfil
  const refreshUser = useCallback(async () => {
    const token = AuthService.getToken();
    const authUser = AuthService.getUser(); // Dados básicos da autenticação (id, email)

    // Apenas prossiga se houver um token e um usuário básico
    if (token && authUser) {
      try {
        // Busca os dados detalhados da tabela 'client_profiles'
        const profileResponse = await AuthService.getProfile();
        // Junta os dados de autenticação com os dados do perfil (nome, avatar, etc.)
        const fullUserData = { ...authUser, profile: profileResponse.data };
        
        setUser(fullUserData);
        setUserToken(token);
        setIsAuthenticated(true);

      } catch (error) {
        console.error("Falha ao buscar perfil completo, fazendo logout:", error);
        AuthService.logout(); // Se não conseguir buscar o perfil, desloga por segurança
        setUser(null);
        setUserToken(null);
        setIsAuthenticated(false);
      }
    } else {
      setUser(null);
      setUserToken(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Busca os dados do usuário ao carregar a página
    refreshUser();

    // Ouve por mudanças no localStorage (login/logout em outra aba)
    const handleStorageChange = () => {
      refreshUser();
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshUser]);

  useEffect(() => {
    // Ouve por eventos de autenticação do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`Supabase auth event: ${event}`);
        if (event === 'SIGNED_IN' && session) {
          localStorage.setItem('clientAuthToken', session.access_token);
          localStorage.setItem('clientUser', JSON.stringify(session.user));
          refreshUser();
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('clientAuthToken');
          localStorage.removeItem('clientUser');
          refreshUser();
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [refreshUser]);

  const login = async (email, password) => {
    try {
      await AuthService.login(email, password);
      // ✅ CORREÇÃO: Espera o refreshUser buscar os dados completos antes de continuar
      await refreshUser();
    } catch (error) {
      console.error("Erro no login (AuthContext):", error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const data = await AuthService.register(userData);
      return data;
    } catch (error) {
      console.error("Erro no registro (AuthContext):", error);
      throw error;
    }
  };

  const logout = () => {
    AuthService.logout();
    // Limpa o estado local imediatamente para uma resposta visual mais rápida
    setUser(null);
    setIsAuthenticated(false);
    setUserToken(null);
  };

  const value = {
    user,
    isAuthenticated,
    userToken,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
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