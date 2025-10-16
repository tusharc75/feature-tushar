import React, { createContext, useContext, useRef, useCallback, useState, useEffect } from 'react';

export type SetFastContextStore<Store> = (value: Partial<Store> | ((prev: Store) => Partial<Store>)) => void;

export default function createFastContext<Store>(initialState: Store) {
  function useStoreData(): {
    get: () => Store;
    set: (value: Partial<Store> | ((prev: Store) => Partial<Store>)) => void;
    subscribe: (callback: () => void) => () => void;
  } {
    const store = useRef(initialState);
    const get = useCallback(() => store.current, []);

    const subscribers = useRef(new Set<() => void>());

    const set: SetFastContextStore<Store> = useCallback((value: Partial<Store> | ((prev: Store) => Partial<Store>)) => {
      store.current = typeof value === 'function' ? { ...store.current, ...value(store.current) } : { ...store.current, ...value };

      subscribers.current.forEach((callback) => {
        callback();
      });
    }, []);

    const subscribe = useCallback((callback: () => void) => {
      subscribers.current.add(callback);
      return () => subscribers.current.delete(callback);
    }, []);

    return {
      get,
      set,
      subscribe
    };
  }

  function useStore<SelectorOutput>(
    selector: (store: Store) => SelectorOutput
    // equalityFn: (a: SelectorOutput, b: SelectorOutput) => boolean = Object.is
  ): [SelectorOutput, (value: Partial<Store> | ((prev: Store) => Partial<Store>)) => void] {
    const store = useContext(StoreContext);
    if (!store) {
      throw new Error('Store not found');
    }

    const [state, setState] = useState<SelectorOutput>(() => selector(store.get()));

    useEffect(() => {
      return store.subscribe(() => setState(() => selector(store.get())));
    }, []);

    // useEffect(() => {
    //   return store.subscribe(() => {
    //     const newState = selector(store.get());
    //     setState((prev) => (equalityFn(prev, newState) ? prev : newState));
    //   });
    // }, [selector, store]);

    // useEffect(() => {
    //   return store.subscribe(() => {
    //     const newState = selector(store.get());
    //     setState((prev) => {
    //       if (Object.is(prev, newState)) return prev; // no update if same
    //       return newState;
    //     });
    //   });
    // }, [selector, store]);

    return [state, store.set] as const;
  }

  type UseStoreDataReturnType = ReturnType<typeof useStoreData>;

  const StoreContext = createContext<UseStoreDataReturnType | null>(null);

  function Provider({ children }: { children: React.ReactNode }) {
    const store = useStoreData();
    return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
  }

  return {
    Provider,
    useStore
  };
}
