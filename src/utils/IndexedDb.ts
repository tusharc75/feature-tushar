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

  where<Key extends keyof T>(index: Key): Query<T> {
    return new Query<T>(this.db, this.name, index as string);
  }
}

type Condition = {
  index: string;
  range?: IDBKeyRange;
  test: (v: any) => boolean;
};

class Query<T> {
  private conditions: Condition[] = [];
  private dir: IDBCursorDirection = 'next';
  private sortField?: keyof T;
  private sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private db: IDBDatabase,
    private storeName: string,
    firstIndex: string
  ) {
    this.conditions.push({ index: firstIndex, test: () => true });
  }

  where<K extends keyof T>(index: K): this {
    this.conditions.push({ index: index as any, test: () => true });
    return this;
  }

  equals<V extends T[keyof T]>(val: V): this {
    const c = this.conditions[this.conditions.length - 1];
    c.range = IDBKeyRange.only(val);
    c.test = (x) => x === val;
    return this;
  }

  above<V extends T[keyof T]>(val: V): this {
    const c = this.conditions[this.conditions.length - 1];
    c.range = IDBKeyRange.lowerBound(val, true);
    c.test = (x) => x > (val as any);
    return this;
  }

  below<V extends T[keyof T]>(val: V): this {
    const c = this.conditions[this.conditions.length - 1];
    c.range = IDBKeyRange.upperBound(val, true);
    c.test = (x) => x < (val as any);
    return this;
  }

  between<V extends T[keyof T]>(lo: V, hi: V, loOpen = false, hiOpen = false): this {
    const c = this.conditions[this.conditions.length - 1];
    c.range = IDBKeyRange.bound(lo, hi, loOpen, hiOpen);
    c.test = (x) => {
      if (x < (lo as any) || x > (hi as any)) return false;
      if (loOpen && x === (lo as any)) return false;
      if (hiOpen && x === (hi as any)) return false;
      return true;
    };
    return this;
  }

  reverse(): this {
    this.dir = 'prev';
    return this;
  }

  sortBy<K extends keyof T>(field: K, direction: 'asc' | 'desc' = 'asc'): this {
    this.sortField = field;
    this.sortDirection = direction;
    return this;
  }

  toArray(): Promise<T[]> {
    const primary = this.conditions[0];
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction(this.storeName, 'readonly');
      const store = txn.objectStore(this.storeName);
      const useIndex = primary.range != null && store.indexNames.contains(primary.index);
      const source = useIndex ? store.index(primary.index) : store;
      const req = useIndex ? (source as IDBIndex).openCursor(primary.range!, this.dir) : store.openCursor();

      const out: T[] = [];
      req.onsuccess = (ev) => {
        const cursor = (ev.target as IDBRequest).result;
        if (cursor) {
          const record = cursor.value as T;
          // all conditions must pass
          if (this.conditions.every((c) => c.test((record as any)[c.index]))) {
            out.push(record);
          }
          cursor.continue();
        } else {
          // apply JS-side sort if needed
          if (this.sortField) {
            out.sort((a, b) => {
              const va = a[this.sortField!] as any;
              const vb = b[this.sortField!] as any;
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
    const primary = this.conditions[0];
    return new Promise((resolve, reject) => {
      const txn = this.db.transaction(this.storeName, 'readwrite');
      const store = txn.objectStore(this.storeName);
      const useIndex = primary.range != null && store.indexNames.contains(primary.index);
      const source = useIndex ? store.index(primary.index) : store;
      const cursorReq = useIndex ? (source as IDBIndex).openCursor(primary.range!, this.dir) : store.openCursor();

      let count = 0;
      cursorReq.onsuccess = (ev) => {
        const cursor = (ev.target as IDBRequest).result;
        if (cursor) {
          const record = cursor.value as T;
          if (this.conditions.every((c) => c.test((record as any)[c.index]))) {
            cursor.delete();
            count++;
          }
          cursor.continue();
        }
      };
      cursorReq.onerror = () => reject(cursorReq.error);
      txn.oncomplete = () => resolve(count);
      txn.onerror = () => reject(txn.error);
      txn.onabort = () => reject(txn.error);
    });
  }
}
