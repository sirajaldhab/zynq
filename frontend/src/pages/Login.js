import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { IonButton, IonContent, IonInput, IonItem, IonLabel, IonPage, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import { useAuth } from '../auth/AuthContext';
export default function Login() {
    const { login, role } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await login(email, password);
        }
        catch (err) {
            setError(err?.message || 'Login failed');
        }
        finally {
            setLoading(false);
        }
    };
    React.useEffect(() => {
        if (!role)
            return;
        let target = '/';
        switch (role) {
            case 'ADMIN':
                target = '/admin';
                break;
            case 'HR_MANAGER':
                target = '/hr';
                break;
            case 'FINANCE_MANAGER':
                target = '/finance';
                break;
            case 'PROJECT_MANAGER':
                target = '/projects';
                break;
            default:
                target = '/';
        }
        window.location.href = target;
    }, [role]);
    return (_jsx(IonPage, { children: _jsx(IonContent, { className: "min-h-screen bg-gradient-to-b from-[color:var(--bg)] via-[color:var(--surface)]/70 to-[color:var(--bg)] flex items-center justify-center p-4 sm:p-6", children: _jsxs("div", { className: "w-full max-w-lg", children: [_jsxs("div", { className: "mb-6 text-center space-y-1", children: [_jsx("div", { className: "text-sm uppercase tracking-[0.3em] text-[color:var(--text-secondary)]", children: "Zynq" }), _jsx("h1", { className: "text-2xl sm:text-3xl font-semibold", children: "Welcome back" }), _jsx("p", { className: "text-sm text-[color:var(--text-secondary)]", children: "Sign in to continue to your workspace" })] }), _jsxs(IonCard, { className: "w-full shadow-xl border zynq-border backdrop-blur-sm", children: [_jsx(IonCardHeader, { children: _jsx(IonCardTitle, { className: "text-lg sm:text-xl", children: "Account access" }) }), _jsx(IonCardContent, { children: _jsxs("form", { onSubmit: onSubmit, className: "space-y-4", children: [_jsxs(IonItem, { lines: "none", className: "rounded-xl border zynq-border", children: [_jsx(IonLabel, { position: "stacked", children: "Email" }), _jsx(IonInput, { id: "login-email", name: "email", value: email, onIonChange: (e) => setEmail(e.detail.value || ''), type: "email", required: true })] }), _jsxs(IonItem, { lines: "none", className: "rounded-xl border zynq-border", children: [_jsx(IonLabel, { position: "stacked", children: "Password" }), _jsx(IonInput, { id: "login-password", name: "password", value: password, onIonChange: (e) => setPassword(e.detail.value || ''), type: "password", required: true })] }), error && _jsx("div", { className: "text-red-600 text-sm", children: error }), _jsx(IonButton, { type: "submit", expand: "block", disabled: loading, className: "h-12 text-base font-semibold", children: loading ? 'Signing in…' : 'Sign in' }), _jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm gap-2 text-[color:var(--text-secondary)]", children: [_jsx("a", { href: "/auth/forgot-password", className: "underline", children: "Forgot password?" }), _jsxs("span", { children: ["Need access? ", _jsx("a", { href: "/auth/signup", className: "underline", children: "Request account" })] })] })] }) })] }), _jsxs("div", { className: "mt-6 text-center text-xs sm:text-sm text-[color:var(--text-secondary)]", children: ["\u00A9 ", new Date().getFullYear(), " Zynq. All rights reserved."] })] }) }) }));
}
