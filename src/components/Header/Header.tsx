import React, { useState, useRef, useContext, useEffect } from 'react';
import { alpha, makeStyles } from '@material-ui/core/styles';
import {
  Slide,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Badge,
  Chip,
  Typography,
  useMediaQuery,
  ButtonBase,
  Popover,
  Tooltip
} from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Avatar from '@material-ui/core/Avatar';
import { Menu as MenuIcon, MoreVert as MoreIcon, Clear as ClearIcon, Notifications, HelpOutline, ExpandMore, Brightness1 } from '@material-ui/icons';
import SyncIcon from '@material-ui/icons/Sync';
import io, { Socket } from 'socket.io-client';
import { useHistory, Link, useLocation } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import { SVG } from '../../assets';
import UserProfile from './../UserProfile';
import { SET_CHATTER, SET_SELECTED_ENTITY, SET_START_TOUR, SET_USER } from '../../StateProvider/actionTypes';
import './Header.scss';
import axiosInstance from '../../axios/axiosInstance';
import { CustomNotificationCountContext } from '../../StateProvider/CustomNotificationCountContext/CustomNotificationCountContext';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import routes from '../Helpers/Routes';
import { useAccount, useMsal } from '@azure/msal-react';
import { isEmpty } from 'lodash';
import { FiCheckCircle } from 'react-icons/fi';
import { displayCardDate } from '../../constants/helpers';
import ChatIcon from '@material-ui/icons/Chat';
import { CustomChatNotificationCountContext } from '../../StateProvider/CustomChatNotificationCountContext/CustomChatNotificationCountContext';
import { backendApi } from '../../config';
import ShoppingCartIcon from '@material-ui/icons/ShoppingCart';
import { SET_CART } from '../../StateProvider/actionTypes';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import FavoriteIcon from '@material-ui/icons/Favorite';
import { WishlistContext } from '../../StateProvider/WishlistContext/WishlistProvider';

const useStyles = makeStyles((theme) => ({
  grow: {
    flexGrow: 1
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1
  },
  toolbar: {
    [theme.breakpoints.down('xs')]: {
      paddingLeft: 0,
      paddingRight: 0
    }
  },
  menuButton: {
    marginRight: theme.spacing(2)
  },

  logo: {
    width: '140px'
  },

  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.25)
    },
    margin: theme.spacing(0, 2),
    width: '100%',
    display: 'none',
    [theme.breakpoints.up('md')]: {
      display: 'block'
    }
  },

  searchIcon: {
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  inputRoot: {
    color: 'inherit'
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create('width'),
    width: '100%'
  },

  sectionDesktop: {
    display: 'none',
    [theme.breakpoints.up('sm')]: {
      display: 'flex',
      alignItems: 'center'
      // gap: '5px'
    }
  },
  sectionMobile: {
    display: 'flex',
    [theme.breakpoints.up('md')]: {
      display: 'none'
    }
  },
  servicesButton: {
    display: 'flex',
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
  brandLogo: {
    maxWidth: '10%',
    height: '45px',
    borderRadius: '4px',
    marginRight: '5px'
  },
  entitySelect: {
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    maxWidth: '195px',
    padding: theme.spacing(1, 0, 1, 1)
  },
  entityName: {
    maxWidth: '200px',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap'
  },
  notificationHeight: {
    minWidth: 300,
    minHeight: 200,
    maxHeight: `calc(100vh - 200px)`
  },
  notificationHeightWithData: {
    minWidth: 300
  },
  notificationContent: {
    maxHeight: '640px',
    overflow: 'auto',
    border: '1px solid #eadfdf',
    margin: '2px'
  },
  markAll: {
    textAlign: 'center',
    color: '#a59e9e',
    padding: '5px',
    display: 'flex !important',
    alignItems: 'center !important',
    justifyContent: 'flex-end',
    paddingRight: '10px',
    '&:hover': {
      textDecoration: 'underline'
    }
  }
}));

