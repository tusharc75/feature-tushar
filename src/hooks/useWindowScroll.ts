import { useCallback, useLayoutEffect, useState } from 'react';

export function useWindowScroll() {
  const [state, setState] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0
  });
  useLayoutEffect(() => {
    const handleScroll = () => {
      setState({ x: window.scrollX, y: window.scrollY });
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  // options?: ScrollToOptions
  const scrollTo = useCallback((...args: [ScrollToOptions] | [number, number]) => {
    if (typeof args[0] === 'object') {
      window.scrollTo(args[0]);
    } else if (typeof args[0] === 'number' && typeof args[1] === 'number') {
      window.scrollTo(args[0], args[1]);
    } else {
      throw new Error(`Invalid arguments passed to scrollTo`);
    }
  }, []);

  return [state, scrollTo] as const;
}
