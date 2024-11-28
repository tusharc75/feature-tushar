import { useAccount, useMsal } from '@azure/msal-react';
import { AppBar, Box, ButtonBase, Chip, IconButton, Menu, MenuItem, Toolbar, Typography, useMediaQuery } from '@material-ui/core';
import { Brightness1, Close, ExpandMore, MoreVert as MoreIcon } from '@material-ui/icons';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import SyncIcon from '@material-ui/icons/Sync';
import { isEmpty } from 'lodash';
import { useContext, useEffect, useRef, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { GoChevronLeft, GoChevronRight } from 'react-icons/go';
import { HiOutlineMenuAlt1 } from 'react-icons/hi';
import { useHistory, useLocation } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import { SIDEBAR_OPEN, SIDEBAR_OPENED_BY_BUTTON, useStore } from 'src/StateProvider/fastContext';
import { SVG } from 'src/assets';
import { MoonIcon, SunIcon } from 'src/assets/svg/svgIcons';
import { useAppTheme } from 'src/constants/AppConfig';
import { cn } from 'src/constants/helpers';
import { useScrollDirection } from 'src/hooks/useScroll';
import { userManual } from 'src/pages/Home';
import { CustomChatNotificationCountContext } from '../../StateProvider/CustomChatNotificationCountContext/CustomChatNotificationCountContext';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import { useData } from '../../StateProvider/Provider';
import { SET_CHATTER, SET_SELECTED_ENTITY, SET_USER } from '../../StateProvider/actionTypes';
import axiosInstance from '../../axios/axiosInstance';
import { backendApi } from '../../config';
import HtmlTooltip from '../CustomTooltipTitle';
import DashboardModal, { ModalHead } from '../DashboardModal';
import routes from '../Helpers/Routes';
import UserProfile from './../UserProfile';
import ChatNotification from './ChatNotifications';
import styles from './Header.module.scss';
import Notification from './Notification';
import { SearchBar } from './SearchBar';
import { deleteDatabase } from 'src/constants/indexdbhelper';

const Header = () => {
  const [themeColor, toggleThemeColor] = useAppTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useStore((store) => store[SIDEBAR_OPEN]);
  const [sidebarOpenedByButton, setSidebarOpenedByButton] = useStore((store) => store[SIDEBAR_OPENED_BY_BUTTON]);
  const isMobile = useMediaQuery('(max-width:960px)');
  const is768 = useMediaQuery('(max-width: 768px)');

  const toggleSidebarByButton = () => {
    if (isSidebarOpen) {
      setIsSidebarOpen({ [SIDEBAR_OPEN]: false });
      setSidebarOpenedByButton({ [SIDEBAR_OPENED_BY_BUTTON]: false });
    } else {
      setIsSidebarOpen({ [SIDEBAR_OPEN]: true });
      if (!isMobile) setSidebarOpenedByButton({ [SIDEBAR_OPENED_BY_BUTTON]: true });
    }
  };

  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  const {
    state: { user, selectedEntity },
    dispatch
  }: any = useData();

  const history = useHistory();
  const { pathname } = useLocation();
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

  const chatNotification = useContext(CustomChatNotificationCountContext);
  const toastConfig = useContext(CustomToastContext);
  const { isOffline, isSynch } = useContext(CustomOfflineContext);

  const scrollPos = useScrollDirection(40);

  const [modalContent, setModalContent] = useState<ModalHead | null>(null);

  const openHelperModal = () => {
    setModalContent({ title: 'Equipt - User Manual', icon: <img src={SVG('LogoNewShort')} alt="equipt logo" /> });
  };
  const handleCloseHelperModal = () => {
    setModalContent(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      saveEntity();
    }
  }, [selectedEntity]);

  const saveEntity = () => {
    if (!isOffline) {
      axiosInstance()
        .put(`/user/save-selected-entity?selectedEntity=${selectedEntity}`)
        .then(({ data }) => {
          axiosInstance()
            .get('/user/me')
            .then(({ data: response }) => {
              const { data } = response;
              dispatch({ type: SET_USER, payload: data });
            })
            .catch((err) => {
              localStorage.setItem('token', '');
            });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

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

  // Socket listening for chat data
  useEffect(() => {
    if (socket && user) {
      socket.on('connect', () => {
        socket.emit('join', user.user._id);
      });

      socket.on('data', (data) => {
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

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const supportMenuClose = () => {
    setSupportAnchorEl(null);
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
    if (option && option.supportTicket) {
      history.push({
        pathname: routes.supportTicket.path
      });
    }
    setOpen(false);
  };

  window.addEventListener('storage', (event) => {
    if (event.storageArea == localStorage) {
      let token = localStorage.getItem('token');
      if (token === undefined) {
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
      deleteDatabase();
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
              <Typography className={`line-clamp-1 max-w-[200px]`}>{curEntity.entityName}</Typography>
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
        <MenuItem disabled={!selectedEntity} onClick={openEntitiesMenu} className="d-flex justify-content-space-between  ">
          <div className="line-clamp-1 max-w-[180px]">
            <p className={'text-ellipsis'}>{curEntity && curEntity.entityName}</p>
          </div>
          <ExpandMore />
        </MenuItem>
      )}

      {/* Remove below false to show chat notification icon */}

      <ChatNotification />
      <Notification />
      <MenuItem onClick={openHelperModal}>
        <HelpOutlineIcon />
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

  return (
    <div className="poppins">
      <div className={styles.filler}></div>
      <span
        className={cn(
          'fixed  top-[50px] z-[1201] [transition:left_225ms_cubic-bezier(0.4,0,0.6,1)_0ms] [&_svg]:block',
          isSidebarOpen ? 'left-[calc(290px)]' : 'left-[70px]',
          isMobile && !isSidebarOpen && '-left-[27px]'
        )}
      >
        <IconButton
          size="small"
          onClick={() => {
            if (isSidebarOpen) {
              setIsSidebarOpen({ [SIDEBAR_OPEN]: false });
              setSidebarOpenedByButton({ [SIDEBAR_OPENED_BY_BUTTON]: false });
            } else {
              setIsSidebarOpen({ [SIDEBAR_OPEN]: true });
            }
          }}
          className=" !size-[26px] !rounded-[9px]  !bg-[var(--sidebar-bg)] !text-[var(--sidebar-text-color)] ![border:1px_solid_var(--common-border-color)]"
        >
          {isSidebarOpen ? <GoChevronLeft /> : <GoChevronRight className=" align-middle" />}
        </IconButton>
      </span>
      <AppBar
        position="relative"
        className={` ${scrollPos?.scrolled ? styles.fixedAppBar : ''} ${styles.toolbar}`}
        style={{ backgroundColor: themeColor === 'light' ? '#fff' : 'var(--dark-primary)' }}
      >
        <Toolbar className={` ${styles.mainConainer}`} style={{ color: themeColor === 'light' ? '#3d3d3d' : '#fff' }}>
          <Box
            component="div"
            className={`${isSidebarOpen && sidebarOpenedByButton ? styles.drawerOpen : styles.drawerClosed} ${styles.leftContent} ${
              styles.flexAlignCenter
            } flex-grow`}
          >
            <div className={` ${styles.toggleButton}`}>
              <IconButton
                aria-label="help"
                color="inherit"
                style={{ background: sidebarOpenedByButton && isSidebarOpen ? 'var(--dark-secondary, #f3f3f3)' : '' }}
                title="Menu"
                onClick={toggleSidebarByButton}
              >
                {sidebarOpenedByButton && isSidebarOpen ? <Close /> : <HiOutlineMenuAlt1 />}
              </IconButton>
            </div>
            {/* Searchbar */}
            {!is768 && <SearchBar user={user} selectedEntity={selectedEntity} history={history} />}
          </Box>

          {/* Brand Logo */}
          {/* {user?.brandLogo ? <img src={user.brandLogo} alt="brand" className={`${styles.brandLogo}`} /> : null} */}

          {/* Select entity */}
          {!isMobile && (
            <Box className={`${styles.entity}`}>
              {selectedEntity && (
                <ButtonBase id="entitySelect">
                  <HtmlTooltip title={curEntity && `Selected Entity - ${curEntity.entityName}`} placement="top" enterDelay={0} arrow>
                    <Box
                      aria-controls={entitiesMenuId}
                      color="inherit"
                      onClick={openEntitiesMenu}
                      className={`${styles.flexAlignCenter} poppins max-w-[200px]`}
                    >
                      {curEntity?.entityLogo ? (
                        <>
                          <img src={curEntity.entityLogo} alt={curEntity ? curEntity.entityName : ''} className="max-h-[44px]" />
                        </>
                      ) : (
                        <span className={'poppins line-clamp-1'}>{curEntity && curEntity.entityName}</span>
                      )}

                      <Box component="span" mr={1} />
                      <ExpandMore />
                    </Box>
                  </HtmlTooltip>
                </ButtonBase>
              )}
            </Box>
          )}

          {!isMobile && (
            <div className={`${styles.flexAlignCenter}`}>
              <div>
                {isOffline && (
                  <IconButton>
                    <HtmlTooltip title="You are working offline right now">
                      <Brightness1 color="error" className="blink" />
                    </HtmlTooltip>
                  </IconButton>
                )}
                {isSynch && (
                  <IconButton color="inherit">
                    <HtmlTooltip title="Synchronizing offline data">
                      <SyncIcon className="rotate" />
                    </HtmlTooltip>
                  </IconButton>
                )}
                <HtmlTooltip title={themeColor === 'light' ? 'Turn off the light' : 'Turn on the light'}>
                  <IconButton
                    onClick={() => {
                      toggleThemeColor();
                    }}
                    aria-describedby={`current theme ${themeColor}`}
                    aria-label="Them switcher"
                    color="inherit"
                    className={styles.showIconLayout}
                  >
                    {themeColor === 'light' ? <MoonIcon /> : <SunIcon />}
                  </IconButton>
                </HtmlTooltip>

                <Notification />
              </div>

              {/* Remove below false to show chat notification icon */}

              <div>
                {/* <IconButton
                  id="chatNotificationButton"
                  aria-describedby={fullScreenChatNotificationId}
                  aria-label="settings"
                  color="inherit"
                  title="Chats"
                  onClick={handleFullScreenChatNotificationClick}
                  className={styles.showIconLayout}
                >
                  <Badge variant="dot" overlap="circular" badgeContent={chatNotification ? chatNotification.count : 0} color="secondary">
                    <ChatBubbleOutlineOutlinedIcon className="setIcon" style={{ maxWidth: 22 }} />
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
                </Popover> */}
                <ChatNotification />
              </div>

              <IconButton id="helpButton" aria-label="help" color="inherit" onClick={openHelperModal} className={styles.showIconLayout} title="Help">
                <HelpOutlineIcon className="setIcon" />
              </IconButton>
            </div>
          )}
          {isMobile && (
            <HtmlTooltip title={themeColor === 'light' ? 'Turn off the light' : 'Turn on the light'}>
              <IconButton
                onClick={() => {
                  toggleThemeColor();
                }}
                aria-describedby={`current theme ${themeColor}`}
                aria-label="Them switcher"
                color="inherit"
                className={styles.showIconLayout}
              >
                {themeColor === 'light' ? <MoonIcon /> : <SunIcon />}
              </IconButton>
            </HtmlTooltip>
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
      <DashboardModal
        modalHead={modalContent}
        handleClose={handleCloseHelperModal}
        style={{ position: 'relative', width: 'min(468px, calc(100vw - 64px))' }}
      >
        <a
          title="open equipt documentation"
          rel="noreferrer"
          href={userManual.link}
          target="_blank"
          className={styles.viewAll}
          onClick={handleCloseHelperModal}
        >
          <Typography component="span">Equipt - User Manual</Typography>
          <FiExternalLink size={20} style={{ marginBottom: 4 }} />
        </a>
      </DashboardModal>
      {renderMobileMenu}
      {supportMenu}
      {arcelorMenu}
      {entitiesMenu}
    </div>
  );
};

export default Header;
