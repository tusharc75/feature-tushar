import { useEffect, useRef, useState, useCallback } from 'react';
import { IndexedDb, IndexedDbProps } from 'src/utils/IndexedDb';

type UseIndexedDbProps<K extends keyof any> = IndexedDbProps<K>;

type IndexedDbHook<T, K extends keyof T> = {
  ready: boolean;
  error: Error | null;
  add: (item: T) => Promise<T>;
  get: (key: T[K]) => Promise<T | undefined>;
  getAll: () => Promise<T[]>;
  put: (item: T) => Promise<T>;
  deleteItem: (key: T[K]) => Promise<void>;
  clear: () => Promise<void>;
};

function useIndexedDb<T extends Record<K, IDBValidKey>, K extends keyof T>(props: UseIndexedDbProps<K>): IndexedDbHook<T, K> {
  // 1) Create a single DB instance
  const dbRef = useRef<IndexedDb<T, K> | null>(null);
  if (!dbRef.current) {
    dbRef.current = new IndexedDb<T, K>(props);
  }

  // 2) Track ready / error state
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 3) Open the DB on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // @ts-ignore access the internal promise
        await dbRef.current.dbReady;
        if (!cancelled) setReady(true);
      } catch (err) {
        if (!cancelled) setError(err as Error);
      }
    })();

    return () => {
      cancelled = true;
      setReady(false);
      dbRef.current?.close();
    };
  }, [props.dbName, props.storeName, props.uniqueKey, props.version, props.autoIncrement, props.debug]);

  // 4) Wrap CRUD methods
  const add = useCallback((item: T) => (!ready ? Promise.reject(new Error('DB not ready')) : dbRef.current!.add(item)), [ready]);

  const get = useCallback((key: T[K]) => (!ready ? Promise.reject(new Error('DB not ready')) : dbRef.current!.get(key)), [ready]);

  const getAll = useCallback(() => (!ready ? Promise.reject(new Error('DB not ready')) : dbRef.current!.getAll()), [ready]);

  const put = useCallback((item: T) => (!ready ? Promise.reject(new Error('DB not ready')) : dbRef.current!.put(item)), [ready]);

  const deleteItem = useCallback((key: T[K]) => (!ready ? Promise.reject(new Error('DB not ready')) : dbRef.current!.delete(key)), [ready]);

  const clear = useCallback(() => (!ready ? Promise.reject(new Error('DB not ready')) : dbRef.current!.clear()), [ready]);

  return {
    ready,
    error,
    add,
    get,
    getAll,
    put,
    deleteItem,
    clear
  };
}

export default useIndexedDb;
