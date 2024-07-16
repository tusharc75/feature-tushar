import { useEffect, useState, useContext } from 'react';
import { Box, IconButton, Typography } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { Visibility } from '@material-ui/icons';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import Members from './Members';

const Channel = ({ channelId }) => {
  const [memberDialog, setMemberDialog] = useState(false);
  const [channelData, setChannelData] = useState(null);
  const toastConfig = useContext(CustomToastContext);

  const fetchChannelData = async () => {
    try {
      const { data } = await axiosInstance().get(`work-space/channel/${channelId}`);
      setChannelData(data?.data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    fetchChannelData();
  }, [channelId]);

  return (
    <Box>
      {channelData ? <>
        <Box display="flex" alignItems="center" justifyContent="space-between" padding={2}>
          <Typography variant="h6">{channelData.title}</Typography>
          <HtmlTooltip title={'View Members'}>
            <span>
              <IconButton color="primary" onClick={() => setMemberDialog(true)}>
                <Visibility fontSize="small" color="primary" />
              </IconButton>
            </span>
          </HtmlTooltip>
        </Box>
        <Typography>
          {channelData.description}
        </Typography>
      </> : <>
        <CommonSkeleton lenArray={[...Array(2).keys()]} />
      </>}
      {memberDialog && (
        <Members
          onClose={() => setMemberDialog(false)}
          channelData={channelData}
          fetchChannelData={fetchChannelData}
        />
      )}
    </Box>
  );
};

export default Channel;
