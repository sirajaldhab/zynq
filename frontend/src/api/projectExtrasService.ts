import { apiFetch } from './client';

export type ProjectExtraDto = {
  id?: string;
  projectId: string;
  otherText?: string | null;
};

export async function fetchProjectExtra(params: { projectId: string; token?: string }) {
  return apiFetch<ProjectExtraDto | null>(`/project-extras/${params.projectId}`, {
    token: params.token,
    retries: 1,
  } as any);
}

export async function saveProjectExtra(body: { projectId: string; otherText: string; token?: string }) {
  const { token, ...payload } = body as any;
  return apiFetch<ProjectExtraDto>(`/project-extras`, {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
    retries: 1,
  } as any);
}
