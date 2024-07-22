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

const Workspace = () => {
  const [channels, setChannels] = useState<TChannel[]>(null);
  const [selectedChannel, setSelectedChannel] = useState<TChannel>(null);
  const [createChannelDialog, setCreateChannelDialog] = useState(false);
  const mobScreen = useMediaQuery('(max-width:768px)');

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    const { data } = await axiosInstance().get('/work-space/channel');
    setChannels(data.data || []);
  };

  const handleDeleteChannels = async (channelIds: string[]) => {
    await axiosInstance().delete('/work-space/channel', { data: { _ids: channelIds } });
    fetchChannels();
  };

  console.log(channels);

  return (
    <>
      <div className="main-container-v1">
        <div className="headerbox-v1">
          <CustomBreadCrumbs routes={[{ title: routes.workSpace.title }]} />
        </div>
        <CustomContainer className="!p-0">
          <div className="flex h-[calc(100vh-98px)] min-h-[600px] overflow-hidden rounded-lg">
            <Sidebar
              channels={channels}
              selectedChannel={selectedChannel}
              setSelectedChannel={setSelectedChannel}
              setCreateChannelDialog={setCreateChannelDialog}
              handleDeleteChannels={handleDeleteChannels}
            />
            <MessagePanel selectedChannel={selectedChannel} />
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
