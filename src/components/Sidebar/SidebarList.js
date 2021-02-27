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
import { Link, withRouter } from "react-router-dom";
import { kebabCase as _kebabCase, lowerCase as _lowerCase } from 'lodash'

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
      <Box>
        {sidebarItem.map((item, index) => (
          <Link
            key={index}
            to={`/${_kebabCase(_lowerCase(item.name))}`}
          >
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
          </Link>
        ))}
      </Box>

    </div>
  );
};

export default SidebarList;
