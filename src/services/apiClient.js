// src/services/apiClient.js
// Wrapper global de fetch com:
//  1. Verificacao proativa de token JWT expirado (decoda o `exp`)
//  2. Intercepcao de 401/403
// Todos os services devem usar apiFetch em vez de fetch diretamente.

const AUTH_KEY = 'clientAuthToken';
const USER_KEY = 'clientUser';

function decodeJwtPayload(token) {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    // base64url -> base64
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
    return JSON.parse(atob(b64 + pad));
  } catch {
    return null;
  }
}

export function isTokenExpired(token, marginSeconds = 30) {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return false; // sem exp, deixa o backend decidir
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec >= payload.exp - marginSeconds;
}

function expireSessionLocally() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new CustomEvent('auth:unauthorized'));
}

export async function apiFetch(url, options = {}) {
  // 1) Antes de chamar: se token local ja expirou, encerra sessao limpa
  const token = localStorage.getItem(AUTH_KEY);
  if (token && isTokenExpired(token)) {
    expireSessionLocally();
    // Retorna uma resposta sintética 401 para o caller tratar como autenticação inválida
    return new Response(JSON.stringify({ status: 'error', error: 'Sessão expirada' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch(url, options);
    // Só 401 (não autenticado) encerra a sessão. 403 é AUTORIZAÇÃO (autenticado,
    // mas sem permissão pra AQUELE recurso) — não deve deslogar o usuário, senão
    // um endpoint que responde 403 (ex.: gamificação) derruba a sessão toda.
    if (response.status === 401) {
      expireSessionLocally();
    }
    return response;
  } catch (error) {
    window.dispatchEvent(new CustomEvent('network:error'));
    throw error;
  }
}
