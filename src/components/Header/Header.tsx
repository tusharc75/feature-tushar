import React, { useState, useRef, useContext } from "react";
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
  Chip,
  Typography,
  useMediaQuery,
  ButtonBase,
  Popover,
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
import { useHistory, Link } from "react-router-dom";
import { useData } from "../../StateProvider/Provider";
import { SVG } from "../../assets";
import UserProfile from "./../UserProfile";
import { SET_SELECTED_ENTITY, SET_USER } from "../../StateProvider/actionTypes";
import "./Header.scss";
import axiosInstance from "../../axios/axiosInstance";
import { CustomNotificationCountContext } from "../../StateProvider/CustomNotificationCountContext/CustomNotificationCountContext";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import routes from "../Helpers/Routes"
import moment from 'moment'
import { useAccount, useMsal } from "@azure/msal-react";
import { isEmpty } from "lodash";

const useStyles = makeStyles((theme) => ({
  grow: {
    flexGrow: 1,
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  toolbar: {
    [theme.breakpoints.down("xs")]: {
      paddingLeft: 0,
      paddingRight: 0,
    },
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },

  logo: {
    width: "140px",
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
    [theme.breakpoints.up("sm")]: {
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
  brandLogo: {
    maxWidth: "10%",
    height: "45px",
    borderRadius: "3px",
  },
  entitySelect: {
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    maxWidth: "195px",
    padding: theme.spacing(1, 0, 1, 1),
  },
  entityName: {
    maxWidth: "200px",
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  notificationHeight: {
    minWidth: 300,
    minHeight: 200,
    maxHeight: `calc(100vh - 200px)`
  },
  notificationHeightWithData: {
    minWidth: 300,
    maxHeight: `calc(100vh - 200px)`
  }
}));

const Header = ({ toggleDrawer }) => {
  const { instance, accounts, inProgress } = useMsal();
  const account = useAccount(accounts[0] || {});

  const {
    state: { user, selectedEntity },
    dispatch,
  }: any = useData();
  const classes = useStyles();
  const history = useHistory();
  const isMobile = useMediaQuery("(max-width:599px)");
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

  const notification = useContext(CustomNotificationCountContext);
  const toastConfig = useContext(CustomToastContext);

  // For FullScreen Notification - Start
  const [fullScreenNotificationAnchorEl, setFullScreenNotificationAnchorEl] = React.useState(null);

  const handleFullScreenNotificationClick = (event) => {
    setFullScreenNotificationAnchorEl(event.currentTarget);
    setLoadingNotifications(true);

    axiosInstance().get("/user/notification").then(({ data: { data } }) => {
      setNotificationList(data);
      setLoadingNotifications(false);
      notification.setCount(0);
    }).catch((error) => {
      setLoadingNotifications(false);
      toastConfig.setToastConfig(error);
    })
  };

  const handleFullScreenNotificationClose = () => {
    setFullScreenNotificationAnchorEl(null);
  };

  const fullScreenNotificationOpen = Boolean(fullScreenNotificationAnchorEl);
  const fullScreenNotificationId = fullScreenNotificationOpen ? 'full-screen-notification' : undefined;
  // For FullScreen Notification - End

  // For MobileScreen Notification - Start
  const [mobileScreenNotificationAnchorEl, setMobileScreenNotificationAnchorEl] = React.useState(null);

  const handleMobileScreenNotificationClick = async (event) => {
    setMobileScreenNotificationAnchorEl(event.currentTarget);
    setLoadingNotifications(true);

    await axiosInstance().get("/user/notification").then(({ data: { data } }) => {
      setNotificationList(data);
      setLoadingNotifications(false);
      notification.setCount(0);
    }).catch((error) => {
      setLoadingNotifications(false);
      toastConfig.setToastConfig(error);
    })
  };

  const handleMobileScreenNotificationClose = () => {
    setMobileScreenNotificationAnchorEl(null);
  };

  const mobileScreenNotificationOpen = Boolean(mobileScreenNotificationAnchorEl);
  const mobileScreenNotificationId = mobileScreenNotificationOpen ? 'mobile-screen-notification' : undefined;
  // For MobileScreen Notification - End

  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationList, setNotificationList] = useState([]);

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  // const openSupportMenu = (event) => {
  //   setSupportAnchorEl(event.currentTarget);
  // };

  const supportMenuClose = () => {
    setSupportAnchorEl(null);
  };

  // const openServicesMenu = (event) => {
  //   setServicesAnchorEl(event.currentTarget);
  // };

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
      logoutUser();
    }

    if (option && option.profile) {
      history.push({
        pathname: routes.profilePage.path
      });
    }
    if (option && option.brandConfiguration) {
      history.push({
        pathname: routes.brandConfiguration.path
      });
    }
    setOpen(false);
  };

  const logoutUser = async () => {
    try {
      if (!isEmpty(account)) await instance.logoutPopup();
    } catch (e) {
      toastConfig.setToastConfig({ open: true, type: "error", message: "Need to logout from Azure" })
    } finally {
      await axiosInstance().get("/user/logout").then(() => {
        history.push("/");
        dispatch({ type: SET_USER, payload: null });
        dispatch({ type: SET_SELECTED_ENTITY, payload: null });
        // localStorage.removeItem("token");
        localStorage.clear();
        history.push("/login");
      }).catch((error) => {
        toastConfig.setToastConfig(error)
      });
    }
  }

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

  const NotificationContent = ({ data }) => {
    return <div className={`${data.length == 0 ? classes.notificationHeight : classes.notificationHeightWithData}`} style={{ position: "relative" }}>
      {
        data.map((d, index) => {
          return <div style={{ borderBottom: d.read ? "1px solid lightgrey" : "1px solid white" }}
            className={`${d.read == true ? "" : "light-grey-bg"} p-3 cursor-pointer`}
            onClick={() => {
              if (d.read == false) {
                axiosInstance().put("/user/notification/read", {
                  toggle: true,
                  notificationId: d.notificationId
                }).then(() => {
                }).catch(error => {
                  toastConfig.setToastConfig(error);
                })
              }
              if (d?.entity) {
                handleSelectedEnity(d.entity)
              }
              history.push(`${d.resourcePath}/${d.resourceId}`)
            }}>
            {
              <>
                <h4>{d.title}</h4>
                <h5>{d.description}</h5>
                <h6 className="pull-right">{moment(d.date).format("MMM DD YYYY")}</h6>
              </>
            }
          </div>
        })
      }

      <div className="px-2 py-1" style={{ borderTop: "1px solid lightgrey" }}>
        <Typography onClick={() => {
          axiosInstance().put("/user/notification/all-read", { toggle: true }).then(({ data }) => {
            let updatedNotificationList = [];
            notificationList.map(notification => {
              notification.read = true;
              updatedNotificationList.push(notification);
            })

            setNotificationList(updatedNotificationList);
            toastConfig.setToastConfig({ open: true, message: data.message, type: "success" })

            setFullScreenNotificationAnchorEl(null);
            setMobileScreenNotificationAnchorEl(null);
          }).catch((error) => {
            toastConfig.setToastConfig(error)
          })

        }} className="cursor-pointer">Mark all as read</Typography>
      </div>

      {/* <Button style={{ position: "sticky", bottom: 0 }} fullWidth variant="contained" color="primary" onClick={() => { }}>
        View All &#8599;
      </Button> */}
    </div >
  }

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
          width: "25ch",
        },
      }}
    >
      {user?.entity && user.entity.length
        ? user.entity.map((curEntity) => (
          <MenuItem
            title={curEntity.entityName}
            key={curEntity._id}
            selected={selectedEntity === curEntity._id}
            onClick={() => {
              handleSelectedEnity(curEntity._id);
              closeEntitiesMenu();
            }}
          >
            <Typography className={classes.entityName}>
              {curEntity.entityName}
            </Typography>
            <Box component="span" marginX={1} />
            {selectedEntity === curEntity._id && (
              <Chip size="small" label="Current" color="primary" />
            )}
          </MenuItem>
        ))
        : null}
    </Menu>
  );

  const curEntity =
    user?.entity?.find((en) => en._id === selectedEntity) || null;

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
      {/* <MenuItem onClick={openServicesMenu}>
        <p>Services</p> <ExpandMore />
      </MenuItem> */}
      {
        selectedEntity && <MenuItem disabled={!selectedEntity} onClick={openEntitiesMenu} className="d-flex justify-content-space-between">
          <span className={classes.entityName}>
            {curEntity && curEntity.entityName}
          </span>
          <ExpandMore />
        </MenuItem>
      }

      <MenuItem onClick={mobileScreenNotificationAnchorEl == null ? handleMobileScreenNotificationClick : () => { }}>

        <Badge badgeContent={notification ? notification.count : 0} color="secondary"
          aria-describedby={mobileScreenNotificationId}>
          <Notifications />
        </Badge>
        <Box component="span" mx={1} />
        <p>Notifications</p>

        <Popover
          id={mobileScreenNotificationId}
          open={mobileScreenNotificationOpen}
          anchorEl={mobileScreenNotificationAnchorEl}
          onClose={handleMobileScreenNotificationClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
        >
          {
            loadingNotifications ? <Typography className="m-3">Loading Notifications...</Typography> :
              (notificationList.length == 0 ? <Typography className="m-3">No Notifications found</Typography> : <NotificationContent data={notificationList} />)
          }
        </Popover>
      </MenuItem>

      <MenuItem>
        <HelpOutline />
        <Box component="span" mx={1} my={2} />
        <p>Help</p>
      </MenuItem>
    </Menu>
  );

  function handleSelectedEnity(id) {
    dispatch({ type: SET_SELECTED_ENTITY, payload: id });
    if (history.location.pathname.includes(routes.opportunityDetail.path)) {
      history.push({ pathname: routes.opportunity.path })
    }
    if (history.location.pathname.includes(routes.lead.path)) {
      history.push({ pathname: routes.lead.path })
    }
  }

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

            {/* <div
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
            </div> */}
          </Toolbar>
        </AppBar>
      </Slide>

      <AppBar position="fixed" className={classes.appBar} color="primary">
        <Toolbar className={classes.toolbar}>
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
            <Link to="/">
              <img
                className={classes.logo}
                src={SVG("Logo")}
                alt="equip logo"
                title="eQuipt Logo"
              />
            </Link>
            <Box marginLeft={2} className={classes.servicesButton}>
              {/* <Button
                aria-controls={servicesMenuId}
                color="inherit"
                onClick={openServicesMenu}
                title="Services"
                className={classes.sectionDesktop}
              >
                Services <ExpandMore />
              </Button> */}
              {selectedEntity && (
                <ButtonBase>
                  <Box
                    aria-controls={entitiesMenuId}
                    color="inherit"
                    onClick={openEntitiesMenu}
                    title={
                      curEntity && `Selected entity - ${curEntity.entityName}`
                    }
                    className={classes.entitySelect}
                  >
                    <span className={classes.entityName}>
                      {curEntity && curEntity.entityName}
                    </span>
                    <Box component="span" mr={1} />
                    <ExpandMore />
                  </Box>
                </ButtonBase>
              )}
            </Box>
            {/* <div className={classes.search}>
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
            </div> */}
          </Box>

          {/* <div className={classes.sectionDesktop}>
            <Button
              aria-controls={supportMenuId}
              color="inherit"
              onClick={openSupportMenu}
              title="Support"
            >
              Support <ExpandMore />
            </Button>
          </div> */}
          {user?.brandLogo ? (
            <img
              src={user.brandLogo}
              alt="brand"
              className={classes.brandLogo}
            ></img>
          ) : null}

          <div className={classes.sectionDesktop}>
            <div>
              <IconButton aria-describedby={fullScreenNotificationId} aria-label="settings" color="inherit"
                onClick={handleFullScreenNotificationClick}>
                <Badge badgeContent={notification ? notification.count : 0} color="secondary">
                  <Notifications />
                </Badge>
              </IconButton>

              <Popover
                className="mr-2"
                id={fullScreenNotificationId}
                open={fullScreenNotificationOpen}
                anchorEl={fullScreenNotificationAnchorEl}
                onClose={handleFullScreenNotificationClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'center',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'center',
                }}
              >
                {
                  loadingNotifications ? <Typography className="m-3">Loading Notifications...</Typography> :
                    (notificationList.length == 0 ? <Typography className="m-3">No Notifications found</Typography> :
                      <NotificationContent data={notificationList} />)
                }
              </Popover>
            </div>
            {/* <IconButton aria-label="settings" color="inherit">
              <Badge badgeContent={1} color="secondary">
                <Notifications />
              </Badge>
            </IconButton> */}

            <IconButton aria-label="help" color="inherit">
              <HelpOutline />
            </IconButton>
          </div>

          {/* <div className={classes.sectionMobile}>
            <IconButton
              aria-label="search"
              onClick={() => setSearch(true)}
              color="inherit"
              title="Search"
            >
              <Search />
            </IconButton>
          </div> */}

          <UserProfile
            anchorRef={anchorRef}
            open={open}
            onToggle={handleToggle}
            onClose={handleClose}
            onListKeyDown={handleListKeyDown}
          />

          {isMobile && (
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
          )}
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
