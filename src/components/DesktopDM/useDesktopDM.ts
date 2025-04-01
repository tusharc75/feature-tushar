import axios, { CancelToken } from 'axios';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { Chat, User } from 'src/components/DesktopDM/types';
import useUIDesktopDm from 'src/components/DesktopDM/useUIDesktopDm';
import { useSocket } from 'src/hooks/useSocket';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const useDesktopDM = () => {
  const uiState = useUIDesktopDm();
  const [state, setState] = useState<{ users: User[]; chats: Chat[] }>({ users: [], chats: [] });
  const [loading, setLoading] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const socket = useSocket({ namespace: '/workspace/channel' });

  const {
    state: {
      user: { user }
    }
  } = useData();

  useEffect(() => {
    const tokenSource = axios.CancelToken.source();
    const fetchData = async (cancelToken: CancelToken) => {
      if (uiState.isMobile || uiState.isMobileDevice) return;
      try {
        setLoading(true);
        const {
          data: { data }
        } = await axiosInstance().get('/work-space/channel/chats', { cancelToken });
        const chats: any = [];
        for (const d of data?.chats) {
          d.notifications = 0;
          const toUser = d?.members?.find((m) => m?.optionValue !== user?._id);
          if (toUser) {
            d.title = toUser?.optionLabel;
            d.to = toUser;
          }
          chats.push(d);
        }
        setState({ chats, users: data.users });
      } catch (error) {
        toastConfig.setToastConfig(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData(tokenSource.token);
    return () => {
      tokenSource.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiState.isMobile, uiState.isMobileDevice]);

  // notifications
  useEffect(() => {
    socket?.on('notification', (channel, userId) => {
      const opennedChatBoxes = uiState.openedChats.filter((d) => d.type === 'chat' && d.open === 'fullyOpen').map((d) => d.id);
      if (user?._id !== userId && !opennedChatBoxes.includes(channel)) {
        setState((prev) => {
          const newData = { ...prev };
          const newChats: Chat[] = newData.chats.map((chat) => {
            if (chat._id === channel) {
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
    });
    return () => {
      socket?.off('notification');
    };
  }, [socket, uiState.openedChats, user?._id]);

  return { ...uiState, ...state, loading, toastConfig, user, socket };
};

export default useDesktopDM;
