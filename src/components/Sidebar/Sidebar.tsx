import React, { useEffect, useState, useContext, useRef } from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { CssBaseline, Drawer, List, ListItem, ListItemText, Toolbar, Collapse, ListItemIcon, Tooltip } from '@material-ui/core';
import { Link, withRouter, useHistory } from 'react-router-dom';
import Header from '../Header/Header';
import { useData } from '../../StateProvider/Provider';
import { GlobalChatContext } from '../../StateProvider/GlobalChatContext';
import './Sidebar.scss';
import { ChevronRight, ExpandMore, ExpandLess } from '@material-ui/icons';
import { kebabCase, lowerCase, sortBy } from 'lodash';

import { FaRegUserCircle, FaReact, FaRegRegistered } from 'react-icons/fa';
import { MdOutlineDashboard, MdOutlineLocalActivity } from 'react-icons/md';
import { RiFolderSettingsLine, RiAccountPinCircleFill, RiShieldUserLine } from 'react-icons/ri';
import { SiCivicrm } from 'react-icons/si';
import { AiOutlineSetting } from 'react-icons/ai';
import { BsChatLeftTextFill } from 'react-icons/bs';
import { ProductSetup, AccountsIcon } from '../../assets/sidebar_assets/icons';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import { staticHiddenResource } from '../../constants/helpers';

import { AiOutlineDatabase, AiOutlineFileText } from 'react-icons/ai';
// import { HiOutlineUser } from 'react-icons/hi';
import { FaRegUser } from 'react-icons/fa';

import { AccountCircle } from '@material-ui/icons';
import useStyles from './style';
import routes from '../Helpers/Routes';
import { IoPeopleOutline } from 'react-icons/io5';
import { BiCart, BiCog } from 'react-icons/bi';
import { RiSuitcaseLine } from 'react-icons/ri';
import { SVG } from 'src/assets';

import styles from './sidebar.module.scss';

