import { Collapse, CssBaseline, Drawer, IconButton, List, ListItem, ListItemIcon, ListItemText, Toolbar, Tooltip } from '@material-ui/core';
import { Close, ExpandLess, ExpandMore } from '@material-ui/icons';
import clsx from 'clsx';
import { kebabCase, lowerCase } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { Link, useHistory, withRouter } from 'react-router-dom';
import { SVG } from 'src/assets';
import { setDataBySectionName } from 'src/pages/Home/helpers';
import { GlobalChatContext } from '../../StateProvider/GlobalChatContext';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import { useData } from '../../StateProvider/Provider';
import Header from '../Header/Header';
import routes from '../Helpers/Routes';
import styles from './sidebar.module.scss';
import useStyles from './style';
import { TResource, TSidebarItem, TSidebarSection } from './type';
import { isSectionActive, isSectionVisible, staticSidebarData } from './utils';
import { useStore, SIDEBAR_OPEN, SIDEBAR_OPENED_BY_BUTTON } from 'src/StateProvider/fastContext';

function SideBar({ location }) {
  const [itemToAddActiveClass, setItemToAddActiveClass] = useState(NaN);
  const [subItemToAddActiveClass, setSubItemToAddActiveClass] = useState(NaN);

  const [isSidebarOpen, setIsSidebarOpen] = useStore((store) => store[SIDEBAR_OPEN]);
  const [sidebarOpenedByButton, setSidebarOpenedByButton] = useStore((store) => store[SIDEBAR_OPENED_BY_BUTTON]);

  const handleSidebarClose = () => {
    setIsSidebarOpen({ [SIDEBAR_OPEN]: false });
    setSidebarOpenedByButton({ [SIDEBAR_OPENED_BY_BUTTON]: false });
  };

  const {
    state: { permissions, user, selectedEntity, tour }
  }: any = useData();
  const { isOffline } = useContext(CustomOfflineContext);

  const { setOpen: setChatOpen } = useContext(GlobalChatContext);
  const history = useHistory();
  const classes = useStyles();
  const [open, setOpen] = useState({});
  const pathnames = location.pathname.split('/').filter((x) => x);
  const pathName = pathnames[0];

  const renderIcon = (sectionName: string) => {
    let { sideBarIcon } = setDataBySectionName(sectionName);
    return sideBarIcon;
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
    if (!isSidebarOpen) {
      setOpen({});
    }
  }, [isSidebarOpen]);

  const getListItem = () => {
    if (user) {
      const sections: TSidebarSection[] = [...staticSidebarData(user, permissions, isOffline)];

      let entitySidebarData: TResource[];
      const userSidebarData: TResource[] = user.role.sideBar || [];
      if (user?.entity && user.entity.length) {
        entitySidebarData = user.entity.find((curEntity) => curEntity._id === selectedEntity)?.resource || [];
      }

      for (const item of [...entitySidebarData, ...userSidebarData]) {
        if (!isSectionVisible(item)) continue;
        const isSectionExist = sections.map((s) => s.sectionName).includes(item.sectionName);
        const itemWithLink: TSidebarItem = { ...item, link: handleRoutes(item) };
        if (!isSectionExist) {
          const newSection: TSidebarSection = {
            name: item.sectionName === 'Activities' || item.sectionName === 'Collaboration Tools' ? 'Collaboration Tools' : item.sectionName,
            sectionName: item.sectionName,
            icon: renderIcon(item.sectionName),
            link: null,
            items: [itemWithLink]
          };
          sections.push(newSection);
        } else {
          const sectionIndex = sections.findIndex((s) => s.sectionName === item.sectionName);
          sections[sectionIndex].items.push(itemWithLink);
        }
      }
      return sections;
    }
    return [];
  };

  const handleCollapse = (section) => {
    let tempdata = { ...open };
    tempdata[section] = !tempdata[section] || false;
    setOpen(tempdata);
  };

  let toggleTimeout;

  return (
    <div>
      <CssBaseline />
      <Header />
      <Drawer
        variant="permanent"
        className={clsx(styles.drawer, 'sidebar-drawer', {
          [classes.drawerOpen]: isSidebarOpen,
          [classes.drawerClose]: !isSidebarOpen,
          'sidebar-overflow-hide': !isSidebarOpen && tour.stepIndex !== 1,
          'sidebar-overflow-auto': isSidebarOpen && tour.stepIndex !== 1
        })}
        classes={{
          paper: clsx(styles.drawer, {
            [classes.drawerOpen]: isSidebarOpen,
            [classes.drawerClose]: !isSidebarOpen,
            'sidebar-overflow-hide': !isSidebarOpen && tour.stepIndex !== 1,
            'sidebar-overflow-auto': isSidebarOpen && tour.stepIndex !== 1,
            'sidebar-drawer': true
          })
        }}
        onClick={() => {
          if (sidebarOpenedByButton) return;
          toggleTimeout = setTimeout(() => setIsSidebarOpen({ [SIDEBAR_OPEN]: true }), 300);
        }}
        onMouseEnter={() => {
          if (sidebarOpenedByButton) return;
          toggleTimeout = setTimeout(() => setIsSidebarOpen({ [SIDEBAR_OPEN]: true }), 300);
        }}
        onMouseLeave={() => {
          if (sidebarOpenedByButton) return;
          if (toggleTimeout) {
            clearTimeout(toggleTimeout);
          }
          if (isSidebarOpen)
            setTimeout(() => {
              setIsSidebarOpen({ [SIDEBAR_OPEN]: false });
            }, 500);
        }}
        keepMounted
      >
        <Toolbar />
        <div id="sidebarOrDrawer" style={{ borderTop: '1px solid #485B64' }}>
          <div className="max-[959px]:min-h-[56px] min-[769px]:min-h-[unset] max-[768px]:min-h-[56px] ">
            <div className={`max-[768px]:pr-[50px] ${styles.logo}`}>
              <img
                className={` ${isSidebarOpen ? 'block' : 'hidden'} ml-[22px] max-h-[33px]`}
                src={user?.brandLogo || SVG('LogoNew')}
                onClick={() => history.push('/')}
                alt="equip logo"
                title="eQuipt Logo"
              />
              <img
                className={`${isSidebarOpen ? 'hidden' : 'block'} mx-auto max-h-[33px]`}
                src={SVG('LogoNewShort')}
                onClick={() => history.push('/')}
                alt="equip logo"
                title="eQuipt Logo"
              />
            </div>
            <div className={`${sidebarOpenedByButton && 'max-[768px]:block'} hidden absolute right-0 top-[5px]`}>
              <IconButton onClick={handleSidebarClose}>
                <Close />
              </IconButton>
            </div>
          </div>
          <List
            className={`${styles.listContainer} sidebar-list max-h-[calc(100vh-80px)] ${
              isSidebarOpen ? 'overflow-y-auto' : 'overflow-y-hidden'
            } overflow-x-hidden`}
          >
            {getListItem()?.map((listItem, i) => {
              const hasChild = Boolean(listItem.items);

              return (
                <React.Fragment key={listItem.name}>
                  <Tooltip title={!isSidebarOpen ? listItem.name : ''}>
                    <ListItem
                      className={`${styles.listItem} dropdown-items ${isSectionActive(pathName, location.pathname, listItem) && styles.activeList}`}
                      button
                      key={listItem.name + '' + i}
                      onClick={() => {
                        if (isSidebarOpen) {
                          handleCollapse(listItem.name);
                        }
                        if (!listItem.items?.length) {
                          history.push(listItem.link);
                        }
                      }}
                    >
                      {isSectionActive(pathName, location.pathname, listItem) && (
                        <>
                          <i />
                          <i />
                        </>
                      )}
                      <ListItemIcon className={styles.listIcon}>{listItem.icon}</ListItemIcon>
                      <ListItemText primary={listItem.name} className={`wordWrap  `} />
                      {hasChild && (
                        <>{open[listItem.name] ? <ExpandLess className={styles.listArrowIcon} /> : <ExpandMore className={styles.listArrowIcon} />}</>
                      )}
                    </ListItem>
                  </Tooltip>
                  {hasChild && (
                    <Collapse in={open[listItem.name]} timeout="auto" unmountOnExit>
                      <List
                        component="div"
                        disablePadding
                        className={`${styles.subList} ${isSectionActive(pathName, location.pathname, listItem) && styles.activeSubList}`}
                      >
                        {listItem.items.map((item, j) => (
                          <Link
                            className={`sub-list ${pathName === item.name.toLowerCase().split(' ').join('-') && styles.active_sub} ${
                              itemToAddActiveClass === i && subItemToAddActiveClass === j ? 'active_sub' : ''
                            }`}
                            key={j}
                            onClick={() => {
                              setItemToAddActiveClass(i);
                              setSubItemToAddActiveClass(j);
                              // setOpen({});
                            }}
                            to={item.link}
                          >
                            <ListItem
                              button
                              selected={pathnames?.includes(lowerCase(item.name))}
                              className={`${classes.nested} ${styles.subListItems} `}
                              style={{ gap: 32 }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 13 13" fill="none">
                                <path
                                  d="M6.50049 0H13.0005V6.5H12.188V1.39014L0.59082 12.981L0.0195312 12.4097L11.6104 0.8125H6.50049V0Z"
                                  fill="currentcolor"
                                  stroke="currentcolor"
                                ></path>
                              </svg>
                              <ListItemText primary={item.resourceLabel || item.name} className={`line-clamp-1`} />
                            </ListItem>
                          </Link>
                        ))}
                      </List>
                    </Collapse>
                  )}
                </React.Fragment>
              );
            })}
          </List>
        </div>
        {/* {!isOffline && (
          <List style={{ bottom: '0px', marginTop: 'auto' }}>
            <ListItem style={{ paddingLeft: '31px', paddingBlock: '12px' }} button onClick={() => setChatOpen((prevState) => !prevState)}>
              <ListItemIcon className={styles.listIcon}>
                <BsChatLeftTextFill size={20} className={styles.sidebarIcon} />
              </ListItemIcon>
              <ListItemText primary="Chat" />
            </ListItem>
          </List>
        )} */}
      </Drawer>
    </div>
  );
}

export default withRouter(SideBar);
