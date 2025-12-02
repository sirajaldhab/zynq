import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { IonButton, IonContent, IonInput, IonItem, IonLabel, IonPage, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import { API_BASE } from '../config';
export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const onSubmit = async (e) => {
        e.preventDefault();
        if (!email)
            return;
        setLoading(true);
        setMessage(null);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (!res.ok)
                throw new Error('Request failed');
            setMessage('If an account exists for that email, you will receive reset instructions shortly.');
        }
        catch (err) {
            setError(err?.message || 'Unable to send reset email. Please try again later.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx(IonPage, { children: _jsx(IonContent, { className: "min-h-screen bg-gradient-to-b from-[color:var(--bg)] via-[color:var(--surface)]/70 to-[color:var(--bg)] flex items-center justify-center p-4 sm:p-6", children: _jsxs("div", { className: "w-full max-w-lg", children: [_jsxs("div", { className: "mb-6 text-center space-y-1", children: [_jsx("div", { className: "text-sm uppercase tracking-[0.3em] text-[color:var(--text-secondary)]", children: "Zynq" }), _jsx("h1", { className: "text-2xl sm:text-3xl font-semibold", children: "Reset password" }), _jsx("p", { className: "text-sm text-[color:var(--text-secondary)]", children: "Enter the email linked to your account" })] }), _jsxs(IonCard, { className: "w-full shadow-xl border zynq-border backdrop-blur-sm", children: [_jsx(IonCardHeader, { children: _jsx(IonCardTitle, { className: "text-lg sm:text-xl", children: "Forgot password" }) }), _jsx(IonCardContent, { children: _jsxs("form", { onSubmit: onSubmit, className: "space-y-4", children: [_jsxs(IonItem, { lines: "none", className: "rounded-xl border zynq-border", children: [_jsx(IonLabel, { position: "stacked", children: "Email" }), _jsx(IonInput, { id: "forgot-email", name: "email", type: "email", required: true, value: email, onIonChange: (e) => setEmail(e.detail.value || '') })] }), message && _jsx("div", { className: "text-emerald-600 text-sm", children: message }), error && _jsx("div", { className: "text-red-600 text-sm", children: error }), _jsx(IonButton, { type: "submit", expand: "block", disabled: loading, className: "h-12 text-base font-semibold", children: loading ? 'Sending…' : 'Send reset link' }), _jsx("div", { className: "text-center text-xs sm:text-sm text-[color:var(--text-secondary)]", children: _jsx("a", { href: "/auth/login", className: "underline", children: "Back to sign in" }) })] }) })] }), _jsx("div", { className: "mt-6 text-center text-xs sm:text-sm text-[color:var(--text-secondary)]", children: "Need help? Contact your administrator for manual reset." })] }) }) }));
}
