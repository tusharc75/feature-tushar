import React from "react";
import { fade, makeStyles } from "@material-ui/core/styles";

import {
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Box,
  Badge,
  InputBase,
} from "@material-ui/core";
import {
  Search,
  AccountCircle,
  Notifications,
  HelpOutline,
  ExpandMore,
} from "@material-ui/icons";
import { SVG } from "../../assets";
import UserProfile from "./../UserProfile";
import { useHistory } from "react-router-dom";
import "./Header.css";

const useStyles = makeStyles((theme) => ({
  grow: {
    flexGrow: 1,
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },

  search: {
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    "&:hover": {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    margin: theme.spacing(0, 2),
    width: "100%",
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
  },

  sectionDesktop: {
    display: "none",
    [theme.breakpoints.up("md")]: {
      display: "flex",
      alignItems: "center",
    },
  },
  sectionMobile: {
    display: "flex",
    [theme.breakpoints.up("md")]: {
      display: "none",
    },
  },
  servicesButton: {
    display: "block",
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
}));

const Header = () => {
  const classes = useStyles();
  const history = useHistory();
  const [supportAnchorEl, setSupportAnchorEl] = React.useState(null);
  const [arcelorAnchorEl, setArcelorAnchorEl] = React.useState(null);

  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);

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

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };


  const handleClose = (event, option) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    if (option && option.logout) {
      window.location.reload();
      localStorage.removeItem("token");
      history.push({
        pathname: "/login",
      });
    }

    // if (option && option.profile) {
    //   history.push({
    //     pathname: Profile.path,
    //   });
    // }
    setOpen(false);
  };

  function handleListKeyDown(event) {
    if (event.key === "Tab") {
      event.preventDefault();
      setOpen(false);
    }
  }

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
      <AppBar position="fixed" className={classes.appBar} color="primary">
        <Toolbar>
          <Box component="div" display="flex" alignItems="center" flexGrow={1}>
            <img src={SVG("Logo")} alt="equip logo" />
            <Box marginLeft={2} className={classes.servicesButton}>
              <Button
                aria-controls={arcelorMenuId}
                color="inherit"
                onClick={openArcelorMenu}
              >
                Services <ExpandMore />
              </Button>
            </Box>
            <div className={classes.search}>
              <div className={classes.searchIcon}>
                <Search />
              </div>
              <InputBase
                fullWidth
                placeholder="Search…"
                type="search"
                classes={{
                  root: classes.inputRoot,
                  input: classes.inputInput,
                }}
                inputProps={{ "aria-label": "search" }}
              />
            </div>
          </Box>
          <div className={classes.sectionDesktop}>
            <Button
              aria-controls={supportMenuId}
              color="inherit"
              onClick={openSupportMenu}
            >
              Support <ExpandMore />
            </Button>
            <IconButton aria-label="settings" color="inherit">
              <Badge badgeContent={1} color="secondary">
                <Notifications />
              </Badge>
            </IconButton>

            <IconButton aria-label="help" color="inherit">
              <HelpOutline />
            </IconButton>

            <UserProfile
              anchorRef={anchorRef}
              open={open}
              onToggle={handleToggle}
              onClose={handleClose}
              onListKeyDown={handleListKeyDown}
            />
          </div>
        </Toolbar>
      </AppBar>
      {supportMenu}
      {arcelorMenu}
    </div>
  );
};

export default Header;
