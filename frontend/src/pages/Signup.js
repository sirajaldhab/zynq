import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import { API_BASE } from '../config';
export default function Signup() {
    const apiBase = API_BASE;
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(false);
    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${apiBase}/auth/signup-pending`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });
            if (!res.ok) {
                let msg = 'Signup failed';
                try {
                    const data = await res.json();
                    msg = data?.message || msg;
                }
                catch {
                    const text = await res.text();
                    if (text)
                        msg = text;
                }
                throw new Error(msg);
            }
            setDone(true);
        }
        catch (err) {
            setError(err?.message || 'Signup failed');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs(IonPage, { children: [_jsx(IonHeader, { children: _jsx(IonToolbar, { children: _jsx(IonTitle, { children: "Sign Up \u2014 Zynq" }) }) }), _jsx(IonContent, { className: "bg-[color:var(--bg)]", children: _jsx("div", { className: "min-h-screen flex items-center justify-center p-6", children: _jsxs(IonCard, { className: "w-full max-w-lg shadow-xl border zynq-border", children: [_jsx(IonCardHeader, { children: _jsx(IonCardTitle, { className: "text-xl", children: "Create your account" }) }), _jsx(IonCardContent, { children: done ? (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "text-green-600 font-medium", children: "Account request sent \u2014 waiting for Admin approval." }), _jsx("div", { className: "text-sm text-[color:var(--text-secondary)]", children: "You can close this window. Once approved, you can log in with the same email and password." }), _jsx(IonButton, { expand: "block", onClick: () => (window.location.href = '/auth/login'), children: "Back to Login" })] })) : (_jsxs("form", { onSubmit: onSubmit, className: "space-y-4", children: [_jsxs(IonItem, { children: [_jsx(IonLabel, { position: "stacked", children: "Full Name" }), _jsx(IonInput, { id: "signup-name", name: "name", value: name, onIonChange: (e) => setName(e.detail.value || ''), required: true })] }), _jsxs(IonItem, { children: [_jsx(IonLabel, { position: "stacked", children: "Email ID" }), _jsx(IonInput, { id: "signup-email", name: "email", type: "email", value: email, onIonChange: (e) => setEmail(e.detail.value || ''), required: true })] }), _jsxs(IonItem, { children: [_jsx(IonLabel, { position: "stacked", children: "Password" }), _jsx(IonInput, { id: "signup-password", name: "password", type: "password", value: password, onIonChange: (e) => setPassword(e.detail.value || ''), required: true })] }), error && _jsx("div", { className: "text-red-600 text-sm", children: error }), _jsx(IonButton, { type: "submit", expand: "block", disabled: loading || !name || !email || !password, children: loading ? 'Submitting…' : 'Request Account' }), _jsxs("div", { className: "text-center text-sm text-[color:var(--text-secondary)]", children: ["Already have an account? ", _jsx("a", { href: "/auth/login", className: "underline", children: "Sign in" })] })] })) })] }) }) })] }));
}
