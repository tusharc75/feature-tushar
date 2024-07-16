import { useState, useEffect } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { Box, Grid, useMediaQuery } from '@material-ui/core';
import { Add } from '@material-ui/icons';
import RenderChannels from './RenderChannels';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import ManageChannel from './ManageChannelDialog';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import Channel from './Channel';

const Workspace = () => {
  const [channels, setChannels] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const mobScreen = useMediaQuery('(max-width:768px)');
  const [isColapsed, setIsColapsed] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [createChannelDialog, setCreateChannelDialog] = useState(false)

  const channelButtons: any = [
    {
      id: '1',
      onClick: () => { setCreateChannelDialog(true) },
      iconForMobile: <Add />,
      children: (
        <>
          <Add fontSize="small" className="-ml-2" /> Create Channel
        </>
      ),
      visible: !isColapsed,
      tooltip: 'Add'
    },
  ];

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    const { data } = await axiosInstance().get('/work-space/channel');
    setChannels(data.data || []);
  };

  const handleDeleteChannels = async (channelIds) => {
    await axiosInstance().delete('/work-space/channel', { data: { _ids: channelIds } });
    fetchChannels();
  };

  const handleColapse = () => {
    setIsColapsed((prev) => !prev);
  };

  return (
    <>
      <div className="main-container-v1">
        <div className="headerbox-v1">
          <CustomBreadCrumbs routes={[{ title: routes.workSpace.title }]} />
        </div>
        <Box mt={2}>
          <>
            <Grid container spacing={2}>
              {!mobScreen && (
                <Grid
                  item
                  xs={12}
                  sm={5}
                  md={5}
                  lg={4}
                  xl={3}
                  style={{
                    maxWidth: isColapsed ? 'calc(76px + 40px)' : mobScreen ? '100%' : '',
                    flexBasis: isColapsed ? 'calc(76px + 40px)' : mobScreen ? '100%' : '',
                    transition: 'width 300ms ease 0s, max-width 300ms ease 0s, flex-basis 300ms ease 0s'
                  }}
                >
                  <RenderChannels
                    {...{
                      isColapsed,
                      channels,
                      handleColapse,
                      setShowConfirmBox,
                      setSelectedChannel,
                      isMobile: false,
                      channelButtons
                    }}
                  />
                </Grid>
              )}

              {/* ------------------ RIGHT SIDE CONTENTS ------------------ */}
              <Grid
                item
                xs={12}
                sm={7}
                md={7}
                lg={8}
                xl={9}
                style={{
                  maxWidth: isColapsed ? 'calc(100% - calc(76px + 40px))' : mobScreen ? '100%' : '',
                  flexBasis: isColapsed ? 'calc(100% - calc(76px + 40px))' : mobScreen ? '100%' : '',
                  transition: 'width 300ms ease 0s, max-width 300ms ease 0s, flex-basis 300ms ease 0s'
                }}
              >
                <Box
                  className="container-with-border"
                  style={{
                    overflow: 'hidden',
                    minHeight: '100%'
                  }}
                >
                  {selectedChannel && (<Channel channelId={selectedChannel?._id} />)}
                </Box>
              </Grid>
            </Grid>
          </>
        </Box>
        {createChannelDialog && (
          <ManageChannel
            onClose={() => setCreateChannelDialog(false)}
            onSuccess={() => {
              fetchChannels();
              setCreateChannelDialog(false);
            }}
          />
        )}
        {showConfirmBox && (
          <ConfirmationDialog
            open={showConfirmBox}
            message={`Are you sure you want to delete ${selectedChannel?.title} Channel?`}
            onClose={() => {
              setShowConfirmBox(false);
            }}
            onOk={() => {
              handleDeleteChannels([selectedChannel._id]);
              setShowConfirmBox(false);
            }}
          />
        )}
      </div>
    </>
  );
};

export default Workspace;
