import * as React from 'react';

type State = {
  x: number;
  y: number;
  elementX: number;
  elementY: number;
  elementPositionX: number;
  elementPositionY: number;
  width: number;
  height: number;
  isIntersecting: boolean;
};

export default function useTooltip(providedRef?: React.MutableRefObject<HTMLElement>) {
  const [state, setState] = React.useState<State>({
    x: 0,
    y: 0,
    elementX: 0,
    elementY: 0,
    elementPositionX: 0,
    elementPositionY: 0,
    width: 0,
    height: 0,
    isIntersecting: false
  });

  const internalRef = React.useRef<HTMLElement>(null);
  const ref = providedRef || internalRef;

  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const handleMouseMove = (event) => {
      let newState: Partial<State> = {
        x: event.pageX,
        y: event.pageY
      };

      if (element && ref.current.nodeType === Node.ELEMENT_NODE) {
        const { left, top, width, height } = element.getBoundingClientRect();
        const elementPositionX = left + window.scrollX;
        const elementPositionY = top + window.scrollY;
        const elementX = event.pageX - elementPositionX;
        const elementY = event.pageY - elementPositionY;
        newState.width = width;
        newState.height = height;
        newState.elementX = elementX;
        newState.elementY = elementY;
        newState.elementPositionX = elementPositionX;
        newState.elementPositionY = elementPositionY;
      }

      setState((s) => {
        return {
          ...s,
          ...newState
        };
      });
    };

    const handleMouseEnter = () => {
      setState((prev) => ({ ...prev, isIntersecting: true }));
    };
    const handleMouseLeave = () => {
      setState((prev) => ({ ...prev, isIntersecting: false }));
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [{ ...state } as State, ref] as const;
}
