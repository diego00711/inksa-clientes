// src/context/AuthContext.jsx - VERSÃO FINAL E CORRIGIDA

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import clientService from '../services/clientService'; // ✅ 1. Importa o serviço correto do cliente

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // ✅ 2. Simplificação: 'user' guardará o perfil completo. 'isAuthenticated' será derivado dele.
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAndSetUser = useCallback(async () => {
    // Esta função agora é a única fonte da verdade para buscar o perfil.
    const token = authService.getToken();
    if (token) {
      try {
        // ✅ 3. Usa o clientService para buscar o perfil da rota /api/client/profile
        const profileData = await clientService.getProfile();
        setUser(profileData); // Armazena o perfil completo: { id, name, avatar_url, ... }
      } catch (error) {
        console.error("Falha ao buscar perfil, fazendo logout:", error);
        // Se o token for inválido ou o perfil não for encontrado, desloga.
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
      // O serviço de login já salva o token no localStorage
      await authService.login(email, password);
      // ✅ 4. Após o login, chama a função para buscar e definir o perfil completo.
      await fetchAndSetUser();
    } catch (error) {
      console.error("Erro no login (AuthContext):", error);
      throw error; // Relança o erro para a página de login poder mostrar a mensagem.
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // ✅ 5. O valor do contexto é simplificado.
  const value = {
    user, // O objeto de perfil completo
    isAuthenticated: !!user, // A autenticação é verdadeira se o objeto 'user' existir
    isLoading,
    login,
    logout,
    refreshUser: fetchAndSetUser, // A função de refresh agora é a mesma que busca o usuário
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
