import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../config';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  role: string | null;
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
    role: localStorage.getItem('userRole'),
  }));

  useEffect(() => {
    if (state.accessToken) localStorage.setItem('accessToken', state.accessToken);
    else localStorage.removeItem('accessToken');
    // Back-compat: also mirror to 'token' for older code paths
    if (state.accessToken) localStorage.setItem('token', state.accessToken);
    else localStorage.removeItem('token');
    if (state.refreshToken) localStorage.setItem('refreshToken', state.refreshToken);
    else localStorage.removeItem('refreshToken');
    if (state.role) localStorage.setItem('userRole', state.role);
    else localStorage.removeItem('userRole');
  }, [state]);

  const apiBase = API_BASE;

  function parseRoleFromToken(token: string | null): string | null {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      return payload.role || null;
    } catch {
      return null;
    }
  }

  const value = useMemo<AuthContextValue>(() => ({
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    role: state.role || parseRoleFromToken(state.accessToken),
    async login(email: string, password: string) {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      const role = (data && data.role) || parseRoleFromToken(data.accessToken);
      setState({ accessToken: data.accessToken, refreshToken: data.refreshToken, role });
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
      const role = parseRoleFromToken(data.accessToken);
      setState({ accessToken: data.accessToken, refreshToken: data.refreshToken, role });
    },
    logout() {
      setState({ accessToken: null, refreshToken: null, role: null });
      try {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('token');
      } catch {}
    },
  }), [apiBase, state.accessToken, state.refreshToken, state.role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
