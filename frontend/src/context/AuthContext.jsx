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
  const [connectionError, setConnectionError] = useState('');

  const clearLocalSession = (message = '') => {
    localStorage.removeItem('fitguide_token');
    localStorage.removeItem('fitguide_user');
    setToken(null);
    setUser(null);
    if (message) sessionStorage.setItem('fitguide_auth_message', message);
  };

  useEffect(() => {
    const onExpired = (event) => clearLocalSession(event.detail || 'Your session has expired. Please log in again.');
    window.addEventListener('fitguide:session-expired', onExpired);
    return () => window.removeEventListener('fitguide:session-expired', onExpired);
  }, []);

  useEffect(() => {
    async function loadCurrentUser() {
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        setConnectionError('');
        const res = await api.get('/auth/me');
        const currentUser = res.data?.data?.user;
        if (currentUser) {
          setUser(currentUser);
          localStorage.setItem('fitguide_user', JSON.stringify(currentUser));
        }
      } catch (err) {
        if (err?.response?.status !== 401) {
          setConnectionError(err.appMessage || 'Could not verify the session because the server is unavailable.');
        }
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
    setConnectionError('');
    return payload.user;
  };

  const register = async (formData) => api.post('/auth/register', formData);

  const updateStoredUser = (nextUser) => {
    if (!nextUser) return;
    setUser(nextUser);
    localStorage.setItem('fitguide_user', JSON.stringify(nextUser));
  };

  const logout = async () => {
    try {
      if (localStorage.getItem('fitguide_token')) await api.post('/auth/logout');
    } catch {
      // The local session is still cleared if the server is temporarily unavailable.
    }
    clearLocalSession();
  };

  const value = useMemo(
    () => ({
      token,
      user,
      authLoading,
      connectionError,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
      updateStoredUser,
      clearLocalSession,
    }),
    [token, user, authLoading, connectionError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
