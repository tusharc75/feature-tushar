import { Avatar, Chip, IconButton } from '@mui/material';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
import { Link } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import { Groups } from '@mui/icons-material';

const MessagePanel = ({
  state,
  resource = null,
  resourceLabel = null,
  resourceData = null,
  fromSidebar = false
}: {
  state: UseWorkSpace;
  resource?: string | null;
  resourceLabel?: string | null;
  resourceData?: any | null;
  fromSidebar?: boolean;
}) => {
  const { selectedChannel, isSidebarCollapsed, toggleSidebar } = state;
  const toastConfig = useContext(CustomToastContext);
  const [channelData, setChannelData] = useState<ChannelData>(null);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [threadDialogOpen, setThreadDialogOpen] = useState<{ open: boolean; message: Message }>({ open: false, message: null });

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

  const resourceDataMemo = useMemo(() => {
    if (!resourceData) return null;
    const members: any = [];
    if (resourceData?.owner?.optionValue) {
      members.push(resourceData?.owner?.optionValue);
    }
    if (resourceData?.collaborator?.length) {
      resourceData?.collaborator?.map((c) => {
        members.push(c?.optionValue);
      });
    }
    return {
      members: members,
      title: resourceLabel,
      resource: resource
    };
  }, [resource, resourceData, resourceLabel]);

  return (
    <>
      <div
        className={cn(
          'relative flex-grow transition-all duration-300 [--thread-bar-width:360px] lg:[--thread-bar-width:400px] xl:[--thread-bar-width:500px]',
          threadDialogOpen?.open && 'lg:pr-[calc(var(--thread-bar-width)_+_5px)]',
          isSidebarCollapsed && 'px-2',
          fromSidebar ? 'rounded-md border ' : ''
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
        {selectedChannel || resource ? (
          <div className="flex h-[var(--h)] flex-col">
            <MessageHeader
              channelData={channelData}
              msgType={msgType}
              setIsMemberDialogOpen={setIsMemberDialogOpen}
              setMsgType={setMsgType}
              state={state}
              fromSidebar={fromSidebar}
              resource={resource}
              resourceLabel={resourceLabel}
            />

            <Messages
              fromSidebar={fromSidebar}
              state={state}
              channelId={selectedChannel ? selectedChannel?._id : null}
              threadDialogOpen={threadDialogOpen}
              setThreadDialogOpen={setThreadDialogOpen}
              channelData={channelData}
              type={msgType}
              resourceData={selectedChannel ? null : resourceDataMemo}
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

const MessageHeader = ({
  state,
  fromSidebar,
  resource,
  resourceLabel,
  setIsMemberDialogOpen,
  channelData,
  msgType,
  setMsgType
}: {
  state: UseWorkSpace;
  resource?: string | null;
  resourceLabel?: string | null;
  fromSidebar?: boolean;
  setIsMemberDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  channelData: ChannelData;
  msgType: 'messages' | 'pins';
  setMsgType: React.Dispatch<React.SetStateAction<'messages' | 'pins'>>;
}) => {
  const [themeColor] = useAppTheme();
  const { selectedChannel, isSidebarCollapsed, permissions, resources } = state;

  return (
    <div className={cn(' [border-bottom:1px_solid_var(--common-border-color)]', fromSidebar ? 'p-[8px]' : 'p-[7px_15px]')}>
      <div className="mb-1 flex items-center justify-between gap-2">
        {!fromSidebar && (
          <h5 className={cn('line-clamp-1 text-[18px] font-bold transition-all', isSidebarCollapsed && 'pl-[30px] ')}>
            {resource && resourceLabel ? resourceLabel : selectedChannel?.title}
          </h5>
        )}

        {selectedChannel && (
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
        {fromSidebar && (
          <>
            {permissions?.['workSpace']?.isRead && (
              <Link to={`${routes.workSpace.path}?channel=${resourceLabel}`} className="ml-auto">
                <HtmlTooltip title={`View in ${resources?.workSpace?.titlePlural}`}>
                  <IconButton size="small" color="primary">
                    <Groups fontSize="small" />
                  </IconButton>
                </HtmlTooltip>
              </Link>
            )}
          </>
        )}
      </div>
      {!fromSidebar && (
        <>
          <p className="line-clamp-2 text-sm text-gray-500">{selectedChannel ? selectedChannel?.description : 'Direct Messaging'}</p>
          <div className="flex gap-2 p-2">
            <Chip label="Messages" clickable color={msgType === 'messages' ? 'primary' : 'default'} onClick={() => setMsgType('messages')} />
            <Chip label="Pins" clickable color={msgType === 'pins' ? 'primary' : 'default'} onClick={() => setMsgType('pins')} />
          </div>
        </>
      )}
    </div>
  );
};
