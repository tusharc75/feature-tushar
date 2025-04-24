import { useMediaQuery } from '@mui/material';
import React, { useCallback, useEffect, useMemo } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { useSocket } from 'src/hooks/useSocket';
import { TChannel, TChat } from 'src/pages/WorkSpace/types';
import { useData } from 'src/StateProvider/Provider';
import { useLocation, useHistory } from 'react-router-dom';
import queryString from 'query-string';

type UseWorkSpaceActions =
  | { action: 'setIsSidebarCollapsed'; payload: UseWorkSpaceState['isSidebarCollapsed'] }
  | { action: 'setAllChannels'; payload: UseWorkSpaceState['allChannels'] }
  | { action: 'setSelectedChannel'; payload: UseWorkSpaceState['selectedChannel'] }
  | { action: 'setEditCreateChannelDialogData'; payload: UseWorkSpaceState['editCreateChannelDialogData'] }
  | { action: 'setNewDirectMessageChannelId'; payload: UseWorkSpaceState['newDirectMessageChannelId'] }
  | { action: 'setCurrentDeletingChannelId'; payload: UseWorkSpaceState['currentDeletingChannelId'] }
  | { action: 'setSelectedResource'; payload: UseWorkSpaceState['selectedResource'] };

type UseWorkSpaceState = {
  allChannels: TChannel[] | null;
  selectedChannel: Partial<TChat> | null;
  editCreateChannelDialogData: { open: boolean; _id: string | null };
  currentDeletingChannelId: string | null;
  isSidebarCollapsed: boolean;
  newDirectMessageChannelId: string | null;
  selectedResource: string | null;
};

const initialState: UseWorkSpaceState = {
  isSidebarCollapsed: false,
  allChannels: null,
  currentDeletingChannelId: null,
  editCreateChannelDialogData: { open: false, _id: null },
  selectedChannel: null,
  newDirectMessageChannelId: null,
  selectedResource: null
};

const reducer = (state: UseWorkSpaceState, action: UseWorkSpaceActions) => {
  switch (action.action) {
    case 'setIsSidebarCollapsed':
      return { ...state, isSidebarCollapsed: action.payload };
    case 'setAllChannels':
      return { ...state, allChannels: action.payload };
    case 'setSelectedChannel':
      return { ...state, selectedChannel: action.payload };
    case 'setEditCreateChannelDialogData':
      return { ...state, editCreateChannelDialogData: action.payload };
    case 'setCurrentDeletingChannelId':
      return { ...state, currentDeletingChannelId: action.payload };
    case 'setNewDirectMessageChannelId':
      return { ...state, newDirectMessageChannelId: action.payload };
    case 'setSelectedResource':
      return { ...state, selectedResource: action.payload };
    default:
      return state;
  }
};

type WorkSpaceProps = {
  title?: string | null;
};

