import { apiFetch } from './client';
export async function fetchProjectExtra(params) {
    return apiFetch(`/project-extras/${params.projectId}`, {
        token: params.token,
        retries: 1,
    });
}
export async function saveProjectExtra(body) {
    const { token, ...payload } = body;
    return apiFetch(`/project-extras`, {
        method: 'POST',
        body: JSON.stringify(payload),
        token,
        retries: 1,
    });
}
