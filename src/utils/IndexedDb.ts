// 1. Props for constructing the DB
export type IndexedDbProps<K extends keyof any> = {
  dbName: string;
  storeName: string;
  uniqueKey: K;
  version?: number;
  autoIncrement?: boolean;
  debug?: boolean;
};

// 2. Main class
export class IndexedDb<T extends Record<K, IDBValidKey>, K extends keyof T> {
  private db: IDBDatabase | null = null;
  private dbReady: Promise<IDBDatabase>;
  private debug: boolean;

  constructor(private props: IndexedDbProps<K>) {
    const { dbName, storeName, uniqueKey, version = 1, autoIncrement = true, debug = false } = props;
    this.debug = debug;

    this.dbReady = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(dbName, version);

      req.onupgradeneeded = () => {
        const database = req.result;
        if (!database.objectStoreNames.contains(storeName)) {
          if (debug) console.log(`Creating store "${storeName}"`);
          database.createObjectStore(storeName, {
            keyPath: uniqueKey as string,
            autoIncrement
          });
        }
      };

      req.onsuccess = () => {
        this.db = req.result;
        if (debug) console.log(`Opened DB "${dbName}" v${req.result.version}`);
        resolve(req.result);
      };

      req.onerror = () => reject(req.error);
    });
  }

  // 3. Helper to get a transaction + object store
  private async getStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const database = this.db ?? (await this.dbReady);
    return database.transaction(this.props.storeName, mode).objectStore(this.props.storeName);
  }

  // 4. CRUD methods

  async add(item: T): Promise<T> {
    const store = await this.getStore('readwrite');
    await new Promise<void>((res, rej) => {
      if (this.debug) console.log(item);
      const req = store.add(item);
      req.onsuccess = () => res();
      req.onerror = () => rej(req.error);
    });
    return item;
  }

  async get(key: T[K]): Promise<T | undefined> {
    const store = await this.getStore('readonly');
    return new Promise<T | undefined>((res, rej) => {
      const req = store.get(key);
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  }

  async getAll(): Promise<T[]> {
    const store = await this.getStore('readonly');
    return new Promise<T[]>((res, rej) => {
      const req = store.getAll();
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  }

  async put(item: T): Promise<T> {
    const store = await this.getStore('readwrite');
    await new Promise<void>((res, rej) => {
      const req = store.put(item);
      req.onsuccess = () => res();
      req.onerror = () => rej(req.error);
    });
    return item;
  }

  async delete(key: T[K]): Promise<void> {
    const store = await this.getStore('readwrite');
    await new Promise<void>((res, rej) => {
      const req = store.delete(key);
      req.onsuccess = () => res();
      req.onerror = () => rej(req.error);
    });
  }

  async clear(): Promise<void> {
    const store = await this.getStore('readwrite');
    await new Promise<void>((res, rej) => {
      const req = store.clear();
      req.onsuccess = () => res();
      req.onerror = () => rej(req.error);
    });
  }

  // 5. Close when you’re done
  async close(): Promise<void> {
    const database = this.db ?? (await this.dbReady);
    database.close();
    this.db = null;
  }
}
