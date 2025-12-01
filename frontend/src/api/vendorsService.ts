import { apiFetch } from './client';

export type VendorDto = {
  id: string;
  name: string;
  contact?: string;
};

export async function fetchVendors(params: { token?: string } = {}) {
  return apiFetch<VendorDto[]>(`/vendors`, { token: params.token, retries: 2 });
}

export async function createVendor(body: { name: string; contact?: string; token?: string }) {
  const { token, ...payload } = body as any;
  return apiFetch<VendorDto>(`/vendors`, {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
    retries: 1,
  } as any);
}

export async function updateVendor(params: { id: string; token?: string }, body: Partial<{ name: string; contact?: string }>) {
  return apiFetch<VendorDto>(`/vendors/${params.id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
    token: params.token,
    retries: 1,
  } as any);
}

export async function deleteVendor(params: { id: string; token?: string }) {
  return apiFetch<any>(`/vendors/${params.id}`, {
    method: 'DELETE',
    token: params.token,
    retries: 1,
  } as any);
}
