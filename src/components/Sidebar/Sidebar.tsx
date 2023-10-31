import { Collapse, CssBaseline, Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Tooltip } from '@material-ui/core';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import clsx from 'clsx';
import { kebabCase, lowerCase } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { Link, useHistory, withRouter } from 'react-router-dom';
import { setDataBySectionName } from 'src/pages/Home/helpers';
import { GlobalChatContext } from '../../StateProvider/GlobalChatContext';
import { useData } from '../../StateProvider/Provider';
import Header from '../Header/Header';
import { BsChatLeftTextFill } from 'react-icons/bs';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import { SVG } from 'src/assets';
import routes from '../Helpers/Routes';
import useStyles from './style';
import styles from './sidebar.module.scss';
import { TResource, TSidebarItem, TSidebarSection } from './type';
import { isSectionActive, isSectionVisible, staticSidebarData } from './utils';

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
  const pathName = pathnames[0];

  const renderIcon = (sectionName: string) => {
    let { sideBarIcon } = setDataBySectionName(sectionName);
    return sideBarIcon;
  };

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

  return (
    <div>
      <CssBaseline />
      <Header toggleDrawer={handleToggleDrawer} isDrawerOpen={toggleDrawer} />
      <Drawer
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
        open={toggleDrawer}
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
          }
        }}
        keepMounted
      >
        <Toolbar />
        <div id="sidebarOrDrawer" style={{ borderTop: '1px solid #485B64' }}>
          <div className="max-[959px]:min-h-[56px] min-[771px]:min-h-[unset] max-[770px]:min-h-[56px] ">
            <img
              className={`${styles.logo} ${toggleDrawer ? 'block' : 'hidden'} ml-[22px]`}
              src={user.brandLogo || SVG('LogoNew')}
              onClick={() => history.push('/')}
              alt="equip logo"
              title="eQuipt Logo"
            />
            <img
              className={`${styles.logo} ${toggleDrawer ? 'hidden' : 'block'} mx-auto `}
              src={SVG('LogoNewShort')}
              onClick={() => history.push('/')}
              alt="equip logo"
              title="eQuipt Logo"
            />
          </div>
          <List
            className={`${styles.listContainer} sidebar-list max-h-[calc(100vh-150px)] ${
              toggleDrawer ? 'overflow-y-auto' : 'overflow-y-hidden'
            } overflow-x-hidden`}
          >
            {getListItem()?.map((listItem, i) => {
              const hasChild = Boolean(listItem.items);

              return (
                <React.Fragment key={listItem.name}>
                  <Tooltip title={!toggleDrawer ? listItem.name : ''}>
                    <ListItem
                      className={`${styles.listItem} dropdown-items ${isSectionActive(pathName, location.pathname, listItem) && styles.activeList}`}
                      button
                      key={listItem.name + '' + i}
                      onClick={() => {
                        if (toggleDrawer) {
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
                      <ListItemText primary={listItem.name} className={`wordWrap  line-clamp-1`} />
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
        {!isOffline && (
          <List style={{ bottom: '0px', marginTop: 'auto' }}>
            <ListItem style={{ paddingLeft: '31px', paddingBlock: '12px' }} button onClick={() => setChatOpen((prevState) => !prevState)}>
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
