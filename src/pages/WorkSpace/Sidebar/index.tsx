import { Button, Collapse, IconButton, List, ListItem, ListItemText, Menu, MenuItem } from '@mui/material';
import { Add, ArrowDropDown, ArrowDropUp, Delete, MoreHoriz } from '@material-ui/icons';
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
  setCreateChannelDialog: React.Dispatch<React.SetStateAction<boolean>>;
  handleDeleteChannels: (ids: string[]) => void;
  mobScreen: boolean;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setChannels: React.Dispatch<React.SetStateAction<TChannel[]>>;
};

const Sidebar = ({
  channels,
  selectedChannel,
  setSelectedChannel,
  setCreateChannelDialog,
  handleDeleteChannels,
  mobScreen,
  setChannels,
  isSidebarCollapsed,
  toggleSidebar
}: SidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [channelMenuData, setChannelMenuData] = React.useState<{ selected: TChannel; openConfirmDialog: boolean } | null>(null);
  const [filteredChannels, setFilteredChannels] = useState(channels);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    setFilteredChannels(channels);
  }, [channels]);

  const handleFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchValue(value);
    const newValue = value.trim().toLowerCase();
    let filtered = channels;
    if (newValue) filtered = channels.filter((c) => c.title.toLowerCase().includes(newValue));
    setFilteredChannels(filtered);
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
            borderColor="none"
            color="primary"
            onClick={() => setCreateChannelDialog(true)}
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
        <div>
          <Button
            size={'small'}
            className="group"
            onClick={() => {
              setIsExpanded((prev) => !prev);
            }}
            endIcon={isExpanded ? <ArrowDropDown fontSize="large" /> : <ArrowDropUp fontSize="large" />}
          >
            <span className="text-[15px]">Channels</span>
          </Button>
          {filteredChannels ? (
            <Collapse in={isExpanded}>
              <List dense>
                {filteredChannels.map((c, index) => (
                  <>
                    {mobScreen && <span className="block [border-bottom:1px_solid_var(--common-border-color)]"></span>}
                    <ListItem
                      button
                      key={c._id}
                      style={{ borderRadius: '6px' }}
                      selected={selectedChannel?._id === c._id}
                      onClick={() => {
                        setSelectedChannel(c);
                        setChannels((prev) => {
                          const index = prev.findIndex((ch) => ch._id === c._id);
                          prev[index] = { ...prev[index], notifications: 0 };
                          return [...prev];
                        });
                      }}
                      className="group"
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
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          size="small"
                          onClick={(e) => {
                            setChannelMenuData({ selected: c, openConfirmDialog: true });
                          }}
                        >
                          <Delete fontSize="small" color="error" />
                        </IconButton>
                      </div>
                    </ListItem>
                  </>
                ))}
              </List>
              {channels?.length === 0 && (
                <div>
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
      </div>
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
