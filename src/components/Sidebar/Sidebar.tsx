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
  ListItemIcon,
  Grid,
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
import { FaUserTie, FaDatabase, FaHandshake } from 'react-icons/fa';
import { BsCalendarFill, BsFillPuzzleFill } from 'react-icons/bs';
import { MdDashboard, MdLocalActivity } from 'react-icons/md';
import SidebarImage from '../../assets/header-bg.png';
import Avatar from '@material-ui/core/Avatar';
import { RiFolderSettingsFill } from 'react-icons/ri';
import { RiAccountPinCircleFill } from 'react-icons/ri';
import { SiCivicrm } from 'react-icons/si';
import {IoIosArrowDroprightCircle ,IoIosArrowDropleftCircle } from 'react-icons/io';

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
    overflowY: "auto",
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
    width: "3rem",
    [theme.breakpoints.down("sm")]: {
      width: 0,
    },
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: theme.spacing(0),
    borderBottom: "2px solid #f5f8f9"
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
  sidebarUser: {
    padding: "1.5rem 1rem 1rem",
    background: "#fff",
    color: "#153d77",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    height: "8rem"
  },
}));

function SideBar({ toggleDrawer, setToggleDrawer, location }) {
  const {
    state: { user, selectedEntity },
  }: any = useData();
  const classes = useStyles();
  const [open, setOpen] = useState({});
  const pathnames = location.pathname.split("/").filter((x) => x);
  const iconMapping = [
    {
      key: 'Brand Admin',
      icon: <FaUserTie size={15} className="sidebar-icon" />
    },
    {
      key: 'Master Data',
      icon: <FaDatabase size={15} className="sidebar-icon" />
    },
    {
      key: 'Product Setup',
      icon: <RiFolderSettingsFill size={15} className="sidebar-icon" />
    },
    {
      key: 'Admin Portal',
      icon: <BsCalendarFill size={15} className="sidebar-icon" />
    },
    {
      key: 'CRM',
      icon: <FaHandshake size={15} className="sidebar-icon" />
    },
    {
      key: 'Activities Management',
      icon: <BsFillPuzzleFill size={15} className="sidebar-icon" />
    },
    {
      key: 'Accounts',
      icon: <RiAccountPinCircleFill size={15} className="sidebar-icon" />
    },
    {
      key: 'CRM +',
      icon: <SiCivicrm size={15} className="sidebar-icon" />
    }


  ]
  const handleToggleDrawer = () => {
    setToggleDrawer(!toggleDrawer);
  };

  const listItems = () => {
    if (user) {
      const sections = [];

      let entityData;
      if (user?.entity && user.entity.length) {
        entityData = user.entity.find(
          (curEntity) => curEntity._id === selectedEntity
        );
      }

      user.role.sideBar.forEach((item) => {
        if (!sections.includes(item.sectionName) && item.isRead) {
          sections.push(item.sectionName);
        }
      });

      if (entityData?.resource && entityData.resource.length) {
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

        if (entityData?.resource && entityData.resource.length) {
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
        //  onMouseEnter={handleToggleDrawer}
        //   onMouseLeave={handleToggleDrawer}
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
          <Grid container>
            <Grid item md={12} className="d-flex align-items-center gap-1">
            <span onClick={handleToggleDrawer}>
                {toggleDrawer ? <IoIosArrowDropleftCircle size={30}/> : <IoIosArrowDroprightCircle size={20}/>}
              </span>
              <div className={classes.sidebarUser}>
                {
                  user?.user?.avatar ? <Avatar className="d-flex align-items-center gap-1" src={user?.user?.avatar}></Avatar>
                    : <Avatar className="d-flex align-items-center gap-1"></Avatar>
                }
                <div className="d-flex align-items-center gap-1">{[user?.user?.firstName, user?.user?.lastName].filter(f => f).join(" ")}</div>
                <small className="d-flex align-items-center gap-1">{user?.user?.email}</small>
              </div>
            </Grid>
            
          </Grid>
        </div>
        <div>
          <List className="sidebar-list">
            <Link to="/">
              <ListItem button selected={location.pathname === "/"} className="list-item">
                <ListItemIcon>
                  <MdDashboard size={15} className="sidebar-icon" />
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItem>
            </Link>
            <Link to="/activity">
              <ListItem button selected={pathnames[0] === "activity"} className="list-item">
                <ListItemIcon>
                  <MdLocalActivity size={15} className="sidebar-icon" />
                </ListItemIcon>
                <ListItemText primary="Activities" />
              </ListItem>
            </Link>
            {user &&
              listItems().map((listItem, i) => (
                <React.Fragment key={i}>
                  <ListItem className="list-item"
                    button
                    key={listItem.section + "" + i}
                    onClick={() => handleCollapse(listItem.section)} >
                    <ListItemIcon >
                      {iconMapping.find((mapping) => {
                        return (mapping.key === listItem.section)
                      })?.icon
                      }
                    </ListItemIcon>
                    <ListItemText primary={listItem.section} />
                    {open[listItem.section] ? <ExpandLess /> : <ExpandMore />}
                  </ListItem>
                  <Collapse
                    in={open[listItem.section]}
                    timeout="auto"
                    unmountOnExit
                  >
                    <List component="div" disablePadding className="list-item">
                      {listItem.items.map((item, j) => (
                        <Link className="sub-list"
                          key={j}
                          to={`/${_.kebabCase(_.lowerCase(item.name))}`}>
                          <ListItem
                            button
                            selected={pathnames.includes(
                              _.lowerCase(item.name)
                            )}
                            className={classes.nested}>
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
