import React, {useState, useContext, useCallback, useEffect} from 'react'
import { Badge, Box, Fab } from '@material-ui/core'
import { Chat, Clear } from '@material-ui/icons'

import ChatsPopover from './ChatsPopover'
import { useData } from '../../StateProvider/Provider'
import { GlobalChatContext } from '../../StateProvider/GlobalChatContext'
import axiosInstance from '../../axios/axiosInstance'
import { SET_CHATTER } from '../../StateProvider/actionTypes'
import "./chatStyles.scss"

const GlobalUserChat = () => {
    const {state:{user:{user}, chatter}, dispatch} = useData()
    const {
        socket,
        setChatList,
        chatterIds,
        setChatterIds,
        messages,
        setMessages,
        selectedChat,
        setCurrentUser
    } = useContext(GlobalChatContext)
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const open = Boolean(anchorEl)

    const handleOpenPopup = (e: React.MouseEvent<HTMLButtonElement>) => {
         setAnchorEl(e.currentTarget)
    }


         useEffect(() => {
       if (socket !== null) {
           socket.on("data", (data) => {
               console.log(messages)
               getChats()
               getChatterInfo()
           })
           
           return () => {
               socket.off("data")
           }
       }
         }, [socket])
    
    useEffect(() => {
        getChatterInfo()
        if(selectedChat === null){ setMessages([])}
    },[selectedChat])
    
    const getChatterInfo = () => {
        if (selectedChat) {
            axiosInstance().get(`/chatter/${selectedChat.id}`)
                .then(({ data: {data} }) => {
                    setMessages(data.Messages)
                    setCurrentUser(data.currentUser)
            })
            .catch(() => {})
        }
    }
    
    const getChats = useCallback(() => {
            axiosInstance().get("/chatter/user-to-user/my")
            .then(({ data: { data } }) => {
                data = data.map(d => ({
                    id: d.id,
                    chatTitle: d.users.filter(d => d._id !== user._id)
                    .map(_d => `${_d.firstName} ${_d.lastName}`).join(", "),
                    message: d?.message,
                    timeStamp: new Date(d?.message.date).getTime()
                }))

                
                // const sortedArry =
                // data.sort((a, b) => (a.timeStamp > b.timeStamp) ? 1 : ((b.timeStamp > a.timeStamp) ? -1: 0))
                
                // console.log(sortedArry)
                setChatList(data)
                setChatterIds(data.map(d => d.id))
                if (chatter) {
                    dispatch({type: SET_CHATTER, payload: null})
                }
            })
            .catch(() => { })
        
    }, [chatter])

   
    useEffect(() => {
        getChats()
    }, [getChats])


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
                    open={open}
                    anchorEl={anchorEl}
                    setAnchorEl={setAnchorEl}
                    
                />}
          </Box>
        </div>
    )
}

export default GlobalUserChat
