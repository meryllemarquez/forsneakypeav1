import axios from 'axios';

// Base API URL targeting /api/v1
const rawBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
const baseURL = rawBaseURL.replace(/\/+$/, '');

// Signed media links come back as "/api/v1/media/..." when the server does not know its public origin.
// Browsers would resolve those against the frontend (localhost:5173, Vercel), so point them at the API.
const apiOrigin = (() => {
  try {
    return new URL(baseURL, window.location.origin).origin;
  } catch {
    return '';
  }
})();

export function absolutizeMediaUrls(value) {
  if (!apiOrigin) return value;
  if (typeof value === 'string') {
    return value.startsWith('/api/v1/media/') ? apiOrigin + value : value;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) value[i] = absolutizeMediaUrls(value[i]);
  } else if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    for (const key of Object.keys(value)) value[key] = absolutizeMediaUrls(value[key]);
  }
  return value;
}

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
      // Ignore JSON parse errors cleanly
    }
  }
  return token;
};

// Request Interceptor: Attach JWT Token ONLY if NOT calling public auth routes
api.interceptors.request.use(
  (config) => {
    const isAuthRoute = config.url?.includes('/auth/login') || config.url?.includes('/auth/register');
    
    // Wag mag-attach ng Authorization header kapag nag-lologin/register
    if (!isAuthRoute) {
      const token = getStoredToken();
      if (token) {
        if (config.headers.set) {
          config.headers.set('Authorization', `Bearer ${token}`);
        } else {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use((response) => {
  absolutizeMediaUrls(response.data);
  return response;
});

// Response Interceptor: Detailed Debugging + centralized session-expiry handling.
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

    // A 401 on any authenticated call means the JWT is missing/expired/invalid.
    // Previously each page had to detect this and redirect on its own (most
    // didn't), leaving the app stuck showing a generic load error while
    // silently unauthenticated. Handle it once, centrally: drop the stale
    // credentials and send the user back to login with an explanation.
    const isAuthRoute = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthRoute && !window.location.pathname.startsWith('/auth')) {
      localStorage.removeItem('fsp_token');
      localStorage.removeItem('fsp_user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.setItem('fsp_session_expired', '1');
      window.location.href = '/auth';
    }

    return Promise.reject(error);
  }
);

export default api;