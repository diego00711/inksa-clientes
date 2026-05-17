// src/services/apiClient.js
// Wrapper global de fetch com interceptação de 401/403.
// Todos os services devem usar apiFetch em vez de fetch diretamente.

export async function apiFetch(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('clientAuthToken');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return response;
  } catch (error) {
    throw error;
  }
}
