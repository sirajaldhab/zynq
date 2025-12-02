import { apiFetch } from './client';
function mapUiStatusToApi(status) {
    if (!status || status === 'All')
        return undefined;
    const s = status.toLowerCase();
    if (s === 'active')
        return 'ACTIVE';
    if (s === 'inactive')
        return 'INACTIVE';
    if (s === 'pending' || s === 'pending approval')
        return 'PENDING_APPROVAL';
    return status;
}
export async function fetchUsers(params) {
    const q = new URLSearchParams();
    if (params.search)
        q.set('search', params.search);
    if (params.role && params.role !== 'All')
        q.set('role', params.role);
    const apiStatus = mapUiStatusToApi(params.status);
    if (apiStatus)
        q.set('status', apiStatus);
    q.set('page', String(params.page));
    q.set('pageSize', String(params.pageSize));
    return apiFetch(`/users?${q.toString()}`, { token: params.token, retries: 2 });
}
export async function fetchRoles(params) {
    // Backend returns a plain array for /roles
    return apiFetch(`/roles`, { token: params.token, retries: 2 });
}
export async function updateUser(id, body, token) {
    return apiFetch(`/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), token, retries: 1 });
}
export async function createUser(body, token) {
    return apiFetch(`/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), token, retries: 1 });
}
export async function deleteUser(id, token) {
    return apiFetch(`/users/${id}`, { method: 'DELETE', token, retries: 1 });
}
export async function fetchPendingUsers(params) {
    const q = new URLSearchParams();
    q.set('page', String(params.page));
    q.set('pageSize', String(params.pageSize));
    return apiFetch(`/users/pending?${q.toString()}`, { token: params.token, retries: 2 });
}
export async function approveUser(id, body, token) {
    return apiFetch(`/users/${id}/approve`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}), token, retries: 1 });
}
export async function rejectUser(id, token) {
    return apiFetch(`/users/${id}/reject`, { method: 'PATCH', token, retries: 1 });
}
