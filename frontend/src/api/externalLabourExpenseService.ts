import { apiFetch } from './client';

export type ExternalLabourExpenseDto = {
  id: string;
  vendorId: string;
  month: string;
  totalLabour: number;
  total: number;
  pmBalance: number;
  paidAmount: number;
  balance: number;
  notes?: string | null;
  vendor?: { id: string; name: string };
};

export async function fetchExternalLabourExpenses(params: { vendorId?: string; monthFrom?: string; monthTo?: string; token?: string } = {}) {
  const q = new URLSearchParams();
  if (params.vendorId) q.set('vendorId', params.vendorId);
  if (params.monthFrom) q.set('monthFrom', params.monthFrom);
  if (params.monthTo) q.set('monthTo', params.monthTo);
  const qs = q.toString();
  const url = qs ? `/external-labour-expense?${qs}` : '/external-labour-expense';
  return apiFetch<ExternalLabourExpenseDto[]>(url, { token: params.token, retries: 2 });
}

export async function upsertExternalLabourExpense(body: { vendorId: string; month: string; totalLabour: number; total: number; paidAmount: number; notes?: string; token?: string }) {
  const { token, ...payload } = body as any;
  return apiFetch<ExternalLabourExpenseDto>(`/external-labour-expense/upsert`, {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
    retries: 1,
  } as any);
}
