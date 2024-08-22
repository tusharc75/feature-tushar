import { Button, Collapse, IconButton, List, ListItem, ListItemText, Menu, MenuItem } from '@material-ui/core';
import { Add, ArrowDropDown, ArrowDropUp, Delete, ExpandMore, MoreHoriz } from '@material-ui/icons';
import React, { useState } from 'react';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { cn } from 'src/constants/helpers';
import { TChannel } from 'src/pages/WorkSpace/types';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

type SidebarProps = {
  channels: TChannel[];
  selectedChannel: TChannel | null;
  setSelectedChannel: React.Dispatch<React.SetStateAction<TChannel>>;
  setCreateChannelDialog: React.Dispatch<React.SetStateAction<boolean>>;
  handleDeleteChannels: (ids: string[]) => void;
  mobScreen: boolean;
};

const Sidebar = ({ channels, selectedChannel, setSelectedChannel, setCreateChannelDialog, handleDeleteChannels, mobScreen }: SidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [channelMenuData, setChannelMenuData] = React.useState<{ anchor: null | HTMLElement; selected: TChannel; openConfirmDialog: boolean } | null>(
    null
  );

  return (
    <>
      <div
        className={cn(
          'min-h-full flex-shrink-0 flex-grow  p-2 transition-transform duration-300 [border-right:1px_solid_var(--common-border-color)] ',
          mobScreen ? 'w-full' : ' w-[270px] max-w-[270px]'
        )}
      >
        <div className="flex items-center px-2">
          <IconButton
            onClick={() => {
              setIsExpanded((prev) => !prev);
            }}
            style={{ padding: 2 }}
          >
            {isExpanded ? <ArrowDropDown /> : <ArrowDropUp />}
          </IconButton>
          <SidebarButton setCreateChannelDialog={setCreateChannelDialog} />
        </div>
        {channels ? (
          <Collapse in={isExpanded}>
            <List dense>
              {channels.map((c, index) => (
                <>
                  {mobScreen && <span className="block [border-bottom:1px_solid_var(--common-border-color)]"></span>}
                  <ListItem
                    button
                    key={c._id}
                    style={{ borderRadius: '6px' }}
                    selected={selectedChannel?._id === c._id}
                    onClick={() => setSelectedChannel(c)}
                    className="group"
                  >
                    <ListItemText id={`channel-${index}`} primary={<span className="font-semibold">{c.title}</span>} />
                    <div
                      className={cn(
                        'absolute right-2 pl-6 opacity-0 group-hover:opacity-100  ',
                        selectedChannel?._id === c._id
                          ? '[background-image:linear-gradient(270deg,_#ebebeb_66%,_transparent_100%)] dark:[background-image:linear-gradient(270deg,_#353546_60%,_transparent_100%)]'
                          : '[background-image:linear-gradient(270deg,_#f5f5f5_66%,_transparent_100%)] dark:[background-image:linear-gradient(270deg,_#212134_60%,_transparent_100%)]'
                      )}
                    >
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        size="small"
                        onClick={(e) => {
                          setChannelMenuData({ anchor: e.currentTarget, selected: c, openConfirmDialog: false });
                        }}
                      >
                        <MoreHoriz />
                      </IconButton>
                    </div>
                  </ListItem>
                </>
              ))}
            </List>
            {channels?.length === 0 && (
              <div>
                <h6 className="py-[60px] text-center text-[25px] text-gray-400 dark:text-gray-600">No channels found</h6>
              </div>
            )}
          </Collapse>
        ) : (
          <div className="m-3">
            <CommonSkeleton lenArray={[...Array(3).keys()]} xs={12} sm={12} md={12} lg={12} />
          </div>
        )}
      </div>
      <Menu
        id="simple-menu"
        anchorEl={channelMenuData?.anchor}
        keepMounted
        open={Boolean(channelMenuData?.anchor)}
        onClose={() => setChannelMenuData(null)}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
      >
        <MenuItem
          onClick={() => {
            setChannelMenuData((prev) => ({ ...prev, anchor: null, openConfirmDialog: true }));
          }}
        >
          <span className="flex justify-between gap-2">
            Delete Channel
            <Delete />
          </span>
        </MenuItem>
      </Menu>
      {channelMenuData?.openConfirmDialog && (
        <ConfirmationDialog
          open={channelMenuData?.openConfirmDialog}
          message={`Are you sure you want to delete ${channelMenuData?.selected?.title} Channel?`}
          onClose={() => {
            setChannelMenuData(null);
          }}
          onOk={() => {
            handleDeleteChannels([channelMenuData?.selected?._id]);
            setChannelMenuData(null);
          }}
        />
      )}
    </>
  );
};

export default Sidebar;

type SidebarButtonProps = {
  setCreateChannelDialog: React.Dispatch<React.SetStateAction<boolean>>;
};

const SidebarButton = ({ setCreateChannelDialog }: SidebarButtonProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button size={'small'} className="group" onClick={handleClick}>
        <span className="text-[15px]">Channels</span>
      </Button>
      <HtmlTooltip title="Create Channel" className="ml-auto">
        <IconButton size={'small'} onClick={() => setCreateChannelDialog(true)}>
          <Add fontSize="small" />
        </IconButton>
      </HtmlTooltip>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
      >
        <MenuItem
          onClick={() => {
            setCreateChannelDialog(true);
            handleClose();
          }}
        >
          Create Channel
        </MenuItem>
      </Menu>
    </>
  );
};
