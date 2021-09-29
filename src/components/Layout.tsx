import { useEffect, useRef, useState } from "react";
import { Toolbar, Box, makeStyles, withWidth } from "@material-ui/core";
import { motion } from "framer-motion";
import { useLocation, useHistory } from "react-router-dom";
import Joyride, { CallBackProps, STATUS, StoreHelpers } from 'react-joyride';


import Sidebar from "./Sidebar/Sidebar";
import GlobalUserChat from "./GlobalUserChat";
import { useData } from "../StateProvider/Provider";
import { SET_START_TOUR } from "../StateProvider/actionTypes";
import { DashboardSteps, UserSteps } from "../constants/tourSteps";

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
  const { key } = useLocation();
  const history = useHistory();
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

  const getHelpers = (helpers: StoreHelpers) => {

  }

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data
    const finishedStatus: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatus.includes(status)) {
      dispatch({
        type: SET_START_TOUR, payload: {
          start: false,
          path: ""
        }
      })
    }
  }

  const grapSteps = () => {
    switch (tour.path) {
      case "/":
        return DashboardSteps;
      case "/user":
        return UserSteps
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
