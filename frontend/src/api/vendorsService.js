import { apiFetch } from './client';
export async function fetchVendors(params = {}) {
    return apiFetch(`/vendors`, { token: params.token, retries: 2 });
}
export async function createVendor(body) {
    const { token, ...payload } = body;
    return apiFetch(`/vendors`, {
        method: 'POST',
        body: JSON.stringify(payload),
        token,
        retries: 1,
    });
}
export async function updateVendor(params, body) {
    return apiFetch(`/vendors/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
        token: params.token,
        retries: 1,
    });
}
export async function deleteVendor(params) {
    return apiFetch(`/vendors/${params.id}`, {
        method: 'DELETE',
        token: params.token,
        retries: 1,
    });
}
