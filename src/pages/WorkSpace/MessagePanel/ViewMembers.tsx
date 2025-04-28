import { RemoveCircleOutline } from '@mui/icons-material';
import { Avatar, Dialog, IconButton, ListItemButton } from '@mui/material';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { useAppTheme } from 'src/constants/AppConfig';
import { CustomDialogTransition } from 'src/constants/helpers';
import AddMemberAutoComplete from 'src/pages/WorkSpace/MessagePanel/AddMemberAutoComplete';
import { ChannelData, TChannel } from 'src/pages/WorkSpace/types';
import { UseWorkSpace } from 'src/pages/WorkSpace/useWorkSpace';
import { getAvatarColor } from 'src/pages/WorkSpace/utils';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

type ViewMembersProps = {
  selectedChannel: Partial<TChannel> | null;
  fetchChannelData: () => void;
  channelData: ChannelData | null;
  handleClose: () => void;
  open: boolean;
  resourceData: any | null;
  resourceLabel: string | null;
  state: UseWorkSpace;
};

const ViewMembers = ({ selectedChannel, fetchChannelData, channelData, handleClose, open, resourceData, resourceLabel, state }: ViewMembersProps) => {
  const {
    state: {
      user: { user }
    }
  } = useData();
  const { setSelectedChannel } = state;
  const toastConfig = useContext(CustomToastContext);
  const [members, setMembers] = useState(channelData?.members || []);
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

  return (
    <>
      <Dialog
        maxWidth="sm"
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
        fullWidth
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            handleClose();
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
          {(selectedChannel?.isOwner || resourceData) && (
            <div className="sticky -top-[16px] z-10 mt-1 flex items-center gap-2 bg-[var(--dark-primary,white)]">
              <AddMemberAutoComplete
                fetchChannelData={fetchChannelData}
                channelId={selectedChannel?._id}
                resourceData={resourceData}
                ignoreIds={channelData?.members?.map((member) => member.optionValue)}
                resourceLabel={resourceLabel}
                setSelectedChannel={setSelectedChannel}
              />
            </div>
          )}
          <ul className={'mt-4  space-y-2 overflow-y-auto'}>
            {!channelData && resourceData && (
              <ListItemButton className="!list-none !items-center !justify-between">
                <div className="flex items-center gap-2">
                  <Avatar
                    style={{
                      width: 25,
                      height: 25,
                      borderRadius: '999px',
                      fontSize: 12,
                      ...getAvatarColor(`${user.firstName} ${user.lastName}`, themeColor)
                    }}
                    variant="rounded"
                    className="my-[2px] uppercase "
                    src={user.avatar}
                  >
                    {`${user.firstName} ${user.lastName}`.match(/(\b\S)?/g).join('')}
                  </Avatar>
                  <span>{`${user.firstName} ${user.lastName}`}</span>
                </div>
              </ListItemButton>
            )}
            {members?.map((member) => (
              <ListItemButton key={member.optionValue} className="!list-none !items-center !justify-between">
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
              </ListItemButton>
            ))}
          </ul>
        </CustomDialogContent>
      </Dialog>

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
