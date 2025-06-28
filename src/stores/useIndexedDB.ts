/**
 * 数据库类，用于管理 IndexedDB 数据库。
 */
class Database {
    dbName: string;
    version: number;
    db: IDBDatabase | null;

    constructor(dbName = 'PLExtension', version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
    }

    /**
     * 打开数据库。
     * @returns {Promise<IDBDatabase>} - 返回一个 Promise，解析为 IDBDatabase 实例。
     */
    async open(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // 根据需要创建对象存储
                if (!db.objectStoreNames.contains('BedConfigStore')) {
                    const store = db.createObjectStore('BedConfigStore', { keyPath: 'id' });
                    store.createIndex('index', 'index', { unique: false });
                }

                if (!db.objectStoreNames.contains('Uploads')) {
                    const store = db.createObjectStore('Uploads', { keyPath: 'key' });
                    store.createIndex('index', 'index', { unique: false });
                }

                if (!db.objectStoreNames.contains('Sticker')) {
                    const store = db.createObjectStore('Sticker', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('index', 'index', { unique: false });
                }

                if (!db.objectStoreNames.contains('ApplicationMenu')) {
                    const store = db.createObjectStore('ApplicationMenu', { keyPath: 'value' });
                    store.createIndex('index', 'index', { unique: false });
                }
            };

            request.onsuccess = (event: Event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve(this.db);
            };

            request.onerror = (event: Event) => {
                console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
                reject((event.target as IDBOpenDBRequest).error);
            };
        });
    }

    /**
     * 关闭数据库。
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

/**
 * Store 类，用于管理 IndexedDB 操作。
 */
class Store {
    database: Database;
    storeName: string;

    constructor(database: Database, storeName: string) {
        this.database = database;
        this.storeName = storeName;
    }

