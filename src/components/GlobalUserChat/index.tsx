import React, {useState, useEffect} from 'react'
import { Badge, Box, Fab, Typography } from '@material-ui/core'
import { Chat, Clear } from '@material-ui/icons'
import io, { Socket } from "socket.io-client";

import ChatsPopover from './ChatsPopover'
import { backendApi } from '../../config';
import { useData } from '../../StateProvider/Provider';
import "./chatStyles.scss"
import axiosInstance from '../../axios/axiosInstance';

const GlobalUserChat = () => {
    const {state: {user: {user:{_id: id}}}} = useData()
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [socket, setSocket] = useState<Socket>(null);
    const [chatterId, setChatterId] = useState("")
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
    }, [id]);


    // Socket listening for data
    useEffect(() => {
        if (socket && id) {
            socket.on("connect", () => {
            socket.emit("join", id);
            });

            socket.on("data", (data) => {
                console.log(data)
            });

            return () => {
            if (socket) {
                socket.disconnect()
                socket.off("connect");
            }
            };
        };
        
    }, [socket, id]);



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
                    <ChatsPopover open={open}
                    anchorEl={anchorEl}
                    setAnchorEl={setAnchorEl}
                    chatterId={chatterId}
                    setChatterId={setChatterId}
                    
                />}
          </Box>
        </div>
    )
}

export default GlobalUserChat
