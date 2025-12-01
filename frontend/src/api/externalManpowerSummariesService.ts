import { apiFetch } from './client';

export type ExternalManpowerSummaryDto = {
  id: string;
  vendorId: string;
  month: string;
  totalLabour: number;
  total: number;
  pBalance: number;
  paid: number;
  netTotal: number;
};

export async function fetchExternalManpowerSummaries(params: { token?: string } = {}) {
  return apiFetch<ExternalManpowerSummaryDto[]>(`/external-manpower-summaries`, {
    token: params.token,
    retries: 2,
  } as any);
}

export async function updateExternalManpowerPaid(params: { id: string; paid: number; token?: string }) {
  return apiFetch<ExternalManpowerSummaryDto>(`/external-manpower-summaries/${params.id}/paid`, {
    method: 'PUT',
    body: JSON.stringify({ paid: params.paid }),
    token: params.token,
    retries: 1,
  } as any);
}

export async function upsertExternalManpowerPaid(params: {
  vendorId: string;
  month: string; // ISO date string
  paid: number;
  token?: string;
}) {
  return apiFetch<ExternalManpowerSummaryDto>(`/external-manpower-summaries/upsert-and-set-paid`, {
    method: 'POST',
    body: JSON.stringify({
      vendorId: params.vendorId,
      month: params.month,
      paid: params.paid,
    }),
    token: params.token,
    retries: 1,
  } as any);
}
