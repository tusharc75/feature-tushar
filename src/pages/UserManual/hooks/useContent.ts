import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getPageDataByUrl } from '../utils';
import { useUserManualStore } from './useUsermanual';

const imageClasses = ['aspect-video', 'animate-pulse', 'dark:bg-slate-700'];

const useContent = () => {
  const [currentRoute] = useUserManualStore((store) => store.currentRoute);
  const [manualData] = useUserManualStore((store) => store.manualData);
  const [isMobile] = useUserManualStore((store) => store.isMobile);
  const [loading] = useUserManualStore((store) => store.loading);
  const data = getPageDataByUrl(manualData, currentRoute, true);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isScrolling = useRef(false);

  const [zoomedImage, setZoomedImage] = useState(null);
  const handleClick = useCallback((e) => {
    if (e.target.tagName === 'IMG') {
      setZoomedImage(e.target);
    }
  }, []);

  useEffect(() => {
    if (zoomedImage) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [zoomedImage]);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    const container = mainContainerRef.current;
    if (!container) return;
    if (location.hash) {
      clearTimeout(scrollTimeout);
      const el = container.querySelector(location.hash);
      if (el) {
        isScrolling.current = true;
        el.scrollIntoView({ behavior: 'smooth' });
        scrollTimeout = setTimeout(() => {
          isScrolling.current = false;
        }, 1000);
      }
    }
  }, [location.hash, loading]);

  useEffect(() => {
    const container = mainContainerRef.current;
    if (!container) return;

    const imgs = container.querySelectorAll<HTMLImageElement>('img');

    imgs.forEach((img) => {
      const cleanupClass = () => {
        img.classList.remove(...imageClasses);
      };
      img.classList.add('w-full', 'h-auto', 'bg-gray-100', ...imageClasses);

      if (img.complete) {
        // already loaded
        cleanupClass();
      } else {
        // wait for load
        img.addEventListener('load', cleanupClass, { once: true });
      }
    });
  }, [data, loading]);

  return { data, zoomedImage, handleClick, isMobile, mainContainerRef, setZoomedImage, currentRoute, loading, isScrolling: isScrolling.current };
};

export default useContent;
