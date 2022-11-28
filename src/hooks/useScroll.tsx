import { useEffect, useState } from 'react';

export const useScrollDirection = (threshold) => {
  const isBrowser = typeof window !== `undefined`;
  const [scrollPosition, setScrollPosition] = useState({ scrolled: false, position: 0 });
  const handleScroll = () => {
    if (isBrowser) {
      const position = window.pageYOffset;
      if (position > threshold) setScrollPosition({ scrolled: true, position: position });
      else setScrollPosition({ scrolled: false, position: 0 });
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return scrollPosition;
};
