import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { usePermissions } from './usePermissions';
// Lightweight wrapper that enforces subpage-level permissions on top of
// existing role-based routes. If the current user does not have the required
// permission, they are redirected without altering existing layouts.
export function PermissionRoute({ permission, children }) {
    const { ready, can } = usePermissions();
    if (!ready) {
        return (_jsx("div", { className: "p-8 text-sm zynq-muted", children: "Loading permissions..." }));
    }
    if (!can(permission)) {
        return _jsx(Navigate, { to: "/403", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
