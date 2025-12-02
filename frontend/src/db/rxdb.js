import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { projectSchema } from './schemas/project';
import { invoiceSchema } from './schemas/invoice';
import { paymentSchema } from './schemas/payment';
let dbPromise = null;
export async function getDB() {
    if (!dbPromise) {
        dbPromise = (async () => {
            const db = await createRxDatabase({
                name: 'zynq',
                storage: getRxStorageDexie(),
                multiInstance: true,
                eventReduce: true,
            });
            await db.addCollections({
                projects: {
                    schema: projectSchema,
                },
                invoices: {
                    schema: invoiceSchema,
                },
                payments: {
                    schema: paymentSchema,
                },
            });
            return db;
        })();
    }
    return dbPromise;
}
export async function upsertProjects(docs) {
    const db = await getDB();
    const col = db.projects;
    await col.bulkUpsert(docs);
}
export async function upsertInvoices(docs) {
    const db = await getDB();
    await db.invoices.bulkUpsert(docs);
}
export async function upsertPayments(docs) {
    const db = await getDB();
    await db.payments.bulkUpsert(docs);
}
