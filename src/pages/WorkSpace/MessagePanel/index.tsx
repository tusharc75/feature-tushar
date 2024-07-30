import { IconButton } from '@material-ui/core';
import { ArrowBack, Visibility } from '@material-ui/icons';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ViewMembers from 'src/pages/WorkSpace/MessagePanel/ViewMembers';
import { ChannelData, TChannel } from 'src/pages/WorkSpace/types';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import io, { Socket } from 'socket.io-client';
import { backendApi } from 'src/config';
import SendMessage from 'src/pages/WorkSpace/MessagePanel/SendMessage';
import Messages from 'src/pages/WorkSpace/MessagePanel/Messages';

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
      <div className="relative flex-grow">
        {selectedChannel && channelData && (
          <>
            <div className="head p-[7px_15px] [border-bottom:1px_solid_var(--common-border-color)]">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {mobScreen && (
                    <IconButton size={'small'} onClick={() => setSelectedChannel(null)}>
                      <ArrowBack />
                    </IconButton>
                  )}
                  <h5 className="text-[18px] font-bold">{selectedChannel.title}</h5>
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
                    <span className="flex items-center gap-2">
                      <Visibility fontSize="small" color="primary" /> {channelData?.members.length}
                    </span>
                  </IconButton>
                </HtmlTooltip>
              </div>
              <p className="text-sm text-gray-500">{selectedChannel.description}</p>
            </div>
            <div className="body my-2 max-h-[calc(100vh-430px)] overflow-y-auto">
              <Messages channelId={selectedChannel?._id} socket={socket} />
            </div>
          </>
        )}
        <div className="footer">
          <SendMessage channelId={selectedChannel?._id} socket={socket} />
        </div>
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
