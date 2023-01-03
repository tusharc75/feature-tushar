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
  ListItem,
  ListItemText,
  List,
  Tooltip
} from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Avatar from '@material-ui/core/Avatar';
import { MoreVert as MoreIcon, Clear as ClearIcon, Notifications, HelpOutline, ExpandMore, Brightness1 } from '@material-ui/icons';
import SyncIcon from '@material-ui/icons/Sync';
import io, { Socket } from 'socket.io-client';
import { useHistory, Link, useLocation } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import { SVG } from '../../assets';
import UserProfile from './../UserProfile';
import { SET_CHATTER, SET_SELECTED_ENTITY, SET_START_TOUR, SET_USER, SET_SEARCH } from '../../StateProvider/actionTypes';
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
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import { AiOutlineClear } from 'react-icons/ai';

import { SVGImages, IMAGE_WIDTH, IMAGE_HEIGHT, IconConst } from 'src/assets/dashboard_images';
import { kebabCase } from 'lodash';
import { staticHiddenResource } from '../../constants/helpers';
import SentimentVeryDissatisfiedIcon from '@material-ui/icons/SentimentVeryDissatisfied';
import { useScrollDirection } from 'src/hooks/useScroll';
import useClickdOutside from 'src/hooks/useClickOutside';
import usePathname from 'src/hooks/usePathName';
import styles from './Header.module.scss';
import { HiOutlineMenuAlt1 } from 'react-icons/hi';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { FiMessageSquare } from 'react-icons/fi';
import AzureInstance from 'src/AzureInstance';

