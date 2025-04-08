import { ArrowDropDown, ArrowDropUp, MoreVert } from '@mui/icons-material';
import { Collapse, IconButton, List, ListItemButton, ListItemText, Menu, MenuItem } from '@mui/material';
import React, { useEffect, useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import SearchBox from 'src/components/Helpers/SearchBox';
import { cn } from 'src/constants/helpers';
import { TChannel } from 'src/pages/WorkSpace/types';
import { UseWorkSpace } from 'src/pages/WorkSpace/useWorkSpace';

const Channels = ({ state }: { state: UseWorkSpace }) => {
  const { channels, mobScreen, initChat, handleDeleteChannels, selectedChannel, setEditCreateChannelDialogData } = state;

  const [filteredChannels, setFilteredChannels] = useState(channels);
  const [searchValue, setSearchValue] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedChannelAction, setSelectedChannelAction] = useState<TChannel>(null);

  useEffect(() => {
    setFilteredChannels(channels);
  }, [channels]);

  const handleFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchValue(value);
    const newValue = value?.trim()?.toLowerCase();
    let filtered = channels;
    if (newValue) filtered = channels.filter((c) => c?.title?.toLowerCase()?.includes(newValue));
    setFilteredChannels(filtered);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, channel: TChannel) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedChannelAction(channel);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <>
      <SearchBox value={searchValue} onChange={handleFilter} />
      <div className=" relative">
        <ThemeButton
          buttonType="transparent"
          onClick={() => {
            setIsExpanded((prev) => !prev);
          }}
          endIcon={isExpanded ? <ArrowDropDown fontSize="large" /> : <ArrowDropUp fontSize="large" />}
        >
          Channels
        </ThemeButton>
        {filteredChannels ? (
          <Collapse in={isExpanded}>
            <List dense className="max-h-[calc(100vh-300px)] min-h-[400px] overflow-y-auto">
              {filteredChannels?.map((c, index) => (
                <>
                  {mobScreen && <span className="block [border-bottom:1px_solid_var(--common-border-color)]"></span>}
                  <ListItemButton
                    key={c._id}
                    className="group"
                    style={{ borderRadius: '6px' }}
                    selected={selectedChannel?._id === c._id}
                    onClick={() => {
                      initChat(c);
                    }}
                  >
                    <ListItemText
                      id={`channel-${index}`}
                      primary={
                        <span className="flex items-center gap-2 ">
                          <span className=" line-clamp-1 font-semibold">{c.title}</span>
                          {c?.notifications > 0 && (
                            <span className="mr-4 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-red-500 text-center text-[8px] text-white">
                              {c?.notifications}
                            </span>
                          )}
                        </span>
                      }
                    />
                    <div
                      className={cn(
                        'absolute right-2 pl-6 opacity-0 group-hover:opacity-100  ',
                        selectedChannel?._id === c._id
                          ? '[background-image:linear-gradient(270deg,_#ebebeb_66%,_transparent_100%)] dark:[background-image:linear-gradient(270deg,_#353546_60%,_transparent_100%)]'
                          : '[background-image:linear-gradient(270deg,_#f5f5f5_66%,_transparent_100%)] dark:[background-image:linear-gradient(270deg,_#212134_60%,_transparent_100%)]'
                      )}
                    >
                      <HtmlTooltip title="Actions">
                        <IconButton
                          onClick={(e) => {
                            handleMenuClick(e, c);
                          }}
                          size="small"
                        >
                          <MoreVert />
                        </IconButton>
                      </HtmlTooltip>
                    </div>
                  </ListItemButton>
                </>
              ))}
            </List>
            {channels?.length === 0 && (
              <div className="absolute left-0 right-0 top-1/2 text-center">
                <h6 className="py-[60px] text-center text-[16px] text-gray-400 dark:text-gray-600">No channels found</h6>
              </div>
            )}
          </Collapse>
        ) : (
          <div className="m-3">
            <CommonSkeleton lenArray={[...Array(3).keys()]} xs={12} sm={12} md={12} lg={12} />
          </div>
        )}
      </div>
      <ChannelActions
        anchorEl={anchorEl}
        handleMenuClose={handleMenuClose}
        selectedChannel={selectedChannelAction}
        setManageChannelDialog={setEditCreateChannelDialogData}
        handleDeleteChannels={handleDeleteChannels}
      />
    </>
  );
};
export default Channels;

const ChannelActions = ({ anchorEl, handleMenuClose, selectedChannel, setManageChannelDialog, handleDeleteChannels }) => {
  const [showConfirmBox, setShowConfirmBox] = useState<boolean>(false);
  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
      >
        <span onClick={handleMenuClose}>
          <MenuItem onClick={() => setManageChannelDialog({ open: true, _id: selectedChannel?._id })} disabled={!selectedChannel?.isOwner}>
            Edit
          </MenuItem>
          <MenuItem onClick={() => setShowConfirmBox(true)} disabled={!selectedChannel?.isOwner}>
            Delete
          </MenuItem>
        </span>
      </Menu>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${selectedChannel?.type === 'chat' ? 'this Chat' : `${selectedChannel?.title} Channel`} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={() => {
            setShowConfirmBox(false);
            handleDeleteChannels([selectedChannel?._id]);
          }}
        />
      )}
    </>
  );
};
