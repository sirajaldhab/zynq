import { createRxDatabase, RxDatabase, RxCollection } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { projectSchema } from './schemas/project';
import { invoiceSchema } from './schemas/invoice';
import { paymentSchema } from './schemas/payment';

export type ProjectDoc = {
  id: string;
  name: string;
  status?: string | null;
  updatedAt: string; // ISO timestamp
};

export type ZynqCollections = {
  projects: RxCollection<ProjectDoc>;
  invoices: RxCollection<InvoiceDoc>;
  payments: RxCollection<PaymentDoc>;
};
export type ZynqDB = RxDatabase<ZynqCollections>;

let dbPromise: Promise<ZynqDB> | null = null;

export async function getDB(): Promise<ZynqDB> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await createRxDatabase<ZynqCollections>({
        name: 'zynq',
        storage: getRxStorageDexie(),
        multiInstance: true,
        eventReduce: true,
      });
      await db.addCollections({
        projects: {
          schema: projectSchema as any,
        },
        invoices: {
          schema: invoiceSchema as any,
        },
        payments: {
          schema: paymentSchema as any,
        },
      });
      return db;
    })();
  }
  return dbPromise;
}

export async function upsertProjects(docs: ProjectDoc[]) {
  const db = await getDB();
  const col = db.projects;
  await col.bulkUpsert(docs as any);
}

export type InvoiceDoc = {
  id: string;
  number: string;
  client: string;
  date: string;
  dueDate: string;
  amount: number;
  status: string;
  updatedAt?: string;
};

export async function upsertInvoices(docs: InvoiceDoc[]) {
  const db = await getDB();
  await db.invoices.bulkUpsert(docs as any);
}

export type PaymentDoc = {
  id: string;
  invoiceId: string;
  date: string;
  amount: number;
  method?: string;
  reference?: string;
  updatedAt?: string;
};

export async function upsertPayments(docs: PaymentDoc[]) {
  const db = await getDB();
  await db.payments.bulkUpsert(docs as any);
}
