import { apiFetch, ApiResult } from './client';

export type MaterialDto = {
  id: string;
  projectId: string;
  invoice_date?: string;
  vendorId?: string;
  vendor?: { id: string; name: string };
  item_description: string;
  quantity: number;
  unit_price?: number;
  total: number;
  attachments?: any;
};

export async function fetchMaterials(params: { projectId?: string; token?: string }) {
  const q = new URLSearchParams();
  if (params.projectId) q.set('projectId', params.projectId);
  return apiFetch<MaterialDto[] | ApiResult<MaterialDto[]>>(`/materials?${q.toString()}`, { token: params.token, retries: 2 }) as any;
}

export async function createMaterial(body: { projectId: string; invoice_date?: string; vendorId?: string; item_description: string; quantity: number; unit_price?: number; vat?: number; total: number; attachments?: any; token?: string }) {
  return apiFetch<MaterialDto>(`/materials`, { method: 'POST', body: JSON.stringify(body), token: body.token, retries: 1 } as any);
}

export async function updateMaterial(params: { id: string; token?: string }, body: Partial<{ invoice_date?: string; vendorId?: string; item_description?: string; quantity?: number; unit_price?: number; vat?: number; total?: number; attachments?: any }>) {
  return apiFetch<MaterialDto>(`/materials/${params.id}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 } as any);
}

export async function deleteMaterial(params: { id: string; token?: string }) {
  return apiFetch<any>(`/materials/${params.id}`, { method: 'DELETE', token: params.token, retries: 1 } as any);
}
