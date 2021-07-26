import { useState } from 'react';
import PropTypes from 'prop-types'
import {
    Popover,
    Box,
    Typography,
    Divider,
    IconButton,
} from '@material-ui/core'
import { ChatBubbleOutlineRounded, Clear, ArrowBack } from '@material-ui/icons';
import ChatList from './ChatList';
import ChatBox from './ChatBox';

const ChatsPopover = (props) => {
    const { open, anchorEl, setAnchorEl } = props;  
    const [selectedChat, setSelectedChat] = useState(null)

    const onClose = () => {
        setAnchorEl(null)
        // setChatVisible(false)
    }

    const staticData = [
        {
            username: "Ali Connors",
            message: "I'll be in your neighborhood doing errands this…",
        },
        {
            username: "Sandra Adams",
            message: 'Do you have Paris recommendations? Have you ever…',
        },
        {
            username: "Jennifer",
            message: "Wish I could come, but I'm out of town this…",
        },
        {
            username: "Peter",
            message: 'Do you have Paris recommendations? Have you ever…',
        },
        {
            username: "Jake",
            message: "I'll be in your neighborhood doing errands this…",
        },
    ]


    return (
        <Popover id={open ? "chats-popover" : undefined}
                open={open}
                anchorEl={anchorEl}
                onClose={onClose}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'center',
                }}
            >
            <Box width={350} height={450} overflow="hidden">
                <Box mx={1} height={50} display="flex" justifyContent="space-between" alignItems="center">
                    {selectedChat
                        ? <IconButton onClick={() => setSelectedChat(null)} size="small">
                            <ArrowBack color='disabled' />
                        </IconButton>
                        : <ChatBubbleOutlineRounded color='disabled' />
                    }
                    <Typography variant='h6' color="textSecondary">
                    {selectedChat ? selectedChat?.username : `Chats (${staticData.length})`}
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <Clear/>
                    </IconButton>
                </Box>

                <Divider orientation="horizontal" />
                
                <Box height={400} style={{overflowY: "auto"}}>
                    {selectedChat ? 
                        <ChatBox selectedChat={selectedChat} />
                        : <ChatList
                            staticData={staticData}
                            setSelectedChat={setSelectedChat}
                        />}
                </Box>
            </Box>
        </Popover>
       
    )
}

ChatsPopover.propTypes = {
    open: PropTypes.bool,
    anchorEl: PropTypes.any,
    setAnchorEl: PropTypes.func,

}


export default ChatsPopover
