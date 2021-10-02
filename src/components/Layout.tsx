import { useEffect, useRef, useState } from "react";
import { Toolbar, Box, makeStyles, withWidth } from "@material-ui/core";
import { motion } from "framer-motion";
import { useLocation, useHistory } from "react-router-dom";
import Joyride, { CallBackProps, STATUS, StoreHelpers, EVENTS, ACTIONS, LIFECYCLE } from 'react-joyride';


import Sidebar from "./Sidebar/Sidebar";
import GlobalUserChat from "./GlobalUserChat";
import { useData } from "../StateProvider/Provider";
import { SET_START_TOUR } from "../StateProvider/actionTypes";
import { AccountDetailsSteps, AccountSteps, DashboardSteps, UserSteps } from "../constants/tourSteps";

const useStyles = makeStyles(() => ({
  content: {
    flexGrow: 1,
    width: "100%",
    overflow: "hidden",
    height: "calc(100vh - 55px)",
  },
  layout: {
    flexGrow: 1,
    width: "100%",
    overflowX: "hidden",
    overflowY: "auto",
    height: "100%",
    zIndex: 1,
  }
}));

const Layout = ({ children, width }) => {
  const contentRef = useRef(null);
  const { key, pathname } = useLocation();
  const classes = useStyles();
  const [toggleDrawer, setToggleDrawer] = useState<Boolean>(false);
  const { state: { tour }, dispatch } = useData()

  const mobileWidths = ["xs", "sm"];

  const handleToggleState = () => toggleDrawer && setToggleDrawer(false);

  useEffect(() => {
    contentRef.current.scrollIntoView({
      behaviour: "smooth",
      block: "start",
    });
  }, [key]);

  useEffect(() => {
    dispatch({
      type: SET_START_TOUR, payload: {
        start: false,
        path: "",
        stepIndex: 0
      }
    })
  }, [pathname]);

  const setTourActions = (start: boolean = false, path: string = "", stepIndex: number = 0) => {
    dispatch({
      type: SET_START_TOUR, payload: {
        start,
        path,
        stepIndex
      }
    })
  }

  const getHelpers = (helpers: StoreHelpers) => { }

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, action, lifecycle, step } = data
    const finishedStatus: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    const eventStatus: string[] = [EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND]
    const lifecyleStatus: string[] = [LIFECYCLE.COMPLETE, LIFECYCLE.BEACON]

    if (finishedStatus.includes(status)) {
      setTourActions()
    } else if (eventStatus.includes(type)) {
      const stepIndex = index + (action === ACTIONS.PREV ? -1 : 1);

      /** ==> START HOME AND SIDE BAR LOGIC <== **/
      if (toggleDrawer && tour.path === "/" && index === 0) {
        setTimeout(() => {
          setTourActions(true, tour.path, stepIndex)
        }, 400)
      } else if (toggleDrawer && tour.path === "/" && index === 1) {
        setTourActions(false, tour.path, stepIndex)
        setToggleDrawer(false)
        setTimeout(() => {
          setTourActions(true, tour.path, stepIndex)
        }, 400)
      } else if (tour.path === "/" && index === 2 && action === ACTIONS.PREV) {
        setTourActions(false, tour.path, stepIndex)
        setToggleDrawer(true)
        setTimeout(() => {
          setTourActions(true, tour.path, stepIndex)
        }, 400)
      } else if (tour.path === "/" && index === 0 && action === ACTIONS.NEXT) {
        setTourActions(false, tour.path, stepIndex)
        setToggleDrawer(true)
        setTimeout(() => {
          setTourActions(true, tour.path, stepIndex)
        }, 400)
      } else {
        setToggleDrawer(false)
        setTourActions(tour.start, tour.path, stepIndex)
      }
      /** ==> END HOME AND SIDE BAR LOGIC <== **/


      /** ==> START ACCOUNT DETAILS PAGE LOGIC  <== **/
      const accountPaths = ["/customer-account/detail", "/supplier-account/detail"]
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
          setTourActions()
        }
      }
      /** ==> END ACCOUNT DETAILS PAGE LOGIC <== **/


    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      setTourActions()
    }
  }

  const grapSteps = () => {
    switch (tour.path) {
      case "/":
        return DashboardSteps;
      case "/user":
        return UserSteps
      case "/customer-account":
        return AccountSteps
      case "/supplier-account":
        return AccountSteps
      case "/customer-account/detail":
        return AccountDetailsSteps
      case "/supplier-account/detail":
        return AccountDetailsSteps
      default:
        return;
    }
  }

  return (
    <div ref={contentRef}>
      {['local', 'development'].includes(process.env.REACT_APP_ENV) && <Joyride
        continuous
        callback={handleJoyrideCallback}
        getHelpers={getHelpers}
        run={tour.start}
        disableScrollParentFix={true}
        scrollOffset={0}
        stepIndex={tour.stepIndex}
        scrollToFirstStep={true}
        showProgress={true}
        showSkipButton={true}
        steps={grapSteps()}
        styles={{
          options: {
            zIndex: 10000
          }
        }}
      />}
      <Sidebar toggleDrawer={toggleDrawer} setToggleDrawer={setToggleDrawer} />
      <Toolbar />
      <Box display="flex">
        {!mobileWidths.includes(width) && <Toolbar style={{ width: "48px" }} />}
        <motion.div
          animate={{ opacity: 1 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          exit={{ opacity: 0 }}
          className={classes.content}
          onClick={handleToggleState}
        >
          <div className={classes.layout}>
            {children}
          </div>
        </motion.div>
      </Box>
      <GlobalUserChat />
    </div>
  );
};

export default withWidth()(Layout);
