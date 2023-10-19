import { useState, useEffect } from 'react';

export default function useDebounce<T>(next: T, ms = 300) {
  const [value, setValue] = useState<T>(next);

  useEffect(() => {
    const id = setTimeout(() => setValue(next), ms);
    return () => clearTimeout(id);
  }, [next, ms]);

  return value;
}
