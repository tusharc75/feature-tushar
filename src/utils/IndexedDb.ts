export class IndexedDb {
  private db!: IDBDatabase;
  private storesSchema: Record<string, string> = {};
  private dbVersion = 1;

  constructor(private dbName: string) { }

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
  ) { }

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

  async sortBy<K extends keyof T>(key: K, direction: 'asc' | 'desc' = 'asc'): Promise<T[]> {
    const arr = await this.getAll();
    return arr.sort((a, b) => {
      const va = a[key];
      const vb = b[key];

      // Numeric or string comparison
      if (va > vb) return direction === 'asc' ? 1 : -1;
      if (va < vb) return direction === 'asc' ? -1 : 1;
      return 0;
    });
  }

  where<Key extends keyof T>(index: Key): Query<T, T[Key]> {
    return new Query<T, T[Key]>(this.db, this.name, index as string);
  }
}

class Query<T, V> {
  private range: IDBKeyRange | null = null;
  private dir: IDBCursorDirection = 'next';

  // New properties for sorting
  private sortField?: keyof T;
  private sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private db: IDBDatabase,
    private storeName: string,
    private filterIndex: string // the index used for .where()
  ) { }

  equals(val: V) {
    this.range = IDBKeyRange.only(val);
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
  between(lo: V, hi: V, loOpen = false, hiOpen = false) {
    this.range = IDBKeyRange.bound(lo, hi, loOpen, hiOpen);
    return this;
  }
  reverse() {
    this.dir = 'prev';
    return this;
  }

  /**
   * Specify an optional sort key and direction.
   */
  sortBy<K extends keyof T>(field: K, direction: 'asc' | 'desc' = 'asc') {
    this.sortField = field;
    this.sortDirection = direction;
    return this;
  }

  /**
   * Retrieve all filtered entries and then sort in JS if requested.
   */
  toArray(): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction(this.storeName, 'readonly');
      const store = txn.objectStore(this.storeName);
      const source = store.indexNames.contains(this.filterIndex) ? store.index(this.filterIndex) : store;

      const req = source.openCursor(this.range, this.dir);
      const out: T[] = [];

      req.onsuccess = (ev) => {
        const cursor = (ev.target as IDBRequest).result;
        if (cursor) {
          out.push(cursor.value);
          cursor.continue();
        } else {
          // Perform JS‐side sort if requested
          if (this.sortField) {
            out.sort((a, b) => {
              const va = a[this.sortField!];
              const vb = b[this.sortField!];
              if (va > vb) return this.sortDirection === 'asc' ? 1 : -1;
              if (va < vb) return this.sortDirection === 'asc' ? -1 : 1;
              return 0;
            });
          }
          resolve(out);
        }
      };

      req.onerror = () => reject(req.error);
    });
  }

  deleteAll(): Promise<number> {
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction(this.storeName, 'readwrite');
      const store = txn.objectStore(this.storeName);
      // if indexName exists on this store, use it; otherwise scan primary store
      const source = store.indexNames.contains(this.filterIndex) ? store.index(this.filterIndex) : store;
      const cursorReq = source.openCursor(this.range, this.dir);
      let count = 0;
      cursorReq.onsuccess = (ev) => {
        const cursor = (ev.target as IDBRequest).result;
        if (cursor) {
          cursor.delete(); // schedule deletion
          count++;
          cursor.continue();
        }
      };
      cursorReq.onerror = () => {
        // cursor-level error
        reject(cursorReq.error);
      };
      txn.oncomplete = () => {
        resolve(count);
      };
      txn.onerror = () => {
        reject(txn.error);
      };
      txn.onabort = () => {
        reject(txn.error);
      };
    });
  }
}
