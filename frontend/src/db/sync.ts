import { API_BASE } from '../config';
import { upsertProjects, ProjectDoc } from './rxdb';

export type SyncPullResponse = {
  checkpoint: string | null;
  docs: Array<{ id: string; type: string; data: any; updatedAt?: string; rev?: string }>;
  limit: number;
};

export type SyncPushResponse = {
  accepted: number;
  conflicts: Array<{ id: string; reason: string }>;
  checkpoint: string | null;
};

async function api<T>(path: string, token: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body ?? {}),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Sync API ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function syncPull(token: string, checkpoint: string | null, limit = 100): Promise<SyncPullResponse> {
  const data = await api<SyncPullResponse>('/sync/pull', token, { checkpoint, limit });
  const projects: ProjectDoc[] = data.docs
    .filter((d) => d.type === 'project')
    .map((d) => ({ id: d.id, ...d.data })) as any;
  if (projects.length) await upsertProjects(projects);
  return data;
}

export async function syncPush(token: string, docs: Array<{ id: string; type: string; data: any; rev?: string; updatedAt?: string }>, checkpoint: string | null) {
  return await api<SyncPushResponse>('/sync/push', token, { docs, checkpoint });
}