    /**
     * 获取当前最大的 index。
     * @param {IDBDatabase} db - IndexedDB 数据库实例。
     * @returns {Promise<number>} - 返回一个 Promise，解析为最大的 index。
     * @private
     */
    _getMaxIndex(db: IDBDatabase): Promise<number> {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('index');
            const request = index.openCursor(null, 'prev'); // 按降序遍历

            request.onsuccess = (event: Event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
                if (cursor) {
                    resolve(cursor.key as number); // cursor.key 即为最大的 index
                } else {
                    resolve(0); // 如果没有数据，返回 0
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 添加数据到对象存储。
     * @param {any | any[]} data - 要添加的数据。
     * @returns {Promise<{ successes: any[], errors: any[] }>} - 返回一个 Promise，解析为包含成功和错误的对象。
     */
    async add(data: any | any[]): Promise<{ successes: any[], errors: any[] }> {
        const db = await this.database.open();
        const items = Array.isArray(data) ? data : [data];

        // 获取当前最大的 index
        let maxIndex = await this._getMaxIndex(db);

        const results = await Promise.allSettled(
            items.map(item => {
                if (!('index' in item)) {
                    maxIndex += 1;
                    item.index = maxIndex;
                }
                return this._saveItem(db, item, 'add');
            })
        );

        const successes = results
            .filter(result => result.status === 'fulfilled')
            .map(result => (result as PromiseFulfilledResult<any>).value);

        const errors = results
            .filter(result => result.status === 'rejected')
            .map(result => (result as PromiseRejectedResult).reason);

        return { successes, errors };
    }

    /**
     * 更新对象存储中的数据。
     * @param {any | any[]} data - 要更新的数据。
     * @returns {Promise<{ successes: any[], errors: any[] }>} - 返回一个 Promise，解析为包含成功和错误的对象。
     */
    async put(data: any | any[]): Promise<{ successes: any[], errors: any[] }> {
        const db = await this.database.open();
        const items = Array.isArray(data) ? data : [data];
        // 获取当前最大的 index
        let maxIndex = await this._getMaxIndex(db);

        const results = await Promise.allSettled(
            items.map(item => {
                if (!('index' in item)) {
                    maxIndex += 1;
                    item.index = maxIndex;
                }
                return this._saveItem(db, item, 'put');
            })
        );

        const successes = results
            .filter(result => result.status === 'fulfilled')
            .map(result => (result as PromiseFulfilledResult<any>).value);

        const errors = results
            .filter(result => result.status === 'rejected')
            .map(result => (result as PromiseRejectedResult).reason);

        return { successes, errors };
    }

    /**
     * 保存数据项到对象存储（添加或更新）。
     * @param {IDBDatabase} db - IndexedDB 数据库实例。
     * @param {any} item - 要保存的数据项。
     * @param {'add' | 'put'} operation - 操作类型（'add' 或 'put'）。
     * @returns {Promise<any>} - 返回一个 Promise，解析为保存的数据项。
     * @private
     */
    _saveItem(db: IDBDatabase, item: any, operation: 'add' | 'put'): Promise<any> {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            let request: IDBRequest<IDBValidKey>;
            if (operation === 'add') {
                request = store.add(item);
            } else if (operation === 'put') {
                request = store.put(item);
            } else {
                reject(new Error('无效的操作'));
                return;
            }

            transaction.oncomplete = () => resolve(item);
            transaction.onerror = () => reject({ item, error: transaction.error });
            transaction.onabort = () => reject({ item, error: transaction.error });
        });
    }

    /**
     * 删除对象存储中的数据。
     * @param {any | any[]} keys - 要删除的数据的键。
     * @returns {Promise<{ successes: any[], errors: any[] }>} - 返回一个 Promise，解析为包含成功和错误的对象。
     */
    async delete(keys: any | any[]): Promise<{ successes: any[], errors: any[] }> {
        const db = await this.database.open();
        const items = Array.isArray(keys) ? keys : [keys];

        const results = await Promise.allSettled(
            items.map(key => this._deleteItem(db, key))
        );

        const successes = results
            .filter(result => result.status === 'fulfilled')
            .map(result => (result as PromiseFulfilledResult<any>).value);

        const errors = results
            .filter(result => result.status === 'rejected')
            .map(result => (result as PromiseRejectedResult).reason);

        return { successes, errors };
    }

    /**
     * 清空对象存储。
     * @returns {Promise<void>} - 返回一个 Promise。
     */
    async clear(): Promise<void> {
        const db = await this.database.open();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);

            store.clear();
        });
    }

    /**
     * 辅助方法：删除单个数据项。
     * @param {IDBDatabase} db - IndexedDB 数据库实例。
     * @param {any} key - 要删除的数据项的键。
     * @returns {Promise<any>} - 返回一个 Promise，解析为删除的数据项的键。
     * @private
     */
    _deleteItem(db: IDBDatabase, key: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);

            transaction.oncomplete = () => resolve(key);
            transaction.onerror = () => reject({ key, error: transaction.error });
            transaction.onabort = () => reject({ key, error: transaction.error });
        });
    }

    /**
     * 获取单个数据项。
     * @param {any} key - 数据项的键。
     * @returns {Promise<any>} - 返回一个 Promise，解析为获取的数据项。
     */
    async get(key: any): Promise<any> {
        const db = await this.database.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取所有数据项。
     * @returns {Promise<any[]>} - 返回一个 Promise，解析为所有数据项的数组。
     */
    async getAll(): Promise<any[]> {
        const db = await this.database.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 按照 'index' 排序获取所有数据项。
     * @param {string} [order='asc'] - 排序顺序（'asc' 或 'desc'）。
     * @returns {Promise<any[]>} - 返回一个 Promise，解析为排序后的数据项数组。
     */
    async getAllSortedByIndex(order = 'asc'): Promise<any[]> {
        const db = await this.database.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('index');
            const direction = order === 'desc' ? 'prev' : 'next';
            const request = index.openCursor(null, direction);
            const results: any[] = [];

            request.onsuccess = (event: Event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }
}

const databaseInstance = new Database();
// 导出统一的 dataBase 对象
export const useIndexedDB = {
    database: databaseInstance,
    BedConfigStore: new Store(databaseInstance, 'BedConfigStore'),
    Uploads: new Store(databaseInstance, 'Uploads'),
    Sticker: new Store(databaseInstance, 'Sticker'),
    ApplicationMenu: new Store(databaseInstance, 'ApplicationMenu'),
};

