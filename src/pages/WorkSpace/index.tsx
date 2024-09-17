import { useMediaQuery } from '@material-ui/core';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import MessagePanel from 'src/pages/WorkSpace/MessagePanel';
import Sidebar from 'src/pages/WorkSpace/Sidebar';
import { TChannel } from 'src/pages/WorkSpace/types';
import ManageChannel from './ManageChannelDialog';
import { cn } from 'src/constants/helpers';

const Workspace = () => {
  const [channels, setChannels] = useState<TChannel[]>(null);
  const [selectedChannel, setSelectedChannel] = useState<TChannel>(null);
  const [createChannelDialog, setCreateChannelDialog] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const mobScreen = useMediaQuery('(max-width:768px)');

  useEffect(() => {
    fetchChannels();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const fetchChannels = async () => {
    const { data } = await axiosInstance().get('/work-space/channel');
    setChannels(data.data || []);
  };

  const handleDeleteChannels = async (channelIds: string[]) => {
    await axiosInstance().delete('/work-space/channel', { data: { _ids: channelIds } });
    fetchChannels();
  };

  return (
    <>
      <div className="main-container-v1">
        <div className="headerbox-v1">
          <CustomBreadCrumbs routes={[{ title: routes.workSpace.title }]} />
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
            />
            <MessagePanel
              isSidebarCollapsed={isSidebarCollapsed}
              toggleSidebar={toggleSidebar}
              setSelectedChannel={setSelectedChannel}
              selectedChannel={selectedChannel}
              mobScreen={mobScreen}
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
