import { apiFetch } from './client';
export async function fetchDocumentCompanies(params) {
    const q = new URLSearchParams();
    if (params.page)
        q.set('page', String(params.page));
    if (params.pageSize)
        q.set('pageSize', String(params.pageSize));
    const token = params.token;
    return apiFetch(`/document-companies?${q.toString()}`, { token });
}
export async function createDocumentCompany(body) {
    const { token, ...payload } = body;
    return apiFetch(`/document-companies`, {
        method: 'POST',
        body: JSON.stringify(payload),
        token,
    });
}
export async function updateDocumentCompany(params, body) {
    return apiFetch(`/document-companies/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
        token: params.token,
    });
}
export async function deleteDocumentCompany(params) {
    return apiFetch(`/document-companies/${params.id}`, {
        method: 'DELETE',
        token: params.token,
    });
}
function getBaseUrl() {
    const envBase = import.meta.env?.VITE_API_BASE_URL ||
        import.meta.env?.VITE_BACKEND_URL ||
        'http://localhost:8443';
    return envBase;
}
function authHeaders() {
    const h = new Headers();
    try {
        const token = window.localStorage.getItem('accessToken') || window.localStorage.getItem('token');
        if (token)
            h.set('Authorization', `Bearer ${token}`);
    }
    catch { }
    return h;
}
export async function fetchCompanyDocuments(companyId) {
    const base = getBaseUrl();
    const res = await fetch(`${base}/document-companies/${companyId}/documents`, {
        headers: authHeaders(),
    });
    if (!res.ok)
        throw new Error('Failed to load company documents');
    return (await res.json());
}
export async function uploadCompanyDocument(companyId, type, file) {
    const base = getBaseUrl();
    const form = new FormData();
    form.append('type', type);
    form.append('file', file);
    const res = await fetch(`${base}/document-companies/${companyId}/documents`, {
        method: 'POST',
        headers: authHeaders(),
        body: form,
    });
    if (!res.ok)
        throw new Error('Upload failed');
    return (await res.json());
}
export async function deleteCompanyDocument(companyId, type) {
    const base = getBaseUrl();
    const res = await fetch(`${base}/document-companies/${companyId}/documents/${type}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    if (!res.ok)
        throw new Error('Delete failed');
}
export function getCompanyDocumentDownloadUrl(companyId, type) {
    const base = getBaseUrl();
    return `${base}/document-companies/${companyId}/documents/${type}`;
}
