import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../config';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(() => ({
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
  }));

  useEffect(() => {
    if (state.accessToken) localStorage.setItem('accessToken', state.accessToken);
    else localStorage.removeItem('accessToken');
    if (state.refreshToken) localStorage.setItem('refreshToken', state.refreshToken);
    else localStorage.removeItem('refreshToken');
  }, [state]);

  const apiBase = API_BASE;

  const value = useMemo<AuthContextValue>(() => ({
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    async login(email: string, password: string) {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      setState({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    },
    async refresh() {
      if (!state.refreshToken) throw new Error('No refresh token');
      const res = await fetch(`${apiBase}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: state.refreshToken }),
      });
      if (!res.ok) throw new Error('Refresh failed');
      const data = await res.json();
      setState({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    },
    logout() {
      setState({ accessToken: null, refreshToken: null });
    },
  }), [apiBase, state.accessToken, state.refreshToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
