import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Projects from '../pages/Projects';
import Finance from '../pages/Finance';
import HR from '../pages/HR';
import Admin from '../pages/Admin';
export default function App() {
    return (_jsx(AuthProvider, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/*", element: _jsx(ProtectedRoute, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "/projects", element: _jsx(Projects, {}) }), _jsx(Route, { path: "/finance", element: _jsx(Finance, {}) }), _jsx(Route, { path: "/hr", element: _jsx(HR, {}) }), _jsx(Route, { path: "/admin", element: _jsx(Admin, {}) })] }) }) })] }) }));
}
