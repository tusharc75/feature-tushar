import { useState, useEffect, useRef } from 'react';

interface ScrollState {
  x: number;
  y: number;
}

type UseScrollController = {
  scrollDistance: number;
};

export const useScrollController = ({
  scrollDistance = 200
}: UseScrollController): {
  setRef: React.Dispatch<React.SetStateAction<HTMLElement>>;
  scrollLeft: () => void;
  scrollRight: () => void;
  scrollUp: () => void;
  scrollDown: () => void;
  isLeftDisabled: boolean;
  isRightDisabled: boolean;
  isUpDisabled: boolean;
  isDownDisabled: boolean;
} => {
  const [ref, setRef] = useState<HTMLElement>(null);
  const [scrollState, setScrollState] = useState<ScrollState>({ x: 0, y: 0 });

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleScroll = () => {
      if (ref) {
        window.requestAnimationFrame(() =>
          setScrollState({
            x: ref.scrollLeft,
            y: ref.scrollTop
          })
        );
      }
    };
    if (ref) {
      if (!reduceMotion.matches) {
        ref.style.scrollBehavior = 'smooth';
        ref.style.scrollSnapType = 'x mandatory';
      }
      ref.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (ref) {
        ref.removeEventListener('scroll', handleScroll);
      }
    };
  }, [ref]);

  const scrollLeft = () => {
    if (ref) {
      ref.scrollLeft -= scrollDistance;
    }
  };

  const scrollRight = () => {
    if (ref) {
      ref.scrollLeft += scrollDistance;
    }
  };

  const scrollUp = () => {
    if (ref) {
      ref.scrollTop -= scrollDistance;
    }
  };

  const scrollDown = () => {
    if (ref) {
      ref.scrollTop += scrollDistance;
    }
  };

  const isLeftDisabled = scrollState.x === 0;
  const isRightDisabled = ref ? scrollState.x >= ref.scrollWidth - ref.clientWidth : true;
  const isUpDisabled = scrollState.y === 0;
  const isDownDisabled = ref ? scrollState.y >= ref.scrollHeight - ref.clientHeight : true;

  return {
    setRef,
    scrollLeft,
    scrollRight,
    scrollUp,
    scrollDown,
    isLeftDisabled,
    isRightDisabled,
    isUpDisabled,
    isDownDisabled
  };
};
