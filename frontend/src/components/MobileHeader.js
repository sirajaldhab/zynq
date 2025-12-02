import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton } from '@ionic/react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import InstallPwaButton from './InstallPwaButton';
export default function MobileHeader({ onToggleMenu }) {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const onLogout = () => {
        logout();
        window.location.href = '/auth/login';
    };
    return (_jsx(IonHeader, { className: "lg:hidden fixed inset-x-0 top-0 z-50", children: _jsxs(IonToolbar, { className: "border-b zynq-border shadow-soft bg-[color:var(--header)] text-[color:var(--text-primary)] flex items-center justify-between", children: [_jsx(IonTitle, { children: _jsx("button", { type: "button", className: "text-base font-semibold tracking-tight", onClick: () => navigate('/'), children: "Zynq" }) }), _jsxs(IonButtons, { slot: "end", children: [_jsx(InstallPwaButton, {}), _jsx(ThemeToggle, {}), _jsx(IonButton, { onClick: onLogout, children: "Logout" })] })] }) }));
}
