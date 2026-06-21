// src/pages/ResetPasswordPage.jsx
// Página de redefinição de senha — o usuário chega aqui pelo link do e-mail.
// O token de recuperação vem no hash da URL (#access_token=...).

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/authService';
import { Lock, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Extrai o access_token do hash da URL (formato do Supabase: #access_token=...)
  useEffect(() => {
    const hash = window.location.hash || '';
    const params = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash);
    const accessToken = params.get('access_token');
    if (accessToken) {
      setToken(accessToken);
    } else {
      setError('Link inválido ou expirado. Volte e solicite um novo link de recuperação.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await AuthService.resetPassword(token, password);
      setMessage(response?.message || 'Senha redefinida com sucesso! Faça login com a nova senha.');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.message || 'Erro ao redefinir a senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-orange-50 p-4">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
            <Lock className="h-6 w-6 text-orange-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Definir nova senha</h2>
        </div>

        {message ? (
          <div className="text-center space-y-4">
            <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
            <p className="text-green-600">{message}</p>
            <Link to="/login" className="inline-block w-full py-2.5 rounded-md text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 min-h-[44px] flex items-center justify-center">
              Ir para o Login
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="text-sm text-gray-600">Nova senha</label>
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="text-sm text-gray-600">Confirmar nova senha</label>
              <input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <button type="submit" disabled={isLoading || !token}
              className="w-full flex justify-center items-center py-2.5 px-4 min-h-[44px] rounded-md text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 transition-colors">
              {isLoading ? 'Redefinindo...' : 'Redefinir senha'}
            </button>

            <div className="text-sm text-center">
              <Link to="/login" className="font-medium text-orange-600 hover:text-orange-500">Voltar para o Login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
