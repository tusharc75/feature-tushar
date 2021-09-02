import React, { useState, useContext, useCallback, useEffect } from 'react';
import { Badge, Fab } from '@material-ui/core';
import { Chat, Clear } from '@material-ui/icons';

import ChatsPopover from './ChatsPopover';
import { useData } from '../../StateProvider/Provider';
import { GlobalChatContext } from '../../StateProvider/GlobalChatContext';
import axiosInstance from '../../axios/axiosInstance';
import { SET_CHATTER } from '../../StateProvider/actionTypes';
import './chatStyles.scss';

const GlobalUserChat = () => {
  const {
    state: { user, chatter },
    dispatch
  } = useData();
  const { socket, chatterIds, setChatList, setChatterIds, selectedChat } = useContext(GlobalChatContext);
  const [unseen, setUnseen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpenPopup = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
  };

  useEffect(() => {
    if (socket !== null) {
      socket.on('data', () => {
        getChats();
      });
    }
  }, [socket]);

  const getChats = useCallback(() => {
    axiosInstance()
      .get('/chatter/user-to-user/my?orderBy=desc&sortBy=message.date')
      .then(({ data: { data } }) => {
        let newData = [];
        data.forEach((d: any) => {
          const obj = {
            id: d.id,
            chatTitle: d.group && d.group !== '' ? d.group : d.users
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

  return ['local', 'development'].includes(process.env.REACT_APP_ENV) ? (
    <div className="global-chat">
      <Badge color="secondary" badgeContent=" " invisible={!unseen} variant="dot">
        <Fab id={open ? 'chats-popover' : undefined} onClick={handleOpenPopup} size="small" color="primary" aria-label="Chats">
          {!open ? <Chat /> : <Clear />}
        </Fab>
      </Badge>
      {open && <ChatsPopover open={open} anchorEl={anchorEl} setAnchorEl={setAnchorEl} getChats={getChats} />}
    </div>
  ) : (
    <div />
  );
};

export default GlobalUserChat;
