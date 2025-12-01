import { apiFetch } from './client';

export type AnalyticsPoint = { month: string; revenue: number; expenses: number; hours: number };
export type AnalyticsResult = { series: AnalyticsPoint[]; kpis?: { rev: number; exp: number; hrs: number; margin: number } };

export async function fetchAnalytics(params: { range: 'YTD'|'6M'|'3M'; segment: 'All'|'Projects'|'HR'|'Finance'; token?: string }) {
  const q = new URLSearchParams();
  q.set('range', params.range);
  q.set('segment', params.segment);
  return apiFetch<AnalyticsResult>(`/analytics?${q.toString()}`, { token: params.token, retries: 2 });
}
