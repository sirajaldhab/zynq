import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { IonPage, IonContent, useIonToast, IonButton } from '@ionic/react';
import Nav from '../../components/Nav';
import { fetchMe } from '../../api/adminService';
export default function ProfileSettings() {
    const [present] = useIonToast();
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    React.useEffect(() => {
        async function loadProfile() {
            try {
                const token = localStorage.getItem('token') || undefined;
                const data = await fetchMe({ token });
                setUser(data);
            }
            catch (error) {
                present({ message: 'Failed to load profile', color: 'danger', duration: 2000, position: 'top' });
            }
            finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [present]);
    const roleName = (user?.role?.name || user?.roleId || '').toUpperCase();
    const canAccessAdmin = roleName === 'ADMIN' || roleName === 'GM';
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsx(IonContent, { className: "bg-[color:var(--bg)] py-8", children: _jsxs("div", { className: "space-y-4 px-4 sm:px-6 lg:px-8", children: [_jsx("div", { className: "text-lg font-semibold", children: "Profile" }), _jsxs("div", { className: "mt-4 grid gap-4 lg:grid-cols-3", children: [_jsxs("div", { className: "rounded-xl border border-white/5 bg-[color:var(--surface)] p-6 flex flex-col items-center text-center", children: [_jsx("div", { className: "w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/30 to-sky-500/30 flex items-center justify-center text-3xl font-semibold text-white uppercase", children: user?.name?.[0] || user?.email?.[0] || '?' }), _jsxs("div", { className: "mt-4", children: [_jsx("div", { className: "text-lg font-semibold", children: user?.name || '—' }), _jsx("div", { className: "text-sm text-zinc-400", children: user?.email || '—' }), _jsx("div", { className: "text-xs mt-1 text-emerald-400 uppercase tracking-wide", children: user?.role?.name || user?.roleId || '—' })] })] }), _jsxs("div", { className: "rounded-xl border border-white/5 bg-[color:var(--surface)] p-6 lg:col-span-2", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-base font-semibold", children: "Account Details" }), _jsx("div", { className: "text-xs text-zinc-400", children: " " })] }), canAccessAdmin && (_jsx(IonButton, { size: "small", className: "text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2", routerLink: "/admin", children: "Open Admin Dashboard" }))] }), loading && _jsx("div", { className: "text-sm text-zinc-400", children: "Loading profile\u2026" }), !loading && (_jsxs("div", { className: "grid gap-4 md:grid-cols-2 text-sm", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs uppercase text-zinc-500", children: "Full name" }), _jsx("div", { className: "text-base", children: user?.name || '—' })] }), _jsxs("div", { children: [_jsx("div", { className: "text-xs uppercase text-zinc-500", children: "Email" }), _jsx("div", { className: "text-base", children: user?.email || '—' })] }), _jsxs("div", { children: [_jsx("div", { className: "text-xs uppercase text-zinc-500", children: "Role" }), _jsx("div", { className: "text-base", children: user?.role?.name || user?.roleId || '—' })] }), _jsxs("div", { children: [_jsx("div", { className: "text-xs uppercase text-zinc-500", children: "Status" }), _jsx("div", { className: "text-base capitalize", children: user?.status?.toLowerCase() || '—' })] }), _jsxs("div", { children: [_jsx("div", { className: "text-xs uppercase text-zinc-500", children: "Phone" }), _jsx("div", { className: "text-base", children: user?.phone || '—' })] }), _jsxs("div", { children: [_jsx("div", { className: "text-xs uppercase text-zinc-500", children: "Created" }), _jsx("div", { className: "text-base", children: user?.createdAt ? new Date(user.createdAt).toLocaleString() : '—' })] })] }))] })] })] }) })] }));
}
