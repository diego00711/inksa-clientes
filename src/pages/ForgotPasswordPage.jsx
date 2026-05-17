// src/pages/ForgotPasswordPage.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../services/authService';
import { Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(''); // Para feedback ao usuário
  const [isSuccess, setIsSuccess] = useState(false); // FIX: track success vs error state

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setIsSuccess(false);
    try {
      const response = await AuthService.forgotPassword(email);
      setIsSuccess(true);
      setMessage(response?.message || 'Link de recuperação enviado! Verifique seu e-mail.');
    } catch (error) {
      setIsSuccess(false);
      setMessage(error.message || 'Ocorreu um erro ao enviar o e-mail.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-orange-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
                <Mail className="h-6 w-6 text-indigo-600" />
            </div>
          <h2 className="mt-4 text-2xl font-bold text-center text-gray-900">
            Recuperar Senha
          </h2>
          <p className="mt-2 text-sm text-center text-gray-600">
            Digite seu e-mail e enviaremos um link para você criar uma nova senha.
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">Endereço de e-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Endereço de e-mail"
            />
          </div>

          {/* Mensagem de feedback (sucesso ou erro) — FIX: color differs by state */}
          {message && (
            <p className={`text-sm text-center font-medium ${isSuccess ? 'text-green-600' : 'text-red-500'}`}>
              {message}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || message} // Desativa o botão após o envio bem-sucedido
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-colors"
            >
              {isLoading ? 'A Enviar...' : 'Enviar Link de Recuperação'}
            </button>
          </div>
        </form>
        <div className="text-sm text-center text-gray-500">
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
}