import { apiFetch } from './client';
export async function fetchProjects(params) {
    const q = new URLSearchParams();
    q.set('page', String(params.page));
    q.set('pageSize', String(params.pageSize));
    if (params.search)
        q.set('search', params.search);
    if (params.contractor)
        q.set('contractor', params.contractor);
    if (params.manager)
        q.set('manager', params.manager);
    if (params.client)
        q.set('client', params.client);
    if (params.site)
        q.set('site', params.site);
    if (params.type)
        q.set('type', params.type);
    if (params.companyId)
        q.set('companyId', params.companyId);
    return apiFetch(`/projects?${q.toString()}`, { token: params.token, retries: 2 });
}
export async function createProject(body) {
    return apiFetch(`/projects`, { method: 'POST', body: JSON.stringify(body), token: body.token, retries: 1 });
}
export async function updateProject(params, body) {
    return apiFetch(`/projects/${params.id}`, { method: 'PUT', body: JSON.stringify(body), token: params.token, retries: 1 });
}
export async function deleteProject(params) {
    return apiFetch(`/projects/${params.id}`, { method: 'DELETE', token: params.token, retries: 1 });
}
