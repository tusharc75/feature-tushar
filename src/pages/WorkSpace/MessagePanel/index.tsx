import { Avatar, Chip, IconButton } from '@mui/material';
import { useCallback, useContext, useEffect, useState } from 'react';
import { VscLayoutSidebarLeft } from 'react-icons/vsc';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { useAppTheme } from 'src/constants/AppConfig';
import { cn } from 'src/constants/helpers';
import Messages from 'src/pages/WorkSpace/MessagePanel/Messages';
import ViewMembers from 'src/pages/WorkSpace/MessagePanel/ViewMembers';
import { ChannelData, Message } from 'src/pages/WorkSpace/types';
import { UseWorkSpace } from 'src/pages/WorkSpace/useWorkSpace';
import { getAvatarColor } from 'src/pages/WorkSpace/utils';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const MessagePanel = ({ state }: { state: UseWorkSpace }) => {
  const { selectedChannel, isSidebarCollapsed, newChatToUser, toggleSidebar } = state;
  const toastConfig = useContext(CustomToastContext);
  const [channelData, setChannelData] = useState<ChannelData>(null);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [threadDialogOpen, setThreadDialogOpen] = useState<{ open: boolean; message: Message }>({ open: false, message: null });
  const [themeColor] = useAppTheme();
  const [msgType, setMsgType] = useState<'messages' | 'pins'>('messages');

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
        {selectedChannel || newChatToUser ? (
          <div className="flex h-[var(--h)] flex-col">
            <div className={cn('p-[7px_15px] [border-bottom:1px_solid_var(--common-border-color)]')}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <h5 className={cn('line-clamp-1 text-[18px] font-bold transition-all', isSidebarCollapsed && 'pl-[30px] ')}>
                  {newChatToUser ? newChatToUser.concatedName : selectedChannel?.title}
                </h5>
                {!newChatToUser && (
                  <HtmlTooltip title={'View all members'}>
                    <IconButton
                      size={'small'}
                      style={{ border: '', borderRadius: 8, padding: '0px', minHeight: 30, minWidth: 55 }}
                      onClick={() => setIsMemberDialogOpen(true)}
                    >
                      <span className="flex flex-row-reverse">
                        {channelData?.members ? (
                          channelData?.members?.map((d, i) => {
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
                                {d?.optionLabel?.match(/(\b\S)?/g).join('')}
                              </Avatar>
                            );
                          })
                        ) : (
                          <div className={cn(' h-[28px] w-[28px] animate-pulse rounded-full bg-gray-400 dark:bg-gray-500')}></div>
                        )}
                      </span>
                      {channelData?.members?.length - 3 > 0 ? (
                        <span className="-ml-[15px] h-[28px] w-[28px] rounded-full bg-[#F0F0F0] text-center text-[11px] leading-[28px] text-[#777575] [outline:1px_solid_#777575] dark:bg-gray-500 dark:text-gray-200 dark:[outline:1px_solid_var(--common-border-color)]">
                          +{channelData?.members?.length - 3}
                        </span>
                      ) : null}
                    </IconButton>
                  </HtmlTooltip>
                )}
              </div>
              <p className="line-clamp-2 text-sm text-gray-500">{selectedChannel ? selectedChannel?.description : 'Direct Messaging'}</p>
              <div className="flex gap-2 p-2">
                <Chip label="Messages" clickable color={msgType === 'messages' ? 'primary' : 'default'} onClick={() => setMsgType('messages')} />
                <Chip label="Pins" clickable color={msgType === 'pins' ? 'primary' : 'default'} onClick={() => setMsgType('pins')} />
              </div>
            </div>

            <Messages
              state={state}
              channelId={selectedChannel?._id}
              threadDialogOpen={threadDialogOpen}
              setThreadDialogOpen={setThreadDialogOpen}
              channelData={channelData}
              type={msgType}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500">Select a channel to start conversation</p>
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
