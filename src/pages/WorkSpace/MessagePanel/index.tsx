import { Avatar, IconButton } from '@material-ui/core';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { VscLayoutSidebarLeft } from 'react-icons/vsc';
import { Socket } from 'socket.io-client';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { useAppTheme } from 'src/constants/AppConfig';
import { cn } from 'src/constants/helpers';
import Messages from 'src/pages/WorkSpace/MessagePanel/Messages';
import { getAvatarColor } from 'src/pages/WorkSpace/utils';
import ViewMembers from 'src/pages/WorkSpace/MessagePanel/ViewMembers';
import { ChannelData, Message, TChannel } from 'src/pages/WorkSpace/types';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

type MessagePanelProps = {
  selectedChannel: TChannel | null;
  mobScreen: boolean;
  setSelectedChannel: React.Dispatch<React.SetStateAction<TChannel>>;
  toggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  socket: Socket;
};

// const avaterPette = ['!bg-[#eeba6c] !dark:bg-[#a17e49]', '!bg-[#3772ff] !dark:bg-[#264fb2]', '!bg-[#0ed290] dark:!bg-[#08855b]'];

// const getAavaterColor = (index: number = 0) => {
//   return avaterPette[index % avaterPette.length];
// };

const MessagePanel = ({ selectedChannel, mobScreen, setSelectedChannel, toggleSidebar, isSidebarCollapsed, socket }: MessagePanelProps) => {
  const toastConfig = useContext(CustomToastContext);
  const [channelData, setChannelData] = useState<ChannelData>(null);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [threadDialogOpen, setThreadDialogOpen] = useState<{ open: boolean; message: Message }>({ open: false, message: null });
  const [themeColor] = useAppTheme();

  const fetchChannelData = useCallback(async () => {
    try {
      const { data } = await axiosInstance().get(`work-space/channel/${selectedChannel._id}`);
      setChannelData(data?.data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  }, [selectedChannel, toastConfig]);

  useEffect(() => {
    if (selectedChannel) {
      fetchChannelData();
    }
    return () => setChannelData(null);
  }, [selectedChannel, fetchChannelData]);

  return (
    <>
      <div
        className={cn(
          'relative flex-grow transition-all duration-300 [--thread-bar-width:360px] lg:[--thread-bar-width:400px] xl:[--thread-bar-width:500px]',
          threadDialogOpen?.open && 'lg:pr-[calc(var(--thread-bar-width)_+_5px)]',
          isSidebarCollapsed && 'px-2'
        )}
      >
        {isSidebarCollapsed && (
          <div className="absolute left-4 top-[7px] z-10 bg-[var(--dark-primary,white)]">
            <HtmlTooltip title="Show sidebar">
              <IconButton size={'small'} style={{ minWidth: 32, minHeight: 32 }} onClick={toggleSidebar}>
                <VscLayoutSidebarLeft />
              </IconButton>
            </HtmlTooltip>
          </div>
        )}
        {selectedChannel && (
          <div className="flex h-[var(--h)] flex-col">
            <div className={cn('p-[7px_15px] [border-bottom:1px_solid_var(--common-border-color)]')}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <h5 className={cn('line-clamp-1 text-[18px] font-bold transition-all', isSidebarCollapsed && 'pl-[30px] ')}>
                  {selectedChannel.title}
                </h5>

                <HtmlTooltip
                  title={
                    <span className="block w-[200px] py-2 text-center">
                      <span className="mx-auto block max-w-[150px] pb-2 text-sm font-semibold">View all members of this channel</span>
                      {channelData && (
                        <span className="block  text-[12px] text-gray-400">
                          {[...channelData.members]
                            .slice(0, 3)
                            .map((d) => d.optionLabel)
                            .join(', ')}
                        </span>
                      )}
                    </span>
                  }
                >
                  <IconButton
                    size={'small'}
                    style={{ border: '', borderRadius: 8, padding: '0px', minHeight: 30, minWidth: 55 }}
                    onClick={() => setIsMemberDialogOpen(true)}
                  >
                    <span className="flex flex-row-reverse">
                      {channelData?.members ? (
                        channelData?.members.map((d, i) => {
                          if (i > 2) return null;
                          return (
                            <Avatar
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 999,
                                fontSize: 11,
                                marginRight: i !== 0 ? '-10px' : '5px',
                                outline: '1px solid var(--common-border-color)',
                                color: 'white',
                                ...getAvatarColor(d?.optionLabel || '', themeColor)
                              }}
                              variant="rounded"
                              className={cn('my-[2px] uppercase')}
                              src={d.avatar}
                            >
                              {d?.optionLabel.match(/(\b\S)?/g).join('')}
                            </Avatar>
                          );
                        })
                      ) : (
                        <div className={cn(' h-[28px] w-[28px] animate-pulse rounded-full bg-gray-400 dark:bg-gray-500')}></div>
                      )}
                    </span>
                    {channelData?.members.length - 3 > 0 ? (
                      <span className="-ml-[15px] h-[28px] w-[28px] rounded-full bg-[#F0F0F0] text-center text-[11px] leading-[28px] text-[#777575] [outline:1px_solid_#777575] dark:bg-gray-500 dark:text-gray-200 dark:[outline:1px_solid_var(--common-border-color)]">
                        +{channelData?.members.length - 3}
                      </span>
                    ) : null}
                  </IconButton>
                </HtmlTooltip>
              </div>
              <p className="line-clamp-2 text-sm text-gray-500">{selectedChannel.description}</p>
            </div>

            <Messages
              channelId={selectedChannel?._id}
              socket={socket}
              threadDialogOpen={threadDialogOpen}
              setThreadDialogOpen={setThreadDialogOpen}
              channelData={channelData}
            />
          </div>
        )}
      </div>
      {isMemberDialogOpen && (
        <ViewMembers
          open={isMemberDialogOpen}
          channelData={channelData}
          fetchChannelData={fetchChannelData}
          selectedChannel={selectedChannel}
          handleClose={() => setIsMemberDialogOpen(false)}
        />
      )}
    </>
  );
};

export default MessagePanel;
