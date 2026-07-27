import { useState } from 'react';
import { AuthContext } from './AuthContext';

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
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}