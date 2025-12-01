import { apiFetch } from './client';

export type ManpowerRecordDto = {
  id: string;
  projectId: string;
  vendorId: string;
  site: string;
  main_contractor?: string | null;
  totalLabour: number;
  dailyRate: number;
  total: number;
  date?: string | null;
  createdAt: string;
  notes?: string | null;
  project?: { id: string; name: string; site?: string | null; main_contractor?: string | null };
  vendor?: { id: string; name: string };
};

export async function fetchManpowerRecords(params: { projectId?: string; vendorId?: string; token?: string } = {}) {
  const q = new URLSearchParams();
  if (params.projectId) q.set('projectId', params.projectId);
  if (params.vendorId) q.set('vendorId', params.vendorId);
  const qs = q.toString();
  const url = qs ? `/manpower-records?${qs}` : '/manpower-records';
  return apiFetch<ManpowerRecordDto[]>(url, { token: params.token, retries: 2 });
}

export async function createManpowerRecord(body: { projectId: string; vendorId: string; site: string; main_contractor?: string; totalLabour: number; dailyRate: number; total: number; date?: string; notes?: string; token?: string }) {
  const { token, ...payload } = body as any;
  return apiFetch<ManpowerRecordDto>(`/manpower-records`, {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
    retries: 1,
  } as any);
}

export async function deleteManpowerRecord(params: { id: string; token?: string }) {
  const { id, token } = params;
  return apiFetch<void>(`/manpower-records/${id}`, {
    method: 'DELETE',
    token,
    retries: 1,
  } as any);
}
