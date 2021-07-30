import  { createContext, useState, useEffect,  } from "react";
import io, { Socket } from "socket.io-client";
import { backendApi } from "../../config";

export const GlobalChatContext = createContext(null);

// This context provider is passed to any component requiring the context
export const GlobalChatProvider = ({ children }) => {

    const [chatList, setChatList] = useState([]);
    const [chatterIds, setChatterIds] = useState([])
    const [messages, setMessages] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null)
    const [socket, setSocket] = useState<Socket>(null);
        const [currentUser, setCurrentUser] = useState("")


     useEffect(() => {
        const token = localStorage.getItem("token");
        const s = io(`${backendApi}/users/room`, {
        auth: {token},
        reconnectionAttempts:5,
        reconnectionDelay:5000,
        transports: ['websocket',"pooling"]
        });
        setSocket(s);
     }, []);


    return (
        <GlobalChatContext.Provider
            value={{
                chatList,
                setChatList,
                chatterIds,
                setChatterIds,
                socket,
                selectedChat,
                setSelectedChat,
                messages,
                setMessages,
                currentUser, setCurrentUser
            }}
        >
            {children}
        </GlobalChatContext.Provider>
    );
};