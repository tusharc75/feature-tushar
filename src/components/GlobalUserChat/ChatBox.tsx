import { Fragment, useState } from 'react'
import {Box, IconButton, Typography} from '@material-ui/core'
import { SendOutlined } from '@material-ui/icons';

const ChatBox = ({ selectedChat }) => {
    const [messageValue, setMessageValue] = useState("");
    const [messages, setMessages] = useState([
        {
            username: "Ali Connors",
            message: "Hey!",
        },
        {
            username: "Sandra Adams",
            message: 'Hey! How are you?',
        },
        {
            username: "Ali Connors",
            message: "Thanks, I am great! when do we meet?",
        },
        {
            username: "Peter",
            message: "At 6 o'clock Balaton Lake.",
        },
        {
            username: "Ali Connors",
            message: "Sounds Perfect...!",
        },
    ]);

    const sendMessage = () => {
        setMessages([...messages, { username: selectedChat.username, message: messageValue.trim() }])
        setMessageValue("")
    }


    return (
        <div className="global-chatbox">
            <div className="chatbox-container">
                {messages.map((data, i) => (
                    <div key={i} className={`message-container ${data.username === selectedChat.username ? "my-message": ""}`}>
                        <div
                            className={`message-outlet`}>
                        <Typography>
                            {data.message}
                        </Typography>
                        </div>
                    </div>
                ))}
            </div>

            
            <div className="chatbox-input">
                <input
                    placeholder="Start Typing..."
                    value={messageValue}
                    onChange={(e) => setMessageValue(e.target.value)}
                />
                <Box mr={1}>
                <IconButton onClick={sendMessage} size="small">
                    <SendOutlined/>
                </IconButton>
                </Box>
            </div>
        </div>
    )
}

export default ChatBox
