import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [state, setState] = useState(() => ({
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken'),
    }));
    useEffect(() => {
        if (state.accessToken)
            localStorage.setItem('accessToken', state.accessToken);
        else
            localStorage.removeItem('accessToken');
        if (state.refreshToken)
            localStorage.setItem('refreshToken', state.refreshToken);
        else
            localStorage.removeItem('refreshToken');
    }, [state]);
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8443';
    const value = useMemo(() => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        async login(email, password) {
            const res = await fetch(`${apiBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (!res.ok)
                throw new Error('Login failed');
            const data = await res.json();
            setState({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        },
        async refresh() {
            if (!state.refreshToken)
                throw new Error('No refresh token');
            const res = await fetch(`${apiBase}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: state.refreshToken }),
            });
            if (!res.ok)
                throw new Error('Refresh failed');
            const data = await res.json();
            setState({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        },
        logout() {
            setState({ accessToken: null, refreshToken: null });
        },
    }), [apiBase, state.accessToken, state.refreshToken]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
};
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
