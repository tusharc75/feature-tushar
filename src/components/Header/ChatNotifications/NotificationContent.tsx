import { Button, IconButton, List, Menu, MenuItem, Typography } from '@material-ui/core';
import { AddCircle, ClearAll, DoneAllOutlined, Markunread, Settings } from '@material-ui/icons';
import { useMemo, useState } from 'react';
import { useData } from 'src/StateProvider/Provider';
import { TabOptions, tabOptions } from '.';
import HtmlTooltip from '../../CustomTooltipTitle';
import { HistoryItem, NotificationItem } from './listITems';

const NotificationContent = ({ handleMarkAllReadUnread, handleClearAll, handleReadSingle, data, isLoading, setNewChat, handleClickHistory, isReplayVisible }) => {
  const {
    state: {
      user: { user }
    }
  } = useData();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [tab, setTab] = useState<TabOptions>(tabOptions[0]);

  const unreadMessages = useMemo(() => {
    let count = 0;
    if (!data[tabOptions[tabOptions.length - 1]]) return '';
    for (const notification of data[tabOptions[tabOptions.length - 1]]) {
      count += notification.unseen;
    }
    return `${count === 0 ? '' : count}`;
  }, [data]);

  const notificationList = useMemo(() => {
    return data[tab];
  }, [tab, data]);

  const otherClasses = ` absolute w-full h-[2px] bottom-[-9px] transition-color duration-300`;

  const componentMap = () => {
    if (isLoading) {
      return <Typography className="m-3">Loading Chat Notifications...</Typography>;
    }
    if (notificationList.length === 0) {
      return <Typography className="m-3">No Chat Notifications</Typography>;
    }
    if (tab !== tabOptions[tabOptions?.length - 1]) {
      return (
        <List component="ul" aria-label="notifications" className=" overflow-x-hidden">
          {notificationList.map((d) => {
            return <NotificationItem data={d} handleClick={handleReadSingle} key={d._id} isReplayVisible={isReplayVisible} />;
          })}
        </List>
      );
    } else {
      return (
        <>
          {
            <List component="ul" aria-label="chat">
              {notificationList.map((d) => {
                return <HistoryItem data={d} userId={user._id} handleClick={handleClickHistory} key={d.id} />;
              })}
            </List>
          }
        </>
      );
    }
  };

  return (
    <>
      <div className="[border-bottom:1px_solid_var(--common-border-color)] flex justify-between items-center px-[20px] py-[10px]">
        <h6 className="text-[16px] font-semibold ">Chats</h6>
        <HtmlTooltip
          title={isLoading || data?.unread?.length === 0 ? 'No Unread chat notifications' : 'Mark all as read'}
          enterTouchDelay={0}
          placement="top"
          arrow
        >
          <span>
            <IconButton
              disabled={isLoading || data?.unread?.length === 0}
              onClick={() => {
                handleMarkAllReadUnread();
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
          {tabOptions?.map((tabItem) => {
            return (
              <>
                <Button key={tabItem} onClick={() => setTab(tabItem)} size={'small'} disabled={isLoading || tab === tabItem} className={`relative`}>
                  <div className={`${tab === tabItem ? 'bg-[var(--primary)]' : 'bg-[transparent]'} ${otherClasses}`} />
                  {tabItem}{' '}
                  <span
                    className={`text-[#D3E0FF] px-2 py-[1px] block rounded-[5px] ml-2 bg-[#2A3042] text-[12px] font-semibold ${
                      isLoading || tab === tabItem ? 'grayscale dark:opacity-50 opacity-70' : ''
                    } ${tabItem === tabOptions[tabOptions.length - 1] && !Boolean(unreadMessages) ? 'sr-only' : ''}`}
                  >
                    {tabItem === tabOptions[tabOptions.length - 1] ? unreadMessages : data[tabItem]?.length || 0}
                  </span>
                </Button>
              </>
            );
          })}
        </div>
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
          <Settings />
        </IconButton>
      </div>
      <div className={`min-h-[300px] max-h-[calc(100vh-200px)] overflow-y-auto`}>
        <div className="p-[15px_20px] dark:[border-bottom:1px_solid_var(--common-border-color)] [border-bottom:1px_solid_#F4F4F4]">
          <Button onClick={() => setNewChat(true)} startIcon={<AddCircle className="text-[var(--new-theme-color)] [font-size:30px_!important]" />}>
            Start a New Chat
          </Button>
        </div>
        {componentMap()}
      </div>
      <Menu anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem
          onClick={(e) => {
            handleClearAll(e);
            setAnchorEl(null);
          }}
        >
          <ClearAll className="mr-2  opacity-60  dark:opacity-100" />
          Clear all
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            handleMarkAllReadUnread(false);
            setAnchorEl(null);
          }}
        >
          <Markunread className="mr-2 opacity-60 dark:opacity-100" />
          Mark all as unread
        </MenuItem>
      </Menu>
    </>
  );
};

export default NotificationContent;
