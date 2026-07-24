import { useState } from 'react';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }) {
  // Synchronous lazy state initialization — pinapatakbo bago i-paint ang DOM
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(sessionStorage.getItem('our_story_auth_token'));
  });

  // Instant auth check means loading is complete immediately on mount
  const isLoading = false;

  const login = (token) => {
    sessionStorage.setItem('our_story_auth_token', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    sessionStorage.removeItem('our_story_auth_token');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}