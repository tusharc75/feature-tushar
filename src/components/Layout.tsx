import { Toolbar, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { cn } from 'src/constants/helpers';
import { SIDEBAR_OPEN, SIDEBAR_OPENED_BY_BUTTON, useStore } from 'src/StateProvider/fastContext';
import Sidebar from './Sidebar/Sidebar';
import { useInforSidebar } from 'src/components/InfoSidebar/store';
import { InfoSidebar } from 'src/components/InfoSidebar';

const Layout = ({ children }) => {
  const [infoSidebarData] = useInforSidebar((state) => state.data);
  const contentRef = useRef(null);
  const bodyRef = useRef(null);
  const isSidebarOutsideScreen = useMediaQuery('(max-width:959px)');

  const [isSidebarOpen, setIsSidebarOpen] = useStore((store) => store[SIDEBAR_OPEN]);
  const [sidebarOpenedByButton] = useStore((store) => store[SIDEBAR_OPENED_BY_BUTTON]);
  const [showChat, setShowChat] = useState({ show: true, oldScrollPosition: 0 });
  const isMobileWidth = useMediaQuery('(max-width:959px)');

  const handleSidebarClose = () => {
    if (!isSidebarOutsideScreen) return;
    setIsSidebarOpen({ [SIDEBAR_OPEN]: false });
  };

  const onScroll = (e) => {
    if (isMobile) {
      const currentPosition = e.target?.scrollTop ?? 0;
      if (currentPosition - showChat.oldScrollPosition > 10) {
        setShowChat({ show: false, oldScrollPosition: currentPosition });
      } else if (currentPosition <= showChat.oldScrollPosition) {
        setShowChat({ show: true, oldScrollPosition: currentPosition });
      }
    }
  };

  return (
    <>
      <Sidebar />
      <div ref={contentRef} className="[--info-sidebar-w:min(100%,300px)]">
        <Toolbar />
        <div className={cn('relative flex')}>
          {!isMobileWidth && <Toolbar style={{ width: '66px' }} />}
          <motion.div
            animate={{ opacity: 1 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            exit={{ opacity: 0 }}
            className={cn(` min-h-[calc(100vh-64px)] w-full flex-grow overflow-hidden max-[768px]:min-h-[calc(100vh-108px)]`)}
            // style={{ backgroundColor: theme === 'light' ? '#f1f5ff' : 'var(--dark-secondary)' }}
            onClick={handleSidebarClose}
          >
            <div
              className={`z-[1] mx-auto h-full w-[calc(100%-2%)] flex-grow  [transition:padding_195ms_cubic-bezier(0.4,_0,_0.6,_1)_0ms] max-[900px]:w-full max-[900px]:px-[13px] ${
                isSidebarOpen && sidebarOpenedByButton ? 'min-[960px]:pl-[222px]' : ''
              }`}
              ref={bodyRef}
              onScroll={onScroll}
            >
              {children}
            </div>
          </motion.div>
          <div
            className={cn(
              'max-sm: absolute bottom-0 right-0 top-0 flex h-screen flex-shrink-0 overflow-hidden transition-[width] duration-0 motion-safe:duration-300 sm:static',
              infoSidebarData ? 'w-[--info-sidebar-w]' : 'w-0'
            )}
          >
            <div className="sticky top-0 z-10 flex w-[--info-sidebar-w] flex-grow border bg-white">{infoSidebarData && <InfoSidebar />}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Layout;
