import { Box, Toolbar, withWidth } from '@material-ui/core';
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

const Layout = ({ children, width }) => {
  const [theme] = useAppTheme();
  const contentRef = useRef(null);
  const bodyRef = useRef(null);

  const [toggleDrawer, setToggleDrawer] = useState<Boolean>(false);

  const [showChat, setShowChat] = useState({ show: true, oldScrollPosition: 0 });

  const mobileWidths = ['xs', 'sm'];

  const handleToggleState = () => toggleDrawer && setToggleDrawer(false);

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
    <div ref={contentRef}>
      <Sidebar toggleDrawer={toggleDrawer} setToggleDrawer={setToggleDrawer} />
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
          onClick={handleToggleState}
        >
          <div
            className={`flex-grow w-[calc(100%-6%)] mx-auto h-full z-[1]  max-[900px]:px-[13px] max-[900px]:w-full [transition:padding_195ms_cubic-bezier(0.4,_0,_0.6,_1)_0ms] ${
              toggleDrawer ? 'min-[960px]:pl-[222px]' : ''
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
  );
};

export default withWidth()(Layout);
