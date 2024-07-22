import { Button, Dialog, IconButton, TextField } from '@material-ui/core';
import { Add, Delete, Remove } from '@material-ui/icons';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DashboardModal from 'src/components/DashboardModal';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import AddMemberDialog from 'src/pages/WorkSpace/MessagePanel/AddMembersDialog';
import { ChannelData, TChannel } from 'src/pages/WorkSpace/types';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

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

  return (
    <>
      <DashboardModal
        handleClose={handleClose}
        open={true}
        dialogProps={{
          fullScreen: isMobile || isTablet,
          maxWidth: 'sm'
        }}
        modalHead={{
          title: `${channelData?.title}`,
          description: <span className=" line-clamp-1">{channelData?.description}</span>,
          fullScreenOption: true
        }}
        contentMaxHeight="350px"
      >
        <div className="flex items-center gap-2">
          <TextField
            size="small"
            id="search-member"
            type="search"
            label="Outlined"
            variant="outlined"
            value={searchTerm}
            onChange={handleSearch}
            fullWidth
            autoFocus
          />
          <HtmlTooltip title={`Add member`}>
            <IconButton
              size="small"
              style={{ border: '1px solid var(--common-border-color)', padding: 6 }}
              onClick={() => setIsAddMemberDialogOpen(true)}
            >
              <Add />
            </IconButton>
          </HtmlTooltip>
        </div>
        <ul className="mt-4 max-h-[230px] space-y-2 overflow-y-auto">
          {members?.map((member) => (
            <li key={member.optionValue} className="flex list-none items-center justify-between">
              <span>{member.optionLabel}</span>
              <HtmlTooltip title={<span className="block w-[200px] py-2 text-center">Remove {member.optionLabel}</span>}>
                <IconButton onClick={() => handleRemoveMember(member.optionValue)} size="small">
                  <Remove color="error" />
                </IconButton>
              </HtmlTooltip>
            </li>
          ))}
        </ul>
      </DashboardModal>
      {isAddMemberDialogOpen && (
        <AddMemberDialog
          channelId={selectedChannel._id}
          ignoreIds={channelData?.members?.map((member) => member.optionValue)}
          onClose={() => setIsAddMemberDialogOpen(false)}
          onSuccess={fetchChannelData}
        />
      )}
    </>
  );
};

export default ViewMembers;
