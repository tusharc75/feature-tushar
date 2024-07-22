import { useState, useEffect, useContext } from 'react';
import { Dialog, Button, List, ListItem, ListItemText, IconButton, Box } from '@material-ui/core';
import { Remove, PersonAdd } from '@material-ui/icons';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import SearchBox from 'src/components/Helpers/SearchBox';
import AddMemberDialog from './AddMembersDialog';

const ViewMembersDialog = ({ channelData, onClose, fetchChannelData }) => {
  const toastConfig = useContext(CustomToastContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState(null);
  const [addMemberDialog, setAddMemberDialog] = useState(false);

  useEffect(() => {
    const filteredMembers = channelData?.members?.filter((member) => member.optionLabel.toLowerCase().includes(searchTerm.toLowerCase()));
    setMembers(filteredMembers);
  }, [searchTerm, channelData.members]);

  const handleRemoveMember = async (userId) => {
    try {
      await axiosInstance().put(`/work-space/channel/${channelData._id}/remove-member`, { userIds: [userId] });
      fetchChannelData();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  }

  return (
    <>
      <Dialog fullWidth maxWidth="sm" open={true} onClose={onClose}>
        <CustomDialogHeader title={`${channelData.title} Members`} showRequiredLabel={false} onClose={onClose} />
        <CustomDialogContent>
          <Box display="flex" alignItems="center">
            <SearchBox onChange={(e) => { setSearchTerm(e.target.value) }} className="terms_header_search_bar" value={searchTerm} />
            <Box flexGrow={1} />
            <Box p={1}>
              <Button
                startIcon={<PersonAdd />}
                color="primary"
                onClick={() => setAddMemberDialog(true)}
              >
                Add People
              </Button>
            </Box>
          </Box>
          <List>
            {members?.map((member) => (
              <ListItem key={member.optionValue}>
                <ListItemText primary={member.optionLabel} />
                <HtmlTooltip title={'Remove Member'}>
                  <IconButton onClick={() => handleRemoveMember(member.optionValue)} disabled={member.optionValue === channelData?.createdBy?.user?._id}>
                    <Remove />
                  </IconButton>
                </HtmlTooltip>
              </ListItem>
            ))}
          </List>
        </CustomDialogContent>
      </Dialog>
      {addMemberDialog && (
        <AddMemberDialog
          onClose={() => setAddMemberDialog(false)}
          channelId={channelData._id}
          onSuccess={() => {
            setAddMemberDialog(false);
            fetchChannelData();
          }}
          ignoreIds={channelData.members.map((member) => member.optionValue)}
        />
      )
      }
    </>
  );
};

export default ViewMembersDialog;
