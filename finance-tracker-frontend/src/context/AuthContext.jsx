import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

function loadStoredSession() {
  try {
    const raw = localStorage.getItem('ledger:session');
    return raw ? JSON.parse(raw) : { user: null, token: null };
  } catch {
    return { user: null, token: null };
  }
}

export function AuthProvider({ children }) {
  const stored = loadStoredSession();
  const [user, setUser] = useState(stored.user);
  const [token, setToken] = useState(stored.token);

  const persist = (nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem('ledger:session', JSON.stringify({ user: nextUser, token: nextToken }));
  };

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    persist(data.user, data.token);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await api.register(payload);
    persist(data.user, data.token);
    return data;
  }, []);

  const logout = useCallback(() => {
    persist(null, null);
    localStorage.removeItem('ledger:session');
  }, []);

  const updateUser = useCallback(async (payload) => {
    const data = await api.updateProfile(token, payload);
    persist(data.user, token);
    return data;
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
