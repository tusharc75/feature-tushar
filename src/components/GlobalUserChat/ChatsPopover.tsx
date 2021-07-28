import { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types'
import {
    Popover,
    Box,
    Typography,
    Divider,
    IconButton,
    Tooltip,
} from '@material-ui/core'
import { Create, Clear, ArrowBack } from '@material-ui/icons';


import ChatList from './ChatList';
import ChatBox from './ChatBox';
import NewChat from './NewChat';
import axiosInstance from '../../axios/axiosInstance';

const ChatsPopover = (props) => {
    const { open, anchorEl, setAnchorEl, chatterId, setChatterId } = props;  
    const [selectedChat, setSelectedChat] = useState(null)
    const [newChat, setNewChat] = useState(false)
    const [users, setUsers] = useState([])

    const onClose = () => {
        setAnchorEl(null)
    }

    const staticData = []

    const getChats = useCallback(() => {
        axiosInstance().get("/chatter/user-to-user/my")
            .then(({ data: { data } }) => {
             
         })
        .catch(() => { })
    }, [chatterId])

    useEffect(() => {
        getChats()
    }, [getChats])

      useEffect(() => {
        fetchUsersList()
    },[])


    const fetchUsersList = () => {
        axiosInstance().get("/user?limit=0")
            .then(({ data: { data } }) => {
                setUsers(data.map(d => ({id: d._id, avatar: d.avatar || "", name: d.concatedName})))
            })
        .catch(err => {})
    }

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
                    {selectedChat || newChat
                        ? <Tooltip title="Go Back">
                        <IconButton onClick={() => {
                                setSelectedChat(null)
                                setNewChat(false)
                           }} size="small"
                         > 
                            <ArrowBack color='disabled' />
                        </IconButton>
                        </Tooltip>
                        : 
                        <Tooltip title="New chat">
                        <IconButton onClick={() => {
                            if(selectedChat) setSelectedChat(null)
                            setNewChat(!newChat)
                        }} size="small">
                            <Create color='disabled' />
                        </IconButton> 
                            
                        </Tooltip>
                    }

                    <Typography variant='h6' color="textSecondary">
                        {selectedChat
                            ? selectedChat?.username
                            : newChat
                                ? "New chat"
                                : `Chats (${staticData.length})`}
                    </Typography>

                    <Tooltip title="Close chat">
                    <IconButton onClick={onClose} size="small">
                        <Clear/>
                    </IconButton>
                    </Tooltip>
                </Box>

                <Divider orientation="horizontal" />
                
                <Box height={400} style={{overflowY: "auto"}}>
                    {newChat
                        ? <NewChat
                            setNewChat={setNewChat}
                            setSelectedChat={setSelectedChat}
                            users={users}
                            setChatterId={setChatterId}
                        />
                        : selectedChat ?
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
    setChatterId: PropTypes.func,
    chatterId: PropTypes.string

}


export default ChatsPopover
