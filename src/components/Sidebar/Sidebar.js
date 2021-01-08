import React from "react";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import Toolbar from "@material-ui/core/Toolbar";
import List from "@material-ui/core/List";
import CssBaseline from "@material-ui/core/CssBaseline";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import {
  menu_icon,
  dashboard,
  activities,
  customer,
  pricing,
  suppliers,
  product,
  location,
  users,
  terms_conditions,
  doa,
  contact,
  leads,
  opportunities,
  dollar,
  quote_builder,
  reminder,
  calender,
  flag,
} from "../../assets";
import Header from "../Header/Header";
import "./Sidebar.css";

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
    padding: theme.spacing(2),
    background: "#eef9fd",
  },
}));

export default function SideBar({ children }) {
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
            <img className={classes.menuIcon} src={menu_icon} alt="menu" />
          </IconButton>
        </div>

        <div className={classes.drawerContainer}>
          <List>
            <ListItem button>
              <ListItemIcon>
                <img
                  className={classes.drawerIcon}
                  src={dashboard}
                  alt="dashboard"
                />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <img
                  className={classes.drawerIcon}
                  src={activities}
                  alt="activities"
                />
              </ListItemIcon>
              <ListItemText primary="Activities" />
            </ListItem>

            {/* Master Data */}
            <Typography
              className={clsx(classes.heading, {
                [classes.hide]: !toggleDrawer,
              })}
              variant="h6"
            >
              Master Data
            </Typography>

            <ListItem button>
              <ListItemIcon>
                <img
                  className={classes.drawerIcon}
                  src={customer}
                  alt="customer"
                />
              </ListItemIcon>
              <ListItemText primary="Customer" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <img
                  className={classes.drawerIcon}
                  src={pricing}
                  alt="pricing"
                />
              </ListItemIcon>
              <ListItemText primary="Pricing" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <img
                  className={classes.drawerIcon}
                  src={suppliers}
                  alt="suppliers"
                />
              </ListItemIcon>
              <ListItemText primary="Suppliers" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <img
                  className={classes.drawerIcon}
                  src={product}
                  alt="product"
                />
              </ListItemIcon>
              <ListItemText primary="Products" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <img
                  className={classes.drawerIcon}
                  src={location}
                  alt="location"
                />
              </ListItemIcon>
              <ListItemText primary="Locations & Entities" />
            </ListItem>

            {/* Admin Portal */}
            <Typography
              className={clsx(classes.heading, {
                [classes.hide]: !toggleDrawer,
              })}
              variant="h6"
            >
              Admin Portal
            </Typography>

            <ListItem button>
              <ListItemIcon>
                <img className={classes.drawerIcon} src={users} alt="users" />
              </ListItemIcon>
              <ListItemText primary="Users" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <img
                  className={classes.drawerIcon}
                  src={terms_conditions}
                  alt="term conditions"
                />
              </ListItemIcon>
              <ListItemText primary="Terms & Conditions" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <img className={classes.drawerIcon} src={doa} alt="doa" />
              </ListItemIcon>
              <ListItemText primary="DOA" />
            </ListItem>

            {/* Sales Funnel */}
            <Typography
              className={clsx(classes.heading, {
                [classes.hide]: !toggleDrawer,
              })}
              variant="h6"
            >
              Sales Funnel
            </Typography>

            <ListItem button>
              <ListItemIcon>
                <img
                  className={classes.drawerIcon}
                  src={contact}
                  alt="contact"
                />
              </ListItemIcon>
              <ListItemText primary="Create Contact" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <img className={classes.drawerIcon} src={leads} alt="leads" />
              </ListItemIcon>
              <ListItemText primary="Leads" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <img
                  className={classes.drawerIcon}
                  src={opportunities}
                  alt="opportunities"
                />
              </ListItemIcon>
              <ListItemText primary="Opportunities" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <img
                  className={classes.drawerIcon}
                  src={dollar}
                  alt="price builder"
                />
              </ListItemIcon>
              <ListItemText primary="PRice Builder" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <img
                  className={classes.drawerIcon}
                  src={quote_builder}
                  alt="quote builder"
                />
              </ListItemIcon>

              <ListItemText primary="Quote Builder" />
            </ListItem>

            {/* Activity Management */}
            <Typography
              className={clsx(classes.heading, {
                [classes.hide]: !toggleDrawer,
              })}
              variant="h6"
            >
              Activity Management
            </Typography>

            <ListItem button>
              <ListItemIcon>
                <img
                  className={classes.drawerIcon}
                  src={reminder}
                  alt="reminder"
                />
              </ListItemIcon>
              <ListItemText primary="Reminder" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <img
                  className={classes.drawerIcon}
                  src={calender}
                  alt="calender"
                />
              </ListItemIcon>
              <ListItemText primary="Calender" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <img className={classes.drawerIcon} src={flag} alt="flags" />
              </ListItemIcon>
              <ListItemText primary="Flags" />
            </ListItem>
          </List>
        </div>
      </Drawer>

      <main className={classes.content}>
        <Toolbar />
        {children}
      </main>
    </div>
  );
}
