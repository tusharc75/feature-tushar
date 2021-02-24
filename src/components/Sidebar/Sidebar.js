import React, { useState } from "react";
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
  Collapse,
} from "@material-ui/core";
import { Link, withRouter } from 'react-router-dom'
import { SVG } from "../../assets";
import Header from "../Header/Header";
import Loader from "../Loader";
import { useData } from "../../StateProvider/Provider";
import "./Sidebar.css";
import SidebarList from "./SidebarList";
import { ExpandLess, ExpandMore, ChevronLeft, ChevronRight } from "@material-ui/icons"
const _ = require('lodash')
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

function SideBar({ children, location }) {
  const {
    state: { user, userLoading },
  } = useData();
  const classes = useStyles();
  const [open, setOpen] = useState(true);
  const pathnames = location.pathname.split("/").filter((x) => x)

  const [toggleDrawer, setToggleDrawer] = React.useState(false);

  const handleToggleDrawer = () => {
    setToggleDrawer(!toggleDrawer);
  };

  const listItems = () => {
    if (user) {
      const sections = [];
      user.role.sideBar.forEach((item) => {
        if (!sections.includes(item.sectionName)) {
          sections.push(item.sectionName);
        }
      });

      return sections.map((section) => {
        const lists = user.role.sideBar.filter(
          (list) => list.sectionName === section
        );
        const items = lists.map((item) => item);
        return { section, items };
      });
    }
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
            {/* <img
              className={classes.menuIcon}
              src={SVG("Menu Icon")}
              alt="menu"
            /> */}
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

        <div
          className={clsx(classes.drawerContainer, {
            [classes.hide]: !toggleDrawer,
          })}
        >
          <List>
            {user &&
              listItems().map((listItem, i) => (
                <React.Fragment key={i}>
                  <ListItem button onClick={() => setOpen(!open)}>
                    <ListItemText primary={listItem.section} />
                    {open ? <ExpandLess /> : <ExpandMore />}
                  </ListItem>
                  <Collapse in={open} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {listItem.items.map((item, j) => (
                        <Link
                          key={j}
                          to={`/${_.kebabCase(listItem.section)}/${_.lowerCase(
                            item.name
                          )}`}
                        >
                          <ListItem
                            button
                            selected={pathnames.includes(
                              _.lowerCase(item.name)
                            )}
                            className={classes.nested}
                          >
                            <ListItemText primary={item.name} />
                          </ListItem>
                        </Link>
                      ))}
                    </List>
                  </Collapse>
                </React.Fragment>
              ))}
          </List>
        </div>

      </Drawer>

      <main className={classes.content}>
        <Toolbar />
        {userLoading ? <Loader /> : children}
      </main>
    </div>
  );
}
export default withRouter(SideBar)