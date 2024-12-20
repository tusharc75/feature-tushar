import { useMediaQuery } from '@material-ui/core';
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
  const [createChannelDialog, setCreateChannelDialog] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const mobScreen = useMediaQuery('(max-width:768px)');
  const [socket, setSocket] = useState<Socket>(null);
  const { state: { user: { user }, resources } } = useData();

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchChannels();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const fetchChannels = async () => {
    const { data } = await axiosInstance().get('/work-space/channel');
    setChannels(data.data || []);
    if (data?.data?.length) setSelectedChannel(data?.data[0]);
  };

  const handleDeleteChannels = async (channelIds: string[]) => {
    await axiosInstance().delete('/work-space/channel', { data: { _ids: channelIds } });
    fetchChannels();
  };

  useEffect(() => {
    if (socket && channels?.length) {
      channels.forEach((channel) => {
        socket.emit('joinChannel', channel?._id);
      });
      socket.on('notification', (channel, userId) => {
        if (user?._id !== userId && selectedChannel?._id !== channel) {
          setChannels((prev) => {
            const updatedChannels = [...prev];
            const index = prev.findIndex((c) => c._id === channel);
            if (index !== -1) {
              const updatedChannel = {
                ...updatedChannels[index],
                notifications: (updatedChannels[index]?.notifications || 0) + 1,
              };
              updatedChannels[index] = updatedChannel;
            }
            return updatedChannels;
          })
        }
      });
    }
    return () => {
      if (socket && channels?.length) {
        channels.forEach((channel) => {
          socket.emit('leaveChannel', channel?._id);
        });
        socket.off('fetchNewMessage');
        socket.off('fetchMessages');
        socket.off('addReaction');
        socket.off('removeReaction');
        socket.off('notification');
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
        <CustomContainer className="!min-h-[var(--container-height)] !p-0 [--container-height:calc(100vh-150px)] [--h:max(500px,_var(--container-height))] [--sidebar-width:270px] max-[768px]:[--container-height:calc(100vh-179px)]">
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
              setCreateChannelDialog={setCreateChannelDialog}
              handleDeleteChannels={handleDeleteChannels}
              mobScreen={mobScreen}
              setChannels={setChannels}
            />
            <MessagePanel
              isSidebarCollapsed={isSidebarCollapsed}
              toggleSidebar={toggleSidebar}
              setSelectedChannel={setSelectedChannel}
              selectedChannel={selectedChannel}
              mobScreen={mobScreen}
              socket={socket}
            />
          </div>
        </CustomContainer>
        {createChannelDialog && (
          <ManageChannel
            onClose={() => setCreateChannelDialog(false)}
            onSuccess={() => {
              fetchChannels();
              setCreateChannelDialog(false);
            }}
          />
        )}
      </div>
    </>
  );
};

export default Workspace;