const Header = ({ toggleDrawer }) => {
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  const {
    state: { user, selectedEntity, cartItems, permissions },
    dispatch
  }: any = useData();

  const classes = useStyles();
  const history = useHistory();
  const { pathname } = useLocation();
  const isMobile = useMediaQuery('(max-width:599px)');
  const [isSearch, setSearch] = useState(false);
  const [socket, setSocket] = useState<Socket>(null);
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
  const chatNotification = useContext(CustomChatNotificationCountContext);
  const toastConfig = useContext(CustomToastContext);
  const { isOffline, isSynch } = useContext(CustomOfflineContext);

  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationList, setNotificationList] = useState([]);

  const { wishlistState, wishlistDispatch } = useContext(WishlistContext);

  // For FullScreen Notification - Start
  const [fullScreenNotificationAnchorEl, setFullScreenNotificationAnchorEl] = React.useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      saveEntity()
    }
  }, [selectedEntity])

  const fetchCart = () => {
    axiosInstance()
      .get(`/ecommerce/cart`)
      .then(({ data: { data } }) => {
        if (data) {
          dispatch({ type: SET_CART, payload: [...data] });
        }
      });
  };

  const saveEntity = () => {
    axiosInstance()
      .put(`/user/save-selected-entity?selectedEntity=${selectedEntity}`)
      .then(({ data }) => {
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }

  const handleFullScreenNotificationClick = (event) => {
    setFullScreenNotificationAnchorEl(event.currentTarget);
    setLoadingNotifications(true);

    axiosInstance()
      .get('/user/notification')
      .then(({ data: { data } }) => {
        setNotificationList(data);
        setLoadingNotifications(false);
        notification.setCount(0);
      })
      .catch((error) => {
        setLoadingNotifications(false);
        toastConfig.setToastConfig(error);
      });
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

    await axiosInstance()
      .get('/user/notification')
      .then(({ data: { data } }) => {
        setNotificationList(data);
        setLoadingNotifications(false);
        notification.setCount(0);
      })
      .catch((error) => {
        setLoadingNotifications(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleMobileScreenNotificationClose = () => {
    setMobileScreenNotificationAnchorEl(null);
  };

  const mobileScreenNotificationOpen = Boolean(mobileScreenNotificationAnchorEl);
  const mobileScreenNotificationId = mobileScreenNotificationOpen ? 'mobile-screen-notification' : undefined;
  // For MobileScreen Notification - End

  const [loadingChatNotifications, setLoadingChatNotifications] = useState(false);
  const [chatNotificationList, setChatNotificationList] = useState([]);

  // For FullScreen Chat Notification - Start
  const [fullScreenChatNotificationAnchorEl, setFullScreenChatNotificationAnchorEl] = React.useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const s = io(`${backendApi}/user`, {
      auth: {
        token
      },
      transports: ['websocket', 'pooling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 5000
    });
    setSocket(s);
  }, [user]);

  // Socket listening for data
  useEffect(() => {
    if (socket && user) {
      socket.on('connect', () => {
        socket.emit('join', user.user._id);
      });

      socket.on('data', (data) => {
        setChatNotificationList(data);
        chatNotification.setCount(chatNotification.count + 1);
      });
      socket.on('new', (data) => {
        dispatch({ type: SET_CHATTER, payload: data });
      });
    }
    return () => {
      if (socket) {
        socket.disconnect();
        socket.off('connect');
        socket.off('data');
      }
    };
  }, [socket, user]);

  const handleFullScreenChatNotificationClick = (event) => {
    setFullScreenChatNotificationAnchorEl(event.currentTarget);
    setLoadingChatNotifications(true);

    axiosInstance()
      .get('/user/user-notification')
      .then(({ data: { data } }) => {
        setChatNotificationList(data);
        setLoadingChatNotifications(false);
        chatNotification.setCount(0);
      })
      .catch((error) => {
        setLoadingNotifications(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleFullScreenChatNotificationClose = () => {
    setFullScreenChatNotificationAnchorEl(null);
  };

  const fullScreenChatNotificationOpen = Boolean(fullScreenChatNotificationAnchorEl);
  const fullScreenChatNotificationId = fullScreenChatNotificationOpen ? 'full-screen-chat-notification' : undefined;
  // For FullScreen Notification - End

  // For MobileScreen Notification - Start
  const [mobileScreenChatNotificationAnchorEl, setMobileScreenChatNotificationAnchorEl] = React.useState(null);

  const handleMobileScreenChatNotificationClick = async (event) => {
    setMobileScreenChatNotificationAnchorEl(event.currentTarget);
    setLoadingChatNotifications(true);

    await axiosInstance()
      .get('/user/user-notification')
      .then(({ data: { data } }) => {
        setChatNotificationList(data);
        setLoadingChatNotifications(false);
        chatNotification.setCount(0);
      })
      .catch((error) => {
        setLoadingNotifications(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleMobileScreenChatNotificationClose = () => {
    setMobileScreenChatNotificationAnchorEl(null);
  };

  const mobileScreenChatNotificationOpen = Boolean(mobileScreenChatNotificationAnchorEl);
  const mobileScreenChatNotificationId = mobileScreenChatNotificationOpen ? 'mobile-screen-chat-notification' : undefined;
  // For MobileScreen Notification - End

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

  window.addEventListener('storage', (event) => {
    if (event.storageArea == localStorage) {
      let token = localStorage.getItem('token');
      if (token == undefined) {
        window.location.reload();
      }
    }
  });

  const logoutUser = async () => {
    try {
      if (!isEmpty(account)) {
        await instance.logoutPopup({
          account: account
        });
      }
    } catch (e) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: 'Need to logout from Azure'
      });
    } finally {
      await axiosInstance()
        .get('/user/logout')
        .then(() => {
          history.push('/');
          dispatch({ type: SET_USER, payload: null });
          dispatch({ type: SET_SELECTED_ENTITY, payload: null });

          // localStorage.removeItem("token");
          localStorage.clear();

          wishlistDispatch({ type: "INITIALIZE", payload: [] });

          history.push('/login');
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const hasAccessToEntity = async (id) => {
    const entityList = user.entity?.map((entity) => entity._id);
    return entityList.includes(id);
  };

  const handleEntityChange = async (id) => {
    if (!Array.isArray(id)) {
      dispatch({ type: SET_SELECTED_ENTITY, payload: id });
    }
  };

  const handleRedirect = (id, resourceId, resourcePath) =>
    id === selectedEntity
      ? history.push(resourceId ? `${resourcePath}/${resourceId}` : resourcePath)
      : hasAccessToEntity(id)
        ? handleEntityChange(id) && history.push(resourceId ? `${resourcePath}/${resourceId}` : resourcePath)
        : '';

  function handleListKeyDown(event) {
    if (event.key === 'Tab') {
      event.preventDefault();
      setOpen(false);
    }
  }

  const supportMenuId = 'support-menu';

  const supportMenu = (
    <Menu
      anchorEl={supportAnchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      keepMounted
      id={supportMenuId}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={isSupportMenuOpen}
      onClose={supportMenuClose}
    >
      <MenuItem>Option 1</MenuItem>
      <MenuItem>Option 2</MenuItem>
    </Menu>
  );

  const servicesMenuId = 'arcelor-menu';

  const arcelorMenu = (
    <Menu
      anchorEl={servicesAnchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      keepMounted
      id={servicesMenuId}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={isArcelorMenuOpen}
      onClose={closeServicesMenu}
    >
      <MenuItem>Option 1</MenuItem>
      <MenuItem>Option 2</MenuItem>
    </Menu>
  );

  const NotificationContent = ({ data }) => {
    return (
      <div className={`${data.length === 0 ? classes.notificationHeight : classes.notificationHeightWithData}`} style={{ position: 'relative' }}>
        <div className={`${classes.markAll} d-flex align-items-center gap-1`}>
          <Typography
            onClick={() => {
              axiosInstance()
                .put('/user/notification/all-read', { toggle: true })
                .then(({ data }) => {
                  let updatedNotificationList = [];
                  notificationList.map((notification) => {
                    notification.read = true;
                    updatedNotificationList.push(notification);
                  });

                  setNotificationList(updatedNotificationList);
                  toastConfig.setToastConfig({
                    open: true,
                    message: data.message,
                    type: 'success'
                  });

                  setFullScreenNotificationAnchorEl(null);
                  setMobileScreenNotificationAnchorEl(null);
                })
                .catch((error) => {
                  toastConfig.setToastConfig(error);
                });
            }}
            className="cursor-pointer"
          >
            <FiCheckCircle className="mr-2 pt-1" size={16} />
            <span>Mark all as read</span>
          </Typography>
        </div>
        <div className={classes.notificationContent}>
          {data.map((d, index) => {
            return (
              <div
                style={{
                  borderBottom: d.read ? '1px solid lightgrey' : '1px solid white'
                }}
                className={`${d.read === true ? '' : 'light-grey-bg'} p-3 cursor-pointer`}
                key={index}
                onClick={() => {
                  if (d.read === false) {
                    axiosInstance()
                      .put('/user/notification/read', {
                        toggle: true,
                        notificationId: d.notificationId
                      })
                      .then(() => { })
                      .catch((error) => {
                        toastConfig.setToastConfig(error);
                      });
                  }

                  handleFullScreenNotificationClose();
                  handleMobileScreenNotificationClose();

                  if (d?.entity) {
                    handleRedirect(d?.entity, d?.resourceId, d?.resourcePath);
                  } else {
                    history.push(d?.resourceId ? `${d?.resourcePath}/${d?.resourceId}` : d?.resourcePath, { data: d?.of ? d?.of : null });
                  }
                }}
              >
                {
                  <>
                    <Grid container>
                      <Grid item xs={2} md={2}>
                        <Avatar style={{ height: 30, width: 30 }} src={d?.avatar}></Avatar>
                      </Grid>
                      <Grid item xs={10} md={10}>
                        <h6>{displayCardDate(d?.date)}</h6>
                        <h4>{d.title}</h4>
                        <h5>{d.description}</h5>
                      </Grid>
                    </Grid>
                  </>
                }
              </div>
            );
          })}
        </div>
        {/* <Button style={{ position: "sticky", bottom: 0 }} fullWidth variant="contained" color="primary" onClick={() => { }}>
        View All &#8599;
      </Button> */}
      </div>
    );
  };

  const ChatNotificationContent = ({ data }) => {
    return (
      <div className={`${data.length === 0 ? classes.notificationHeight : classes.notificationHeightWithData}`} style={{ position: 'relative' }}>
        <div className={`${classes.markAll} d-flex align-items-center gap-1`} style={{ position: 'sticky', top: 0 }}>
          <Typography
            onClick={() => {
              axiosInstance()
                .put('/user/user-notification/all-read', { toggle: true })
                .then(({ data }) => {
                  let updatedNotificationList = [];
                  chatNotificationList.map((notification) => {
                    notification.read = true;
                    updatedNotificationList.push(notification);
                  });

                  setChatNotificationList(updatedNotificationList);
                  toastConfig.setToastConfig({
                    open: true,
                    message: data.message,
                    type: 'success'
                  });

                  setFullScreenChatNotificationAnchorEl(null);
                  setMobileScreenChatNotificationAnchorEl(null);
                })
                .catch((error) => {
                  toastConfig.setToastConfig(error);
                });
            }}
            className="cursor-pointer"
          >
            <FiCheckCircle className="mr-2 pt-1" size={16} />
            <span>Mark all as read</span>
          </Typography>
        </div>

        <div className={classes.notificationContent}>
          {data.map((d, index) => {
            return (
              <div
                style={{
                  borderBottom: d.read ? '1px solid lightgrey' : '1px solid white'
                }}
                className={`${d.read === true ? '' : 'light-grey-bg'} p-3 cursor-pointer`}
                key={index}
                onClick={() => {
                  if (d.read === false) {
                    axiosInstance()
                      .put('/user/user-notification/read', {
                        toggle: true,
                        notificationId: d.notificationId
                      })
                      .then(() => { })
                      .catch((error) => {
                        toastConfig.setToastConfig(error);
                      });
                  }

                  handleFullScreenChatNotificationClose();
                  handleMobileScreenChatNotificationClose();

                  if (d?.entity) {
                    handleRedirect(d?.entity, d?.resourceId, d?.resourcePath);
                  } else {
                    history.push(d?.resourceId ? `${d?.resourcePath}/${d?.resourceId}` : d?.resourcePath);
                  }
                }}
              >
                {
                  <>
                    <Grid container>
                      <Grid item xs={2} md={2}>
                        <Avatar style={{ height: 30, width: 30 }} src={d?.avatar}></Avatar>
                      </Grid>
                      <Grid item xs={10} md={10}>
                        <h6>{displayCardDate(d?.date)}</h6>
                        <h4>{d.title}</h4>
                        <h5>{d.description}</h5>
                      </Grid>
                    </Grid>
                  </>
                }
              </div>
            );
          })}
        </div>
        {/* <Button style={{ position: "sticky", bottom: 0 }} fullWidth variant="contained" color="primary" onClick={() => { }}>
        View All &#8599;
      </Button> */}
      </div>
    );
  };

  const entitiesMenuId = 'entities-menu';

  const entitiesMenu = (
    <Menu
      anchorEl={entitiesEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      keepMounted
      id={entitiesMenuId}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={isEntitiesMenuOpen}
      onClose={closeEntitiesMenu}
      PaperProps={{
        style: {
          maxHeight: 48 * 4.5,
          width: '25ch'
        }
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
            <Typography className={classes.entityName}>{curEntity.entityName}</Typography>
            <Box component="span" marginX={1} />
            {selectedEntity === curEntity._id && <Chip size="small" label="Current" color="primary" />}
          </MenuItem>
        ))
        : null}
    </Menu>
  );

  const curEntity = user?.entity?.find((en) => en._id === selectedEntity) || null;

  const mobileMenuId = 'primary-search-account-menu-mobile';

  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      id={mobileMenuId}
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
    >
      {/* <MenuItem onClick={openServicesMenu}>
        <p>Services</p> <ExpandMore />
      </MenuItem> */}
      {selectedEntity && (
        <MenuItem disabled={!selectedEntity} onClick={openEntitiesMenu} className="d-flex justify-content-space-between">
          <span className={classes.entityName}>{curEntity && curEntity.entityName}</span>
          <ExpandMore />
        </MenuItem>
      )}

      {/* Remove below false to show chat notification icon */}

      <MenuItem onClick={mobileScreenChatNotificationAnchorEl === null ? handleMobileScreenChatNotificationClick : () => { }}>
        <Badge badgeContent={chatNotification ? chatNotification.count : 0} color="secondary" aria-describedby={mobileScreenChatNotificationId}>
          <ChatIcon />
        </Badge>
        <Box component="span" mx={1} />
        <p>Chat Notifications</p>

        <Popover
          id={mobileScreenChatNotificationId}
          open={mobileScreenChatNotificationOpen}
          anchorEl={mobileScreenChatNotificationAnchorEl}
          onClose={handleMobileScreenChatNotificationClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center'
          }}
        >
          {loadingChatNotifications ? (
            <Typography className="m-3">Loading Chat Notifications...</Typography>
          ) : chatNotificationList.length === 0 ? (
            <Typography className="m-3">No Chat Notifications found</Typography>
          ) : (
            <ChatNotificationContent data={chatNotificationList} />
          )}
        </Popover>
      </MenuItem>

      <MenuItem onClick={mobileScreenNotificationAnchorEl === null ? handleMobileScreenNotificationClick : () => { }}>
        <Badge badgeContent={notification ? notification.count : 0} color="secondary" aria-describedby={mobileScreenNotificationId}>
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
            horizontal: 'center'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center'
          }}
        >
          {loadingNotifications ? (
            <Typography className="m-3">Loading Notifications...</Typography>
          ) : notificationList.length === 0 ? (
            <Typography className="m-3">No Notifications found</Typography>
          ) : (
            <NotificationContent data={notificationList} />
          )}
        </Popover>
      </MenuItem>

      <MenuItem>
        <HelpOutline />
        <Box component="span" mx={1} my={2} />
        <p>Help</p>
      </MenuItem>

      {
        permissions?.eCommerce?.isRead && <MenuItem
          id="shoppingCartButton"
          onClick={() => {
            history.push({
              pathname: '/product/my-cart'
            });
          }}
        >
          <Badge color="secondary" badgeContent={wishlistState.wishlist.length}>
            <FavoriteIcon className="setIcon" />
          </Badge>
          <Box component="span" mx={1} />
          <p>Wishlist</p>
        </MenuItem>
      }

      {
        permissions?.eCommerce?.isRead && <MenuItem
          id="shoppingCartButton"
          onClick={() => {
            history.push({
              pathname: '/product/my-cart'
            });
          }}
        >
          <Badge color="secondary" badgeContent={cartItems.length}>
            <ShoppingCartIcon className="setIcon" />
          </Badge>
          <Box component="span" mx={1} />
          <p>Cart</p>
        </MenuItem>
      }
    </Menu>
  );

  function handleSelectedEnity(id) {
    dispatch({ type: SET_SELECTED_ENTITY, payload: id });
    if (history.location.pathname.includes(routes.opportunityDetail.path)) {
      history.push({ pathname: routes.opportunity.path });
    }
    if (history.location.pathname.includes(routes.lead.path)) {
      history.push({ pathname: routes.lead.path });
    }
    if (history.location.pathname.includes(routes.quoteBuilder.path)) {
      history.push({ pathname: routes.quoteBuilder.path });
    }
    if (history.location.pathname.includes(routes.customerAccountDetail.path)) {
      history.push({ pathname: routes.customerAccount.path });
    }
    if (history.location.pathname.includes(routes.supplierAccountDetail.path)) {
      history.push({ pathname: routes.supplierAccount.path });
    }
    if (history.location.pathname.includes(routes.customerContactDetail.path)) {
      history.push({ pathname: routes.customerContact.path });
    }
    if (history.location.pathname.includes(routes.supplierContactDetail.path)) {
      history.push({ pathname: routes.supplierContact.path });
    }
    if (history.location.pathname.includes(routes.projectSalesDetail.path)) {
      history.push({ pathname: routes.projectSales.path });
    }
    if (history.location.pathname.includes(routes.productDetail.path)) {
      history.push({ pathname: routes.product.path });
    }
    if (history.location.pathname.includes(`${routes.productTemplate.path}/`)) {
      history.push({ pathname: routes.productTemplate.path });
    }
    if (history.location.pathname.includes(`${routes.priceTemplate.path}/`)) {
      history.push({ pathname: routes.priceTemplate.path });
    }
    if (history.location.pathname.includes(routes.quotePdfTemplateDetail.path)) {
      history.push({ pathname: routes.quotePdfTemplate.path });
    }
    if (history.location.pathname.includes(routes.purchaseOrderDetail.path)) {
      history.push({ pathname: routes.purchaseOrder.path });
    }
    if (history.location.pathname.includes(routes.transferAssetDetail.path)) {
      history.push({ pathname: routes.transferAsset.path })
    }
    if (history.location.pathname.includes(routes.rentalManagementDetail.path)) {
      history.push({ pathname: routes.rentalManagement.path })
    }
    if (history.location.pathname.includes(routes.repairJobDetail.path)) {
      history.push({ pathname: routes.repairJob.path })
    }
    if (history.location.pathname.includes(routes.deliveryTicketDetail.path)) {
      history.push({ pathname: routes.deliveryTicket.path })
    }
    if (history.location.pathname.includes(routes.productInventoryDetail.path)) {
      history.push({ pathname: routes.productInventory.path })
    }
    if (history.location.pathname.includes(routes.pricingConditionDetail.path)) {
      history.push({ pathname: routes.pricingCondition.path })
    }
  }

  const startTour = () => {
    if (['local', 'development'].includes(process.env.REACT_APP_ENV)) {
      const paths = pathname.split('/').filter((x: string) => x);
      let path: string;

      if (paths.includes('detail')) {
        paths.splice(paths.length - 1, 1);
        path = paths.join('/');
      }

      dispatch({
        type: SET_START_TOUR,
        payload: {
          path: paths.includes('detail') ? `/${path}` : pathname,
          start: true,
          stepIndex: 0
        }
      });
    }
  };

  return (
    <div>
      <Slide direction="down" in={isSearch}>
        <AppBar position="fixed" style={{ zIndex: 10000 }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" aria-label="close search" onClick={() => setSearch(false)}>
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
              <IconButton aria-label="help" color="inherit" title="Menu" onClick={toggleDrawer}>
                <MenuIcon />
              </IconButton>
            </div>
            <Link to="/">
              <img className={classes.logo} src={SVG('LogoPng')} alt="equip logo" title="eQuipt Logo" />
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
                <ButtonBase id="entitySelect">
                  <Box
                    aria-controls={entitiesMenuId}
                    color="inherit"
                    onClick={openEntitiesMenu}
                    title={curEntity && `Selected entity - ${curEntity.entityName}`}
                    className={classes.entitySelect}
                  >
                    <span className={classes.entityName}>{curEntity && curEntity.entityName}</span>
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
          {user?.brandLogo ? <img src={user.brandLogo} alt="brand" className={classes.brandLogo} /> : null}

          <div className={classes.sectionDesktop}>
            <div>
              {isOffline && (
                <IconButton>
                  <Tooltip title="You are working offline right now">
                    <Brightness1 color="error" className="blink" />
                  </Tooltip>
                </IconButton>
              )}
              {isSynch && (
                <IconButton color="inherit">
                  <Tooltip title="Synchronizing offline data">
                    <SyncIcon className="rotate" />
                  </Tooltip>
                </IconButton>
              )}
              {
                permissions?.eCommerce?.isRead && <IconButton
                  id="shoppingCartButton"
                  title="Wishlist"
                  aria-describedby={fullScreenNotificationId}
                  aria-label="settings"
                  color="inherit"
                  onClick={() => {
                    history.push({
                      pathname: '/product/my-cart'
                    });
                  }}
                  className="showIconLayout"
                >
                  <Badge color="secondary" badgeContent={wishlistState.wishlist.length}>
                    <FavoriteIcon className="setIcon" />
                  </Badge>
                </IconButton>
              }

              {/*Only show cart icon if environment is local || development*/}
              {
                permissions?.eCommerce?.isRead && (
                  <IconButton
                    id="shoppingCartButton"
                    title={'My Cart'}
                    aria-describedby={fullScreenNotificationId}
                    aria-label="settings"
                    color="inherit"
                    onClick={() => {
                      history.push({
                        pathname: '/product/my-cart'
                      });
                    }}
                    className="showIconLayout"
                  >
                    <Badge color="secondary" badgeContent={cartItems.length}>
                      <ShoppingCartIcon className="setIcon" />
                    </Badge>
                  </IconButton>
                )
              }

              <IconButton
                id="notificationButton"
                aria-describedby={fullScreenNotificationId}
                aria-label="settings"
                color="inherit"
                title="Notifications"
                onClick={handleFullScreenNotificationClick}
                className="showIconLayout"
              >
                <Badge badgeContent={notification ? notification.count : 0} color="secondary">
                  <Notifications className="setIcon" />
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
                  horizontal: 'center'
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'center'
                }}
              >
                {loadingNotifications ? (
                  <Typography className="m-3">Loading Notifications...</Typography>
                ) : notificationList.length === 0 ? (
                  <Typography className="m-3">No Notifications found</Typography>
                ) : (
                  <NotificationContent data={notificationList} />
                )}
              </Popover>
            </div>

            {/* Remove below false to show chat notification icon */}

            <div>
              <IconButton
                id="chatNotificationButton"
                aria-describedby={fullScreenChatNotificationId}
                aria-label="settings"
                color="inherit"
                title="Chats"
                onClick={handleFullScreenChatNotificationClick}
                className="showIconLayout"
              >
                <Badge badgeContent={chatNotification ? chatNotification.count : 0} color="secondary">
                  <ChatIcon className="setIcon" />
                </Badge>
              </IconButton>

              <Popover
                className="mr-2"
                id={fullScreenChatNotificationId}
                open={fullScreenChatNotificationOpen}
                anchorEl={fullScreenChatNotificationAnchorEl}
                onClose={handleFullScreenChatNotificationClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'center'
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'center'
                }}
              >
                {loadingChatNotifications ? (
                  <Typography className="m-3">Loading Chat Notifications...</Typography>
                ) : chatNotificationList.length === 0 ? (
                  <Typography className="m-3">No Chat Notifications found</Typography>
                ) : (
                  <ChatNotificationContent data={chatNotificationList} />
                )}
              </Popover>
            </div>

            {/* <IconButton aria-label="settings" color="inherit">
              <Badge badgeContent={1} color="secondary">
                <Notifications />
              </Badge>
            </IconButton> */}

            <IconButton id="helpButton" aria-label="help" color="inherit" onClick={startTour} className="showIconLayout" title="Help">
              <HelpOutline className="setIcon" />
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

          <UserProfile anchorRef={anchorRef} open={open} onToggle={handleToggle} onClose={handleClose} onListKeyDown={handleListKeyDown} />

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
