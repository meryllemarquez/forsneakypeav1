import { useState } from 'react';
import { AuthContext } from './AuthContext';
import { queryClient } from '../queries/queryClient';

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
    // Start every session with an empty cache so nothing from a previous account can show.
    queryClient.clear();
    localStorage.setItem('fsp_token', authData.token);
    localStorage.setItem('fsp_user', JSON.stringify(authData));
    setUser(authData);
  };

  const logout = () => {
    localStorage.removeItem('fsp_token');
    localStorage.removeItem('fsp_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Drop every cached query (folders, dates, notes, notifications, profile...) so the next
    // person to sign in on this browser never sees the previous user's data.
    queryClient.clear();
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