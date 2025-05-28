import * as React from 'react';

type State = {
  x: number;
  y: number;
  elementX: number;
  elementY: number;
  elementPositionX: number;
  elementPositionY: number;
};

type FullState = State & {
  xIntersecting: boolean;
  yIntersecting: boolean;
  isIntersecting: boolean;
};

export default function useMouse(providedRef?: React.MutableRefObject<HTMLElement>) {
  const [state, setState] = React.useState<State>({
    x: 0,
    y: 0,
    elementX: 0,
    elementY: 0,
    elementPositionX: 0,
    elementPositionY: 0
  });

  const xIntersecting = state.elementX > 0 && state.elementX < 300;
  const yIntersecting = state.elementY > 0 && state.elementY < 300;
  const isIntersecting = xIntersecting && yIntersecting;

  const internalRef = React.useRef<HTMLElement>(null);
  const ref = providedRef || internalRef;

  React.useLayoutEffect(() => {
    const handleMouseMove = (event) => {
      let newState: Partial<State> = {
        x: event.pageX,
        y: event.pageY
      };

      if (ref.current && ref.current.nodeType === Node.ELEMENT_NODE) {
        const { left, top } = ref.current.getBoundingClientRect();
        const elementPositionX = left + window.scrollX;
        const elementPositionY = top + window.scrollY;
        const elementX = event.pageX - elementPositionX;
        const elementY = event.pageY - elementPositionY;

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

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [{ ...state, xIntersecting, yIntersecting, isIntersecting } as FullState, ref] as const;
}
