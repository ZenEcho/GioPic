import { openDB } from 'idb'

const DB_NAME = 'giopic-db'
const STORE_NAME = 'keyval'

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE_NAME)
  },
})

export const db = {
  async get<T = any>(key: string): Promise<T | undefined> {
    return (await dbPromise).get(STORE_NAME, key)
  },
  async set(key: string, val: any): Promise<void> {
    await (await dbPromise).put(STORE_NAME, val, key)
  },
  async del(key: string): Promise<void> {
    return (await dbPromise).delete(STORE_NAME, key)
  },
  async clear(): Promise<void> {
    return (await dbPromise).clear(STORE_NAME)
  },
  async keys(): Promise<IDBValidKey[]> {
    return (await dbPromise).getAllKeys(STORE_NAME)
  },
  async getFromExternal<T = any>(dbName: string, storeName: string): Promise<T[]> {
    try {
      const externalDb = await openDB(dbName)
      return await externalDb.getAll(storeName)
    } catch (error) {
      console.error(`Failed to get data from external DB ${dbName}/${storeName}:`, error)
      return []
    }
  },
}
