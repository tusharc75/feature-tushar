import React, {useState} from 'react'
import { Badge, Box, Fab, Typography } from '@material-ui/core'
import { Chat, Clear } from '@material-ui/icons'

import ChatsPopover from './ChatsPopover'
import "./chatStyles.scss"

const GlobalUserChat = () => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const open = Boolean(anchorEl)

    const handleOpenPopup = (e: React.MouseEvent<HTMLButtonElement>) => {
         setAnchorEl(e.currentTarget)
    }



    return (
        <div>
            <Box position="absolute" bottom={20} right={20} zIndex={1}>
                <Badge variant='dot' overlap="circle" badgeContent=" ">
                <Fab id={open ? "chats-popover" : undefined}
                    onClick={handleOpenPopup}
                    size="small"
                    color='primary'
                    aria-label="Chats">
                    {!open ? <Chat /> : <Clear />}
              </Fab>
              </Badge>
                {open && <ChatsPopover open={open}
                    anchorEl={anchorEl}
                    setAnchorEl={setAnchorEl}          
                />}
          </Box>
        </div>
    )
}

export default GlobalUserChat
