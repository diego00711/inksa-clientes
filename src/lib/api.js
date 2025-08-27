// Cliente HTTP centralizado para o app (Vite + React)
import AuthService from '../services/authService';

// Defina em produção: VITE_API_ORIGIN=https://api.inksadelivery.com.br
// Em dev: VITE_API_ORIGIN=http://localhost:5000
export const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || '').replace(/\/$/, '');

function buildUrl(path, params) {
  if (!API_ORIGIN) {
    throw new Error('VITE_API_ORIGIN não configurado. Crie .env.local ou defina na Vercel');
  }
  const p = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(p, API_ORIGIN);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, v);
      }
    });
  }
  return url.toString();
}

async function request(method, path, { auth = false, params, body, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers['Content-Type'] = 'application/json';

  if (auth) {
    const token = AuthService?.getToken?.();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  const parseJson = async () => {
    try {
      return await res.json();
    } catch {
      return null;
    }
  };

  if (!res.ok) {
    const data = contentType.includes('application/json') ? await parseJson() : null;
    const msg = data?.error || `Erro HTTP ${res.status}`;
    throw new Error(msg);
  }

  if (res.status === 204) return null;

  if (contentType.includes('application/json')) {
    const data = await parseJson();
    return data && Object.prototype.hasOwnProperty.call(data, 'data') ? data.data : data;
  }

  return res;
}

export const api = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, body, opts) => request('POST', path, { ...opts, body }),
  postForm: (path, formData, opts) => request('POST', path, { ...opts, body: formData, isForm: true }),
  put: (path, body, opts) => request('PUT', path, { ...opts, body }),
  del: (path, opts) => request('DELETE', path, opts),
};