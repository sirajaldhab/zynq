import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
export default function RoleRoute({ allow }) {
    const { accessToken, role } = useAuth();
    const location = useLocation();
    if (!accessToken) {
        return _jsx(Navigate, { to: "/auth/login", state: { from: location }, replace: true });
    }
    const normalizedRole = (role || '').trim().toUpperCase().replace(/\s+/g, '_');
    const normalizedAllow = allow.map((r) => r.trim().toUpperCase().replace(/\s+/g, '_'));
    if (!role || (normalizedAllow.length > 0 && !normalizedAllow.includes(normalizedRole))) {
        return _jsx(Navigate, { to: "/403", replace: true });
    }
    return _jsx(Outlet, {});
}
