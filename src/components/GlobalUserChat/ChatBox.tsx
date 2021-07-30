import { useEffect, useMemo, useState } from 'react'
import {Box, IconButton, Typography} from '@material-ui/core'
import { SendOutlined } from '@material-ui/icons';
import axiosInstance from '../../axios/axiosInstance';

const ChatBox = ({ selectedChat, sendMessage, socket }) => {
    const [messageValue, setMessageValue] = useState("");
    const [currentUser, setCurrentUser] = useState("")
    const [messages, setMessages] = useState([]);

    const getMessages = useMemo(() => {
        
    },[])

    useEffect(() => {
      getChatterInfo()
    }, [selectedChat])
    
    useEffect(() => {
       if (socket !== null) {
           socket.on("data", (data) => {
               //alert(JSON.stringify(data))
               getChatterInfo()
           })
           
           return () => {
               socket.off("data")
           }
       }
    }, [socket])

    const sendMsg = (e) => {
        e.preventDefault()
        sendMessage(selectedChat.id, messageValue)
        setMessageValue("")
    }

    const getChatterInfo = () => {
        axiosInstance().get(`/chatter/${selectedChat.id}`)
            .then(({ data: {data} }) => {
                setMessages(data.Messages)
                setCurrentUser(data.currentUser)
        })
        .catch(() => {})
    }




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
                        </div>
                    </div>
                ))}
            </div>

            
            <form onSubmit={sendMsg} className="chatbox-input">
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
