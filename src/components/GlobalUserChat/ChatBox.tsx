import { useEffect, useState, useContext } from 'react'
import {Box, IconButton, Typography} from '@material-ui/core'
import { SendOutlined } from '@material-ui/icons';
import axiosInstance from '../../axios/axiosInstance';
import { GlobalChatContext } from '../../StateProvider/GlobalChatContext';

const ChatBox = () => {
    const {selectedChat, messages, currentUser} = useContext(GlobalChatContext)
    const [messageValue, setMessageValue] = useState("");

    const sendMessage = async (e) => {
        e.preventDefault()
        try {
            await axiosInstance()
                .put(`/chatter/${selectedChat.id}`, { message: messageValue });
            setMessageValue("")
        } catch (err) {
           
        }
    };

    const formatTime = (time) => new Date(time).toTimeString().split(":");


    return (
        <div className="global-chatbox">
            <div className="chatbox-container">
                {messages.map((data, i) => (
                    <div key={i} className={`message-container ${data.userid === currentUser ? "my-message": ""}`}>
                        <div
                            className={`message-outlet ${data.userid === currentUser ? "my-color": ""}`}>
                        <Typography>
                            {data.message}
                        </Typography>
                            <p className="message-time">
                                {`${formatTime(data.date)[0]}:${formatTime(data.date)[1]}`}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            
            <form onSubmit={sendMessage} className="chatbox-input">
                <input
                    placeholder="Start Typing..."
                    value={messageValue}
                    onChange={(e) => setMessageValue(e.target.value)}
                />
                <Box mr={1}>
                <IconButton color="primary" disabled={!messageValue} type="submit" size="small">
                    <SendOutlined/>
                </IconButton>
                </Box>
            </form>
        </div>
    )
}

export default ChatBox
