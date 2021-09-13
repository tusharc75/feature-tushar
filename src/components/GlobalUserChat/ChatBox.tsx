import { useEffect, useState, useContext } from 'react'
import {Box, IconButton, Typography} from '@material-ui/core'
import { SendOutlined } from '@material-ui/icons';
import moment from 'moment'

import axiosInstance from '../../axios/axiosInstance';
import { GlobalChatContext } from '../../StateProvider/GlobalChatContext';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import styles from "./Chat.module.scss";

const ChatBox = (props) => {
    const {setToastConfig} = useContext(CustomToastContext)
    const {selectedChat, socket} = useContext(GlobalChatContext)
    const [messageValue, setMessageValue] = useState("");
    const [messages, setMessages] = useState([]);
    const [currentUser, setCurrentUser] = useState("")
    const [isMsgSending, setIsMsgSending] = useState(false)
    const [chatUsers, setChatUsers] = useState([]);

    useEffect(() => {
        if (socket !== null) {
            socket.on("data", (data: any) => {
                if (selectedChat.id === data.chatterId) {
                    setMessages([data, ...messages])
                }
            })
        }
    }, [socket, messages])

    useEffect(() => {
        if (selectedChat) {
            getChatterInfo()
            setChatUsers(selectedChat.users)
        }
    }, [selectedChat])

    const getChatterInfo = () => {
        if (selectedChat) {
            axiosInstance()
                .get(`/chatter/${selectedChat.id}`)
                .then(({ data: { data } }) => {
                    setMessages(data.Messages)
                    setCurrentUser(data.currentUser)
                })
                .catch(() => {

                 })
        }
    }

    const sendMessage = async (e) => {
        e.preventDefault()
        setMessageValue("")
        setIsMsgSending(true)
        try {
            const {data} =  await axiosInstance()
                .put(`/chatter/${selectedChat.id}`, { message: messageValue });
            
            if (data) {
                setIsMsgSending(false)
            }
            
        } catch (err) {
            setIsMsgSending(false)
            setToastConfig(err)
        }
       
    };

    const formatTime = (time) => moment(time).fromNow(true);

    const user = (data) => chatUsers.find(_d => _d?._id === data.userid)

    return (
        <div className="global-chatbox">
            {
                selectedChat.chatTitle === "eQuip-t User" &&
                <div className="not-found">
                  <p>Account Deleted</p>
                </div>
            }
            <div className="chatbox-container">
                {messages && messages.map((data, i) => (
                    <div key={i} className={`message-container ${data.userid === currentUser ? "my-message" : ""}`}>

                        <div
                            title={moment(data.date).format("DD, MMM YYYY")}
                            className={`message-outlet ${data.userid === currentUser ? "my-color ml-4": "mr-4"}`}>
                            {selectedChat && chatUsers?.length > 2
                            ? <p className="username">
                                    {!user(data)
                                        ? "eQuip-t User"
                                        : user(data)?._id !== currentUser && user(data)?.firstName
                                    }
                            </p>
                            : null
                            }
                            <div className="msg-data">

                            <Typography className={styles.chat_box_text}>
                              {data.message}
                            </Typography>
                            <p className="message-time">
                                {formatTime(data.date)}
                            </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            
            <form onSubmit={sendMessage} className="chatbox-input">
                <input
                    disabled={selectedChat.chatTitle==="eQuip-t User" || isMsgSending}
                    placeholder="Start Typing..."
                    value={messageValue}
                    onChange={(e) => setMessageValue(e.target.value)}
                />
                <Box mr={1}>
                <IconButton 
                    color="primary" 
                    disabled={!messageValue || selectedChat.chatTitle==="eQuip-t User" || isMsgSending} 
                    type="submit"
                    size="small"
                    >
                    <SendOutlined/>
                </IconButton>
                </Box>
            </form>
        </div>
    )
}

export default ChatBox