const useStyles = makeStyles((theme) => ({
  grow: {
    flexGrow: 1
  },
  appBar: {
    zIndex: theme.zIndex.drawer
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

const Header = ({ toggleDrawer, isDrawerOpen }) => {
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  const {
    state: { user, selectedEntity },
    dispatch
  }: any = useData();

  const classes = useStyles();
  const history = useHistory();
  const { pathname } = useLocation();
  const isMobile = useMediaQuery('(max-width:959.95px)');
  const is768 = useMediaQuery('(max-width: 768px)');

  const [isSearch, setIsSearch] = useState(false);
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

  // For FullScreen Notification - Start
  const [fullScreenNotificationAnchorEl, setFullScreenNotificationAnchorEl] = React.useState(null);
  const scrollPos = useScrollDirection(40);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      saveEntity();
    }
  }, [selectedEntity]);

  const saveEntity = () => {
    axiosInstance()
      .put(`/user/save-selected-entity?selectedEntity=${selectedEntity}`)
      .then(({ data }) => {})
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleFullScreenNotificationClick = (event) => {
    setFullScreenNotificationAnchorEl(event.currentTarget);
    setLoadingNotifications(true);

    axiosInstance()
      .get('/notification/all')
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
      .get('/notification/all')
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
    const s = io(`${backendApi?.replace('/api', '')}/user`, {
      path: backendApi?.includes('/api') ? '/api/socket.io/' : '/socket.io/',
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
        await instance.logout({
          account: account,
          authority: 'https://login.microsoftonline.com/common/.well-known/openid-configuration'
        });
      }
    } catch (e) {
      // toastConfig.setToastConfig({
      //   open: true,
      //   type: 'error',
      //   message: 'Need to logout from Azure'
      // });
    } finally {
      await axiosInstance()
        .get('/user/logout')
        .then(() => {
          history.push('/');
          dispatch({ type: SET_USER, payload: null });
          dispatch({ type: SET_SELECTED_ENTITY, payload: null });
          localStorage.clear();
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
        <div className={`d-flex align-items-center gap-1`}>
          <div className={`${classes.markAll} `}>
            <Typography
              onClick={() => {
                axiosInstance()
                  .put('/notification/all-read', { toggle: true })
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
              style={{ marginRight: 20 }}
            >
              <FiCheckCircle className="mr-2 pt-1" size={16} />
              <span>Mark all as read</span>
            </Typography>
          </div>
          <div className={`${classes.markAll} `}>
            <Typography
              onClick={() => {
                axiosInstance()
                  .put('/notification/clear')
                  .then(({ data }) => {
                    toastConfig.setToastConfig({
                      open: true,
                      message: data.message,
                      type: 'success'
                    });
                    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                    !isMobile ? handleFullScreenNotificationClick : handleMobileScreenNotificationClick;
                    setFullScreenNotificationAnchorEl(null);
                    setMobileScreenNotificationAnchorEl(null);
                  })
                  .catch((error) => {
                    toastConfig.setToastConfig(error);
                  });
              }}
              className="cursor-pointer"
            >
              <AiOutlineClear className="mr-2 pt-1" size={16} />
              <span>Clear all</span>
            </Typography>
          </div>
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
                      .then(() => {})
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
        <div className={`d-flex align-items-center gap-1`} style={{ position: 'sticky', top: 0 }}>
          <div className={classes.markAll}>
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
          <div className={classes.markAll}>
            <Typography
              onClick={() => {
                axiosInstance()
                  .put('/user/user-notification/clear-all', { toggle: true })
                  .then(({ data }) => {
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
              <AiOutlineClear className="mr-2 pt-1" size={16} />
              <span>Clear All</span>
            </Typography>
          </div>
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
                      .then(() => {})
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
      style={{ marginTop: '40px' }}
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

      <MenuItem onClick={mobileScreenChatNotificationAnchorEl === null ? handleMobileScreenChatNotificationClick : () => {}}>
        <Badge
          variant="dot"
          overlap="circular"
          badgeContent={chatNotification ? chatNotification.count : 0}
          color="secondary"
          aria-describedby={mobileScreenChatNotificationId}
        >
          <FiMessageSquare style={{ maxWidth: 19 }} />
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

      <MenuItem onClick={mobileScreenNotificationAnchorEl === null ? handleMobileScreenNotificationClick : () => {}}>
        <Badge
          variant="dot"
          overlap="circular"
          badgeContent={notification ? notification.count : 0}
          color="secondary"
          aria-describedby={mobileScreenNotificationId}
        >
          <IoMdNotificationsOutline style={{ maxWidth: 19 }} />
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
        <HelpOutline style={{ maxWidth: 19 }} />
        <Box component="span" mx={1} my={2} />
        <p>Help</p>
      </MenuItem>
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
      history.push({ pathname: routes.transferAsset.path });
    }
    if (history.location.pathname.includes(routes.rentalManagementDetail.path)) {
      history.push({ pathname: routes.rentalManagement.path });
    }
    if (history.location.pathname.includes(routes.repairJobDetail.path)) {
      history.push({ pathname: routes.repairJob.path });
    }
    if (history.location.pathname.includes(routes.deliveryTicketDetail.path)) {
      history.push({ pathname: routes.deliveryTicket.path });
    }
    if (history.location.pathname.includes(routes.serializedAssetDetail.path)) {
      history.push({ pathname: routes.serializedAsset.path });
    }
    if (history.location.pathname.includes(routes.pricingConditionDetail.path)) {
      history.push({ pathname: routes.pricingCondition.path });
    }
    if (history.location.pathname.includes('/dashboards')) {
      history.push({ pathname: '/dashboards' });
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
      <div className={styles.filler}></div>
      <AppBar
        position="relative"
        className={` ${scrollPos?.scrolled ? styles.fixedAppBar : ''} ${styles.toolbar}`}
        style={{ backgroundColor: '#fff' }}
      >
        <Toolbar className={` ${styles.mainConainer}`}>
          <Box
            component="div"
            className={`${isDrawerOpen ? styles.drawerOpen : styles.drawerClosed} ${styles.leftContent} ${styles.flexAlignCenter}`}
            flexGrow
          >
            <div className={` ${styles.toggleButton}`}>
              <IconButton aria-label="help" color="inherit" title="Menu" onClick={toggleDrawer}>
                <HiOutlineMenuAlt1 />
              </IconButton>
            </div>
            {/* Searchbar */}
            {!is768 && <SearchBar user={user} selectedEntity={selectedEntity} history={history} />}

            {/* <Link to="/">
              <img className={classes.logo} src={SVG('LogoNew')} alt="equip logo" title="eQuipt Logo" />
            </Link> */}
          </Box>

          {/* Brand Logo */}
          {user?.brandLogo ? <img src={user.brandLogo} alt="brand" className={`${styles.brandLogo}`} /> : null}

          {/* Select entity */}
          {!isMobile && (
            <Box className={`${styles.entity}`}>
              {selectedEntity && (
                <ButtonBase id="entitySelect">
                  <Box
                    aria-controls={entitiesMenuId}
                    color="inherit"
                    onClick={openEntitiesMenu}
                    title={curEntity && `Selected entity - ${curEntity.entityName}`}
                    className={`${styles.flexAlignCenter} `}
                  >
                    <span className={''}>{curEntity && curEntity.entityName}</span>
                    <Box component="span" mr={1} />
                    <ExpandMore />
                  </Box>
                </ButtonBase>
              )}
            </Box>
          )}

          {!isMobile && (
            <div className={`${styles.flexAlignCenter}`}>
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

                <IconButton
                  id="notificationButton"
                  aria-describedby={fullScreenNotificationId}
                  aria-label="settings"
                  color="inherit"
                  title="Notifications"
                  onClick={handleFullScreenNotificationClick}
                  className={styles.showIconLayout}
                >
                  <Badge variant="dot" overlap="circular" badgeContent={notification ? notification.count : 0} color="secondary">
                    <IoMdNotificationsOutline className="setIcon" style={{ maxWidth: 19 }} />
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
                  className={styles.showIconLayout}
                >
                  <Badge variant="dot" overlap="circular" badgeContent={chatNotification ? chatNotification.count : 0} color="secondary">
                    <FiMessageSquare className="setIcon" style={{ maxWidth: 19 }} />
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

              <IconButton id="helpButton" aria-label="help" color="inherit" onClick={startTour} className={styles.showIconLayout} title="Help">
                <HelpOutline className="setIcon" style={{ maxWidth: 19 }} />
              </IconButton>
            </div>
          )}

          <Box className={styles.profile}>
            <UserProfile anchorRef={anchorRef} open={open} onToggle={handleToggle} onClose={handleClose} onListKeyDown={handleListKeyDown} />
          </Box>

          {isMobile && (
            <IconButton
              aria-label="show more"
              aria-controls={mobileMenuId}
              aria-haspopup="true"
              onClick={handleMobileMenuOpen}
              color="inherit"
              title="More"
              className={styles.moreIcons}
            >
              <MoreIcon />
            </IconButton>
          )}
          {is768 && <SearchBar user={user} selectedEntity={selectedEntity} history={history} />}
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

const sectionVariations = (sec) => {
  let icon = <img src={SVGImages(IconConst.PRODUCT_SETUP)} alt="Product Setup Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
  let heading = '';
  let text = '';
  let color = '#FFEFEE';

  switch (sec) {
    case 'Product Setup':
      icon = <img src={SVGImages(IconConst.PRODUCT_SETUP)} alt="Product Setup Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
      text = 'Product and Category Setup.';
      color = '#FFEFEE';
      break;
    case 'Admin Portal':
      icon = <img src={SVGImages(IconConst.ADMIN_PORTAL)} alt="Admin Portal Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
      text = 'Build your own Template, Manage Roles and Entities.';
      color = '#F3F8FF';
      break;
    case 'CRM +':
      icon = <img src={SVGImages(IconConst.CRM)} alt="Crm Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
      text = 'Convert leads and close sales deals faster.';
      color = '#FFF7F2';
      break;
    case 'ROM':
      icon = <img src={SVGImages(IconConst.ROM)} alt="ROM Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
      text = 'Fulfill Rental Orders Faster.';
      color = '#F9FDEC';
      break;
    case 'Accounts':
      icon = <img src={SVGImages(IconConst.ACCOUNTS)} alt="Accounts Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
      text = 'Customer and Supplier Account Management at your fingertips.';
      color = '#FFFAEC';
      break;
    case 'Activities':
      icon = <img src={SVGImages(IconConst.ACTIVITIES)} alt="Activities Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
      text = 'Assign and Access Activities related to an Order.';
      color = '#F6F1FF';
      break;

    case 'Dynamic Forms':
      icon = <img src={SVGImages(IconConst.FORM_ICON)} alt="Form Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
      text = 'Setup Dynamic Forms & Templates';
      color = '#FFEFEE';
      break;
    case 'Inventory Management':
      icon = <img src={SVGImages(IconConst.INVENTORY_MANAGEMENT)} alt="Form Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
      text = 'Manage Inventory and Purchases Smartly.';
      color = '#F3F8FF';
      break;
    default:
      icon = <img src={SVGImages(IconConst.GEN_ICON)} alt="Form Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
      text = '';
      color = '#FFF7F2';
  }
  return { icon, heading, text, color };
};

const SearchBar = ({ user, selectedEntity, history }) => {
  const {
    state: { searchQuery },
    dispatch
  }: any = useData();

  const [sections, setSections] = useState([]);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    let arr = [];
    let allData = [];
    // let allData = user && [...user?.role.sideBar];
    let entityData;
    if (user?.entity && user.entity.length) {
      entityData = user.entity.find((curEntity) => curEntity._id === selectedEntity);
    }
    if (entityData?.resource) {
      allData = entityData.resource;
    }

    allData?.forEach((u) => {
      u['resourceLabel'] = u.resourceLabel ?? u.name;
      u['sectionNameLowerCase'] = u.sectionName?.toLowerCase();
      u['resourceLabelLowerCase'] = u.resourceLabel?.toLowerCase() ?? u.name?.toLowerCase();
      !arr.includes(u.sectionName) && arr.push(u.sectionName);
    });

    var data = arr.map((sec) => {
      const list = allData?.filter((u) => {
        if (u?.name === 'Product Builder' && process.env.REACT_APP_ENV === 'staging') {
          return false;
        }
        if (u?.isHidden || staticHiddenResource?.includes(u?.name)) {
          return false;
        }
        return sec === u.sectionName && u.isRead;
      });

      let { icon, heading, text, color } = sectionVariations(sec);

      return {
        icon: icon,
        text: text,
        head: sec,
        items: list,
        color: color
      };
    });

    setSections(data);
  }, [user, selectedEntity]);

  const handleSearch = (value) => {
    dispatch({ type: SET_SEARCH, payload: value });
    const searchedValueInLowerCase = value?.toLowerCase();
    const filteredItems = [];

    sections.forEach((section) => {
      const items = section.items.filter(
        (ff) => ff.sectionNameLowerCase.indexOf(searchedValueInLowerCase) > -1 || ff.resourceLabelLowerCase.indexOf(searchedValueInLowerCase) > -1
      );
      if (items.length > 0) {
        filteredItems.push({ ...section, items: items });
      }
    });
    setFilteredData(filteredItems);
  };
  const clearSearch = () => {
    dispatch({ type: SET_SEARCH, payload: '' });
    setSearch('');
    setShowCloseButton(false);
  };

  const handleRoutes = (item) => {
    switch (item.name) {
      case 'Pos':
        return routes.pos.path;
      default:
        return `/${kebabCase(item.name)}`;
    }
  };
  const pathName = usePathname();

  return (
    <div className={styles.searchContainer}>
      <div className={`${styles.search_input}`} style={{ borderRadius: showCloseButton ? '4px 4px 0 0' : '4px' }}>
        <input
          type="text"
          value={search}
          placeholder="Search"
          onChange={(e) => {
            const searchedValue = e.target.value;
            searchedValue.length > 0 ? setShowCloseButton(true) : setShowCloseButton(false);
            setSearch(searchedValue);
            handleSearch(searchedValue);
          }}
          style={{ borderRadius: showCloseButton ? '4px 4px 0 0' : '4px' }}
        />
        <IconButton className={styles.searchIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
            <path d="M11.4233 11.5286L14.7983 14.9036" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            <path
              d="M7.20459 12.6536C10.1559 12.6536 12.5483 10.2611 12.5483 7.30981C12.5483 4.35854 10.1559 1.96606 7.20459 1.96606C4.25332 1.96606 1.86084 4.35854 1.86084 7.30981C1.86084 10.2611 4.25332 12.6536 7.20459 12.6536Z"
              stroke="#fff"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </IconButton>
        {showCloseButton && (
          <div className={styles.clear_icon}>
            <ClearIcon onClick={() => clearSearch()} />
          </div>
        )}
      </div>
      {search.trim() !== '' && pathName === '/' && (
        <SearchResult filteredData={filteredData} history={history} handleRoutes={handleRoutes} clearSearch={clearSearch} />
      )}
    </div>
  );
};

const SearchResult = ({ filteredData, history, handleRoutes, clearSearch }) => {
  const resultRef = useRef(null);
  const isClickOutside = useClickdOutside(resultRef);
  useEffect(() => {
    if (isClickOutside) {
      clearSearch();
    }
  }, [isClickOutside]);
  return (
    <div className={styles.searchResult} ref={resultRef}>
      <div className={`${styles.filtered_data} `} style={{ overflowY: filteredData.length === 0 ? 'auto' : 'scroll' }}>
        {filteredData.length !== 0 ? (
          filteredData.map((section, key) => {
            return (
              <List key={key} subheader={<li className={`${styles.list_header}`}>{section.head}</li>}>
                {section.items.map((item, key) => {
                  return (
                    <>
                      <ListItem
                        key={key}
                        button
                        onClick={() => {
                          history.push(handleRoutes(item));
                          clearSearch();
                        }}
                        className={styles.heaaderResults}
                      >
                        <ListItemText primary={item.resourceLabel} style={{ fontSize: '14px' }} />
                      </ListItem>
                    </>
                  );
                })}
              </List>
            );
          })
        ) : (
          <div className={styles.no_result_container}>
            <SentimentVeryDissatisfiedIcon />
            <p className={styles.no_result}>Sorry, we couldn't find any result</p>
          </div>
        )}
      </div>
    </div>
  );
};
