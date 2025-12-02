import { API_BASE } from '../config';
import { upsertProjects, upsertInvoices, upsertPayments } from './rxdb';
async function api(path, token, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body ?? {}),
        credentials: 'include',
    });
    if (!res.ok)
        throw new Error(`Sync API ${path} failed: ${res.status}`);
    return (await res.json());
}
export async function syncPull(token, checkpoint, limit = 100) {
    const data = await api('/sync/pull', token, { checkpoint, limit });
    const projects = data.docs
        .filter((d) => d.type === 'project')
        .map((d) => ({ id: d.id, ...d.data }));
    if (projects.length)
        await upsertProjects(projects);
    const invoices = data.docs
        .filter((d) => d.type === 'invoice')
        .map((d) => ({ id: d.id, ...d.data }));
    if (invoices.length)
        await upsertInvoices(invoices);
    const payments = data.docs
        .filter((d) => d.type === 'payment')
        .map((d) => ({ id: d.id, ...d.data }));
    if (payments.length)
        await upsertPayments(payments);
    return data;
}
export async function syncPush(token, docs, checkpoint) {
    return await api('/sync/push', token, { docs, checkpoint });
}
