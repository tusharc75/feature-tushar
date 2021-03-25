import { useState } from "react";
import { Toolbar, Box, makeStyles, withWidth } from "@material-ui/core";
import { motion } from "framer-motion";

import Sidebar from "./Sidebar/Sidebar";
import Footer from "./Footer";
import Loader from "./Loader";
import { useData } from "../StateProvider/Provider";

const useStyles = makeStyles((theme) => ({
  content: {
    flexGrow: 1,
    width: "100%",
    padding: theme.spacing(2),
    background: "#eef9fd",
  },
}));

const Layout = ({ children, width }) => {
  const {
    state: { userLoading },
  }: any = useData();
  const classes = useStyles();
  const [toggleDrawer, setToggleDrawer] = useState<Boolean>(false);

  const mobileWidths = ["xs", "sm"];

  const handleToggleState = () => toggleDrawer && setToggleDrawer(false);

  return (
    <>
      {userLoading ? (
        <Loader
          text="Securely Loggin In"
          style={{ height: "calc(100vh - 88px)" }}
        />
      ) : (
        <div>
          <Sidebar
            toggleDrawer={toggleDrawer}
            setToggleDrawer={setToggleDrawer}
          />
          <Toolbar />
          <Box display="flex">
            {!mobileWidths.includes(width) && (
              <Toolbar style={{ width: "48px" }} />
            )}
            <motion.main
              animate={{ opacity: 1 }}
              initial={{ opacity: 0.6 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              exit={{ opacity: 0 }}
              className={classes.content}
              onClick={handleToggleState}
            >
              {children}
              <Footer />
            </motion.main>
          </Box>
        </div>
      )}
    </>
  );
};

export default withWidth()(Layout);
