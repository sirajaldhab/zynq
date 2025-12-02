import { apiFetch } from './client';
export async function fetchExternalLabourExpenses(params = {}) {
    const q = new URLSearchParams();
    if (params.vendorId)
        q.set('vendorId', params.vendorId);
    if (params.monthFrom)
        q.set('monthFrom', params.monthFrom);
    if (params.monthTo)
        q.set('monthTo', params.monthTo);
    const qs = q.toString();
    const url = qs ? `/external-labour-expense?${qs}` : '/external-labour-expense';
    return apiFetch(url, { token: params.token, retries: 2 });
}
export async function upsertExternalLabourExpense(body) {
    const { token, ...payload } = body;
    return apiFetch(`/external-labour-expense/upsert`, {
        method: 'POST',
        body: JSON.stringify(payload),
        token,
        retries: 1,
    });
}
