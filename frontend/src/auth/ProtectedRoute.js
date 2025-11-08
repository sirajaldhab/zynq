import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
export const ProtectedRoute = ({ children }) => {
    const { accessToken } = useAuth();
    if (!accessToken)
        return _jsx(Navigate, { to: "/login", replace: true });
    return _jsx(_Fragment, { children: children });
};
