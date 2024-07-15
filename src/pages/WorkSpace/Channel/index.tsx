import { useState } from 'react';
import { Box, IconButton, Typography } from '@material-ui/core';
import { AiOutlinePlus } from 'react-icons/ai';
import AddMembersDialog from './AddMembersDialog';

const Channel = ({ channelData, fetchChannels }) => {
  const [addMemberDialog, setAddMemberDialog] = useState(false);

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" padding={2}>
        <Typography variant="h6">{channelData.title}</Typography>
        <IconButton color="primary" onClick={() => setAddMemberDialog(true)}>
          <AiOutlinePlus />
        </IconButton>
      </Box>
      <Typography>
        {channelData.description}
      </Typography>
      {addMemberDialog && (
        <AddMembersDialog
          onClose={() => setAddMemberDialog(false)}
          channelId={channelData._id}
          onSuccess={() => {
            fetchChannels();
            setAddMemberDialog(false);
          }}
          ignoreIds={channelData?.members}
        />
      )}
    </Box>
  );
};

export default Channel;
