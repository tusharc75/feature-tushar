import { useEffect, useState, useContext } from 'react'
import {Box, IconButton, Typography} from '@material-ui/core'
import { SendOutlined } from '@material-ui/icons';
import axiosInstance from '../../axios/axiosInstance';
import { GlobalChatContext } from '../../StateProvider/GlobalChatContext';

const ChatBox = (props) => {
    const {selectedChat, socket} = useContext(GlobalChatContext)
    const [messageValue, setMessageValue] = useState("");
    const [messages, setMessages] = useState([]);
    const [currentUser, setCurrentUser] = useState("")
    const [loading, setLoading] = useState(true)

     useEffect(() => {
         if (socket !== null) {
             socket.on("data", (data: any) => {
                 getChatterInfo()
             })

             return () => {

             }
         }
    }, [socket])

    useEffect(() => {
        getChatterInfo()
    }, [selectedChat])

    const getChatterInfo = () => {
        if (selectedChat) {
            axiosInstance()
                .get(`/chatter/${selectedChat.id}`)
                .then(({ data: { data } }) => {
                    setLoading(false)
                    setMessages(data.Messages)
                    setCurrentUser(data.currentUser)
                })
                .catch(() => { })
        }
    }

    const sendMessage = async (e) => {
        e.preventDefault()
        try {
            await axiosInstance()
            .put(`/chatter/${selectedChat.id}`, { message: messageValue });
        } catch (err) {
            
        }
        setMessageValue("")
    };

    const formatTime = (time) => new Date(time).toTimeString().split(":");


    return (
        <div className="global-chatbox">
            <div className="chatbox-container">
                {loading ? "" : messages.map((data, i) => (
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
