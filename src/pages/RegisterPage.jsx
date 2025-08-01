import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/authService';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Objeto com os dados formatados para o backend
      const dataToSend = {
        email: formData.email,
        password: formData.password,
        name: `${formData.firstName} ${formData.lastName}`, // Combina nome e apelido
        userType: 'client', // Adiciona o tipo de usuário fixo
      };

      // Envia os dados corretos para o serviço de autenticação
      await AuthService.register(dataToSend); 
      
      alert('Registo feito com sucesso! Por favor, faça o login.');
      navigate('/login');

    } catch (err) {
      // Captura a mensagem de erro específica vinda do backend
      const errorMessage = err.response?.data?.message || err.message || 'Ocorreu um erro ao tentar registar.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-orange-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <img src="/inka-logo.png" alt="Inksa Logo" className="h-10 w-auto mx-auto" />
          <h2 className="mt-4 text-2xl font-bold text-center text-gray-900">
            Crie a sua Conta
          </h2>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Nome</label>
              <input id="firstName" name="firstName" type="text" required value={formData.firstName} onChange={handleChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex-1">
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Apelido</label>
              <input id="lastName" name="lastName" type="text" required value={formData.lastName} onChange={handleChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail</label>
            <input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
            <input id="password" name="password" type="password" required minLength="6" value={formData.password} onChange={handleChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {error && <p className="text-sm text-center text-red-500">{error}</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isLoading ? 'A Registar...' : 'Criar Conta'}
            </button>
          </div>
        </form>
        <div className="text-sm text-center text-gray-500 pt-4 border-t">
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Já tem uma conta? Faça Login
          </Link>
        </div>
      </div>
    </div>
  );
}