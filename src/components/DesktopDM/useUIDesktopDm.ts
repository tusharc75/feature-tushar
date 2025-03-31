import React from 'react';
import { isMobile } from 'react-device-detect';

const windowWidth = window.innerWidth;

const useUIDesktopDm = () => {
  return { isMobile };
};

export default useUIDesktopDm;
