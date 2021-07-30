import { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types'
import { createStyles, Theme, makeStyles } from '@material-ui/core/styles';
import {
    Popover,
    Box,
    Typography,
    Divider,
    IconButton,
    Tooltip,
    List,
} from '@material-ui/core'
import { Create, Clear, ArrowBack } from '@material-ui/icons';


import ChatList from './ChatList';
import ChatBox from './ChatBox';
import NewChat from './NewChat';
import axiosInstance from '../../axios/axiosInstance';
import { useData } from '../../StateProvider/Provider';
import { SET_CHATTER } from '../../StateProvider/actionTypes';


const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    listRoot: {
      width: '100%',
      backgroundColor: theme.palette.background.paper,
    },
    inline: {
      display: 'inline',
    },
  }),
);

const ChatsPopover = (props) => {
    const classes = useStyles();
    const {state: {user: { user}, chatter}, dispatch} = useData()
    const { open, anchorEl, setAnchorEl, socket } = props;  
    const [selectedChat, setSelectedChat] = useState(null)
    const [newChat, setNewChat] = useState(false)
    const [users, setUsers] = useState([])
    const [userChats, setUserChats] = useState([])
    const [chatterIds, setChatterIds] = useState([])

    const onClose = () => {
        setAnchorEl(null)
    }

    const getChats = useCallback(() => {
        axiosInstance().get("/chatter/user-to-user/my")
            .then(({ data: { data } }) => {
                data = data.map(d => ({
                    id: d.id,
                    chatTitle: d.users.filter(d => d._id !== user._id)
                        .map(_d => `${_d.firstName} ${_d.lastName}`).join(", "),
                    message: d?.message,
                }))
             setChatterIds(data.map(d => d.id))
             setUserChats(data)
             dispatch({type: SET_CHATTER, payload: null})
         })
        .catch(() => { })
    }, [chatter])

    useEffect(() => {
        getChats()
    }, [getChats])


      useEffect(() => {
        fetchUsersList()
      }, [])
    
        // Create connection between user with chatterID
    const joinRooms = () => {
        if (chatterIds.length && socket !== null) {
            chatterIds.forEach((chatterId) => {
                socket.emit("join", chatterId)
             })
        }
    }
    
    useEffect(() => {
        joinRooms()
    }, [chatterIds, socket])


    const fetchUsersList = () => {
        axiosInstance().get("/user?limit=0")
            .then(({ data: { data } }) => {
                const allUsers = data.filter(d => d._id !== user._id)
                                     .map(d => ({ id: d._id, avatar: d.avatar || "", name: d.concatedName }))
                setUsers(allUsers)
            })
        .catch(err => {})
    }


    const sendMessage = async (chatterId:string, msg:string) => {
        try {
            await axiosInstance()
                .put(`/chatter/${chatterId}`, { message: msg });
        } catch (error) {
           console.log(error)
        }
    };



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
                            <ArrowBack color='action' />
                        </IconButton>
                        </Tooltip>
                        : 
                        <Tooltip title="New chat">
                        <IconButton onClick={() => {
                            if(selectedChat) setSelectedChat(null)
                            setNewChat(!newChat)
                        }} size="small">
                            <Create color='action' />
                        </IconButton> 
                            
                        </Tooltip>
                    }

                    <Typography variant='h6' color="textPrimary" className="text-truncate">
                        {selectedChat
                            ? selectedChat?.chatTitle
                            : newChat
                                ? "New chat"
                                : `Chats (${userChats.length})`}
                    </Typography>

                    <Tooltip title="Close chat">
                    <IconButton onClick={onClose} size="small">
                        <Clear color="action"/>
                    </IconButton>
                    </Tooltip>
                </Box>

                <Divider orientation="horizontal" />
                
                <Box height={400} style={{overflowY: "auto"}}>
                    {newChat
                        ? <NewChat
                            userId={user._id}
                            setNewChat={setNewChat}
                            setSelectedChat={setSelectedChat}
                            users={users}
                        />
                        : selectedChat
                            ?
                            <ChatBox
                                selectedChat={selectedChat}
                                sendMessage={sendMessage}
                                socket={socket}
                            />
                            : <List disablePadding className={classes.listRoot}>
                                {userChats.map(chat => (
                                    <ChatList
                                        userId={user._id}
                                        socket={socket}
                                        chat={chat}
                                        setSelectedChat={setSelectedChat}
                                    />
                                ))}
                            </List>}
                </Box>
            </Box>
        </Popover>
       
    )
}

ChatsPopover.propTypes = {
    open: PropTypes.bool,
    anchorEl: PropTypes.any,
    socket: PropTypes.any,
    setAnchorEl: PropTypes.func,
    setChatterId: PropTypes.func,
    chatterId: PropTypes.string

}


export default ChatsPopover
