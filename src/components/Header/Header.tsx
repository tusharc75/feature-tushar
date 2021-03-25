import { useState, useRef } from "react";
import { fade, makeStyles } from "@material-ui/core/styles";

import {
  Slide,
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
  Menu as MenuIcon,
  MoreVert as MoreIcon,
  Clear as ClearIcon,
  Notifications,
  HelpOutline,
  ExpandMore,
} from "@material-ui/icons";
import { useHistory } from "react-router-dom";

import { SVG } from "../../assets";
import UserProfile from "./../UserProfile";
import "./Header.scss";

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

  logo: {
    width: "120px",
    [theme.breakpoints.down("sm")]: {
      width: "80px",
      marginRight: 10,
    },
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
    display: "none",
    [theme.breakpoints.up("md")]: {
      display: "block",
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
    display: "flex",
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
}));

const Header = ({ toggleDrawer }) => {
  const classes = useStyles();
  const history = useHistory();
  const [isSearch, setSearch] = useState(false);
  const [supportAnchorEl, setSupportAnchorEl] = useState(null);
  const [servicesAnchorEl, setServicesAnchorEl] = useState(null);
  const [entitiesEl, setEntitiesEl] = useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState(null);

  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const isSupportMenuOpen = Boolean(supportAnchorEl);
  const isArcelorMenuOpen = Boolean(servicesAnchorEl);
  const isEntitiesMenuOpen = Boolean(entitiesEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const openSupportMenu = (event) => {
    setSupportAnchorEl(event.currentTarget);
  };

  const supportMenuClose = () => {
    setSupportAnchorEl(null);
  };

  const openServicesMenu = (event) => {
    setServicesAnchorEl(event.currentTarget);
  };

  const closeServicesMenu = () => {
    setServicesAnchorEl(null);
  };

  const openEntitiesMenu = (event) => {
    setEntitiesEl(event.currentTarget);
  };

  const closeEntitiesMenu = () => {
    setEntitiesEl(null);
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

  const servicesMenuId = "arcelor-menu";

  const arcelorMenu = (
    <Menu
      anchorEl={servicesAnchorEl}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      keepMounted
      id={servicesMenuId}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      open={isArcelorMenuOpen}
      onClose={closeServicesMenu}
    >
      <MenuItem>Option 1</MenuItem>
      <MenuItem>Option 2</MenuItem>
    </Menu>
  );

  const entitiesMenuId = "entities-menu";

  const entitiesMenu = (
    <Menu
      anchorEl={entitiesEl}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      keepMounted
      id={entitiesMenuId}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      open={isEntitiesMenuOpen}
      onClose={closeEntitiesMenu}
      PaperProps={{
        style: {
          maxHeight: 48 * 4.5,
          width: "20ch",
        },
      }}
    >
      <MenuItem>Entities 1</MenuItem>
      <MenuItem>Entities 2</MenuItem>
      <MenuItem>Entities 3</MenuItem>
      <MenuItem>Entities 4</MenuItem>
      <MenuItem>Entities 5</MenuItem>
      <MenuItem>Entities 6</MenuItem>
      <MenuItem>Entities 7</MenuItem>
      <MenuItem>Entities 8</MenuItem>
      {/* <Box display="flex" alignItems="center" justifyContent="center">
        <CircularProgress size={20} />
      </Box> */}
    </Menu>
  );

  const mobileMenuId = "primary-search-account-menu-mobile";

  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      id={mobileMenuId}
      keepMounted
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
    >
      <MenuItem onClick={openServicesMenu}>
        <p>Services</p> <ExpandMore />
      </MenuItem>
      <MenuItem onClick={openEntitiesMenu}>
        <p>Entities</p> <ExpandMore />
      </MenuItem>
      <MenuItem onClick={openSupportMenu}>
        <p>Support</p> <ExpandMore />
      </MenuItem>
    </Menu>
  );

  return (
    <div>
      <Slide direction="down" in={isSearch}>
        <AppBar position="fixed" style={{ zIndex: 10000 }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="close search"
              onClick={() => setSearch(false)}
            >
              <ClearIcon />
            </IconButton>

            <div
              className={classes.search}
              style={{ display: "block", width: "100%" }}
            >
              <div className={classes.searchIcon}>
                <Search />
              </div>
              <InputBase
                placeholder="Search…"
                classes={{
                  root: classes.inputRoot,
                  input: classes.inputInput,
                }}
                style={{ width: "100%" }}
                inputProps={{ "aria-label": "search" }}
              />
            </div>
          </Toolbar>
        </AppBar>
      </Slide>

      <AppBar position="fixed" className={classes.appBar} color="primary">
        <Toolbar>
          <Box component="div" display="flex" alignItems="center" flexGrow={1}>
            <div className={classes.sectionMobile}>
              <IconButton
                aria-label="help"
                color="inherit"
                title="Menu"
                onClick={toggleDrawer}
              >
                <MenuIcon />
              </IconButton>
            </div>
            <img
              className={classes.logo}
              src={SVG("Logo")}
              alt="equip logo"
              title="eQuipt Logo"
            />
            <Box marginLeft={2} className={classes.servicesButton}>
              <Button
                aria-controls={servicesMenuId}
                color="inherit"
                onClick={openServicesMenu}
                title="Services"
                className={classes.sectionDesktop}
              >
                Services <ExpandMore />
              </Button>
              <Button
                aria-controls={entitiesMenuId}
                color="inherit"
                onClick={openEntitiesMenu}
                title="Entities"
              >
                Entities <ExpandMore />
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
              title="Support"
            >
              Support <ExpandMore />
            </Button>
          </div>

          <IconButton aria-label="settings" color="inherit">
            <Badge badgeContent={1} color="secondary">
              <Notifications />
            </Badge>
          </IconButton>

          <IconButton aria-label="help" color="inherit">
            <HelpOutline />
          </IconButton>

          <div className={classes.sectionMobile}>
            <IconButton
              aria-label="search"
              onClick={() => setSearch(true)}
              color="inherit"
              title="Search"
            >
              <Search />
            </IconButton>
          </div>
          <UserProfile
            anchorRef={anchorRef}
            open={open}
            onToggle={handleToggle}
            onClose={handleClose}
            onListKeyDown={handleListKeyDown}
          />
          <div className={classes.sectionMobile}>
            <IconButton
              aria-label="show more"
              aria-controls={mobileMenuId}
              aria-haspopup="true"
              onClick={handleMobileMenuOpen}
              color="inherit"
              title="More"
            >
              <MoreIcon />
            </IconButton>
          </div>
        </Toolbar>
      </AppBar>
      {renderMobileMenu}
      {supportMenu}
      {arcelorMenu}
      {entitiesMenu}
    </div>
  );
};

export default Header;
