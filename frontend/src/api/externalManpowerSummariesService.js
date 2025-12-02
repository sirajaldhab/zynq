import { apiFetch } from './client';
export async function fetchExternalManpowerSummaries(params = {}) {
    return apiFetch(`/external-manpower-summaries`, {
        token: params.token,
        retries: 2,
    });
}
export async function updateExternalManpowerPaid(params) {
    return apiFetch(`/external-manpower-summaries/${params.id}/paid`, {
        method: 'PUT',
        body: JSON.stringify({ paid: params.paid }),
        token: params.token,
        retries: 1,
    });
}
export async function upsertExternalManpowerPaid(params) {
    return apiFetch(`/external-manpower-summaries/upsert-and-set-paid`, {
        method: 'POST',
        body: JSON.stringify({
            vendorId: params.vendorId,
            month: params.month,
            paid: params.paid,
        }),
        token: params.token,
        retries: 1,
    });
}
