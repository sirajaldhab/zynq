import { apiFetch } from './client';
export async function fetchManpowerRecords(params = {}) {
    const q = new URLSearchParams();
    if (params.projectId)
        q.set('projectId', params.projectId);
    if (params.vendorId)
        q.set('vendorId', params.vendorId);
    const qs = q.toString();
    const url = qs ? `/manpower-records?${qs}` : '/manpower-records';
    return apiFetch(url, { token: params.token, retries: 2 });
}
export async function createManpowerRecord(body) {
    const { token, ...payload } = body;
    return apiFetch(`/manpower-records`, {
        method: 'POST',
        body: JSON.stringify(payload),
        token,
        retries: 1,
    });
}
export async function deleteManpowerRecord(params) {
    const { id, token } = params;
    return apiFetch(`/manpower-records/${id}`, {
        method: 'DELETE',
        token,
        retries: 1,
    });
}
