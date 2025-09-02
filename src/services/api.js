// src/services/api.js

// ✅ 1. Defina a URL base da sua API do backend.
//    Use a variável de ambiente do Vite (VITE_API_URL) para isso.
export const CLIENT_API_URL = import.meta.env.VITE_API_URL || 'https://inksa-auth-flask-dev.onrender.com';

/**
 * ✅ 2. Cria os cabeçalhos de autenticação para as requisições.
 *    Pega o token de autenticação do localStorage.
 * @returns {HeadersInit} Um objeto com o cabeçalho de autorização.
 */
export function createAuthHeaders( ) {
  const token = localStorage.getItem('authToken'); // Ou o nome que você usa para guardar o token
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }
  return {};
}

/**
 * ✅ 3. Processa a resposta da API, tratando erros comuns.
 *    Converte a resposta para JSON e dispara um erro se a requisição falhou.
 * @param {Response} response - O objeto de resposta da função fetch.
 * @returns {Promise<any>} Os dados da resposta em formato JSON.
 */
export async function processResponse(response) {
  // Se a resposta for 204 (No Content), não há corpo para ler.
  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    // Usa a mensagem de erro do backend, se disponível, ou uma mensagem padrão.
    const errorMessage = data?.error || data?.message || `Erro ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return data;
}
