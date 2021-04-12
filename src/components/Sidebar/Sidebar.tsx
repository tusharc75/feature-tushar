import React, { useState } from "react";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import {
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Toolbar,
  Collapse,
} from "@material-ui/core";
import { Link, withRouter } from "react-router-dom";
import Header from "../Header/Header";
import { useData } from "../../StateProvider/Provider";
import "./Sidebar.scss";
import {
  ChevronLeft,
  ChevronRight,
  ExpandMore,
  ExpandLess,
} from "@material-ui/icons";
import _ from "lodash";

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
    overflowY: "scroll",
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
    width: theme.spacing(6) - 1,
    [theme.breakpoints.down("sm")]: {
      width: 0,
    },
  },
  toolbar: {
    background: "#dcdcdc",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: theme.spacing(0),
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

  nested: {
    paddingLeft: theme.spacing(4),
  },
}));

function SideBar({ toggleDrawer, setToggleDrawer, location }) {
  const {
    state: { user, selectedEntity },
  }: any = useData();
  const classes = useStyles();
  const [open, setOpen] = useState({});
  const pathnames = location.pathname.split("/").filter((x) => x);

  const handleToggleDrawer = () => {
    setToggleDrawer(!toggleDrawer);
  };

  const listItems = () => {
    if (user) {
      const sections = [];

      let entityData;
      if (user.entity && user.entity.length) {
        entityData = user.entity.find(
          (curEntity) => curEntity._id === selectedEntity
        );
      }

      user.role.sideBar.forEach((item) => {
        if (!sections.includes(item.sectionName) && item.isRead) {
          sections.push(item.sectionName);
        }
      });

      if (entityData.resource && entityData.resource.length) {
        entityData.resource.forEach((item) => {
          if (!sections.includes(item.sectionName) && item.isRead) {
            sections.push(item.sectionName);
          }
        });
      }

      return sections.map((section) => {
        const lists = user.role.sideBar.filter(
          (list) => list.sectionName === section
        );

        let enitityList = [];

        if (entityData.resource && entityData.resource.length) {
          enitityList = entityData.resource.filter(
            (list) => list.sectionName === section
          );
        }

        const items = [...lists, ...enitityList].filter(
          (item) => item.isRead === true
        );
        return { section, items };
      });
    }
  };

  const handleCollapse = (section) => {
    let tempdata = { ...open };
    tempdata[section] = !tempdata[section] || false;
    setOpen(tempdata);
  };

  return (
    <div className={classes.root}>
      <CssBaseline />
      <Header toggleDrawer={handleToggleDrawer} />
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

        <div
          className={clsx({
            [classes.hide]: !toggleDrawer,
          })}
        >
          <List>
            <Link to="/">
              <ListItem button selected={location.pathname === "/"}>
                <ListItemText primary="Dashboard" />
              </ListItem>
            </Link>
            <Link to="/activity">
              <ListItem button selected={pathnames[0] === "activity"}>
                <ListItemText primary="Activities" />
              </ListItem>
            </Link>
            {user &&
              listItems().map((listItem, i) => (
                <React.Fragment key={i}>
                  <ListItem
                    button
                    key={listItem.section + "" + i}
                    onClick={() => handleCollapse(listItem.section)}
                  >
                    <ListItemText primary={listItem.section} />
                    {open[listItem.section] ? <ExpandLess /> : <ExpandMore />}
                  </ListItem>
                  <Collapse
                    in={open[listItem.section]}
                    timeout="auto"
                    unmountOnExit
                  >
                    <List component="div" disablePadding>
                      {listItem.items.map((item, j) => (
                        <Link
                          key={j}
                          to={`/${_.kebabCase(_.lowerCase(item.name))}`}
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

      {/* <main className={classes.content}>
        <Toolbar />
        {userLoading ? (
          <Loader />
        ) : (
          <Box>
            <Box marginY={2} />
            {children}
          </Box>
        )}
      </main> */}
    </div>
  );
}

export default withRouter(SideBar);
