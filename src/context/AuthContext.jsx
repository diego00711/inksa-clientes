// Local: src/context/AuthContext.jsx

import React, { createContext, useContext, useState } from 'react';

// 1. Criamos o contexto
const AuthContext = createContext();

// 2. Criamos o "Provedor" do contexto. 
// Ele é um componente que vai gerenciar o estado de autenticação.
export function AuthProvider({ children }) { // <--- A CHAVE DE ABERTURA VAI AQUI
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Função para simular o login
  const login = () => {
    console.log("Simulando login...");
    setIsAuthenticated(true);
  };

  // Função para simular o logout
  const logout = () => {
    console.log("Simulando logout...");
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} // <--- E A CHAVE DE FECHAMENTO AQUI

// 3. Criamos um "hook" personalizado para facilitar o uso do contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}