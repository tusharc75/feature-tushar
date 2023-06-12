import React, { FC, useState, useEffect, useMemo } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import styles from './ScreenOrientationOverlay.module.scss';
import RotateRightOutlinedIcon from '@material-ui/icons/RotateRightOutlined';
import RotateLeftOutlinedIcon from '@material-ui/icons/RotateLeftOutlined';
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
    return (
      ((displayOn === 'landscape' && landscape) || (displayOn === 'portrait' && portrait)) &&
      ((device === 'mobile' && isMobile) || (device === 'tablet' && isTablet))
    );
  }, [landscape, portrait, isMobile, isTablet, displayOn, device]);

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
