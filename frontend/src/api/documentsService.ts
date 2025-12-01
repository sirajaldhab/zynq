import { apiFetch, ApiResult } from './client';

export type DocumentCompanyDto = {
  id: string;
  name: string;
  createdById?: string | null;
  createdByName?: string | null;
  createdAt: string;
};

export async function fetchDocumentCompanies(params: { page?: number; pageSize?: number; token?: string }) {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  const token = params.token;
  return apiFetch<ApiResult<DocumentCompanyDto[]>>(`/document-companies?${q.toString()}`, { token });
}

export async function createDocumentCompany(body: { name: string; token?: string }) {
  const { token, ...payload } = body as any;
  return apiFetch<DocumentCompanyDto>(`/document-companies`, {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  } as any);
}

export async function updateDocumentCompany(params: { id: string; token?: string }, body: { name: string }) {
  return apiFetch<DocumentCompanyDto>(`/document-companies/${params.id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
    token: params.token,
  } as any);
}

export async function deleteDocumentCompany(params: { id: string; token?: string }) {
  return apiFetch<{ success: boolean }>(`/document-companies/${params.id}`, {
    method: 'DELETE',
    token: params.token,
  } as any);
}

export type CompanyDocumentMeta = {
  type: string;
  fileName: string;
};

function getBaseUrl() {
  const envBase =
    (import.meta as any).env?.VITE_API_BASE_URL ||
    (import.meta as any).env?.VITE_BACKEND_URL ||
    'http://localhost:8443';
  return envBase;
}

function authHeaders() {
  const h = new Headers();
  try {
    const token = window.localStorage.getItem('accessToken') || window.localStorage.getItem('token');
    if (token) h.set('Authorization', `Bearer ${token}`);
  } catch {}
  return h;
}

export async function fetchCompanyDocuments(companyId: string): Promise<CompanyDocumentMeta[]> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/document-companies/${companyId}/documents`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load company documents');
  return (await res.json()) as CompanyDocumentMeta[];
}

export async function uploadCompanyDocument(
  companyId: string,
  type: string,
  file: File,
): Promise<CompanyDocumentMeta> {
  const base = getBaseUrl();
  const form = new FormData();
  form.append('type', type);
  form.append('file', file);
  const res = await fetch(`${base}/document-companies/${companyId}/documents`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  } as any);
  if (!res.ok) throw new Error('Upload failed');
  return (await res.json()) as CompanyDocumentMeta;
}

export async function deleteCompanyDocument(companyId: string, type: string): Promise<void> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/document-companies/${companyId}/documents/${type}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Delete failed');
}

export function getCompanyDocumentDownloadUrl(companyId: string, type: string): string {
  const base = getBaseUrl();
  return `${base}/document-companies/${companyId}/documents/${type}`;
}
