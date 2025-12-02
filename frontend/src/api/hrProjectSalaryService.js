import { apiFetch } from './client';
export async function fetchSiteDaySalaries(params) {
    return apiFetch(`/hr/site-day-salaries`, { token: params.token, retries: 2 });
}
export async function upsertSiteDaySalary(body) {
    const { token, ...payload } = body;
    return apiFetch(`/hr/site-day-salaries`, {
        method: 'POST',
        body: JSON.stringify(payload),
        token,
        retries: 1,
    });
}
