import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Box,
  Typography,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@material-ui/core";
import clsx from "clsx";
import { SVG } from "../../assets";

const useStyles = makeStyles((theme) => ({
  hide: {
    display: "none",
  },
  drawerIcon: {
    width: 18,
  },
  heading: {
    fontWeight: "normal",
    marginLeft: theme.spacing(2),
  },
}));

const SidebarList = ({ sidebarItem, toggleDrawer }) => {
  const classes = useStyles();
  return (
    <div>
      {/* Master Data */}

      {sidebarItem["Master Data"] && (
        <Box>
          <Typography
            className={clsx(classes.heading, {
              [classes.hide]: !toggleDrawer,
            })}
            variant="h6"
          >
            Master Data
          </Typography>
          {sidebarItem["Master Data"].map((item) => (
            <ListItem button key={item.id}>
              <ListItemIcon>
                <img
                  className={classes.drawerIcon}
                  src={SVG(item.name)}
                  alt={item.name}
                />
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItem>
          ))}
        </Box>
      )}

      {/* Admin Portal */}
      {sidebarItem["Admin Portal"] && (
        <Box>
          <Typography
            className={clsx(classes.heading, {
              [classes.hide]: !toggleDrawer,
            })}
            variant="h6"
          >
            Admin Portal
          </Typography>

          {sidebarItem["Admin Portal"].map((item) => (
            <ListItem button key={item.id}>
              <ListItemIcon>
                <img
                  className={classes.drawerIcon}
                  src={SVG(item.name)}
                  alt="users"
                />
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItem>
          ))}
        </Box>
      )}

      {/* Admin Portal */}
      {sidebarItem["CRM"] && (
        <Box>
          <Typography
            className={clsx(classes.heading, {
              [classes.hide]: !toggleDrawer,
            })}
            variant="h6"
          >
            CRM
          </Typography>

          {sidebarItem["CRM"].map((item) => (
            <ListItem button key={item.id}>
              <ListItemIcon>
                <img
                  className={classes.drawerIcon}
                  src={SVG(item.name)}
                  alt={item.name}
                />
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItem>
          ))}
        </Box>
      )}

      {/* Activity Management */}
      {sidebarItem["Activities Management"] && (
        <Box>
          <Typography
            className={clsx(classes.heading, {
              [classes.hide]: !toggleDrawer,
            })}
            variant="h6"
          >
            Activities Management
          </Typography>

          {sidebarItem["Activities Management"].map((item) => (
            <ListItem button key={item.id}>
              <ListItemIcon>
                <img
                  className={classes.drawerIcon}
                  src={SVG(item.name)}
                  alt={item.name}
                />
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItem>
          ))}
        </Box>
      )}
    </div>
  );
};

export default SidebarList;
