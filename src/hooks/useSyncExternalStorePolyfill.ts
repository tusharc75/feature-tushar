import { useEffect, useState } from 'react';

const useSyncExternalStorePolyfill = <T>(subscribe: (listener: () => void) => () => void, getSnapshot: () => T): T => {
  const [state, setState] = useState(getSnapshot);

  useEffect(() => {
    const handleChange = () => setState(getSnapshot);
    const unsubscribe = subscribe(handleChange);

    return unsubscribe;
  }, [subscribe, getSnapshot]);

  return state;
};

export default useSyncExternalStorePolyfill;
