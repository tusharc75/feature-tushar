import { useRef, useCallback } from 'react';

/**
 * Polyfill for useEffectEvent in React 17
 *
 * Keeps a stable function reference while always calling the latest handler.
 */
export function useEffectEvent(handler) {
  const handlerRef = useRef(handler);

  handlerRef.current = handler;

  return useCallback((...args) => {
    return handlerRef.current?.(...args);
  }, []);
}
