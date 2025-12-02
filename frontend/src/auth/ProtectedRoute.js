import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
export const ProtectedRoute = () => {
    const { accessToken } = useAuth();
    if (!accessToken)
        return _jsx(Navigate, { to: "/auth/login", replace: true });
    return _jsx(Outlet, {});
};
