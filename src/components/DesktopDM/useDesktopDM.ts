import axios, { CancelToken } from 'axios';
import { useCallback, useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { Chat, User } from 'src/components/DesktopDM/types';
import useUIDesktopDm from 'src/components/DesktopDM/useUIDesktopDm';
import { useSocket } from 'src/hooks/useSocket';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

function checkIsUser(data: User | Chat): data is User {
  return (data as User).firstName !== undefined && (data as User).lastName !== undefined;
}

const useDesktopDM = () => {
  const uiState = useUIDesktopDm();
  const { onUserFirstMessageSent: uiOnUserFirstMessageSent, permissions, user, ...rest } = uiState;
  const [state, setState] = useState<{ users: User[]; chats: Chat[] }>({ users: [], chats: [] });
  const [loading, setLoading] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const socket = useSocket({ namespace: '/workspace/channel' });

  const fetchData = useCallback(
    async ({ cancelToken, onSuccess = () => {} }: { cancelToken?: CancelToken; onSuccess?: () => void }) => {
      if (uiState.isMobile || uiState.isMobileDevice) return;
      try {
        setLoading(true);
        const {
          data: { data }
        } = await axiosInstance().get('/work-space/channel/chats', { cancelToken });
        const chats: any = [];
        for (const d of data?.chats) {
          d.notifications = d.notifications || 0;
          const toUser = d?.members?.find((m) => m?.optionValue !== user?._id);
          if (toUser) {
            d.title = toUser?.optionLabel;
            d.to = toUser;
          }
          chats.push(d);
        }
        setState({ chats, users: data.users });
        onSuccess();
      } catch (error) {
        toastConfig.setToastConfig(error);
      } finally {
        setLoading(false);
      }
    },
    [toastConfig, uiState.isMobile, uiState.isMobileDevice, user?._id]
  );

  useEffect(() => {
    const tokenSource = axios.CancelToken.source();
    fetchData({ cancelToken: tokenSource.token });
    return () => {
      tokenSource.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiState.isMobile, uiState.isMobileDevice]);

  const onUserFirstMessageSent = useCallback(
    ({ userId, channelId }: { userId: string; channelId: string }) => {
      fetchData({ onSuccess: () => setTimeout(() => uiOnUserFirstMessageSent({ userId, channelId }), 100) });
    },
    [fetchData, uiOnUserFirstMessageSent]
  );

  const addNotifications = useCallback(
    (channelId, userId) => {
      const opennedChatBoxes = uiState.openedChats.filter((d) => d.type === 'chat' && d.open === 'fullyOpen').map((d) => d.id);
      if (user?._id !== userId && !opennedChatBoxes.includes(channelId)) {
        setState((prev) => {
          const newData = { ...prev };
          const newChats: Chat[] = newData.chats.map((chat) => {
            if (chat._id === channelId) {
              return {
                ...chat,
                notifications: chat.notifications + 1
              } as Chat;
            }
            return chat;
          });
          newData.chats = newChats;
          return newData;
        });
      }
    },
    [uiState.openedChats]
  );

  const readMessage = useCallback(async (channelId: string) => {
    await axiosInstance().put('/work-space/channel/message/read', { channelId });
    setState((prev) => {
      const newData = { ...prev };
      const newChats: Chat[] = newData.chats.map((chat) => {
        if (chat._id === channelId) {
          return {
            ...chat,
            notifications: 0
          } as Chat;
        }
        return chat;
      });
      newData.chats = newChats;
      return newData;
    });
  }, []);

  // new work space or new channel
  useEffect(() => {
    let tokenSource = axios.CancelToken.source();
    socket?.on('newWorkSpaceChannel', () => {
      tokenSource = axios.CancelToken.source();
      fetchData({ cancelToken: tokenSource.token });
    });
    socket?.on('newMessage', ({ channelId }) => {
      addNotifications(channelId, null);
    });
    return () => {
      // socket?.off('notification');
      socket?.off('newMessage');
      socket?.off('newWorkSpaceChannel');
      tokenSource?.cancel();
    };
  }, [socket, uiState.openedChats, user?._id]);

  return { ...state, loading, toastConfig, user, socket, onUserFirstMessageSent, readMessage, checkIsUser, permissions, ...rest };
};

export default useDesktopDM;
