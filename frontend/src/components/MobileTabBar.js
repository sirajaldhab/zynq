import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardIcon, FinanceIcon, HrIcon, ProjectsIcon, DocumentsIcon, ProfileIcon } from '../icons/AppIcons';
const items = [
    { to: '/', label: 'Dashboard', icon: DashboardIcon },
    { to: '/finance', label: 'Finance', icon: FinanceIcon },
    { to: '/hr', label: 'HR', icon: HrIcon },
    { to: '/projects', label: 'Projects', icon: ProjectsIcon },
    { to: '/documents-main', label: 'Documents', icon: DocumentsIcon },
    { to: '/profile', label: 'Profile', icon: ProfileIcon },
];
export default function MobileTabBar() {
    const location = useLocation();
    const navigate = useNavigate();
    return (_jsx("nav", { className: "fixed inset-x-0 bottom-0 z-50 border-t zynq-border bg-[color:var(--surface)] lg:hidden", children: _jsx("div", { className: "flex justify-between", children: items.map((item) => {
                const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
                const Icon = item.icon;
                return (_jsxs("button", { type: "button", onClick: () => navigate(item.to), className: `flex-1 flex flex-col items-center justify-center py-1.5 text-[10px] leading-tight gap-0.5 ${active ? 'text-[color:var(--accent)]' : 'text-[color:var(--text-secondary)]'}`, children: [_jsx(Icon, { className: "text-lg" }), _jsx("span", { children: item.label })] }, item.to));
            }) }) }));
}
