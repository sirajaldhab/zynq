import { apiFetch } from './client';

export type ClientDto = {
  id: string;
  name: string;
  contact?: string | null;
};

export async function fetchClients(params: { token?: string } = {}) {
  return apiFetch<ClientDto[]>(`/clients`, { token: params.token, retries: 2 });
}
