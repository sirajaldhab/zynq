import { apiFetch } from './client';
// Users
export async function fetchUsers(params) {
    const q = new URLSearchParams();
    q.set('page', String(params.page));
    q.set('pageSize', String(params.pageSize));
    if (params.search)
        q.set('search', params.search);
    if (params.role)
        q.set('role', params.role);
    if (params.status && params.status !== 'All')
        q.set('status', params.status);
    return apiFetch(`/users?${q.toString()}`, { token: params.token, retries: 2 });
}
export async function fetchMe(params) {
    return apiFetch(`/users/me`, { token: params.token, retries: 1 });
}
export async function createUser(body) {
    return apiFetch(`/users`, { method: 'POST', body: JSON.stringify(body), token: body.token, retries: 1 });
}
export async function updateUser(params, body) {
    return apiFetch(`/users/${params.id}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 });
}
export async function deleteUser(params) {
    return apiFetch(`/users/${params.id}`, { method: 'DELETE', token: params.token, retries: 1 });
}
// Roles
export async function fetchRoles(params) {
    return apiFetch(`/roles`, { token: params.token, retries: 2 });
}
export async function createRole(body) {
    return apiFetch(`/roles`, { method: 'POST', body: JSON.stringify(body), token: body.token, retries: 1 });
}
export async function updateRole(params, body) {
    return apiFetch(`/roles/${params.id}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 });
}
export async function deleteRole(params) {
    return apiFetch(`/roles/${params.id}`, { method: 'DELETE', token: params.token, retries: 1 });
}
export function parsePermissions(json) {
    const base = {
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
    if (!json)
        return base;
    try {
        const obj = JSON.parse(json);
        return { ...base, ...obj };
    }
    catch {
        return base;
    }
}
// System Logs
export async function fetchSystemLogs(params) {
    const q = new URLSearchParams();
    q.set('page', String(params.page));
    q.set('pageSize', String(params.pageSize));
    if (params.level)
        q.set('level', params.level);
    return apiFetch(`/system-logs?${q.toString()}`, { token: params.token, retries: 2 });
}
// App Settings
export async function fetchAppSettings(params) {
    return apiFetch(`/settings`, { token: params.token, retries: 2 });
}
export async function updateAppSetting(params, body) {
    return apiFetch(`/settings/${encodeURIComponent(params.key)}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 });
}
