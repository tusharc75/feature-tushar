import { useEffect, useRef, useState } from "react";
import { Toolbar, Box, makeStyles, withWidth } from "@material-ui/core";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

import Sidebar from "./Sidebar/Sidebar";

const useStyles = makeStyles(() => ({
  content: {
    flexGrow: 1,
    width: "100%",
    overflow: "hidden",
    minHeight: "calc(100vh - 55px)",
  },
}));

const Layout = ({ children, width }) => {
  const contentRef = useRef(null);
  const { key } = useLocation();
  const classes = useStyles();
  const [toggleDrawer, setToggleDrawer] = useState<Boolean>(false);

  const mobileWidths = ["xs", "sm"];

  const handleToggleState = () => toggleDrawer && setToggleDrawer(false);

  useEffect(() => {
    contentRef.current.scrollIntoView({
      behaviour: "smooth",
      block: "start",
    });
  }, [key]);

  return (
    <div ref={contentRef}>
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
          {children}
        </motion.div>
      </Box>
    </div>
  );
};

export default withWidth()(Layout);