function SideBar({ toggleDrawer, setToggleDrawer, location }) {
  const [itemToAddActiveClass, setItemToAddActiveClass] = useState(NaN);
  const [subItemToAddActiveClass, setSubItemToAddActiveClass] = useState(NaN);

  const {
    state: { permissions, user, selectedEntity, tour }
  }: any = useData();
  const { isOffline } = useContext(CustomOfflineContext);

  const { setOpen: setChatOpen } = useContext(GlobalChatContext);
  const history = useHistory();
  const classes = useStyles();
  const [open, setOpen] = useState({});
  const pathnames = location.pathname.split('/').filter((x) => x);
  const pathName = pathnames.join('');

  const renderIcon = (sectionName: string) => {
    let icon = <FaReact size={20} className={styles.sidebarIcon} />;
    switch (sectionName) {
      case 'Brand Admin':
        icon = <FaRegUserCircle size={20} className={styles.sidebarIcon} />;
        break;
      case 'Master Data':
        icon = <AiOutlineDatabase size={20} className={styles.sidebarIcon} />;
        break;
      case 'Product Setup':
        icon = <ProductSetup size={20} className={styles.sidebarIcon} />;
        break;
      case 'Admin Portal':
        icon = <RiShieldUserLine size={20} className={styles.sidebarIcon} />;
        break;
      case 'Accounts':
        icon = <FaRegUser size={20} className={styles.sidebarIcon} />;
        break;
      case 'CRM +':
        icon = <SiCivicrm size={20} className={styles.sidebarIcon} />;
        break;
      case 'ROM':
        icon = <FaRegRegistered size={20} className={styles.sidebarIcon} />;
        break;
      case 'Sales Management':
        icon = <SiCivicrm size={20} className={styles.sidebarIcon} />;
        break;
      case 'Rental Management':
        icon = <FaRegRegistered size={20} className={styles.sidebarIcon} />;
        break;
      case 'Inventory Management':
        icon = <RiSuitcaseLine size={20} className={styles.sidebarIcon} />;
        break;
      case 'eCommerce':
        icon = <BiCart size={20} className={styles.sidebarIcon} />;
        break;
      case 'Repair & Maintenance Management':
        icon = <ProductSetup size={20} className={styles.sidebarIcon} />;
        break;
      case 'Service Management':
        icon = <FaRegUser size={20} className={styles.sidebarIcon} />;
        break;
      case 'Setups':
        icon = <BiCog size={20} className={styles.sidebarIcon} />;
        break;
      case 'Activities':
        icon = <IoPeopleOutline size={20} className={styles.sidebarIcon} />;
        break;

      default:
        icon = <FaReact size={20} className={styles.sidebarIcon} />;
        break;
    }
    return icon;
  };

  let toggleTimeout;

  const handleToggleDrawer = () => {
    setToggleDrawer(!toggleDrawer);
    if (toggleDrawer) {
      setOpen({});
    }
  };

  const handleRoutes = (item) => {
    switch (item.name) {
      case 'Pos':
        return routes.pos.path;
      default:
        return `/${kebabCase(item.name)}`;
    }
  };

  useEffect(() => {
    if (!toggleDrawer) {
      setOpen({});
    }
  }, [toggleDrawer]);

  const listItems = () => {
    if (user) {
      var sections = [];

      let entityData;
      if (user?.entity && user.entity.length) {
        entityData = user.entity.find((curEntity) => curEntity._id === selectedEntity);
      }

      user.role.sideBar.forEach((item) => {
        if (!sections.includes(item.sectionName) && item.isRead && !item.isHidden) {
          sections.push(item.sectionName);
        }
      });

      if (entityData?.resource && entityData.resource.length) {
        entityData.resource.forEach((item) => {
          if (!sections.includes(item.sectionName) && item.isRead && !item.isHidden && item.sectionName !== '') {
            sections.push(item.sectionName);
          }
        });
      }

      return sections.map((section) => {
        const lists = user.role.sideBar.filter((list) => list.sectionName === section);

        let enitityList = [];

        if (entityData?.resource && entityData.resource.length) {
          enitityList = entityData.resource.filter((list) => list.sectionName === section);
        }
        const items = [...lists, ...enitityList].filter((item) => {
          if (item?.name === 'Product Builder' && process.env.REACT_APP_ENV === 'staging') {
            return false;
          }
          if (item?.isHidden || staticHiddenResource?.includes(item?.name)) {
            return false;
          }
          return item.isRead === true;
        });
        return { section, items };
      });
    }
  };

  const handleCollapse = (section) => {
    let tempdata = { ...open };
    tempdata[section] = !tempdata[section] || false;
    setOpen(tempdata);
  };

  return (
    <div>
      <CssBaseline />
      <Header toggleDrawer={handleToggleDrawer} isDrawerOpen={toggleDrawer} />
      <Drawer
        onClick={() => {
          toggleTimeout = setTimeout(() => setToggleDrawer(true), 300);
        }}
        // onClick={() => {
        //   toggleTimeout = setTimeout(() => setToggleDrawer((prev) => !prev), 300);
        // }}
        onMouseEnter={() => {
          toggleTimeout = setTimeout(() => setToggleDrawer(true), 300);
        }}
        onMouseLeave={() => {
          if (toggleTimeout) {
            clearTimeout(toggleTimeout);
          }
          if (toggleDrawer)
            setTimeout(() => {
              setToggleDrawer(false);
            }, 500);
        }}
        variant="permanent"
        className={clsx(styles.drawer, 'sidebar-drawer', {
          [classes.drawerOpen]: toggleDrawer,
          [classes.drawerClose]: !toggleDrawer,
          'sidebar-overflow-hide': !toggleDrawer && tour.stepIndex !== 1,
          'sidebar-overflow-auto': toggleDrawer && tour.stepIndex !== 1
        })}
        classes={{
          paper: clsx(styles.drawer, {
            [classes.drawerOpen]: toggleDrawer,
            [classes.drawerClose]: !toggleDrawer,
            'sidebar-overflow-hide': !toggleDrawer && tour.stepIndex !== 1,
            'sidebar-overflow-auto': toggleDrawer && tour.stepIndex !== 1,
            'sidebar-drawer': true
          })
        }}
      >
        <Toolbar />
        <div id="sidebarOrDrawer">
          {toggleDrawer ? (
            <img className={styles.logo} src={SVG('LogoNew')} onClick={() => history.push('/')} alt="equip logo" title="eQuipt Logo" />
          ) : (
            <img className={styles.logo} src={SVG('LogoNewShort')} onClick={() => history.push('/')} alt="equip logo" title="eQuipt Logo" />
          )}
          <List className={`${styles.listContainer} sidebar-list`}>
            <ListItem
              button
              selected={location.pathname === '/'}
              className={`${styles.listItem} ${pathName === '' ? styles.activeList : ''}`}
              onClick={() => {
                setItemToAddActiveClass(NaN);
                setSubItemToAddActiveClass(NaN);
                history.push('/');
              }}
            >
              {pathName === '' && (
                <>
                  <i />
                  <i />
                </>
              )}
              <ListItemIcon className={`${styles.listIcon} hi`}>
                {toggleDrawer ? (
                  <FaRegUserCircle
                    className={styles.sidebarIcon}
                    size={20}
                    onClick={() => {
                      history.push('/');
                    }}
                  />
                ) : (
                  <ChevronRight className={styles.sidebarIcon} />
                )}
              </ListItemIcon>
              <ListItemText
                onClick={() => {}}
                primary={[user?.user?.firstName, user?.user?.lastName].filter((f) => f).join(' ')}
                // className={`wordWrap`}
              />
            </ListItem>
            {permissions?.dashboard?.isRead && !isOffline && (
              <Link
                to="/dashboards"
                onClick={() => {
                  setItemToAddActiveClass(NaN);
                  setSubItemToAddActiveClass(NaN);
                }}
              >
                <Tooltip title={!toggleDrawer ? 'Dashboards' : ''}>
                  <ListItem
                    button
                    selected={location.pathname === '/dashboards'}
                    className={`${styles.listItem} ${pathName === 'dashboards' && styles.activeList}`}
                  >
                    {pathName === 'dashboards' && (
                      <>
                        <i />
                        <i />
                      </>
                    )}
                    <ListItemIcon className={styles.listIcon}>
                      <MdOutlineDashboard size={20} className={styles.sidebarIcon} />
                    </ListItemIcon>
                    <ListItemText primary="Dashboards" className={`wordWrap`} />
                  </ListItem>
                </Tooltip>
              </Link>
            )}
            {permissions?.report?.isRead && !isOffline && (
              <Link
                to="/reports"
                onClick={() => {
                  setItemToAddActiveClass(NaN);
                  setSubItemToAddActiveClass(NaN);
                }}
              >
                <Tooltip title={!toggleDrawer ? 'Reports' : ''}>
                  <ListItem
                    button
                    selected={location.pathname === '/reports'}
                    className={`${styles.listItem} ${pathName === 'reports' && styles.activeList}`}
                  >
                    {pathName === 'reports' && (
                      <>
                        <i />
                        <i />
                      </>
                    )}
                    <ListItemIcon className={styles.listIcon}>
                      <AiOutlineFileText size={20} className={styles.sidebarIcon} />
                    </ListItemIcon>
                    <ListItemText primary="Reports" className={`wordWrap`} />
                  </ListItem>
                </Tooltip>
              </Link>
            )}
            {user &&
              listItems().map((listItem, i) => {
                const items = listItem.items.map((item) => item.name.toLowerCase().split(' ').join('-'));
                return (
                  <React.Fragment key={i}>
                    <Tooltip title={!toggleDrawer ? listItem.section : ''}>
                      <ListItem
                        className={`${styles.listItem} dropdown-items ${items.includes(pathName) && styles.activeList}`}
                        button
                        key={listItem.section + '' + i}
                        onClick={() => {
                          handleCollapse(listItem.section);
                          if (!toggleDrawer) {
                            handleToggleDrawer();
                          }
                        }}
                      >
                        {items.includes(pathName) && (
                          <>
                            <i />
                            <i />
                          </>
                        )}
                        <ListItemIcon className={styles.listIcon}>{renderIcon(listItem.section)}</ListItemIcon>
                        <ListItemText primary={listItem.section} className={`wordWrap`} />
                        {open[listItem.section] ? <ExpandLess /> : <ExpandMore />}
                      </ListItem>
                    </Tooltip>
                    <Collapse in={open[listItem.section]} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding className={`${styles.subList} `}>
                        {listItem.items.map((item, j) => (
                          <Link
                            className={`sub-list ${pathName.includes(item.name.toLowerCase().split(' ').join('-')) && styles.active_sub} ${
                              itemToAddActiveClass == i && subItemToAddActiveClass == j ? 'active_sub' : ''
                            }`}
                            key={j}
                            onClick={() => {
                              setItemToAddActiveClass(i);
                              setSubItemToAddActiveClass(j);
                            }}
                            to={handleRoutes(item)}
                          >
                            <ListItem button selected={pathnames.includes(lowerCase(item.name))} className={classes.nested}>
                              <ListItemText primary={item.resourceLabel || item.name} />
                            </ListItem>
                          </Link>
                        ))}
                      </List>
                    </Collapse>
                  </React.Fragment>
                );
              })}
          </List>
        </div>
        {!isOffline && (
          <List style={{ bottom: '0px', marginTop: 'auto' }}>
            <ListItem button onClick={() => setChatOpen((prevState) => !prevState)}>
              <ListItemIcon className={styles.listIcon}>
                <BsChatLeftTextFill size={20} className={styles.sidebarIcon} />
              </ListItemIcon>
              <ListItemText primary="Chat" />
            </ListItem>
          </List>
        )}
      </Drawer>
    </div>
  );
}

export default withRouter(SideBar);
