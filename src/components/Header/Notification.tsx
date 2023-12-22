import { Badge, Box, Button, IconButton, List, ListItem, Menu, MenuItem, Popover, Typography, useMediaQuery } from '@material-ui/core';
import { ClearAll, DoneAllOutlined, Settings } from '@material-ui/icons';
import { useContext, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Accepted, Assigned, Rejected, Changed, Created } from 'src/assets/notificationIcons';
import { CustomNotificationCountContext } from '../../StateProvider/CustomNotificationCountContext/CustomNotificationCountContext';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import { SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import axiosInstance from '../../axios/axiosInstance';
import { displayCardDate } from '../../constants/helpers';

import styles from './Header.module.scss';

import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone';
import HtmlTooltip from '../CustomTooltipTitle';

const Notification = () => {
  const toastConfig = useContext(CustomToastContext);
  const notification = useContext(CustomNotificationCountContext);
  const history = useHistory();
  const isMobile = useMediaQuery('(max-width:960px)');

  const {
    state: { user, selectedEntity },
    dispatch
  }: any = useData();

  const [anchorEl, setAnchorEl] = useState(null);
  const isNotificationOpen = Boolean(anchorEl);
  const [notificationList, setNotificationList] = useState([]);
  const [notificationData, setNotificationData] = useState({
    all: [],
    unread: []
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleNotificationClose = () => {
    setAnchorEl(null);
  };
  const notificationId = isNotificationOpen ? 'full-screen-notification' : undefined;

  const handleEntityChange = async (id) => {
    if (!Array.isArray(id)) {
      dispatch({ type: SET_SELECTED_ENTITY, payload: id });
    }
  };

  const hasAccessToEntity = async (id) => {
    const entityList = user.entity?.map((entity) => entity._id);
    return entityList.includes(id);
  };

  const handleRedirect = (id, resourceId, resourcePath) =>
    id === selectedEntity
      ? history.push(resourceId ? `${resourcePath}/${resourceId}` : resourcePath)
      : hasAccessToEntity(id)
        ? handleEntityChange(id) && history.push(resourceId ? `${resourcePath}/${resourceId}` : resourcePath)
        : '';

  const getAllNotifications = (event) => {
    setAnchorEl(event.currentTarget);
    setIsLoading(true);

    axiosInstance()
      .get('/notification/all')
      .then(({ data: { data } }) => {
        setNotificationList(data);
        const nData = { all: data, unread: data.filter((d) => !d.read) };
        setNotificationData(nData);
        notification.setCount(0);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleMarkAllRead = () => {
    axiosInstance()
      .put('/notification/all-read', { toggle: true })
      .then(({ data }) => {
        let updatedNotificationList = [];
        notificationList.forEach((notification) => {
          notification.read = true;
          updatedNotificationList.push(notification);
        });

        setNotificationList(updatedNotificationList);
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          type: 'success'
        });
        setAnchorEl(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleClearAll = (e) => {
    axiosInstance()
      .put('/notification/clear')
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          type: 'success'
        });
        getAllNotifications(e);
        setAnchorEl(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleReadSingle = (d) => {
    if (d.read === false) {
      axiosInstance()
        .put('/user/notification/read', {
          toggle: true,
          _id: d._id
        })
        .then(() => { })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }

    handleNotificationClose();
    const resourcePath = returnResourcePath(d?.resourceId, d?.resourcePath);
    if (d?.entity) {
      handleRedirect(d?.entity, d?.resourceId, resourcePath);
    } else {
      history.push(resourcePath, { data: d?.of ? d?.of : null });
    }
  };

  const returnResourcePath = (resourceId, resourcePath) => {
    const splittedPath = resourcePath.split('/');
    if (splittedPath[splittedPath.length - 1] === resourceId) {
      splittedPath.pop();
      return splittedPath.join('/');
    }
    return resourcePath;
  };

  return (
    <>
      {isMobile ? (
        <>
          <MenuItem onClick={anchorEl === null ? getAllNotifications : () => { }}>
            <Badge
              variant="dot"
              overlap="circular"
              badgeContent={notification ? notification.count : 0}
              color="secondary"
              aria-describedby={notificationId}
            >
              <NotificationsNoneIcon />
            </Badge>
            <Box component="span" mx={1} />
            <p>Notifications</p>
          </MenuItem>
        </>
      ) : (
        <IconButton
          id="notificationButton"
          aria-describedby={notificationId}
          aria-label="settings"
          color="inherit"
          title="Notifications"
          onClick={getAllNotifications}
          className={styles.showIconLayout}
        >
          <Badge variant="dot" overlap="circular" badgeContent={notification ? notification.count : 0} color="secondary">
            <NotificationsNoneIcon className="setIcon" />
          </Badge>
        </IconButton>
      )}
      <Popover
        PaperProps={{
          className: 'w-[min(400px,100%)_!important]',
          style: {
            borderRadius: 0,
            boxShadow: '-4px 0px 40px 0px rgba(0, 0, 0, 0.06)'
          }
        }}
        id={notificationId}
        open={isNotificationOpen}
        anchorEl={anchorEl}
        onClose={handleNotificationClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
      >
        <NotificationContent
          isLoading={isLoading}
          handleMarkAllRead={handleMarkAllRead}
          handleClearAll={handleClearAll}
          handleReadSingle={handleReadSingle}
          data={notificationData}
        />
      </Popover>
    </>
  );
};

export default Notification;

const NotificationContent = ({ isLoading, handleMarkAllRead, handleClearAll, handleReadSingle, data }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [tab, setTab] = useState<'all' | 'unread'>('all');

  const tabSetter = (cTab: 'all' | 'unread') => {
    if (tab === cTab) return;
    setTab(cTab);
  };

  const notificationList = useMemo(() => {
    return data[tab];
  }, [tab, data]);

  const otherClasses = ` absolute w-full h-[2px] bottom-[-9px] transition-color duration-300`;

  const getIcon = (title: string) => {
    let icon = Assigned;

    const compareTitle = (nameList: string[], title) => {
      return nameList.some((s) => title.toLowerCase().includes(s.toLowerCase()));
    };

    switch (true) {
      case compareTitle(['accepted', 'completed', 'finished'], title):
        icon = Accepted;
        break;
      case compareTitle(['assigned'], title):
        icon = Assigned;
        break;
      case compareTitle(['rejected', 'failed', 'closed'], title):
        icon = Rejected;
        break;
      case compareTitle(['changes', 'changed', 'change'], title):
        icon = Changed;
        break;
      case compareTitle(['Created', 'Creates', 'create'], title):
        icon = Created;
        break;
      default:
        icon = Assigned;
        break;
    }
    return icon;
  };

  const boldMatchPattern = (title: string) => {
    const regex = new RegExp(`([A-Z]+_[0-9]+)|([0-9]+)|(fail)(ed|s)?|(pass)(ed)?|(complete)(d|s)?|(start)(ed|s)?|(assign)(ed)?|(reject)(ed|s)?|(accept)(ed|s)?|(create)(d|s)?|(change)(s|d)?`, 'gi');
    const data = title.replace(regex, '<strong>$&</strong>');
    return data;
  }

  return (
    <>
      <div className={``}>
        <div className="[border-bottom:1px_solid_var(--common-border-color)] flex justify-between items-center px-[20px] py-[10px]">
          <h6 className="text-[16px] font-semibold ">Notifications</h6>
          <HtmlTooltip
            title={isLoading || data?.unread?.length === 0 ? 'No Unread notification' : 'Mark all as read'}
            enterTouchDelay={0}
            placement="top"
            arrow
          >
            <span>
              <IconButton
                disabled={isLoading || data?.unread?.length === 0}
                onClick={() => {
                  handleMarkAllRead();
                }}
                size={'small'}
              >
                <DoneAllOutlined />
              </IconButton>
            </span>
          </HtmlTooltip>
        </div>
        <div className={`flex items-center gap-1 justify-between px-[20px] py-[8px] [border-bottom:1px_solid_var(--common-border-color)]`}>
          <div className="tabs flex gap-[24px]">
            <Button onClick={() => tabSetter('all')} size={'small'} disabled={isLoading} className={`relative`}>
              <div className={`${tab === 'all' ? 'bg-[var(--primary)]' : 'bg-[transparent]'} ${otherClasses}`} />
              All{' '}
              <span
                className={`text-[#D3E0FF] px-2 py-[1px] block rounded-[5px] ml-2 bg-[#2A3042] text-[12px] font-semibold ${isLoading || tab === 'all' ? 'grayscale dark:opacity-50 opacity-70' : ''
                  }`}
              >
                {data.all.length || 0}
              </span>
            </Button>
            <Button onClick={() => tabSetter('unread')} size={'small'} disabled={isLoading} className={`relative`}>
              <div className={`${tab === 'unread' ? 'bg-[var(--primary)]' : 'bg-[transparent]'} ${otherClasses}`} />
              Unread{' '}
              <span
                className={`text-[#2A3042] px-2 py-[1px] block rounded-[5px] ml-2 bg-[#D3E0FF] text-[12px] font-semibold ${isLoading || tab === 'unread' ? 'grayscale dark:opacity-50 opacity-70' : ''
                  }`}
              >
                {data.unread.length || 0}
              </span>
            </Button>
          </div>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
            <Settings />
          </IconButton>
        </div>
        <div className={`min-h-[300px] max-h-[calc(100vh-200px)] overflow-y-auto`}>
          {isLoading ? (
            <Typography className="m-3">Loading Notifications...</Typography>
          ) : notificationList.length === 0 ? (
            <Typography className="m-3">No Notifications found</Typography>
          ) : (
            <List component="ul" aria-label="notifications">
              {notificationList.map((d) => {
                const Icon = getIcon(d.title);
                return (
                  <ListItem
                    button
                    aria-label={d.title}
                    className={`p-0 dark:[border-bottom:1px_solid_var(--common-border-color)_!important] [border-bottom:1px_solid_#F4F4F4_!important] `}
                    key={d._id}
                    onClick={() => {
                      handleReadSingle(d);
                    }}
                  >
                    <div className="flex items-center md:gap-[17px] gap-[15px] p-[20px] w-full">
                      <div className=" basis-[38px]">
                        <div className="rounded-full bg-[var(--dark-secondary,#F4F4F4)] w-[38px] h-[38px] relative">
                          <Icon className="absolute top-1/2 left-1/2 [transform:translate(-50%,-50%)]" />
                        </div>
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-[12px] font-medium mb-[8px] [&>strong]:font-semibold dark:[&>strong]:font-bold leading-[22px] text-[#6B6F77] dark:text-gray-300 [&>strong]:text-[var(--primary-text)]" dangerouslySetInnerHTML={{ __html: boldMatchPattern(d.title) }}></h4>
                        <h5 className="text-[var(--dark-secondary-text,_#718496)] text-[11px] font-normal mb-[2px]">{d.description}</h5>
                        <p className="text-[var(--dark-secondary-text,_#718496)] text-[11px] font-normal">{displayCardDate(d?.date)}</p>
                      </div>
                    </div>
                  </ListItem>
                );
              })}
            </List>
          )}
        </div>
      </div>
      <Menu anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem
          onClick={(e) => {
            handleClearAll(e);
            setAnchorEl(null);
          }}
        >
          <ClearAll className="mr-2" />
          Clear all
        </MenuItem>
      </Menu>
    </>
  );
};
