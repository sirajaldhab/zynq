import { apiFetch, ApiResult } from './client';

export type SiteDaySalaryDto = {
  id: string;
  site: string;
  projectId?: string | null;
  daySalary: number;
};

export async function fetchSiteDaySalaries(params: { token?: string }) {
  return apiFetch<ApiResult<SiteDaySalaryDto[]>>(`/hr/site-day-salaries`, { token: params.token, retries: 2 });
}

export async function upsertSiteDaySalary(body: { id?: string; site: string; projectId?: string | null; daySalary: number; token?: string }) {
  const { token, ...payload } = body as any;
  return apiFetch<SiteDaySalaryDto>(`/hr/site-day-salaries`, {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
    retries: 1,
  } as any);
}
