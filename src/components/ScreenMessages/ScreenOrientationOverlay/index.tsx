import React, { FC, useState, useEffect, useMemo } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import styles from './ScreenOrientationOverlay.module.scss';
import RotateRightOutlinedIcon from '@mui/icons-material/RotateRightOutlined';
import RotateLeftOutlinedIcon from '@mui/icons-material/RotateLeftOutlined';
import ReactDOM from 'react-dom';

const useDeviceOrientation = (): { landscape: boolean; portrait: boolean } => {
  const [orientation, setOrientation] = useState<{ landscape: boolean; portrait: boolean }>({ landscape: false, portrait: false });
  const detectOrientation = (e: MediaQueryListEvent) => {
    const portrait = e.matches;
    const landscape = !portrait;
    setOrientation({ landscape, portrait });
  };

  useEffect(() => {
    let mediaQuery = window.matchMedia('(orientation: portrait)');
    setOrientation({ landscape: !mediaQuery.matches, portrait: mediaQuery.matches });
    mediaQuery.addEventListener('change', detectOrientation);
    return () => mediaQuery.removeEventListener('change', detectOrientation);
  }, []);
  return orientation;
};

interface ScreenOrientationOverlayProps {
  displayOn: 'landscape' | 'portrait';
  device: 'mobile' | 'tablet';
}

const ScreenOrientationOverlay: FC<ScreenOrientationOverlayProps> = ({ displayOn, device }) => {
  const { landscape, portrait } = useDeviceOrientation();

  const shouldDisplay = useMemo(() => {
    if (device === 'mobile' && isMobile && !isTablet) {
      if (displayOn === 'landscape' && landscape) return true;
      if (displayOn === 'portrait' && portrait) return true;
      return false;
    }
    if (device === 'tablet' && isTablet) {
      if (displayOn === 'landscape' && landscape) return true;
      if (displayOn === 'portrait' && portrait) return true;
      return false;
    }
    return false;
  }, [landscape, portrait, displayOn, device]);

  useEffect(() => {
    if (shouldDisplay) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = null;
    }
    return () => (document.body.style.overflow = null);
  }, [shouldDisplay]);

  if (!import.meta.env.PROD) return null;

  return (
    <>
      {shouldDisplay &&
        ReactDOM.createPortal(
          <div
            className={`
            ${styles.overlay} 
              ${shouldDisplay ? styles.show : ''}
              ${styles[displayOn]}
              `}
          >
            <div className={styles.iconContainer}>
              <div className={styles.phone}>{displayOn === 'portrait' ? <RotateRightOutlinedIcon /> : <RotateLeftOutlinedIcon />}</div>
              <p>Rotate your device!</p>
            </div>
          </div>,
          document.querySelector('body') as HTMLBodyElement
        )}
    </>
  );
};

export default ScreenOrientationOverlay;
