import { PrismaClient } from '@prisma/client';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'manage';
export type PermissionsShape = Record<string, Record<PermissionAction, boolean>>;

// Backend mirror of frontend adminService.parsePermissions
export function parsePermissions(json?: string): PermissionsShape {
  const base: PermissionsShape = {
    Dashboard: { view: false, create: false, edit: false, delete: false, manage: false },
    Finance: { view: false, create: false, edit: false, delete: false, manage: false },
    HR: { view: false, create: false, edit: false, delete: false, manage: false },
    Projects: { view: false, create: false, edit: false, delete: false, manage: false },
    Admin: { view: false, create: false, edit: false, delete: false, manage: false },
    Analytics: { view: false, create: false, edit: false, delete: false, manage: false },

    'HR.Employees': { view: false, create: false, edit: false, delete: false, manage: false },
    'HR.Employees.Details': { view: false, create: false, edit: false, delete: false, manage: false },
    'HR.Attendance': { view: false, create: false, edit: false, delete: false, manage: false },
    'HR.Attendance.Entry': { view: false, create: false, edit: false, delete: false, manage: false },
    'HR.Attendance.Records': { view: false, create: false, edit: false, delete: false, manage: false },
    'HR.Attendance.ManpowerSupplier': { view: false, create: false, edit: false, delete: false, manage: false },
    'HR.Payroll': { view: false, create: false, edit: false, delete: false, manage: false },
    'HR.Payroll.Details': { view: false, create: false, edit: false, delete: false, manage: false },
  };
  if (!json) return base;
  try {
    const obj = JSON.parse(json);
    return { ...base, ...obj };
  } catch {
    return base;
  }
}

// Backend mirror of frontend resolvePermission
export function resolvePermission(perms: PermissionsShape | null, fullKey: string): boolean {
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

const prisma = new PrismaClient();

export async function hasPermissionForUser(userId: string, key: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
  if (!user || !user.role) return false;
  const roleName = (user.role.name || '').toUpperCase();
  if (roleName === 'ADMIN' || roleName === 'GM' || roleName === 'MANAGER' || roleName === 'TEAM LEADER') return true;
  const permissionsJson = user.role.permissionsJson || '{}';
  const perms = parsePermissions(permissionsJson);
  return resolvePermission(perms, key);
}
