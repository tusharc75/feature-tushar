import { IconButton, List, ListItem, ListItemText, Menu, MenuItem } from '@material-ui/core';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import React, { useCallback, useEffect, useState } from 'react';
import { Chat, Delete } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';
import { groupBy } from 'lodash';
import moment from 'moment';
import { FiSidebar } from 'react-icons/fi';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { cn } from 'src/constants/helpers';

type HistorySidebarProps = {
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSidebarOpen: boolean;
  hadleNewChat: () => void;
  chatHistory: ChatHistory[];
  getOneChatHistory: (id: string) => void;
  handleDelete: (id: string) => void;
  chatId: string | null;
  isMobile: boolean;
};

type ChatHistory = {
  _id: string;
  title: string;
  createdAt: Date;
};

const HistorySidebar = ({
  setIsSidebarOpen,
  isSidebarOpen,
  hadleNewChat,
  chatHistory,
  getOneChatHistory,
  handleDelete,
  chatId,
  isMobile
}: HistorySidebarProps) => {
  const [selectedChatHistory, setSelectedChatHistory] = useState<string>(null);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [groupedHistory, setGroupedHistory] = useState<Record<string, ChatHistory[]>>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setSelectedChatHistory(id);
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setSelectedChatHistory(null);
    setAnchorEl(null);
  };

  const handleDeleteWrapper = () => {
    handleCloseMenu();
    if (selectedChatHistory) handleDelete(selectedChatHistory);
  };

  const groupHistory = useCallback((history: ChatHistory[]) => {
    if (!history || !history?.length) {
      setGroupedHistory({});
      return;
    }
    const formatter = (date: Date) => {
      const momentDate = moment(date);
      const currentYear = moment().year();
      const currentMonth = moment().month();
      let format = '';

      if (momentDate.year() < currentYear) {
        format = momentDate.format('YYYY');
      } else if (momentDate.month() === currentMonth) {
        format = `Previous 30 days`;
      } else {
        // Current year (other than current month)
        format = momentDate.format('MMM');
      }
      return format;
    };

    const grouped = groupBy(history, (item) => formatter(item.createdAt));
    setGroupedHistory(grouped);
  }, []);

  function customSort(items) {
    // Separate items into three arrays: Previous 30 days, months, and years
    const months = [];
    const years = [];
    const monthArray = ['Dec', 'Nov', 'Oct', 'Sep', 'Aug', 'Jul', 'Jun', 'May', 'Apr', 'Mar', 'Feb', 'Jan'];

    for (const item of items) {
      if (item === 'Previous 30 days') {
      } else if (monthArray.includes(item)) {
        months.push(item);
      } else {
        years.push(item);
      }
    }
    // Sort months in reverse order
    months.sort((a, b) => monthArray.findIndex((d) => d === a) - monthArray.findIndex((d) => d === b));
    // Sort years in reverse order
    years.sort((a, b) => b.localeCompare(a));
    // Combine the arrays in the desired order
    return ['Previous 30 days', ...months, ...years];
  }

  useEffect(() => {
    groupHistory(chatHistory);
  }, [chatHistory, groupHistory]);

  return (
    <aside
      className={cn(
        'z-10 min-h-full w-[var(--sidebar-w)] flex-shrink-0 bg-[white] px-3 transition-transform duration-300 [border-right:1px_solid_var(--common-border-color)] dark:bg-[#070712]',
        isSidebarOpen ? '[transform:translateX(0)]' : '[transform:translateX(calc(var(--sidebar-w)_*_-1))]'
      )}
    >
      <div className="head flex min-h-[var(--head-h)] items-center justify-between gap-2 ">
        <HtmlTooltip title={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}>
          <IconButton size="small" onClick={() => setIsSidebarOpen((prev) => !prev)} style={{ padding: 8 }}>
            <FiSidebar />
          </IconButton>
        </HtmlTooltip>
        <ThemeButton
          mobileTooltip="New Chat"
          iconForMobile={<Chat fontSize={'small'} />}
          color="primary"
          borderColor="none"
          startIcon={<Chat fontSize={'small'} />}
          size="small"
          onClick={() => hadleNewChat()}
          style={{ padding: 8 }}
        >
          New Chat
        </ThemeButton>
      </div>
      <div className="body max-h-[calc(100%_-_var(--head-h))] overflow-y-auto">
        {groupedHistory ? (
          <>
            {customSort(Object.keys(groupedHistory)).map((date) => (
              <div key={date} className="mt-5">
                <h3 className="px-2 text-[12px] font-semibold text-gray-400 dark:text-gray-600">{date}</h3>
                <List dense>
                  {groupedHistory[date]?.map((history) => (
                    <ListItem
                      button
                      onClick={() => {
                        if (isMobile) setIsSidebarOpen(false);
                        getOneChatHistory(history._id);
                      }}
                      key={history._id}
                      className="group"
                      style={{ borderRadius: 8, padding: '4px 8px' }}
                      selected={chatId === history._id}
                    >
                      <ListItemText primary={<span className="line-clamp-1 text-[14px]">{history.title}</span>} />
                      <div
                        className={cn(
                          'absolute right-2 pl-6 opacity-0 group-hover:opacity-100  ',
                          chatId === history._id
                            ? '[background-image:linear-gradient(270deg,_#ebebeb_66%,_transparent_100%)] dark:[background-image:linear-gradient(270deg,_#2f2f38_60%,_transparent_100%)]'
                            : '[background-image:linear-gradient(270deg,_#f5f5f5_66%,_transparent_100%)] dark:[background-image:linear-gradient(270deg,_#1a1a25_60%,_transparent_100%)]'
                        )}
                      >
                        <IconButton edge="end" aria-label="delete" size="small" onClick={(event) => handleOpenMenu(event, history._id)}>
                          <MoreHorizIcon />
                        </IconButton>
                      </div>
                    </ListItem>
                  ))}
                </List>
              </div>
            ))}
          </>
        ) : (
          Array.from(Array(3).keys()).map((i) => (
            <ListItem button key={i} className="group" style={{ borderRadius: 8 }}>
              <ListItemText primary={<span className="line-clamp-1">{<Skeleton width={Math.random() * (200 - 100) + 100} height={20} />}</span>} />
              <div className="absolute right-2 pl-6 opacity-0 [background-image:linear-gradient(270deg,_#f5f5f5_66%,_transparent_100%)] group-hover:opacity-100 dark:[background-image:linear-gradient(270deg,_#212134_60%,_transparent_100%)] ">
                <IconButton edge="end" aria-label="delete" size="small">
                  <MoreHorizIcon />
                </IconButton>
              </div>
            </ListItem>
          ))
        )}
      </div>
      <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={handleDeleteWrapper}>
          <Delete fontSize="small" className="mr-2" />
          Delete
        </MenuItem>
      </Menu>
    </aside>
  );
};

export default HistorySidebar;
