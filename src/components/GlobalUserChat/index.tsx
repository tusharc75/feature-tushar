import React, { useState, useContext, useCallback, useEffect, useRef } from 'react';
import { Badge, Fab } from '@mui/material';
import { Chat, Clear, Close } from '@mui/icons-material';

import ChatsPopover from './ChatsPopover';
import { useData } from '../../StateProvider/Provider';
import { GlobalChatContext } from '../../StateProvider/GlobalChatContext';
import axiosInstance from '../../axios/axiosInstance';
import { SET_CHATTER } from '../../StateProvider/actionTypes';
import './chatStyles.scss';
import { RiCloseLine } from 'react-icons/ri';
import { IoCloseSharp } from 'react-icons/io5';

const GlobalUserChat = () => {
  const {
    state: { user, chatter },
    dispatch
  } = useData();
  const { socket, chatterIds, setChatList, setChatterIds, selectedChat, setSelectedChat, open, setOpen } = useContext(GlobalChatContext);
  const [unseen, setUnseen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLSpanElement>();

  useEffect(() => {
    if (!socket) return;
    socket.on('data', () => {
      getChats();
    });
  }, [socket]);

  useEffect(() => {
    if (!open) return;
    buttonRef.current.click();
  }, [open]);

  const getUserAvatar = (data) => {
    let avatar = '';
    for (const user of data.users) {
      const userName = `${user.firstName} ${user.lastName}`;
      if (userName === data.chatTitle) {
        avatar = user.avatar || '';
      }
    }
    return avatar;
  };

  const assignAvatar = (chats) => {
    const newNotifications = [...chats];
    for (const notification of newNotifications) {
      notification.avatar = getUserAvatar(notification);
    }
    return newNotifications;
  };

  const getChats = useCallback(() => {
    axiosInstance()
      .get('/chatter/user-to-user/my?orderBy=desc&sortBy=message.date&limit=100')
      .then(({ data: { data } }) => {
        let newData = [];
        data.forEach((d: any) => {
          const obj = {
            id: d.id,
            chatTitle:
              d.group && d.group !== ''
                ? d.group
                : d.users
                    .filter((d) => d._id !== user?.user?._id)
                    .map((_d) => `${_d.firstName} ${_d.lastName}`)
                    .join(', '),
            message: d?.message,
            timeStamp: new Date(d?.message.date).getTime(),
            ...d
          };
          newData.push(obj);
        });

        const yetUnseen = data?.filter((d) => d.unseen > 0).length > 0 ? true : false;
        setUnseen(yetUnseen);
        newData = assignAvatar(newData);
        setChatList(newData);
        setChatterIds(data.map((d) => d.id));
        if (chatter) {
          dispatch({ type: SET_CHATTER, payload: null });
        }
      })
      .catch(() => {});
  }, [chatter, selectedChat]);

  useEffect(() => {
    getChats();
  }, [getChats]);

  const joinRooms = () => {
    if (chatterIds.length && socket !== null) {
      chatterIds.forEach((chatterId) => {
        socket.emit('join', chatterId);
      });
    }
  };

  useEffect(() => {
    joinRooms();
  }, [chatterIds, socket]);

  const closeChat = () => {
    setSelectedChat(null);
    setAnchorEl(null);
    setOpen(false);
  };

  return (
    <div className={`global-chat ${open ? 'chat-open' : ''}`}>
      <span
        onClick={(e) => {
          if (Boolean(anchorEl)) {
            closeChat();
          } else {
            setAnchorEl(e.currentTarget);
          }
        }}
        role="button"
        className={`chat-close-button ${open ? 'chat-open' : ''}`}
        ref={buttonRef}
        id={open ? 'chats-popover' : undefined}
        color="primary"
        aria-label="Chats"
      >
        <span className=" sr-only">close chat</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 28 28">
          <path stroke="currentcolor" strokeLinecap="round" strokeWidth="4" d="M22 21L7 6m15 0L7 21"></path>
        </svg>
      </span>

      {open && Boolean(anchorEl) && <ChatsPopover open={open} anchorEl={anchorEl} onClose={closeChat} getChats={getChats} />}
    </div>
  );
};

export default GlobalUserChat;
