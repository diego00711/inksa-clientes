// src/components/ProtectedRoute.jsx (PROJETO CLIENTE - ClienteApp)

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Contexto de Auth do Cliente

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth(); // FIX: AuthContext exports 'isLoading', not 'loading'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-orange-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
          <p className="text-gray-600 text-sm font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redireciona para o login do cliente
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
}