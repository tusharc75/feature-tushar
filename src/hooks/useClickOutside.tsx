import { useEffect, useState } from 'react';

const useClickdOutside = (ref: any) => {
  const [clickedOutside, setClickedOutside] = useState(false);
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setClickedOutside(true);
      } else {
        setClickedOutside(false);
      }
    };
    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, []);
  return clickedOutside;
};
export default useClickdOutside;
