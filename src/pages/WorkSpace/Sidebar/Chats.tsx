import { ArrowDropDown, ArrowDropUp, Person } from '@mui/icons-material';
import { Avatar, Badge, CircularProgress, Collapse, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { debounce } from 'lodash';
import { useContext, useEffect, useMemo, useState } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import axiosInstance from 'src/axios/axiosInstance';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { cn } from 'src/constants/helpers';
import { TChat, User } from 'src/pages/WorkSpace/types';
import { UseWorkSpace } from 'src/pages/WorkSpace/useWorkSpace';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useStore } from 'src/StateProvider/fastContext';

const Chats = ({ state }: { state: UseWorkSpace }) => {
  const { initChat, selectedChannel, ignoreIds, chats, newChatToUser } = state;
  const [onlineUsers] = useStore((state) => state.onlineUsers);
  const toastConfig = useContext(CustomToastContext);

  const [isExpanded, setIsExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [maxCount, setMaxCount] = useState(0);

  const fetchOptions = debounce(async (searchKey: string = '', page: number = 0) => {
    setLoading(true);
    try {
      if (searchKey !== '') {
        page = 0;
        setCurrentPage(0);
      }
      let query = `user?limit=25&page=${page}&search=${searchKey}&ignoreIds=${JSON.stringify(ignoreIds)}`;
      const response = await axiosInstance().get(query);
      const optionsData = response?.data?.data?.map((user) => ({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        concatedName: user.firstName + ' ' + user.lastName,
        avatar: user.avatar
      }));
      setMaxCount(response?.data?.count);

      setUsers((currentOptions) => {
        return page === 0 ? optionsData : [...currentOptions, ...optionsData];
      });
      if (page > 0 && optionsData?.length > 0) {
        setCurrentPage(page);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      setLoading(false);
    }
  }, 1000);

  const allData = useMemo(() => {
    if (chats && users) return [...chats, ...users];
    return [];
  }, [chats, users]);

  const hasMore = users.length < maxCount;
  const isItemLoaded = (index) => {
    return index < allData.length;
  };
  const loadMoreItems = (startIndex) => {
    if (!isItemLoaded(startIndex)) {
      fetchOptions('', currentPage + 1);
    }
  };

  useEffect(() => {
    if (ignoreIds) {
      fetchOptions();
    }
  }, [ignoreIds.length]);

  return (
    <div>
      <ThemeButton
        buttonType="transparent"
        onClick={() => {
          setIsExpanded((prev) => !prev);
        }}
        endIcon={isExpanded ? <ArrowDropDown fontSize="large" /> : <ArrowDropUp fontSize="large" />}
      >
        Chats
      </ThemeButton>
      {chats ? (
        <Collapse in={isExpanded}>
          <List dense>
            <InfiniteLoader isItemLoaded={isItemLoaded} itemCount={hasMore ? allData.length + 1 : allData.length} loadMoreItems={loadMoreItems}>
              {({ onItemsRendered, ref }) => (
                <FixedSizeList
                  onItemsRendered={onItemsRendered}
                  ref={ref}
                  height={400}
                  width={'auto'}
                  itemSize={45}
                  itemCount={allData.length}
                  overscanCount={5}
                >
                  {(props) => renderRow({ ...props, allData, initChat, selectedChannel, newChatToUser, loading, onlineUsers })}
                </FixedSizeList>
              )}
            </InfiniteLoader>
          </List>
          {loading && (
            <div className="flex justify-center">
              <CircularProgress size={20} />
            </div>
          )}
        </Collapse>
      ) : (
        <div className="m-3">
          <CommonSkeleton lenArray={[...Array(3).keys()]} xs={12} sm={12} md={12} lg={12} />
        </div>
      )}
    </div>
  );
};

export default Chats;

function renderRow(
  props: {
    allData: (User | TChat)[];
    initChat: (data: User | TChat) => void;
    selectedChannel: TChat;
    newChatToUser: User;
    loading: boolean;
    onlineUsers: string[];
  } & ListChildComponentProps
) {
  const { index, style, initChat, selectedChannel, allData, newChatToUser, onlineUsers } = props;
  const data = allData[index];
  const title = 'concatedName' in data ? data.concatedName : data.title;
  const notifications = 'notifications' in data ? data.notifications : 0;
  const avatar = 'avatar' in data ? data.avatar : data.to.avatar;
  const userId = 'concatedName' in data ? data._id : data.to.optionValue;

  return (
    <ListItemButton
      style={style}
      sx={{ borderRadius: '6px' }}
      key={index}
      className="group"
      selected={selectedChannel?._id === data._id || data._id === newChatToUser?._id}
      onClick={() => {
        initChat(data);
      }}
    >
      <ListItemIcon sx={{ minWidth: '38px' }}>
        <Badge
          overlap="circular"
          sx={(theme) => ({
            '& .MuiBadge-badge': {
              boxShadow: `0 0 0 2px ${theme.palette.background.paper}`
            }
          })}
          className={cn(
            onlineUsers.includes(userId)
              ? '[&_.MuiBadge-badge]:!bg-red-500 '
              : '[&_.MuiBadge-badge]:!bg-[#d9d9d9] dark:[&_.MuiBadge-badge]:!bg-[#757575]'
          )}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant={'dot'}
        >
          <Avatar src={avatar} sx={{ width: 30, height: 30 }} alt={title}>
            <Person fontSize="small" />
          </Avatar>
        </Badge>
      </ListItemIcon>
      <ListItemText
        primary={
          <span className="flex items-center gap-2 ">
            <span className=" line-clamp-1 font-semibold">{title}</span>
            {notifications > 0 && (
              <span className="mr-4 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-red-500 text-center text-[8px] text-white">
                {notifications}
              </span>
            )}
          </span>
        }
      />
    </ListItemButton>
  );
}
