// src/lib/api.js - Centralized HTTP client for INKSA Clientes

// API base URL configuration - prioritize VITE_API_ORIGIN, fallback to VITE_API_URL for compatibility
const API_BASE_URL = (import.meta.env.VITE_API_ORIGIN || import.meta.env.VITE_API_URL || 'https://inksa-auth-flask-dev.onrender.com').replace(/\/$/, '');

// Helper to get authentication token
const getAuthToken = () => {
  return localStorage.getItem('clientAuthToken');
};

// Process API responses with consistent error handling
const processResponse = async (response) => {
  // Handle 401 - unauthorized access
  if (response.status === 401) {
    localStorage.removeItem('clientAuthToken');
    localStorage.removeItem('clientUser');
    window.location.href = '/login';
    return null;
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      message: `HTTP error! status: ${response.status}` 
    }));
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }
  
  // Handle 204 No Content
  return response.status === 204 ? null : response.json();
};

// Create request headers with optional authorization
const createHeaders = (includeAuth = false, customHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders
  };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Token de autenticação não encontrado.');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// HTTP client with consistent API
const api = {
  /**
   * GET request
   * @param {string} endpoint - API endpoint (e.g., '/api/restaurants')
   * @param {boolean} includeAuth - Include authorization header
   * @param {object} headers - Additional headers
   */
  async get(endpoint, includeAuth = false, headers = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: createHeaders(includeAuth, headers),
    });
    return processResponse(response);
  },

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {object|FormData} body - Request body
   * @param {boolean} includeAuth - Include authorization header
   * @param {object} headers - Additional headers
   */
  async post(endpoint, body = null, includeAuth = false, headers = {}) {
    const isFormData = body instanceof FormData;
    const requestHeaders = isFormData 
      ? createHeaders(includeAuth, { ...headers, 'Content-Type': undefined }) // Let browser set Content-Type for FormData
      : createHeaders(includeAuth, headers);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: requestHeaders,
      body: isFormData ? body : JSON.stringify(body),
    });
    return processResponse(response);
  },

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {object|FormData} body - Request body
   * @param {boolean} includeAuth - Include authorization header
   * @param {object} headers - Additional headers
   */
  async put(endpoint, body = null, includeAuth = false, headers = {}) {
    const isFormData = body instanceof FormData;
    const requestHeaders = isFormData 
      ? createHeaders(includeAuth, { ...headers, 'Content-Type': undefined })
      : createHeaders(includeAuth, headers);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: requestHeaders,
      body: isFormData ? body : JSON.stringify(body),
    });
    return processResponse(response);
  },

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {boolean} includeAuth - Include authorization header
   * @param {object} headers - Additional headers
   */
  async delete(endpoint, includeAuth = false, headers = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: createHeaders(includeAuth, headers),
    });
    return processResponse(response);
  },

  // Utility to get the current API base URL
  getBaseURL() {
    return API_BASE_URL;
  }
};

export default api;