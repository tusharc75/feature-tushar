import { Close } from '@mui/icons-material';
import { Collapse, CssBaseline, IconButton, List, ListItem, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import { kebabCase, lowerCase } from 'lodash';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { GoChevronDown, GoChevronUp } from 'react-icons/go';
import { Link, useHistory, withRouter } from 'react-router-dom';
import { SIDEBAR_OPEN, SIDEBAR_OPENED_BY_BUTTON, useStore } from 'src/StateProvider/fastContext';
import { SVG } from 'src/assets';
import { DynamicIcon } from 'src/assets/IconGenerator';
import { cn } from 'src/constants/helpers';
import { setDataBySectionName } from 'src/pages/Home/helpers';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import { useData } from '../../StateProvider/Provider';
import HtmlTooltip from '../CustomTooltipTitle';
import Header from '../Header/Header';
import routes from '../Helpers/Routes';
import styles from './sidebar.module.scss';
import useStyles from './style';
import { TResource, TSidebarItem, TSidebarSection } from './type';
import { isSectionActive, isSectionVisible, staticSidebarData } from './utils';

const drawerWidth = 306;
const closedDrawerWidth = 84;
let toggleTimeout;

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

  const getListItem = useCallback(() => {
    if (user) {
      const sections: TSidebarSection[] = [...staticSidebarData(user, permissions, isOffline)];

      let entitySidebarData: TResource[];
      const userSidebarData: TResource[] = user.role.sideBar || [];
      if (user?.entity && user.entity.length) {
        entitySidebarData = user.entity.find((curEntity) => curEntity._id === selectedEntity)?.resource || [];
      }

      let dataList = [];
      if (entitySidebarData) {
        dataList = [...dataList, ...entitySidebarData];
      }
      if (userSidebarData) {
        dataList = [...dataList, ...userSidebarData];
      }
      for (const item of dataList) {
        if (!isSectionVisible(item) || item.sectionName === '') continue;
        const isSectionExist = sections.map((s) => s.sectionName).includes(item.sectionName);
        const itemWithLink: TSidebarItem = { ...item, link: handleRoutes(item) };
        if (!isSectionExist) {
          const newSection: TSidebarSection = {
            name:
              item.sectionName === 'Activities' || item.sectionName === 'Collaboration Tools' || item.sectionName === 'Workspace'
                ? 'Workspace'
                : item.sectionName,
            sectionName: item.sectionName,
            icon: renderIcon(item.sectionName),
            link: null,
            items: [itemWithLink]
          };
          const section = user?.role?.brandSectionMaster.find((e) => e?.sectionName === item.sectionName);
          if (section?.iconName && section?.iconName !== '') {
            newSection.icon = DynamicIcon(section.iconName, { size: 20 });
          }
          sections.push(newSection);
        } else {
          const sectionIndex = sections.findIndex((s) => s.sectionName === item.sectionName);
          sections[sectionIndex].items.push(itemWithLink);
        }
      }
      return sections;
    }
    return [];
  }, [isOffline, permissions, selectedEntity, user]);

  const listItems = useMemo(() => getListItem(), [getListItem]);

  const handleCollapse = (section) => {
    let tempdata = { ...open };
    tempdata[section] = !tempdata[section] || false;
    setOpen(tempdata);
  };

  const sidebarOpen = sidebarOpenedByButton || isSidebarOpen;

  return (
    <div>
      <CssBaseline />
      <Header />
      <div
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
        className={cn(
          'main-sidebar fixed left-0 top-0 z-[1200] h-full overflow-hidden bg-[--sidebar-bg] [&_.MuiListItem-root]:min-h-[56px] [&_.MuiListItem-root]:py-[12px] [&_.MuiListItem-root]:pl-[30px] [&_.MuiListItem-root]:pr-[16px]',
          sidebarOpen ? 'w-[306px]' : 'max-[959px]:w-0 min-[960px]:w-[84px] [&_.MuiListItemText-root]:truncate'
        )}
        style={{ transition: 'width 195ms cubic-bezier(0.4, 0, 0.6, 1) 0ms' }}
      >
        <div className={`flex min-h-[64px] items-center justify-center border-b border-r max-[768px]:pr-[50px]`}>
          <img
            className={` ${isSidebarOpen ? 'block' : 'hidden'} mx-auto max-h-[33px]`}
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

        <div className="w-[306px]">
          <div id="sidebarOrDrawer" className={styles.innerContainer}>
            <div className=" max-[959px]:min-h-[0px] max-[768px]:min-h-[0px] min-[769px]:min-h-[unset]">
              <div className={`${sidebarOpenedByButton && 'max-[768px]:block'} absolute right-0 top-[5px] hidden`}>
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
              {listItems?.map((listItem, i) => {
                const hasChild = Boolean(listItem.items);
                const isItemActive = isSectionActive(pathName, location.pathname, listItem);

                return (
                  <React.Fragment key={listItem.name}>
                    <HtmlTooltip title={!isSidebarOpen ? listItem.name : ''}>
                      <ListItem
                        className={`${styles.listItem} dropdown-items ${isItemActive && styles.activeList}`}
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
                        id={`sidbar-parent-item-${listItem.name.split(' ').join('-')}`}
                      >
                        <span
                          className={cn(
                            '-z-10',
                            isItemActive ? 'absolute bottom-2 left-[19px] right-[19px] top-2 rounded-md bg-[var(--new-theme-color)] ' : 'sr-only',
                            isSidebarOpen ? 'left-3 right-3' : 'left-[18px] h-[40px] w-[45px]'
                          )}
                        ></span>
                        <ListItemIcon className={cn(styles.listIcon, isItemActive && '!text-white')}>{listItem.icon}</ListItemIcon>
                        <ListItemText
                          primary={listItem.name}
                          className={cn(
                            `wordWrap [&>span]:!font-normal`,
                            isItemActive ? '[&>span]:!text-white' : '[&>span]:!text-[var(--sidebar-text-color)]'
                          )}
                        />
                        {hasChild && (
                          <span className={cn('expand-icon mr-2', isItemActive ? 'text-white' : 'text-[var(--sidebar-text-color)]')}>
                            {open[listItem.name] ? <GoChevronUp size={20} /> : <GoChevronDown size={20} />}
                          </span>
                        )}
                      </ListItem>
                    </HtmlTooltip>
                    {hasChild && (
                      <Collapse in={open[listItem.name]} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding className={`${styles.subList} ${isItemActive && styles.activeSubList}`}>
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
                                className={`${styles.subListItems} `}
                                id={`sidebar-item-${(item.resourceLabel || item.name).split(' ').join('-')}`}
                                style={{ gap: 32 }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 13 13" fill="none">
                                  <path
                                    d="M6.50049 0H13.0005V6.5H12.188V1.39014L0.59082 12.981L0.0195312 12.4097L11.6104 0.8125H6.50049V0Z"
                                    fill="currentcolor"
                                    stroke="currentcolor"
                                  ></path>
                                </svg>
                                <ListItemText
                                  primary={item.resourceLabel || item.name}
                                  className={`line-clamp-1 !text-[var(--sidebar-text-color)] [&>span]:!font-normal`}
                                />
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
        </div>
      </div>
    </div>
  );
}

export default withRouter(SideBar);
