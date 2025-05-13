import { useEffect, useCallback } from 'react';
import useSyncExternalStorePolyfill from 'src/hooks/useSyncExternalStorePolyfill';

const dispatchStorageEvent = <D>(key: string, newValue: D) => {
  window.dispatchEvent(new StorageEvent('storage', { key, newValue }));
};

const setItem = <D>(key: string, value: D) => {
  const stringifiedValue = JSON.stringify(value);
  window.localStorage.setItem(key, stringifiedValue);
  dispatchStorageEvent(key, stringifiedValue);
};

const removeItem = (key: string) => {
  window.localStorage.removeItem(key);
  dispatchStorageEvent(key, null);
};

const getItem = (key: string) => {
  return window.localStorage.getItem(key);
};

const subscribe = (callback) => {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
};

export default function useLocalStorage<D>(key: string, initialValue?: D) {
  const getSnapshot = () => getItem(key);

  const store = useSyncExternalStorePolyfill(subscribe, getSnapshot);

  const setState = useCallback(
    (v: ((value: D) => D) | D) => {
      try {
        const nextState = typeof v === 'function' ? (v as (data: D) => D)(JSON.parse(store)) : v;
        if (nextState === undefined || nextState === null) {
          removeItem(key);
        } else {
          setItem(key, nextState);
        }
      } catch (e) {
        console.warn(e);
      }
    },
    [key, store]
  );

  useEffect(() => {
    if (getItem(key) === null && typeof initialValue !== 'undefined') {
      setItem(key, initialValue);
    }
  }, [key, initialValue]);

  const returnValue = [store ? (JSON.parse(store) as D) : initialValue, setState] as const;
  return returnValue;
}
