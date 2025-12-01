import { apiFetch, ApiResult } from './client';

export type UserDto = { id: string; email: string; name: string; status: string; roleId: string; createdAt?: string; role?: { name: string } };
export type RoleDto = { id: string; name: string; description?: string | null; status?: string; permissionsJson?: string };
export type SystemLogDto = { id: string; level: string; message: string; context_json?: string; created_at: string };
export type AppSettingDto = { key: string; value: string };

// Users
export async function fetchUsers(params: { page: number; pageSize: number; search?: string; role?: string; status?: string; token?: string }) {
  const q = new URLSearchParams();
  q.set('page', String(params.page));
  q.set('pageSize', String(params.pageSize));
  if (params.search) q.set('search', params.search);
  if (params.role) q.set('role', params.role);
  if (params.status && params.status !== 'All') q.set('status', params.status);
  return apiFetch<ApiResult<UserDto[]>>(`/users?${q.toString()}`, { token: params.token, retries: 2 });
}
export async function fetchMe(params: { token?: string }) {
  return apiFetch<UserDto>(`/users/me`, { token: params.token, retries: 1 } as any);
}
export async function createUser(body: { email: string; name: string; password?: string; roleId: string; status?: string; token?: string }) {
  return apiFetch<UserDto>(`/users`, { method: 'POST', body: JSON.stringify(body), token: body.token, retries: 1 } as any);
}
export async function updateUser(params: { id: string; token?: string }, body: Partial<{ email: string; name: string; roleId: string; status: string }>) {
  return apiFetch<UserDto>(`/users/${params.id}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 } as any);
}
export async function deleteUser(params: { id: string; token?: string }) {
  return apiFetch<any>(`/users/${params.id}`, { method: 'DELETE', token: params.token, retries: 1 } as any);
}

// Roles
export async function fetchRoles(params: { token?: string }) {
  return apiFetch<RoleDto[]>(`/roles`, { token: params.token, retries: 2 });
}
export async function createRole(body: { name: string; description?: string; status?: string; baseRoleName?: string; permissionsJson?: string; token?: string }) {
  return apiFetch<RoleDto>(`/roles`, { method: 'POST', body: JSON.stringify(body), token: body.token, retries: 1 } as any);
}
export async function updateRole(params: { id: string; token?: string }, body: Partial<{ name: string; description: string; status: string; permissionsJson: string }>) {
  return apiFetch<RoleDto>(`/roles/${params.id}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 } as any);
}
export async function deleteRole(params: { id: string; token?: string }) {
  return apiFetch<any>(`/roles/${params.id}`, { method: 'DELETE', token: params.token, retries: 1 } as any);
}

export type PermissionCategory = 'Dashboard' | 'Finance' | 'HR' | 'Projects' | 'Admin' | 'Analytics';
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'manage';
// NOTE: We keep the original PermissionCategory union for top-level modules, but
// allow arbitrary string keys (e.g. "HR.Employees", "HR.Attendance.Records")
// so that subpage-level permissions can be stored in the same JSON structure.
export type PermissionsShape = Record<string, Record<PermissionAction, boolean>>;

export function parsePermissions(json?: string): PermissionsShape {
  const base: PermissionsShape = {
    Dashboard: { view: false, create: false, edit: false, delete: false, manage: false },
    Finance: { view: false, create: false, edit: false, delete: false, manage: false },
    HR: { view: false, create: false, edit: false, delete: false, manage: false },
    Projects: { view: false, create: false, edit: false, delete: false, manage: false },
    Admin: { view: false, create: false, edit: false, delete: false, manage: false },
    Analytics: { view: false, create: false, edit: false, delete: false, manage: false },

    // HR subpages: these keys are optional, but seeding them here ensures they
    // appear in the Manage Permissions modal in a consistent order without
    // changing layout or styling.
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

// System Logs
export async function fetchSystemLogs(params: { page: number; pageSize: number; level?: string; token?: string }) {
  const q = new URLSearchParams();
  q.set('page', String(params.page));
  q.set('pageSize', String(params.pageSize));
  if (params.level) q.set('level', params.level);
  return apiFetch<ApiResult<SystemLogDto[]>>(`/system-logs?${q.toString()}`, { token: params.token, retries: 2 });
}

// App Settings
export async function fetchAppSettings(params: { token?: string }) {
  return apiFetch<AppSettingDto[]>(`/settings`, { token: params.token, retries: 2 });
}
export async function updateAppSetting(params: { key: string; token?: string }, body: { value: string }) {
  return apiFetch<AppSettingDto>(`/settings/${encodeURIComponent(params.key)}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 } as any);
}
