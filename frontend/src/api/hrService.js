import { apiFetch } from './client';
export async function fetchAttendance(params) {
    const q = new URLSearchParams();
    if (params.search)
        q.set('search', params.search);
    if (params.status && params.status !== 'All')
        q.set('status', params.status);
    if (params.project && params.project !== 'All')
        q.set('project', params.project);
    if (params.employeeId)
        q.set('employeeId', params.employeeId);
    if (params.start)
        q.set('start', params.start);
    if (params.end)
        q.set('end', params.end);
    q.set('page', String(params.page));
    q.set('pageSize', String(params.pageSize));
    return apiFetch(`/attendance?${q.toString()}`, { token: params.token, retries: 2 });
}
export async function createAttendance(body) {
    const { token, ...payload } = body;
    return apiFetch(`/attendance`, {
        method: 'POST',
        body: JSON.stringify(payload),
        token,
        retries: 1,
    });
}
export async function updateAttendance(params, body) {
    return apiFetch(`/attendance/${params.id}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 });
}
export async function deleteAttendance(params) {
    return apiFetch(`/attendance/${params.id}`, { method: 'DELETE', token: params.token, retries: 1 });
}
export async function fetchRoster(params) {
    const q = new URLSearchParams();
    if (params.search)
        q.set('search', params.search);
    if (params.shift && params.shift !== 'All')
        q.set('shift', params.shift);
    q.set('page', String(params.page));
    q.set('pageSize', String(params.pageSize));
    return apiFetch(`/roster?${q.toString()}`, { token: params.token, retries: 2 });
}
// Employees CRUD
export async function fetchEmployees(params) {
    const q = new URLSearchParams();
    q.set('page', String(params.page));
    q.set('pageSize', String(params.pageSize));
    if (params.search)
        q.set('search', params.search);
    return apiFetch(`/employees?${q.toString()}`, { token: params.token, retries: 2 });
}
export async function createEmployee(body) {
    const { token, ...payload } = body;
    return apiFetch(`/employees`, { method: 'POST', body: JSON.stringify(payload), token, retries: 1 });
}
export async function createEmployeeWithUser(body) {
    return apiFetch(`/employees/with-user`, { method: 'POST', body: JSON.stringify(body), token: body.token, retries: 1 });
}
export async function updateEmployee(params, body) {
    return apiFetch(`/employees/${params.id}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 });
}
export async function deleteEmployee(params) {
    return apiFetch(`/employees/${params.id}`, { method: 'DELETE', token: params.token, retries: 1 });
}
// Leaves CRUD
export async function fetchLeaves(params) {
    const q = new URLSearchParams();
    q.set('page', String(params.page));
    q.set('pageSize', String(params.pageSize));
    if (params.status && params.status !== 'All')
        q.set('status', params.status);
    if (params.employeeId)
        q.set('employeeId', params.employeeId);
    if (params.start)
        q.set('start', params.start);
    if (params.end)
        q.set('end', params.end);
    return apiFetch(`/leaves?${q.toString()}`, { token: params.token, retries: 2 });
}
export async function createLeave(body) {
    return apiFetch(`/leaves`, { method: 'POST', body: JSON.stringify(body), token: body.token, retries: 1 });
}
export async function updateLeave(params, body) {
    return apiFetch(`/leaves/${params.id}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 });
}
export async function deleteLeave(params) {
    return apiFetch(`/leaves/${params.id}`, { method: 'DELETE', token: params.token, retries: 1 });
}
// Payroll CRUD
export async function fetchPayrolls(params) {
    const q = new URLSearchParams();
    q.set('page', String(params.page));
    q.set('pageSize', String(params.pageSize));
    if (params.month)
        q.set('month', params.month);
    if (params.employeeId)
        q.set('employeeId', params.employeeId);
    return apiFetch(`/payroll?${q.toString()}`, { token: params.token, retries: 2 });
}
export async function createPayroll(body) {
    return apiFetch(`/payroll`, { method: 'POST', body: JSON.stringify(body), token: body.token, retries: 1 });
}
export async function updatePayroll(params, body) {
    return apiFetch(`/payroll/${params.id}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 });
}
export async function deletePayroll(params) {
    return apiFetch(`/payroll/${params.id}`, { method: 'DELETE', token: params.token, retries: 1 });
}
// Manpower Suppliers
export async function fetchManpowerSuppliers(params) {
    const q = new URLSearchParams();
    q.set('page', String(params.page));
    q.set('pageSize', String(params.pageSize));
    if (params.search)
        q.set('search', params.search);
    return apiFetch(`/manpower-suppliers?${q.toString()}`, { token: params.token, retries: 2 });
}
export async function createManpowerSupplier(body) {
    const { token, ...payload } = body;
    return apiFetch(`/manpower-suppliers`, { method: 'POST', body: JSON.stringify(payload), token, retries: 1 });
}
