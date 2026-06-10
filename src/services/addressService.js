// src/services/addressService.js
// CRUD de múltiplos endereços do cliente.

import AuthService from './authService';
import { CLIENT_API_URL } from './api';
import { apiFetch } from './apiClient.js';

const BASE = `${CLIENT_API_URL}/api/client/addresses`;

const authHeaders = () => {
  const token = AuthService.getToken();
  if (!token) throw new Error('Token de autenticação não encontrado.');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
};

const handle = async (res) => {
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `Erro HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
};

const AddressService = {
  list: async () => {
    const data = await handle(await apiFetch(BASE, { headers: authHeaders(), credentials: 'include' }));
    return data?.data || [];
  },
  create: async (address) => {
    const data = await handle(await apiFetch(BASE, {
      method: 'POST', headers: authHeaders(), credentials: 'include', body: JSON.stringify(address),
    }));
    return data?.data;
  },
  update: async (id, address) => {
    const data = await handle(await apiFetch(`${BASE}/${id}`, {
      method: 'PUT', headers: authHeaders(), credentials: 'include', body: JSON.stringify(address),
    }));
    return data?.data;
  },
  remove: async (id) => handle(await apiFetch(`${BASE}/${id}`, {
    method: 'DELETE', headers: authHeaders(), credentials: 'include',
  })),
  setDefault: async (id) => handle(await apiFetch(`${BASE}/${id}/default`, {
    method: 'POST', headers: authHeaders(), credentials: 'include',
  })),
};

// Monta uma string legível a partir de um endereço estruturado
export function formatAddress(a) {
  if (!a) return '';
  const linha1 = [a.street, a.number].filter(Boolean).join(', ');
  const parts = [linha1, a.complement, a.neighborhood, a.city, a.state].filter(Boolean);
  return parts.join(' - ');
}

export default AddressService;
