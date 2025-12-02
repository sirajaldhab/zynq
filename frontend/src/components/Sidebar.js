import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import { DashboardIcon, FinanceIcon, HrIcon, ProjectsIcon, DocumentsIcon, AdminIcon, AnalyticsIcon } from '../icons/AppIcons';
import { useAuth } from '../auth/AuthContext';
const allItems = [
    { to: '/', label: 'Dashboard', icon: DashboardIcon, key: 'dashboard' },
    { to: '/finance', label: 'Finance', icon: FinanceIcon, key: 'finance' },
    { to: '/hr', label: 'HR', icon: HrIcon, key: 'hr' },
    { to: '/projects', label: 'Projects', icon: ProjectsIcon, key: 'projects' },
    { to: '/documents-main', label: 'Documents', icon: DocumentsIcon, key: 'documents' },
    { to: '/admin', label: 'Admin', icon: AdminIcon, key: 'admin' },
    { to: '/analytics', label: 'Analytics', icon: AnalyticsIcon, key: 'analytics' },
];
export default function Sidebar({ variant = 'desktop', onNavigate }) {
    const { role } = useAuth();
    const upperRole = (role || '').trim().toUpperCase();
    const items = allItems
        .filter((it) => {
        switch (upperRole) {
            case 'ADMIN':
            case 'SUPERADMIN':
            case 'GM':
            case 'MANAGER':
            case 'TEAM LEADER':
            case 'OFFICE_DESK':
            case 'RECORDER':
                // Full app navigation except items further filtered out (Admin/Analytics)
                return true;
            case 'HR_MANAGER':
                return ['dashboard', 'hr'].includes(it.key);
            case 'FINANCE_MANAGER':
                return ['dashboard', 'finance'].includes(it.key);
            case 'PROJECT_MANAGER':
                return ['dashboard', 'projects'].includes(it.key);
            case 'ACCOUNTANT':
                // Accountant can see Dashboard, Finance, HR, Projects, and Documents
                return ['dashboard', 'finance', 'hr', 'projects', 'documents'].includes(it.key);
            default:
                // unauthenticated or unknown: keep minimal
                return it.key === 'dashboard';
        }
    })
        .filter((it) => {
        // Only ADMIN and SUPERADMIN see Analytics; Admin visible to ADMIN, SUPERADMIN, and GM
        if (it.key === 'analytics')
            return upperRole === 'ADMIN' || upperRole === 'SUPERADMIN';
        if (it.key === 'admin')
            return upperRole === 'ADMIN' || upperRole === 'SUPERADMIN' || upperRole === 'GM';
        return true;
    });
    const containerClasses = variant === 'desktop'
        ? 'fixed inset-y-0 left-0 w-60 bg-[color:var(--header)] border-r zynq-border p-4 flex flex-col z-40 sm:z-50 shadow-[4px_0_12px_rgba(0,0,0,0.06)] max-h-screen'
        : 'flex flex-col h-full w-72 max-w-[85vw] bg-[color:var(--surface)] border-r zynq-border shadow-soft';
    const itemPadding = variant === 'desktop' ? 'px-3 py-2 text-sm' : 'px-4 py-3 text-base';
    return (_jsxs("aside", { className: containerClasses, children: [_jsx("div", { className: "px-2 py-3 text-lg font-semibold tracking-tight", children: "Zynq" }), _jsx("nav", { className: "flex-1 space-y-1 overflow-y-auto pr-1", children: items.map((it) => {
                const Icon = it.icon;
                return (_jsxs(NavLink, { to: it.to, end: true, onClick: onNavigate, className: ({ isActive }) => `flex items-center gap-3 rounded-xl transition-colors ${itemPadding} ${isActive
                            ? 'bg-[color:var(--surface)] text-[color:var(--text-primary)] border zynq-border'
                            : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--surface)]'}`, children: [_jsx(Icon, { className: "text-lg" }), _jsx("span", { children: it.label })] }, it.to));
            }) })] }));
}
