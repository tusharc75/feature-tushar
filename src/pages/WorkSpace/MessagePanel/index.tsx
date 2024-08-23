import { Avatar, IconButton } from '@material-ui/core';
import { ArrowBack } from '@material-ui/icons';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { backendApi } from 'src/config';
import { cn } from 'src/constants/helpers';
import Messages from 'src/pages/WorkSpace/MessagePanel/Messages';
import ViewMembers from 'src/pages/WorkSpace/MessagePanel/ViewMembers';
import { ChannelData, Message, TChannel } from 'src/pages/WorkSpace/types';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

type MessagePanelProps = {
  selectedChannel: TChannel | null;
  mobScreen: boolean;
  setSelectedChannel: React.Dispatch<React.SetStateAction<TChannel>>;
};

const MessagePanel = ({ selectedChannel, mobScreen, setSelectedChannel }: MessagePanelProps) => {
  const toastConfig = useContext(CustomToastContext);
  const [channelData, setChannelData] = useState<ChannelData>(null);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [socket, setSocket] = useState<Socket>(null);
  const [threadDialogOpen, setThreadDialogOpen] = useState<{ open: boolean; message: Message }>({ open: false, message: null });

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    const s = io(`${backendApi?.replace('/api', '')}/workspace/channel`, {
      path: backendApi?.includes('/api') ? '/api/socket.io/' : '/socket.io/',
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
      transports: ['websocket', 'pooling']
    });
    setSocket(s);
  }, [token]);

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
          threadDialogOpen?.open && 'lg:pr-[calc(var(--thread-bar-width)_+_5px)]'
        )}
      >
        {selectedChannel && channelData && (
          <div className="flex h-[var(--h)] flex-col">
            <div className={cn('p-[7px_15px] [border-bottom:1px_solid_var(--common-border-color)]')}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex min-h-[32px] items-center gap-2">
                  {mobScreen && (
                    <IconButton size={'small'} onClick={() => setSelectedChannel(null)}>
                      <ArrowBack />
                    </IconButton>
                  )}
                  <h5 className="line-clamp-1 text-[18px] font-bold">{selectedChannel.title}</h5>
                </div>
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
                    style={{ border: '1px solid var(--common-border-color)', borderRadius: 8, padding: '2px 5px' }}
                    onClick={() => setIsMemberDialogOpen(true)}
                  >
                    <span className="flex flex-row-reverse">
                      {channelData?.members.map((d, i) => {
                        if (i > 3) return null;
                        return (
                          <Avatar
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 'clamp(6px, min(22.222%, 12px), 12px)',
                              fontSize: 12,
                              marginRight: i !== 0 ? '-6px' : '5px',
                              outline: '2px solid var(--dark-primary,white)'
                            }}
                            variant="rounded"
                            className="my-[2px]"
                            src={d.avatar}
                          >
                            {d?.optionLabel.match(/(\b\S)?/g).join('')}
                          </Avatar>
                        );
                      })}
                    </span>
                    <span className="text-[13px] font-bold leading-[20px]">{channelData?.members.length}</span>
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
