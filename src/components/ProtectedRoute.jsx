// src/components/ProtectedRoute.jsx (PROJETO CLIENTE - ClienteApp)

import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Contexto de Auth do Cliente

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth(); // Pega o estado de autenticação do cliente

  if (loading) {
    return <div>Carregando autenticação do cliente...</div>;
  }

  if (!isAuthenticated) {
    // Redireciona para o login do cliente
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
}