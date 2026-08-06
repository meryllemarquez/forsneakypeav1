import axios from 'axios';

// Base API URL targeting /api/v1
const rawBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
const baseURL = rawBaseURL.replace(/\/+$/, '');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Helper function to extract stored JWT token safely
const getStoredToken = () => {
  let token = localStorage.getItem('token') || localStorage.getItem('jwt') || localStorage.getItem('authToken');
  if (!token) {
    try {
      const userObj = JSON.parse(localStorage.getItem('user') || '{}');
      token = userObj.token || userObj.jwt;
    } catch {
      // Ignore JSON parse errors cleanly without unused variable
    }
  }
  return token;
};

// Request Interceptor: Attach JWT Token if available
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Detailed Debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('🚨 Axios Error Inspection:', {
      url: error.config?.url,
      fullURL: `${error.config?.baseURL || ''}${error.config?.url || ''}`,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

export default api;