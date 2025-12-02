import { apiFetch } from './client';
export async function fetchMaterials(params) {
    const q = new URLSearchParams();
    if (params.projectId)
        q.set('projectId', params.projectId);
    return apiFetch(`/materials?${q.toString()}`, { token: params.token, retries: 2 });
}
export async function createMaterial(body) {
    return apiFetch(`/materials`, { method: 'POST', body: JSON.stringify(body), token: body.token, retries: 1 });
}
export async function updateMaterial(params, body) {
    return apiFetch(`/materials/${params.id}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 });
}
export async function deleteMaterial(params) {
    return apiFetch(`/materials/${params.id}`, { method: 'DELETE', token: params.token, retries: 1 });
}
