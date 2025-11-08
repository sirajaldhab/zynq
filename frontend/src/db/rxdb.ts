import { createRxDatabase, RxDatabase, RxCollection } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { projectSchema } from './schemas/project';

export type ProjectDoc = {
  id: string;
  name: string;
  status?: string | null;
  updatedAt: string; // ISO timestamp
};

export type ZynqCollections = {
  projects: RxCollection<ProjectDoc>;
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
