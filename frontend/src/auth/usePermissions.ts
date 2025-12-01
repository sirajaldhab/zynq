import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { fetchMe, parsePermissions, PermissionsShape, PermissionAction } from '../api/adminService';

interface UsePermissionsResult {
  ready: boolean;
  can: (key: string) => boolean;
  raw: PermissionsShape | null;
}

// Helper to resolve a hierarchical permission key like "HR.Employees.Details.View"
// against a flat map of permission objects stored in Role.permissionsJson.
// Resolution strategy (most-specific to least-specific):
//   HR.Employees.Details.View ->
//     1) HR.Employees.Details.view
//     2) HR.Employees.view
//     3) HR.view
function resolvePermission(perms: PermissionsShape | null, fullKey: string): boolean {
  if (!perms) return false;
  if (!fullKey) return false;
  const parts = fullKey.split('.').filter(Boolean);
  if (parts.length < 2) return false;

  const actionRaw = parts[parts.length - 1];
  if (!actionRaw) return false;
  const action = actionRaw.toLowerCase() as PermissionAction;
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

export function usePermissions(): UsePermissionsResult {
  const { accessToken, role } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [perms, setPerms] = useState<PermissionsShape | null>(null);

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
        const role = (me as any).role;
        const permissionsJson: string | undefined = role?.permissionsJson;
        const parsed = parsePermissions(permissionsJson);
        if (!cancelled) {
          setPerms(parsed);
          setLoaded(true);
        }
      } catch {
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

  const value = useMemo<UsePermissionsResult>(() => ({
    ready: loaded,
    raw: perms,
    can(key: string) {
      const r = (role || '').trim().toUpperCase().replace(/\s+/g, '_');
      if (['ADMIN', 'GM', 'MANAGER', 'TEAM_LEADER', 'TEAM LEADER', 'OFFICE_DESK', 'RECORDER'].includes(r)) return true;
      return resolvePermission(perms, key);
    },
  }), [loaded, perms, role]);

  return value;
}
