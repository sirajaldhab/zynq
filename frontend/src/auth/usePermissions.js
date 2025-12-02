import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { fetchMe, parsePermissions } from '../api/adminService';
// Helper to resolve a hierarchical permission key like "HR.Employees.Details.View"
// against a flat map of permission objects stored in Role.permissionsJson.
// Resolution strategy (most-specific to least-specific):
//   HR.Employees.Details.View ->
//     1) HR.Employees.Details.view
//     2) HR.Employees.view
//     3) HR.view
function resolvePermission(perms, fullKey) {
    if (!perms)
        return false;
    if (!fullKey)
        return false;
    const parts = fullKey.split('.').filter(Boolean);
    if (parts.length < 2)
        return false;
    const actionRaw = parts[parts.length - 1];
    if (!actionRaw)
        return false;
    const action = actionRaw.toLowerCase();
    const pathParts = parts.slice(0, parts.length - 1);
    for (let i = pathParts.length; i >= 1; i -= 1) {
        const cat = pathParts.slice(0, i).join('.');
        const catPerms = perms[cat];
        if (catPerms && typeof catPerms[action] === 'boolean') {
            return !!catPerms[action];
        }
    }
    return false;
}
export function usePermissions() {
    const { accessToken, role } = useAuth();
    const [loaded, setLoaded] = useState(false);
    const [perms, setPerms] = useState(null);
    useEffect(() => {
        let cancelled = false;
        async function load() {
            if (!accessToken) {
                setPerms(null);
                setLoaded(true);
                return;
            }
            try {
                const me = await fetchMe({ token: accessToken });
                const role = me.role;
                const permissionsJson = role?.permissionsJson;
                const parsed = parsePermissions(permissionsJson);
                if (!cancelled) {
                    setPerms(parsed);
                    setLoaded(true);
                }
            }
            catch {
                if (!cancelled) {
                    setPerms(null);
                    setLoaded(true);
                }
            }
        }
        setLoaded(false);
        load();
        return () => {
            cancelled = true;
        };
    }, [accessToken]);
    const value = useMemo(() => ({
        ready: loaded,
        raw: perms,
        can(key) {
            const r = (role || '').trim().toUpperCase().replace(/\s+/g, '_');
            if (['ADMIN', 'GM', 'MANAGER', 'TEAM_LEADER', 'TEAM LEADER', 'OFFICE_DESK', 'RECORDER'].includes(r))
                return true;
            return resolvePermission(perms, key);
        },
    }), [loaded, perms, role]);
    return value;
}
