import { ArrowDropDown, ArrowDropUp, Person } from '@mui/icons-material';
import { Avatar, Badge, CircularProgress, Collapse, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { cn } from 'src/constants/helpers';
import { User } from 'src/pages/WorkSpace/types';
import { UseWorkSpace } from 'src/pages/WorkSpace/useWorkSpace';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useStore } from 'src/StateProvider/fastContext';
import { useData } from 'src/StateProvider/Provider';

const Chats = ({ state }: { state: UseWorkSpace }) => {
  const { initChat, selectedChannel, newChatToUser } = state;
  const [onlineUsers] = useStore((state) => state.onlineUsers);
  const toastConfig = useContext(CustomToastContext);

  const {
    state: {
      user: { user }
    }
  } = useData();

  const [isExpanded, setIsExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [allData, setAllData] = useState<User[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const {
        data: { data }
      } = await axiosInstance().get('/work-space/channel/chats');
      const chats: any = [];
      for (const d of data?.chats) {
        const toUser = d?.members?.find((m) => m?.optionValue !== user?._id);
        if (toUser) {
          d.title = toUser?.optionLabel;
          d.to = toUser;
        }
        chats.push(d);
      }
      setAllData([...chats, ...data?.users]);
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      {allData?.length ? (
        <Collapse in={isExpanded}>
          <List dense>
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              {allData?.map((_data, i) => {
                return (
                  <RenderRow
                    data={_data}
                    index={i}
                    initChat={initChat}
                    selectedChannel={selectedChannel}
                    newChatToUser={newChatToUser}
                    onlineUsers={onlineUsers}
                  />
                );
              })}
            </div>
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

const RenderRow = ({ index, data, initChat, selectedChannel, newChatToUser, onlineUsers }) => {
  const title = 'concatedName' in data ? data.concatedName : data.title;
  const notifications = 'notifications' in data ? data.notifications : 0;
  const avatar = 'avatar' in data ? data?.avatar : data?.to?.avatar;
  const userId = 'concatedName' in data ? data._id : data?.to?.optionValue;

  return (
    <ListItemButton
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
              ? '[&_.MuiBadge-badge]:!bg-green-500'
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
};
