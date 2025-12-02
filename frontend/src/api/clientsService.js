import { apiFetch } from './client';
export async function fetchClients(params = {}) {
    return apiFetch(`/clients`, { token: params.token, retries: 2 });
}
