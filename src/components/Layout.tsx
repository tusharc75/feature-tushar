import { Box, Toolbar, useMediaQuery, withWidth } from '@material-ui/core';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useLocation } from 'react-router-dom';
import { useData } from '../StateProvider/Provider';
import { SET_START_TOUR } from '../StateProvider/actionTypes';
import GlobalUserChat from './GlobalUserChat';
import Sidebar from './Sidebar/Sidebar';
// import { AccountDetailsSteps, AccountSteps, DashboardSteps, UserSteps, ContactsSteps, ContactDetailsSteps } from '../constants/tourSteps';
import { useAppTheme } from 'src/constants/AppConfig';
import { useStore, SIDEBAR_OPEN, SIDEBAR_OPENED_BY_BUTTON } from 'src/StateProvider/fastContext';

const Layout = ({ children, width }) => {
  const [theme] = useAppTheme();
  const contentRef = useRef(null);
  const bodyRef = useRef(null);
  const isSidebarOutsideScreen = useMediaQuery('(max-width:959px)');

  const [isSidebarOpen, setIsSidebarOpen] = useStore((store) => store[SIDEBAR_OPEN]);
  const [sidebarOpenedByButton] = useStore((store) => store[SIDEBAR_OPENED_BY_BUTTON]);
  const [showChat, setShowChat] = useState({ show: true, oldScrollPosition: 0 });
  const mobileWidths = ['xs', 'sm'];

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
      <div ref={contentRef}>
        <Toolbar />
        <Box display="flex">
          {!mobileWidths.includes(width) && <Toolbar style={{ width: '66px' }} />}
          <motion.div
            animate={{ opacity: 1 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            exit={{ opacity: 0 }}
            className={`flex-grow f-full overflow-hidden min-h-[calc(100vh-64px)] max-[768px]:min-h-[calc(100vh-108px)]`}
            style={{ backgroundColor: theme === 'light' ? '#f1f5ff' : 'var(--dark-secondary)' }}
            onClick={handleSidebarClose}
          >
            <div
              className={`flex-grow w-[calc(100%-6%)] mx-auto h-full z-[1]  max-[900px]:px-[13px] max-[900px]:w-full [transition:padding_195ms_cubic-bezier(0.4,_0,_0.6,_1)_0ms] ${
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

export default withWidth()(Layout);
