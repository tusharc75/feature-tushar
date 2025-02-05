import { useState, useEffect, useCallback } from 'react';

export default function useDelayedClass<T>(initialClass: T, delayedClass: NoInfer<T>, delay: number) {
  const [state, setState] = useState<{ className: T; delayComplete: boolean }>({
    className: initialClass,
    delayComplete: false
  });

  const revertClass = useCallback(() => {
    setState({ className: initialClass, delayComplete: true });
  }, [initialClass]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setState({ className: delayedClass, delayComplete: true });
    }, delay);
    return () => {
      clearTimeout(timer);
    };
  }, [delayedClass, delay]);

  return { ...state, revertClass };
}
