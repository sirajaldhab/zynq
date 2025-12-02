import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import MobileTabBar from './MobileTabBar';
export default function Layout({ children }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
    const toggleMobileMenu = useCallback(() => {
        setMobileMenuOpen((prev) => !prev);
    }, []);
    useEffect(() => {
        document.documentElement.classList.add('has-sidebar');
        return () => {
            document.documentElement.classList.remove('has-sidebar');
        };
    }, []);
    return (_jsxs("div", { className: "min-h-screen bg-[color:var(--bg)] text-[color:var(--text-primary)]", children: [_jsx(MobileHeader, { onToggleMenu: toggleMobileMenu }), _jsx(MobileTabBar, {}), _jsxs("div", { className: `lg:hidden fixed inset-0 z-40 transition-all duration-200 ${mobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`, children: [_jsx("div", { className: `absolute inset-0 bg-black/40 transition-opacity duration-200 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`, onClick: closeMobileMenu }), _jsx("div", { className: `absolute inset-y-0 left-0 transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`, children: _jsx(Sidebar, { variant: "mobile", onNavigate: closeMobileMenu }) })] }), _jsx("div", { className: "hidden lg:block", children: _jsx(Sidebar, {}) }), _jsx("main", { className: "min-h-screen flex flex-col", children: children })] }));
}
