import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
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

  function parseClaimsFromToken(token: string | null): { role: string | null; userId: string | null } {
    if (!token) return { role: null, userId: null };
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      return {
        role: payload.role || null,
        userId: payload.sub || null,
      };
    } catch {
      return { role: null, userId: null };
    }
  }

  const logout = useCallback(() => {
    setState({ accessToken: null, refreshToken: null, role: null });
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('token');
    } catch {}
  }, []);

  const claims = parseClaimsFromToken(state.accessToken);
  const effectiveRole = state.role || claims.role;

  const value = useMemo<AuthContextValue>(() => ({
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    role: effectiveRole,
    async login(email: string, password: string) {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      const role = (data && data.role) || parseClaimsFromToken(data.accessToken).role;
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
      const role = parseClaimsFromToken(data.accessToken).role;
      setState({ accessToken: data.accessToken, refreshToken: data.refreshToken, role });
    },
    logout,
  }), [apiBase, logout, state.accessToken, state.refreshToken, effectiveRole]);

  useEffect(() => {
    if (!state.accessToken) return;
    const currentClaims = parseClaimsFromToken(state.accessToken);
    if (!currentClaims.userId) return;
    const socket = io(`${apiBase}/ws/activity`, {
      transports: ['websocket'],
      auth: { token: state.accessToken },
    });

    const handleForceLogout = (payload: { userId?: string; reason?: string }) => {
      if (!payload?.userId || payload.userId !== currentClaims.userId) return;
      try {
        sessionStorage.setItem('forcedLogoutReason', payload.reason || 'Your account has been signed out.');
      } catch {}
      logout();
      window.location.href = '/auth/login?forced=1';
    };

    socket.on('user.forceLogout', handleForceLogout);
    return () => {
      socket.off('user.forceLogout', handleForceLogout);
      socket.disconnect();
    };
  }, [apiBase, logout, state.accessToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
