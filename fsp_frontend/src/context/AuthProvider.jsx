import { useState } from 'react';
import { AuthContext } from './AuthContext';
import { notificationService } from '../services/notificationService';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('fsp_user');
    const token = localStorage.getItem('fsp_token');
    if (storedUser && token) {
      try {
        return JSON.parse(storedUser);
      } catch {
        localStorage.removeItem('fsp_user');
        localStorage.removeItem('fsp_token');
      }
    }
    return null;
  });

  const [loading] = useState(false);

  const login = (authData) => {
    localStorage.setItem('fsp_token', authData.token);
    localStorage.setItem('fsp_user', JSON.stringify(authData));
    setUser(authData);
  };

  const logout = () => {
    localStorage.removeItem('fsp_token');
    localStorage.removeItem('fsp_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    notificationService.clearCache();
    setUser(null);
  };

  // Merges a partial patch (e.g. after a profile save) into the in-memory user
  // and both localStorage key-sets this app writes to (`fsp_user` here,
  // `user` from authService.js) so nothing goes stale after a reload.
  const updateUser = (patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem('fsp_user', JSON.stringify(next));
      if (localStorage.getItem('user')) {
        localStorage.setItem('user', JSON.stringify(next));
      }
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}