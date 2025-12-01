import { apiFetch, ApiResult } from './client';

export type UserDto = {
  id: string;
  name: string;
  email: string;
  role: any;
  status: string;
  createdAt?: string;
};
export type RoleDto = { id: string; name: string; permissions?: number };

function mapUiStatusToApi(status?: string): string | undefined {
  if (!status || status === 'All') return undefined;
  const s = status.toLowerCase();
  if (s === 'active') return 'ACTIVE';
  if (s === 'inactive') return 'INACTIVE';
  if (s === 'pending' || s === 'pending approval') return 'PENDING_APPROVAL';
  return status;
}

export async function fetchUsers(params: { search?: string; role?: string; status?: string; page: number; pageSize: number; token?: string; }) {
  const q = new URLSearchParams();
  if (params.search) q.set('search', params.search);
  if (params.role && params.role !== 'All') q.set('role', params.role);
  const apiStatus = mapUiStatusToApi(params.status);
  if (apiStatus) q.set('status', apiStatus);
  q.set('page', String(params.page));
  q.set('pageSize', String(params.pageSize));
  return apiFetch<ApiResult<UserDto[]>>(`/users?${q.toString()}`, { token: params.token, retries: 2 });
}

export async function fetchRoles(params: { page: number; pageSize: number; token?: string }) {
  // Backend returns a plain array for /roles
  return apiFetch<RoleDto[]>(`/roles`, { token: params.token, retries: 2 });
}

export async function updateUser(id: string, body: Partial<UserDto> & { password?: string }, token?: string) {
  return apiFetch<UserDto>(`/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), token, retries: 1 });
}

export async function createUser(body: { email: string; name: string; roleId: string; password?: string; status?: string }, token?: string) {
  return apiFetch<UserDto>(`/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), token, retries: 1 });
}

export async function deleteUser(id: string, token?: string) {
  return apiFetch<void>(`/users/${id}`, { method: 'DELETE', token, retries: 1 });
}

export async function fetchPendingUsers(params: { page: number; pageSize: number; token?: string }) {
  const q = new URLSearchParams();
  q.set('page', String(params.page));
  q.set('pageSize', String(params.pageSize));
  return apiFetch<ApiResult<UserDto[]>>(`/users/pending?${q.toString()}`, { token: params.token, retries: 2 });
}

export async function approveUser(id: string, body: { roleId?: string }, token?: string) {
  return apiFetch<UserDto>(`/users/${id}/approve`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}), token, retries: 1 });
}

export async function rejectUser(id: string, token?: string) {
  return apiFetch<UserDto>(`/users/${id}/reject`, { method: 'PATCH', token, retries: 1 });
}
