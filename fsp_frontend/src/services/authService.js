import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-attach JWT token to requests if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fsp_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  // 1. PIN verification (for Welcome screen)
  verifyPin: async (pin) => {
    const response = await api.post('/auth/verify-pin', { pin });
    return response.data;
  },

  // 2. Master Key verification for Account Creation (0617)
  verifyMasterKey: async (masterKey) => {
    // Fast local verification for 0617
    return masterKey === '0617';
  },

  // 3. User Login (Merylle / Cj / Admin)
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data && response.data.success) {
      return response.data.data; // Returns { token, username, name, role }
    }
    throw new Error(response.data.message || 'Login failed');
  },

  // 4. Create Account (Protected by Master Password)
  register: async (accountData) => {
    // accountData: { masterPassword, name, username, password, role }
    const response = await api.post('/auth/register', accountData);
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Registration failed');
  },

  // 5. Fetch current logged-in user session
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};