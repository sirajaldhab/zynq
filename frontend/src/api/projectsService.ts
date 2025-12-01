import { apiFetch, ApiResult } from './client';

export type ProjectDto = {
  id: string;
  name: string;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
  main_contractor?: string | null;
  consultant?: string | null;
  project_manager_id?: string | null;
  clientId?: string | null;
  site?: string | null;
  parentId?: string | null;
  client?: { id: string; name: string } | null;
  companyId?: string | null;
  company?: { id: string; name: string } | null;
};

export async function fetchProjects(params: { page: number; pageSize: number; search?: string; contractor?: string; manager?: string; client?: string; site?: string; type?: 'MAIN' | 'SUB'; companyId?: string; token?: string }) {
  const q = new URLSearchParams();
  q.set('page', String(params.page));
  q.set('pageSize', String(params.pageSize));
  if (params.search) q.set('search', params.search);
  if (params.contractor) q.set('contractor', params.contractor);
  if (params.manager) q.set('manager', params.manager);
  if (params.client) q.set('client', params.client);
  if (params.site) q.set('site', params.site);
  if (params.type) q.set('type', params.type);
  if (params.companyId) q.set('companyId', params.companyId);
  return apiFetch<ApiResult<ProjectDto[]>>(`/projects?${q.toString()}`, { token: params.token, retries: 2 });
}

export async function createProject(body: { companyId?: string; name: string; main_contractor?: string; consultant?: string; project_manager_id?: string; plots_json?: any; start_date?: string; end_date?: string; status?: string; parentId?: string; clientId?: string; clientName?: string; site?: string; token?: string }) {
  return apiFetch<ProjectDto>(`/projects`, { method: 'POST', body: JSON.stringify(body), token: body.token, retries: 1 } as any);
}

export async function updateProject(params: { id: string; token?: string }, body: Partial<{ name: string; main_contractor?: string; consultant?: string; project_manager_id?: string; plots_json?: any; start_date?: string; end_date?: string; status?: string; parentId?: string | null; clientId?: string | null; site?: string | null }>) {
  return apiFetch<ProjectDto>(`/projects/${params.id}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 } as any);
}

export async function deleteProject(params: { id: string; token?: string }) {
  return apiFetch<any>(`/projects/${params.id}`, { method: 'DELETE', token: params.token, retries: 1 } as any);
}
