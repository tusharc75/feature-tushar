import { Add, ArrowDropDown, ArrowDropUp, MoreVert } from '@mui/icons-material';
import { Collapse, IconButton, List, ListItem, ListItemButton, ListItemText, Menu, MenuItem } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { VscLayoutSidebarLeft } from 'react-icons/vsc';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import SearchBox from 'src/components/Helpers/SearchBox';
import { cn } from 'src/constants/helpers';
import { TChannel } from 'src/pages/WorkSpace/types';

type SidebarProps = {
  channels: TChannel[];
  selectedChannel: TChannel | null;
  setSelectedChannel: React.Dispatch<React.SetStateAction<TChannel>>;
  setManageChannelDialog: React.Dispatch<React.SetStateAction<{ open: boolean; _id: string }>>;
  handleDeleteChannels: (ids: string[]) => void;
  mobScreen: boolean;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setChannels: React.Dispatch<React.SetStateAction<TChannel[]>>;
  setNewChat: React.Dispatch<React.SetStateAction<boolean>>;
  setNewChatUsers: React.Dispatch<React.SetStateAction<string[]>>;
  setNewChatAddMemberDialog: React.Dispatch<React.SetStateAction<boolean>>;
};

const Sidebar = ({
  channels,
  selectedChannel,
  setSelectedChannel,
  setManageChannelDialog,
  handleDeleteChannels,
  mobScreen,
  setChannels,
  isSidebarCollapsed,
  toggleSidebar,
  setNewChat,
  setNewChatUsers,
  setNewChatAddMemberDialog,
}: SidebarProps) => {
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


  const handleMenuClick = (event, channel: TChannel) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedChannelAction(channel);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <div
        className={cn(
          'min-h-full w-[var(--sidebar-width)] max-w-[var(--sidebar-width)] flex-shrink-0  flex-grow space-y-3 px-3 py-4 transition-transform  duration-300 [border-right:1px_solid_var(--common-border-color)]',
          isSidebarCollapsed ? '[transform:translateX(-100%)]' : 'translate-x-0',
          mobScreen ? 'absolute bottom-0 left-0 top-0 z-20 bg-[var(--dark-primary,white)]' : ''
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <ThemeButton
            buttonType="theme"
            onClick={() => setManageChannelDialog({ open: true, _id: null })}
            iconForMobile={<Add />}
            mobileTooltip="New Channel"
            startIcon={<Add />}
          >
            New Channel
          </ThemeButton>
          <HtmlTooltip title="Hide sidebar">
            <IconButton size={'small'} style={{ minWidth: 32, minHeight: 32, marginRight: '-6px' }} onClick={toggleSidebar}>
              <VscLayoutSidebarLeft />
            </IconButton>
          </HtmlTooltip>
        </div>
        <SearchBox value={searchValue} onChange={handleFilter} />
        <ChannelAndChats
          type="channel"
          channels={channels?.filter((f: any) => f.type !== 'chat')}
          filteredChannels={filteredChannels?.filter((f: any) => f.type !== 'chat')}
          mobScreen={mobScreen}
          selectedChannel={selectedChannel}
          setSelectedChannel={setSelectedChannel}
          setNewChat={setNewChat}
          setChannels={setChannels}
          handleMenuClick={handleMenuClick}
        />
        <div className="pt-2">
          <ThemeButton
            buttonType="theme"
            onClick={() => {
              setSelectedChannel(null);
              setNewChat(true);
              setNewChatUsers([]);
              setNewChatAddMemberDialog(true);
            }}
            iconForMobile={<Add />}
            mobileTooltip="New Chat"
            startIcon={<Add />}
          >
            New Chat
          </ThemeButton>
        </div>
        <ChannelAndChats
          type="chat"
          channels={channels?.filter((f: any) => f.type === 'chat')}
          filteredChannels={filteredChannels?.filter((f: any) => f.type === 'chat')}
          mobScreen={mobScreen}
          selectedChannel={selectedChannel}
          setSelectedChannel={setSelectedChannel}
          setNewChat={setNewChat}
          setChannels={setChannels}
          handleMenuClick={handleMenuClick}
        />
      </div>
      <ChannelActions
        anchorEl={anchorEl}
        handleMenuClose={handleMenuClose}
        selectedChannel={selectedChannelAction}
        setManageChannelDialog={setManageChannelDialog}
        handleDeleteChannels={handleDeleteChannels}
      />
    </>
  );
};

export default Sidebar;


const ChannelActions = ({
  anchorEl,
  handleMenuClose,
  selectedChannel,
  setManageChannelDialog,
  handleDeleteChannels,
}) => {

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
          {selectedChannel?.type !== 'chat' && (
            <MenuItem onClick={() => setManageChannelDialog({ open: true, _id: selectedChannel?._id })} disabled={!selectedChannel?.isOwner}>
              Edit
            </MenuItem>
          )}
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

const ChannelAndChats = ({
  type,
  channels,
  filteredChannels,
  mobScreen,
  selectedChannel,
  setSelectedChannel,
  setNewChat,
  setChannels,
  handleMenuClick,
}) => {

  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div>
      <ThemeButton
        buttonType='transparent'
        onClick={() => {
          setIsExpanded((prev) => !prev);
        }}
        endIcon={isExpanded ? <ArrowDropDown fontSize="large" /> : <ArrowDropUp fontSize="large" />}
      >
        {type === 'chat' ? 'Chats' : 'Channels'}
      </ThemeButton>
      {filteredChannels ? (
        <Collapse in={isExpanded}>
          <List dense>
            {filteredChannels?.map((c, index) => (
              <>
                {mobScreen && <span className="block [border-bottom:1px_solid_var(--common-border-color)]"></span>}
                <ListItemButton
                  key={c._id}
                  className="group"
                  style={{ borderRadius: '6px' }}
                  selected={selectedChannel?._id === c._id}
                  onClick={() => {
                    setSelectedChannel(c);
                    setNewChat(false);
                    setChannels((prev) => {
                      const index = prev.findIndex((ch) => ch._id === c._id);
                      prev[index] = { ...prev[index], notifications: 0 };
                      return [...prev];
                    });
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
            <div>
              <h6 className="py-[60px] text-center text-[16px] text-gray-400 dark:text-gray-600">No {type === 'chat' ? 'chats' : 'channels'} found</h6>
            </div>
          )}
        </Collapse>
      ) : (
        <div className="m-3">
          <CommonSkeleton lenArray={[...Array(3).keys()]} xs={12} sm={12} md={12} lg={12} />
        </div>
      )}
    </div>
  )
}
