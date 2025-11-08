import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
let dbPromise = null;
export async function getDB() {
    if (!dbPromise) {
        dbPromise = createRxDatabase({
            name: 'zynq',
            storage: getRxStorageDexie(),
            multiInstance: true,
            eventReduce: true,
        });
    }
    return dbPromise;
}
