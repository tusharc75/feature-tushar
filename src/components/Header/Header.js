import React from "react";
import { fade, makeStyles } from "@material-ui/core/styles";

import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Menu,
  MenuItem,
} from "@material-ui/core";
import {
  Search,
  AccountCircle,
  FilterList,
  Add,
  Settings,
  HelpOutline,
  ExpandMore,
} from "@material-ui/icons";
import { logo } from "../../assets";

import "./Header.css";

const useStyles = makeStyles((theme) => ({
  grow: {
    flexGrow: 1,
  },
  appBar: {
    backgroundColor: theme.palette.darkBg,
    zIndex: theme.zIndex.drawer + 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    display: "none",
    [theme.breakpoints.up("sm")]: {
      display: "block",
    },
  },
  search: {
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    "&:hover": {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      marginLeft: theme.spacing(3),
      width: "auto",
    },
  },
  searchIcon: {
    padding: theme.spacing(0, 2),
    height: "100%",
    position: "absolute",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  inputRoot: {
    color: "inherit",
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: "20ch",
    },
  },
  sectionDesktop: {
    display: "none",
    [theme.breakpoints.up("md")]: {
      display: "flex",
    },
  },
  sectionMobile: {
    display: "flex",
    [theme.breakpoints.up("md")]: {
      display: "none",
    },
  },
}));

const Header = () => {
  const classes = useStyles();
  const [supportAnchorEl, setSupportAnchorEl] = React.useState(null);
  const [arcelorAnchorEl, setArcelorAnchorEl] = React.useState(null);

  const isSupportMenuOpen = Boolean(supportAnchorEl);
  const isArcelorMenuOpen = Boolean(arcelorAnchorEl);

  const openSupportMenu = (event) => {
    setSupportAnchorEl(event.currentTarget);
  };

  const supportMenuClose = () => {
    setSupportAnchorEl(null);
  };

  const openArcelorMenu = (event) => {
    setArcelorAnchorEl(event.currentTarget);
  };

  const arcelorMenuClose = () => {
    setArcelorAnchorEl(null);
  };

  const supportMenuId = "support-menu";

  const supportMenu = (
    <Menu
      anchorEl={supportAnchorEl}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      keepMounted
      id={supportMenuId}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      open={isSupportMenuOpen}
      onClose={supportMenuClose}
    >
      <MenuItem>Option 1</MenuItem>
      <MenuItem>Option 2</MenuItem>
    </Menu>
  );

  const arcelorMenuId = "arcelor-menu";

  const arcelorMenu = (
    <Menu
      anchorEl={arcelorAnchorEl}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      keepMounted
      id={arcelorMenuId}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      open={isArcelorMenuOpen}
      onClose={arcelorMenuClose}
    >
      <MenuItem>Option 1</MenuItem>
      <MenuItem>Option 2</MenuItem>
    </Menu>
  );

  return (
    <div>
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <Typography className={classes.title} component="div">
            <img src={logo} alt="equip logo" />
          </Typography>
          <div className={classes.grow} />
          <div className={classes.sectionDesktop}>
            <IconButton aria-label="search" color="inherit">
              <Search />
            </IconButton>

            <IconButton aria-label="filter" color="inherit">
              <FilterList />
            </IconButton>

            <IconButton aria-label="add" color="inherit">
              <Add />
            </IconButton>

            <IconButton aria-label="settings" color="inherit">
              <Settings />
            </IconButton>

            <IconButton aria-label="help" color="inherit">
              <HelpOutline />
            </IconButton>

            <Button
              aria-controls={supportMenuId}
              color="inherit"
              onClick={openSupportMenu}
            >
              Support <ExpandMore />
            </Button>
            <Button
              aria-controls={arcelorMenuId}
              color="inherit"
              onClick={openArcelorMenu}
            >
              ArcelorMittal <ExpandMore />
            </Button>

            <IconButton
              edge="end"
              aria-label="account of current user"
              aria-haspopup="true"
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
          </div>
        </Toolbar>
      </AppBar>
      {supportMenu}
      {arcelorMenu}
    </div>
  );
};

export default Header;
