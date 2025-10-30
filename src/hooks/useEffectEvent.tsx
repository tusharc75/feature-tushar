import { useRef, useCallback } from 'react';

/**
 * Polyfill for useEffectEvent in React 17
 *
 * Keeps a stable function reference while always calling the latest handler.
 */
export function useEffectEvent<T extends (...args: any[]) => any>(handler: T): T {
  const handlerRef = useRef(handler);

  // Always update to the latest handler
  handlerRef.current = handler;

  // Return a stable callback that calls the latest handler
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(
    ((...args: Parameters<T>): ReturnType<T> => {
      // Non-null assertion since handlerRef.current is always set
      return handlerRef.current!(...args);
    }) as T,
    []
  );
}