export const useWorkSpace = ({ title = '' }: WorkSpaceProps = {}) => {
  const location = useLocation();
  const parsedParams = queryString.parse(location.search);
  const history = useHistory();
  const {
    state: {
      user: { user },
      permissions,
      resources
    }
  } = useData();
  const mobScreen = useMediaQuery('(max-width:768px)');
  const [state, setState] = React.useReducer(reducer, initialState);
  const socket = useSocket({ namespace: '/workspace/channel' });

  const toggleSidebar = useCallback(() => {
    setState({ action: 'setIsSidebarCollapsed', payload: !state.isSidebarCollapsed });
  }, [state.isSidebarCollapsed]);
  const setAllChannels = useCallback((payload: UseWorkSpaceState['allChannels']) => {
    setState({ action: 'setAllChannels', payload });
  }, []);

  const setSelectedChannel = useCallback(
    (payload: UseWorkSpaceState['selectedChannel'], allChannels = state.allChannels) => {
      if (payload) {
        const newAllChannels = allChannels.map((d) => {
          if (d._id === payload._id) {
            return { ...d, notifications: 0 };
          } else {
            return d;
          }
        });

        setState({ action: 'setAllChannels', payload: newAllChannels });
      }
      history.push(`?channel=${payload.title}`);
      setState({ action: 'setSelectedChannel', payload });
    },
    [state.allChannels]
  );

  const setEditCreateChannelDialogData = useCallback((payload: UseWorkSpaceState['editCreateChannelDialogData']) => {
    setState({ action: 'setEditCreateChannelDialogData', payload });
  }, []);
  const setCurrentDeletingChannelId = useCallback((payload: UseWorkSpaceState['currentDeletingChannelId']) => {
    setState({ action: 'setCurrentDeletingChannelId', payload });
  }, []);
  const setNewDirectMessageChannelId = useCallback((payload: UseWorkSpaceState['newDirectMessageChannelId']) => {
    setState({ action: 'setNewDirectMessageChannelId', payload });
  }, []);
  const setSelectedResource = useCallback((payload: UseWorkSpaceState['selectedResource']) => {
    setState({ action: 'setSelectedResource', payload });
  }, []);

  const channels = useMemo(() => {
    return state.allChannels?.filter((a) => a.type !== 'chat');
  }, [state.allChannels]);

  const initChat = useCallback(
    (data: Partial<TChat>) => {
      setSelectedChannel(data);
    },
    [setSelectedChannel]
  );

  const fetchChannelsAndChats = async (setActiveChannel = false, newDirectMessageChannelId = state.newDirectMessageChannelId) => {
    let api = '/work-space/channel';
    if (state.selectedResource) {
      api = `${api}?resource=${state.selectedResource}`;
    }
    const {
      data: { data }
    } = await axiosInstance().get(api);

    setAllChannels(data);
    if (title) {
      const channel = data?.find((channel) => channel?.title === title);
      setSelectedChannel(channel, data);
    } else if (setActiveChannel) {
      const queryParam = new URLSearchParams(window.location.search);
      const channelId = newDirectMessageChannelId || state.selectedChannel._id || queryParam.get('channelId');
      if (channelId) {
        const channel = data?.find((channel) => channel?._id === channelId);
        setSelectedChannel(channel, data);
      }
      setState({ action: 'setNewDirectMessageChannelId', payload: null });
    }
  };

  useEffect(() => {
    fetchChannelsAndChats();
  }, [state.selectedResource]);

  useEffect(() => {
    if (socket) {
      socket.emit('joinChannel', 'directMessaging');
    }
    return () => {
      if (socket) {
        socket.emit('leaveChannel', 'directMessaging');
      }
    };
  }, [socket]);

  useEffect(() => {
    socket?.on('notification', (channel, userId) => {
      if (user?._id !== userId && state.selectedChannel?._id !== channel) {
        const updatedChannels = [...state.allChannels];
        const index = updatedChannels.findIndex((c) => c._id === channel);
        if (index !== -1) {
          const updatedChannel = {
            ...updatedChannels[index],
            notifications: (updatedChannels[index]?.notifications || 0) + 1
          };
          updatedChannels[index] = updatedChannel;
        }
        setAllChannels(updatedChannels);
      }
    });
    return () => {
      socket?.off('notification');
    };
  }, [setAllChannels, socket, state.allChannels, state.selectedChannel?._id, user?._id]);

  useEffect(() => {
    if (socket) {
      state.allChannels?.forEach((channel) => {
        socket.emit('joinChannel', channel?._id);
      });
    }
    return () => {
      if (socket) {
        state.allChannels?.forEach((channel) => {
          socket.emit('leaveChannel', channel?._id);
        });
      }
    };
  }, [socket, state.allChannels]);

  useEffect(() => {
    socket?.on('refreshChannels', () => {
      setTimeout(() => {
        fetchChannelsAndChats(true, state.newDirectMessageChannelId);
      }, 100);
    });
    return () => {
      socket?.off('refreshChannels');
    };
  }, [socket, state.newDirectMessageChannelId]);

  useEffect(() => {
    if (parsedParams.channel && !state.selectedChannel) {
      const channelData = state.allChannels?.find((c) => c.title === parsedParams.channel);
      if (channelData) {
        initChat(channelData);
      }
    }
  }, [parsedParams.channel, state.allChannels, state.selectedChannel]);

  const handleDeleteChannels = useCallback(async (channelIds: string[]) => {
    await axiosInstance().delete('/work-space/channel', { data: { _ids: channelIds } });
    fetchChannelsAndChats();
  }, []);

  return {
    ...state,
    mobScreen,
    user,
    resources,
    socket,
    channels,
    setNewDirectMessageChannelId,
    setAllChannels,
    fetchChannelsAndChats,
    toggleSidebar,
    handleDeleteChannels,
    initChat,
    setSelectedChannel,
    setEditCreateChannelDialogData,
    setCurrentDeletingChannelId,
    setState,
    setSelectedResource,
    permissions
  };
};

export type UseWorkSpace = ReturnType<typeof useWorkSpace>;
