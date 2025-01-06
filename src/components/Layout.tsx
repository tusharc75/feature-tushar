import { Box, Toolbar, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import GlobalUserChat from './GlobalUserChat';
import Sidebar from './Sidebar/Sidebar';
import { useAppTheme } from 'src/constants/AppConfig';
import { useStore, SIDEBAR_OPEN, SIDEBAR_OPENED_BY_BUTTON } from 'src/StateProvider/fastContext';
import { usePathname } from 'src/hooks';
import { cn } from 'src/constants/helpers';

const Layout = ({ children }) => {
  const pathName = usePathname();
  const [theme] = useAppTheme();
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

  console.log(pathName);

  return (
    <>
      <Sidebar />
      <div ref={contentRef}>
        <Toolbar />
        <Box display="flex">
          {!isMobileWidth && <Toolbar style={{ width: '66px' }} />}
          <motion.div
            animate={{ opacity: 1 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            exit={{ opacity: 0 }}
            className={cn(
              `f-full min-h-[calc(100vh-64px)] flex-grow overflow-hidden max-[768px]:min-h-[calc(100vh-108px)]`,
              pathName !== '/' ? 'bg-[--dark-primary,white]' : 'bg-[--dark-secondary,#f1f5ff]'
            )}
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
        </Box>
        {showChat.show && <GlobalUserChat />}
      </div>
    </>
  );
};

export default Layout;
