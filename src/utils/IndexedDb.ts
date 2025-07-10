export class IndexedDb {
  private db!: IDBDatabase;
  private storesSchema: Record<string, string> = {};
  private dbVersion = 1;

  constructor(private dbName: string) {}

  version(v: number): this {
    this.dbVersion = v;
    return this;
  }

  store(schema: Record<string, string>): this {
    this.storesSchema = { ...this.storesSchema, ...schema };
    return this;
  }

  open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, this.dbVersion);

      req.onupgradeneeded = () => {
        const db = req.result;
        for (const [storeName, def] of Object.entries(this.storesSchema)) {
          if (!db.objectStoreNames.contains(storeName)) {
            // parse schema string: "++id, title, author"
            const parts = def.split(',').map((s) => s.trim());
            console.log(parts);
            let keyOptions: { keyPath?: string; autoIncrement?: boolean } = {};
            const indexes: string[] = [];

            for (const p of parts) {
              if (p.startsWith('++')) {
                keyOptions = { keyPath: p.slice(2), autoIncrement: true };
              } else if (p.startsWith('+')) {
                keyOptions = { keyPath: p.slice(1) };
              } else {
                indexes.push(p);
              }
            }

            const store = db.createObjectStore(storeName, keyOptions);
            for (const idx of indexes) {
              store.createIndex(idx, idx, { unique: false });
            }
          }
        }
      };

      req.onsuccess = () => {
        this.db = req.result;
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  table<T = any>(storeName: string): Table<T> {
    if (!this.db) throw new Error('Call open() first');
    return new Table<T>(this.db, storeName);
  }
  close() {
    if (!this.db) {
      throw new Error('Database is not open or has already been closed');
    }
    this.db.close();
    this.db = null;
  }
}

class Table<T> {
  constructor(
    private db: IDBDatabase,
    private name: string
  ) {}

  private store(mode: IDBTransactionMode) {
    return this.db.transaction(this.name, mode).objectStore(this.name);
  }

  add(item: T): Promise<IDBValidKey> {
    return new Promise((res, rej) => {
      const r = this.store('readwrite').add(item);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }

  getAll(): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const req = this.store('readonly').getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  get(key: IDBValidKey): Promise<T | undefined> {
    return new Promise((res, rej) => {
      const r = this.store('readonly').get(key);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }

  put(item: T): Promise<IDBValidKey> {
    return new Promise((res, rej) => {
      const r = this.store('readwrite').put(item);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }

  delete(key: IDBValidKey): Promise<void> {
    return new Promise((res, rej) => {
      const r = this.store('readwrite').delete(key);
      r.onsuccess = () => res();
      r.onerror = () => rej(r.error);
    });
  }

  where<Key extends keyof T>(index: Key): Query<T, T[Key]> {
    return new Query<T, T[Key]>(this.db, this.name, index as string);
  }
}

class Query<T, V> {
  private range: IDBKeyRange | null = null;
  private dir: IDBCursorDirection = 'next';

  constructor(
    private db: IDBDatabase,
    private storeName: string,
    private indexName: string
  ) {}

  equals(value: V) {
    this.range = IDBKeyRange.only(value);
    return this;
  }

  between(lower: V, upper: V, lowerOpen = false, upperOpen = false) {
    this.range = IDBKeyRange.bound(lower, upper, lowerOpen, upperOpen);
    return this;
  }

  above(val: V) {
    this.range = IDBKeyRange.lowerBound(val, true);
    return this;
  }

  below(val: V) {
    this.range = IDBKeyRange.upperBound(val, true);
    return this;
  }

  reverse() {
    this.dir = 'prev';
    return this;
  }

  deleteAll(): Promise<number> {
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction(this.storeName, 'readwrite');
      const idx = txn.objectStore(this.storeName).index(this.indexName);
      const req = idx.openCursor(this.range, this.dir);
      let count = 0;

      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          count++;
          cursor.continue();
        } else {
          resolve(count);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  toArray(): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction(this.storeName, 'readonly');
      const index = txn.objectStore(this.storeName).index(this.indexName);
      const req = index.openCursor(this.range, this.dir);
      const out: T[] = [];

      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor) {
          out.push(cursor.value);
          cursor.continue();
        } else {
          resolve(out);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }
}
