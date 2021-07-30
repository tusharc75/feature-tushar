import React, {useState, useEffect} from 'react'
import { Badge, Box, Fab } from '@material-ui/core'
import { Chat, Clear } from '@material-ui/icons'
import io, { Socket } from "socket.io-client";

import ChatsPopover from './ChatsPopover'
import { backendApi } from '../../config';
import "./chatStyles.scss"

const GlobalUserChat = () => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [socket, setSocket] = useState<Socket>(null);
    const open = Boolean(anchorEl)

    const handleOpenPopup = (e: React.MouseEvent<HTMLButtonElement>) => {
         setAnchorEl(e.currentTarget)
    }


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
        <div>
            <Box position="absolute" bottom={20} right={20} zIndex={1001}>
                <Badge variant='dot' overlap="circle" badgeContent=" ">
                <Fab id={open ? "chats-popover" : undefined}
                    onClick={handleOpenPopup}
                    size="small"
                    color='primary'
                    aria-label="Chats">
                    {!open ? <Chat /> : <Clear />}
              </Fab>
              </Badge>
                {open &&
                    <ChatsPopover
                    socket={socket}    
                    open={open}
                    anchorEl={anchorEl}
                    setAnchorEl={setAnchorEl}
                    
                />}
          </Box>
        </div>
    )
}

export default GlobalUserChat
