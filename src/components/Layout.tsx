import { useEffect, useRef, useState } from 'react';
import { Toolbar, Box, makeStyles, withWidth } from '@material-ui/core';
import { motion } from 'framer-motion';
import { useLocation, useHistory } from 'react-router-dom';
import Joyride, { CallBackProps, STATUS, StoreHelpers, EVENTS, ACTIONS, LIFECYCLE } from 'react-joyride';
import { isMobile } from 'react-device-detect';
import Sidebar from './Sidebar/Sidebar';
import GlobalUserChat from './GlobalUserChat';
import { useData } from '../StateProvider/Provider';
import { SET_START_TOUR } from '../StateProvider/actionTypes';
import { AccountDetailsSteps, AccountSteps, DashboardSteps, UserSteps, ContactsSteps, ContactDetailsSteps } from '../constants/tourSteps';
import { useAppTheme } from 'src/constants/AppConfig';

const useStyles = makeStyles(() => ({
  content: {
    flexGrow: 1,
    width: '100%',
    overflow: 'hidden',
    minHeight: 'calc(100vh - 64px)',
    ['@media (max-width:768px)']: {
      minHeight: 'calc(100vh - 108px)'
    }
  },
  layout: {
    flexGrow: 1,
    width: 'calc(100% - 6%)',
    marginInline: 'auto',

    height: '100%',
    zIndex: 1,
    ['@media (max-width:900px)']: {
      paddingInline: '13px',
      width: '100%'
    }
  }
}));

const Layout = ({ children, width }) => {
  const [theme] = useAppTheme();
  const contentRef = useRef(null);
  const bodyRef = useRef(null);
  const { key, pathname } = useLocation();
  const classes = useStyles();
  const [toggleDrawer, setToggleDrawer] = useState<Boolean>(false);
  const {
    state: { tour },
    dispatch
  } = useData();

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

  useEffect(() => {
    contentRef.current.scrollIntoView({
      behaviour: 'smooth',
      block: 'start'
    });
  }, [key]);

  useEffect(() => {
    dispatch({
      type: SET_START_TOUR,
      payload: {
        start: false,
        path: '',
        stepIndex: 0
      }
    });
  }, [pathname]);

  const setTourActions = (start: boolean = false, path: string = '', stepIndex: number = 0) => {
    dispatch({
      type: SET_START_TOUR,
      payload: {
        start,
        path,
        stepIndex
      }
    });
  };

  const getHelpers = (helpers: StoreHelpers) => {};

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, action, lifecycle, step } = data;
    const finishedStatus: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    const eventStatus: string[] = [EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND];
    const lifecyleStatus: string[] = [LIFECYCLE.COMPLETE, LIFECYCLE.BEACON];

    if (finishedStatus.includes(status)) {
      setTourActions();
    } else if (eventStatus.includes(type)) {
      const stepIndex = index + (action === ACTIONS.PREV ? -1 : 1);

      /** ==> START HOME AND SIDE BAR LOGIC <== **/
      if (toggleDrawer && tour.path === '/' && index === 0) {
        setTimeout(() => {
          setTourActions(true, tour.path, stepIndex);
        }, 400);
      } else if (toggleDrawer && tour.path === '/' && index === 1 && action !== ACTIONS.CLOSE) {
        setTourActions(false, tour.path, stepIndex);
        setToggleDrawer(false);
        setTimeout(() => {
          setTourActions(true, tour.path, stepIndex);
        }, 400);
      } else if (tour.path === '/' && index === 2 && action === ACTIONS.PREV) {
        setTourActions(false, tour.path, stepIndex);
        setToggleDrawer(true);
        setTimeout(() => {
          setTourActions(true, tour.path, stepIndex);
        }, 400);
      } else if (tour.path === '/' && index === 0 && action === ACTIONS.NEXT) {
        setTourActions(false, tour.path, stepIndex);
        setToggleDrawer(true);
        setTimeout(() => {
          setTourActions(true, tour.path, stepIndex);
        }, 400);
      } else if (action === ACTIONS.CLOSE) {
        setToggleDrawer(false);
        setTourActions(false);
      } else {
        setToggleDrawer(false);
        setTourActions(tour.start, tour.path, stepIndex);
      }
      /** ==> END HOME AND SIDE BAR LOGIC <== **/

      /** ==> START ACCOUNT DETAILS PAGE LOGIC  <== **/
      const accountPaths = ['/customer-account/detail', '/supplier-account/detail'];
      if (accountPaths.includes(tour.path)) {
        const elem: any = step.target;

        if (action === ACTIONS.START) {
          // document.querySelector('.detailHeader').scrollIntoView({
          //   behavior: "smooth",
          //   inline: "center",
          //   block: 'nearest'
          // })
        } else if (stepIndex === 8 && action === ACTIONS.PREV) {
          // setTourActions()
          // setTimeout(() => {
          //   document.querySelector('.detailHeader').scrollIntoView({
          //     behavior: "smooth",
          //     inline: "center",
          //     block: 'nearest'
          //   })
          // }, 400)
          // setTimeout(() => { setTourActions(true, tour.path, stepIndex) }, 200)
        } else if (action === ACTIONS.CLOSE) {
          setTourActions();
        }
      }
      /** ==> END ACCOUNT DETAILS PAGE LOGIC <== **/
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      setTourActions();
    }
  };

  const grapSteps = () => {
    switch (tour.path) {
      case '/':
        return DashboardSteps;
      case '/user':
        return UserSteps;
      case '/customer-account':
        return AccountSteps;
      case '/supplier-account':
        return AccountSteps;
      case '/customer-contact':
        return ContactsSteps;
      case '/supplier-contact':
        return ContactsSteps;
      case '/customer-account/detail':
        return AccountDetailsSteps;
      case '/supplier-account/detail':
        return AccountDetailsSteps;
      case '/customer-contact/detail':
        return ContactDetailsSteps;
      case '/supplier-contact/detail':
        return ContactDetailsSteps;
      default:
        return;
    }
  };

  return (
    <div ref={contentRef}>
      {/* <Joyride
        continuous
        callback={handleJoyrideCallback}
        getHelpers={getHelpers}
        run={tour.start}
        disableScrollParentFix={true}
        scrollOffset={0}
        stepIndex={tour.stepIndex}
        scrollToFirstStep={true}
        showProgress={true}
        showSkipButton={false}
        steps={grapSteps()}
        styles={{
          options: {
            zIndex: 10000
          }
        }}
      /> */}
      <Sidebar toggleDrawer={toggleDrawer} setToggleDrawer={setToggleDrawer} />
      <Toolbar />
      <Box display="flex">
        {!mobileWidths.includes(width) && <Toolbar style={{ width: '66px' }} />}
        <motion.div
          animate={{ opacity: 1 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          exit={{ opacity: 0 }}
          className={classes.content}
          style={{ backgroundColor: theme === 'light' ? '#f1f5ff' : 'var(--dark-secondary)' }}
          onClick={handleToggleState}
        >
          <div className={classes.layout} ref={bodyRef} onScroll={onScroll}>
            {children}
          </div>
        </motion.div>
      </Box>
      {showChat.show && <GlobalUserChat />}
    </div>
  );
};

export default withWidth()(Layout);
