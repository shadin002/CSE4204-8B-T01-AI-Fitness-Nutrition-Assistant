import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('fitguide_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fitguide_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authLoading, setAuthLoading] = useState(Boolean(token));

  useEffect(() => {
    async function loadCurrentUser() {
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        const currentUser = res.data?.data?.user;
        if (currentUser) {
          setUser(currentUser);
          localStorage.setItem('fitguide_user', JSON.stringify(currentUser));
        }
      } catch {
        logout();
      } finally {
        setAuthLoading(false);
      }
    }

    loadCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const payload = res.data?.data;
    localStorage.setItem('fitguide_token', payload.token);
    localStorage.setItem('fitguide_user', JSON.stringify(payload.user));
    setToken(payload.token);
    setUser(payload.user);
    return payload.user;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    return res.data;
  };

  const logout = async () => {
    try {
      if (localStorage.getItem('fitguide_token')) {
        await api.post('/auth/logout');
      }
    } catch {
      // Local logout should still continue even if backend logout fails.
    }
    localStorage.removeItem('fitguide_token');
    localStorage.removeItem('fitguide_user');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ token, user, authLoading, isAuthenticated: Boolean(token), login, register, logout }),
    [token, user, authLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
