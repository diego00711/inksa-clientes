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
  // ✅✅✅ CORREÇÃO PRINCIPAL APLICADA AQUI ✅✅✅
  // Alterado de 'authToken' para 'clientAuthToken' para corresponder ao seu localStorage.
  const token = localStorage.getItem('clientAuthToken'); 
  
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
    //
    // `erro` (português) entra na lista porque TODO o payment.py responde
    // assim — 40 mensagens escritas com cuidado ("este pedido pesa 160 kg e
    // precisa de utilitário", "esta loja está fechada", "o valor da entrega
    // mudou") viravam "Erro 409:" na tela, porque aqui só se procurava
    // `error`. O usuário levava um número no lugar do motivo.
    const errorMessage = data?.error || data?.erro || data?.message
      || `Erro ${response.status}: ${response.statusText}`;
    const err = new Error(errorMessage);
    // O backend manda error_code justamente pra tela poder reagir ao MOTIVO,
    // não só mostrar texto. Sem carregar aqui, ele morria no meio do caminho.
    err.code = data?.error_code || null;
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}
