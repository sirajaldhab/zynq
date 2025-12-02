import { apiFetch } from './client';
export async function fetchAnalytics(params) {
    const q = new URLSearchParams();
    q.set('range', params.range);
    q.set('segment', params.segment);
    return apiFetch(`/analytics?${q.toString()}`, { token: params.token, retries: 2 });
}
