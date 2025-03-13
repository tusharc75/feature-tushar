import { createContext, useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import { backendApi } from '../../config';
import { useSocket } from 'src/hooks/useSocket';

export const GlobalChatContext = createContext(null);

// This context provider is passed to any component requiring the context
export const GlobalChatProvider = ({ children }) => {
  const [chatList, setChatList] = useState([]);
  const [chatterIds, setChatterIds] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [open, setOpen] = useState(false);
  const usersSocket = useSocket({namespace:"/users/room"})

  return (
    <GlobalChatContext.Provider
      value={{
        chatList,
        setChatList,
        chatterIds,
        setChatterIds,
        socket:usersSocket,
        selectedChat,
        setSelectedChat,
        open,
        setOpen
      }}
    >
      {children}
    </GlobalChatContext.Provider>
  );
};
