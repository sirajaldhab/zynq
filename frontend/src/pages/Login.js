import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useAuth } from '../auth/AuthContext';
export default function Login() {
    const { login } = useAuth();
    const [email, setEmail] = useState('admin@zynq.app');
    const [password, setPassword] = useState('ChangeMe!1234');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await login(email, password);
            window.location.href = '/';
        }
        catch (err) {
            setError(err?.message || 'Login failed');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs(IonPage, { children: [_jsx(IonHeader, { children: _jsx(IonToolbar, { children: _jsx(IonTitle, { children: "Login \u2014 Zynq" }) }) }), _jsx(IonContent, { className: "p-6 max-w-md mx-auto", children: _jsxs("form", { onSubmit: onSubmit, className: "space-y-4", children: [_jsxs(IonItem, { children: [_jsx(IonLabel, { position: "stacked", children: "Email" }), _jsx(IonInput, { value: email, onIonChange: (e) => setEmail(e.detail.value || ''), type: "email", required: true })] }), _jsxs(IonItem, { children: [_jsx(IonLabel, { position: "stacked", children: "Password" }), _jsx(IonInput, { value: password, onIonChange: (e) => setPassword(e.detail.value || ''), type: "password", required: true })] }), error && _jsx("div", { className: "text-red-600 text-sm", children: error }), _jsx(IonButton, { type: "submit", expand: "block", disabled: loading, children: loading ? 'Signing in…' : 'Sign in' })] }) })] }));
}
