import { Avatar, Dialog, IconButton, ListItem, TextField } from '@mui/material';
import { Add, RemoveCircleOutline } from '@mui/icons-material';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { useAppTheme } from 'src/constants/AppConfig';
import AddMemberDialog from 'src/pages/WorkSpace/MessagePanel/AddMembersDialog';
import { getAvatarColor } from 'src/pages/WorkSpace/utils';
import { ChannelData, TChannel } from 'src/pages/WorkSpace/types';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';

type ViewMembersProps = {
  selectedChannel: TChannel | null;
  fetchChannelData: () => void;
  channelData: ChannelData | null;
  handleClose: () => void;
  open: boolean;
};

const ViewMembers = ({ selectedChannel, fetchChannelData, channelData, handleClose, open }: ViewMembersProps) => {
  const toastConfig = useContext(CustomToastContext);
  const [members, setMembers] = useState(channelData?.members || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, data: null });
  const [themeColor] = useAppTheme();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const handleRemoveMember = useCallback(
    async (userId) => {
      try {
        await axiosInstance().put(`/work-space/channel/${selectedChannel?._id}/remove-member`, { userIds: [userId] });
        fetchChannelData();
      } catch (error) {
        toastConfig.setToastConfig(error);
      }
    },
    [selectedChannel?._id, fetchChannelData, toastConfig]
  );

  useEffect(() => {
    setMembers(channelData?.members);
  }, [channelData]);

  const handleSearch = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim() === '') return setMembers(channelData?.members);
    const newMembers = channelData?.members.filter((member) => member.optionLabel.toLowerCase().includes(value.trim().toLowerCase()));
    setMembers(newMembers);
  };



  return (<>
    <Dialog
      maxWidth="sm"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose()
        }
      }}
    >
      <CustomDialogHeader
        onClose={handleClose}
        title={channelData?.title}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
        showRequiredLabel={false}
      />
      <CustomDialogContent isFooterPresent={false}>
        <div className="sticky -top-[16px] mt-1 z-10 flex items-center gap-2 bg-[var(--dark-primary,white)]">
          <TextField
            size="small"
            id="search-member"
            type="search"
            label="Search.."
            variant="outlined"
            value={searchTerm}
            onChange={handleSearch}
            fullWidth
            autoFocus
          />
          {selectedChannel?.isOwner && (
            <HtmlTooltip title={`Add Members`}>
              <IconButton
                size="small"
                style={{ border: '1px solid var(--common-border-color)', padding: 6 }}
                onClick={() => setIsAddMemberDialogOpen(true)}
              >
                <Add />
              </IconButton>
            </HtmlTooltip>
          )}
        </div>
        <ul className={'mt-4  space-y-2 overflow-y-auto'}>
          {members?.map((member) => (
            <ListItem component={'li'} button key={member.optionValue} className="!list-none !items-center !justify-between">
              <div className="flex items-center gap-2">
                <Avatar
                  style={{
                    width: 25,
                    height: 25,
                    borderRadius: '999px',
                    fontSize: 12,
                    ...getAvatarColor(member?.optionLabel, themeColor)
                  }}
                  variant="rounded"
                  className="my-[2px] uppercase "
                  src={member.avatar}
                >
                  {member?.optionLabel.match(/(\b\S)?/g).join('')}
                </Avatar>
                <span>{member.optionLabel}</span>
              </div>
              {selectedChannel?.isOwner && selectedChannel?.createdBy?.user !== member?.optionValue && (
                <HtmlTooltip title={'Remove'}>
                  <IconButton onClick={() => setConfirmDialog({ open: true, data: member })} size="small">
                    <RemoveCircleOutline color="error" />
                  </IconButton>
                </HtmlTooltip>
              )}
            </ListItem>
          ))}
        </ul>
      </CustomDialogContent>
    </Dialog>
    {isAddMemberDialogOpen && (
      <AddMemberDialog
        channelId={selectedChannel._id}
        ignoreIds={channelData?.members?.map((member) => member.optionValue)}
        onClose={() => setIsAddMemberDialogOpen(false)}
        onSuccess={fetchChannelData}
      />
    )}
    {confirmDialog.open && (
      <ConfirmationDialog
        open={true}
        message={`Are you sure you want to remove ${confirmDialog.data?.optionLabel}?`}
        onClose={() => {
          setConfirmDialog({ open: false, data: null });
        }}
        onOk={() => {
          handleRemoveMember(confirmDialog.data?.optionValue);
          setConfirmDialog({ open: false, data: null });
        }}
      />
    )}
  </>
  );
};

export default ViewMembers;
