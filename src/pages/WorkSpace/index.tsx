import { useMediaQuery } from '@mui/material';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import MessagePanel from 'src/pages/WorkSpace/MessagePanel';
import Sidebar from 'src/pages/WorkSpace/Sidebar';
import { TChannel } from 'src/pages/WorkSpace/types';
import ManageChannel from './ManageChannelDialog';
import { cn } from 'src/constants/helpers';
import { backendApi } from 'src/config';
import io, { Socket } from 'socket.io-client';
import { useData } from 'src/StateProvider/Provider';

const Workspace = () => {
  const [channels, setChannels] = useState<TChannel[]>(null);
  const [selectedChannel, setSelectedChannel] = useState<TChannel>(null);
  const [manageChannelDialog, setManageChannelDialog] = useState({ open: false, _id: null });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const mobScreen = useMediaQuery('(max-width:768px)');
  const [socket, setSocket] = useState<Socket>(null);
  const [newChat, setNewChat] = useState(false);
  const {
    state: {
      user: { user },
      resources
    }
  } = useData();

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchChannels();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const fetchChannels = async () => {
    const { data } = await axiosInstance().get('/work-space/channel');
    data?.data?.forEach((d: any) => {
      if (d?.type === 'chat') {
        d.title = (d?.members?.filter(m => m?.optionValue !== user?._id) || d?.members)?.map((m) => m?.optionLabel)?.join(', ');
        d.description = 'Direct Messaging';
      }
    })
    setChannels(data.data || []);
    const queryParam = new URLSearchParams(window.location.search)
    const channelId = queryParam.get("channelId");
    if (channelId) {
      const channel = data?.data?.find((channel) => channel?._id === channelId);
      setSelectedChannel(channel);
    }
  };

  const handleDeleteChannels = async (channelIds: string[]) => {
    await axiosInstance().delete('/work-space/channel', { data: { _ids: channelIds } });
    fetchChannels();
  };

  useEffect(() => {
    if (socket) {
      channels?.forEach((channel) => {
        socket.emit('joinChannel', channel?._id);
      });
      socket.off('notification');
      socket.on('notification', (channel, userId) => {
        if (user?._id !== userId && selectedChannel?._id !== channel) {
          setChannels((prev) => {
            const updatedChannels = [...prev];
            const index = prev.findIndex((c) => c._id === channel);
            if (index !== -1) {
              const updatedChannel = {
                ...updatedChannels[index],
                notifications: (updatedChannels[index]?.notifications || 0) + 1
              };
              updatedChannels[index] = updatedChannel;
            }
            return updatedChannels;
          });
        }
      });
      socket.emit('joinChannel', 'directMessaging');
      socket.off('refreshChannels');
      socket.on('refreshChannels', fetchChannels);
    }
    return () => {
      if (socket) {
        channels?.forEach((channel) => {
          socket.emit('leaveChannel', channel?._id);
        });
        socket.emit('leaveChannel', 'directMessaging');
        socket.off('notification');
        socket.off('refreshChannels');
      }
    };
  }, [socket, channels]);

  useEffect(() => {
    if (!token) return;
    const s = io(`${backendApi?.replace('/api', '')}/workspace/channel`, {
      path: backendApi?.includes('/api') ? '/api/socket.io/' : '/socket.io/',
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
      transports: ['websocket', 'pooling']
    });
    setSocket(s);
  }, [token]);

  return (
    <>
      <div className="main-container-v1">
        <div className="headerbox-v1">
          <CustomBreadCrumbs routes={[{ title: resources?.workSpace?.titlePlural }]} />
        </div>
        <CustomContainer className="border !min-h-[var(--container-height)] !p-0 [--container-height:calc(100vh-150px)] [--h:max(500px,_var(--container-height))] [--sidebar-width:270px] max-[768px]:[--container-height:calc(100vh-179px)]">
          <div
            className={cn(
              'relative flex min-h-[var(--h)] overflow-hidden rounded-lg transition-[margin]',
              isSidebarCollapsed && !mobScreen ? '-ml-[var(--sidebar-width)] w-[calc(100%+var(--sidebar-width))]' : ''
            )}
          >
            <Sidebar
              isSidebarCollapsed={isSidebarCollapsed}
              toggleSidebar={toggleSidebar}
              channels={channels}
              selectedChannel={selectedChannel}
              setSelectedChannel={setSelectedChannel}
              setManageChannelDialog={setManageChannelDialog}
              handleDeleteChannels={handleDeleteChannels}
              mobScreen={mobScreen}
              setChannels={setChannels}
              setNewChat={setNewChat}
            />
            <MessagePanel
              isSidebarCollapsed={isSidebarCollapsed}
              toggleSidebar={toggleSidebar}
              selectedChannel={selectedChannel}
              socket={socket}
              newChat={newChat}
              setNewChat={setNewChat}
            />
          </div>
        </CustomContainer>
        {manageChannelDialog.open && (
          <ManageChannel
            onClose={() => setManageChannelDialog({ open: false, _id: null })}
            onSuccess={() => {
              fetchChannels();
              setManageChannelDialog({ open: false, _id: null });
            }}
            _id={manageChannelDialog._id}
          />
        )}
      </div>
    </>
  );
};

export default Workspace;
