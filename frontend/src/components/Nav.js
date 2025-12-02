import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IonHeader, IonToolbar, IonButtons, IonTitle, IonButton } from '@ionic/react';
import ThemeToggle from './ThemeToggle';
import InstallPwaButton from './InstallPwaButton';
import { useAuth } from '../auth/AuthContext';
export default function Nav() {
    const { logout } = useAuth();
    const onLogout = () => {
        logout();
        window.location.href = '/auth/login';
    };
    return (_jsx(IonHeader, { className: "hidden lg:block", children: _jsxs(IonToolbar, { className: "border-b zynq-border shadow-soft bg-[color:var(--header)] text-[color:var(--text-primary)]", children: [_jsx(IonTitle, { className: "font-semibold", children: "Zynq" }), _jsxs(IonButtons, { slot: "end", children: [_jsx(InstallPwaButton, {}), _jsx(ThemeToggle, {}), _jsx(IonButton, { onClick: onLogout, children: "Logout" })] })] }) }));
}
