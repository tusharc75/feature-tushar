import React from 'react';

export function usePrevious<D>(value: D) {
  const [current, setCurrent] = React.useState<D>(value);
  const [previous, setPrevious] = React.useState<D>(null);

  if (value !== current) {
    setPrevious(current);
    setCurrent(value);
  }

  return previous;
}

export default usePrevious;
