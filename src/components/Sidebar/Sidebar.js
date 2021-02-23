import React from "react";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import {
  Drawer,
  Toolbar,
  List,
  CssBaseline,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box
} from "@material-ui/core";

import {
  ChevronRight,
  ChevronLeft,
} from "@material-ui/icons";

import { SVG } from "../../assets";
import Header from "../Header/Header";
import Loader from "../Loader";
import { useData } from "../../StateProvider/Provider";
import "./Sidebar.css";
import SidebarList from "./SidebarList";
import BreadCrumbs from "../BreadCrumbs";

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },

  hide: { display: "none" },

  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  drawerOpen: {
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerClose: {
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: "hidden",
    width: theme.spacing(8) + 1,
    // [theme.breakpoints.up("sm")]: {
    //   width: theme.spacing(9) + 1,
    // },
  },
  toolbar: {
    background: theme.palette.textLight,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: theme.spacing(0, 0.5),
  },
  menuIcon: {
    width: 22,
  },
  drawerIcon: {
    width: 18,
  },
  heading: {
    fontWeight: "normal",
    marginLeft: theme.spacing(2),
  },
  content: {
    flexGrow: 1,
    width: "calc(100% - 65px)",
    padding: theme.spacing(2),
    background: "#eef9fd",
  },
}));

export default function SideBar({ children }) {
  const {
    state: { user, userLoading },
  } = useData();
  const classes = useStyles();
  const [toggleDrawer, setToggleDrawer] = React.useState(false);

  const handleToggleDrawer = () => {
    setToggleDrawer(!toggleDrawer);
  };

  return (
    <div className={classes.root}>
      <CssBaseline />
      <Header />
      <Drawer
        variant="permanent"
        className={clsx(classes.drawer, {
          [classes.drawerOpen]: toggleDrawer,
          [classes.drawerClose]: !toggleDrawer,
        })}
        classes={{
          paper: clsx({
            [classes.drawerOpen]: toggleDrawer,
            [classes.drawerClose]: !toggleDrawer,
          }),
        }}
      >
        <Toolbar />
        <div className={classes.toolbar}>
          <IconButton onClick={handleToggleDrawer}>
            {toggleDrawer ? <ChevronLeft /> : <ChevronRight />}
          </IconButton>
        </div>

        <div className={classes.drawerContainer}>
          <List>
            <ListItem button>
              <ListItemIcon>
                <img
                  className={classes.drawerIcon}
                  src={SVG("Dashboard")}
                  alt="dashboard"
                />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <img
                  className={classes.drawerIcon}
                  src={SVG("Activities")}
                  alt="activities"
                />
              </ListItemIcon>
              <ListItemText primary="Activities" />
            </ListItem>
            {user && (
              <SidebarList
                toggleDrawer={toggleDrawer}
                sidebarItem={user.role.sideBar}
              />
            )}
          </List>
        </div>
      </Drawer>

      <main className={classes.content}>
        <Toolbar />
        {
          userLoading ? <Loader /> : <Box>
            <BreadCrumbs />
            <Box marginY={2} />
            {children}
          </Box>
        }

      </main>
    </div>
  );
}
