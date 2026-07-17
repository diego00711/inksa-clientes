// src/services/apiClient.js
// Wrapper global de fetch com:
//  1. Renovação automática da sessão (refresh_token) ANTES do token vencer
//  2. Retry único em 401 (renova e repete a chamada)
//  3. Logout SÓ quando a sessão é definitivamente inválida
// Todos os services devem usar apiFetch em vez de fetch diretamente.

import { CLIENT_API_URL } from './api';

const AUTH_KEY = 'clientAuthToken';
const USER_KEY = 'clientUser';
const REFRESH_KEY = 'clientRefreshToken';

export const REFRESH_NETWORK_ERROR = 'REFRESH_NETWORK_ERROR';

function decodeJwtPayload(token) {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
    return JSON.parse(atob(b64 + pad));
  } catch {
    return null;
  }
}

// margem generosa: renova 60s antes de vencer, pra nunca mandar token morto
export function isTokenExpired(token, marginSeconds = 60) {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return false; // sem exp, deixa o backend decidir
  return Math.floor(Date.now() / 1000) >= payload.exp - marginSeconds;
}

function expireSessionLocally() {
  try {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {}
  window.dispatchEvent(new CustomEvent('auth:unauthorized'));
}

// Uma única renovação em voo (várias telas ao mesmo tempo -> 1 request só)
let refreshPromise = null;

export async function refreshSession() {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const r = await fetch(`${CLIENT_API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!r.ok) return null; // 401: refresh_token revogado/inválido
      const json = await r.json();
      const token = json?.data?.token;
      const newRefresh = json?.data?.refresh_token;
      if (!token) return null;
      localStorage.setItem(AUTH_KEY, token);
      if (newRefresh) localStorage.setItem(REFRESH_KEY, newRefresh);
      return token;
    } catch {
      return REFRESH_NETWORK_ERROR; // backend hibernando/wifi caiu: NÃO desloga
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function withAuthHeader(init, token) {
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  return { ...init, headers };
}

function makeResponse(status, message) {
  return new Response(JSON.stringify({ status: 'error', error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function apiFetch(url, options = {}) {
  let token = localStorage.getItem(AUTH_KEY);

  // 1) Token vencendo? renova ANTES de chamar (em vez de deslogar).
  if (token && isTokenExpired(token)) {
    const renewed = await refreshSession();
    if (renewed === REFRESH_NETWORK_ERROR) {
      // rede fora: 503 (não 401) mantém a sessão viva pra próxima tentativa
      return makeResponse(503, 'Sem conexão. Tentando novamente...');
    }
    if (!renewed) {
      expireSessionLocally();
      return makeResponse(401, 'Sessão expirada');
    }
    token = renewed;
  }

  const doFetch = (tk) => fetch(url, tk ? withAuthHeader(options, tk) : options);

  let response;
  try {
    response = await doFetch(token);
  } catch (error) {
    window.dispatchEvent(new CustomEvent('network:error'));
    throw error;
  }

  // 2) 401 mesmo com token fresco? renova e tenta 1x.
  if (response.status === 401) {
    const renewed = await refreshSession();
    if (renewed === REFRESH_NETWORK_ERROR) return response;
    if (renewed) {
      try {
        response = await doFetch(renewed);
      } catch (error) {
        window.dispatchEvent(new CustomEvent('network:error'));
        throw error;
      }
      if (response.status !== 401) return response;
    }
    expireSessionLocally();
  }

  return response;
}
