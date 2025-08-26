import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AuthService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ CORREÇÃO: 'refreshUser' agora é assíncrona e busca os dados completos do perfil
  const refreshUser = useCallback(async () => {
    const token = AuthService.getToken();
    const authUser = AuthService.getCurrentUser(); // Correção aqui!

    if (token && authUser) {
      try {
        const profileResponse = await AuthService.getProfile?.();
        const fullUserData = { ...authUser, profile: profileResponse?.data };
        setUser(fullUserData);
        setUserToken(token);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Falha ao buscar perfil completo, fazendo logout:", error);
        AuthService.logout();
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
    refreshUser();
    const handleStorageChange = () => {
      refreshUser();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshUser]);

  const login = async (email, password) => {
    try {
      await AuthService.login(email, password);
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
