import React, { useState } from "react";
import { Toolbar, Box, makeStyles } from "@material-ui/core";

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

const Layout = ({ children }) => {
  const {
    state: { userLoading },
  }: any = useData();
  const classes = useStyles();
  const [toggleDrawer, setToggleDrawer] = useState(false);

  return (
    <>
      {/* <SideBar>{children }</SideBar> */}
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
            <Toolbar style={{ width: "55px" }} />
            <main className={classes.content}>
              {children}
              <Footer />
            </main>
          </Box>
        </div>
      )}
    </>
  );
};

export default Layout;
