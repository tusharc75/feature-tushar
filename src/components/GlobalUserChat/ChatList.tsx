import { Fragment, useEffect } from 'react'
import {
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography
} from '@material-ui/core'
import axiosInstance from '../../axios/axiosInstance'


const ChatList = (props) => {
  const { chat, setSelectedChat, userId } = props

  const onChatClick = () => {
    setSelectedChat(chat)

    if (chat.unseen > 0) {
      axiosInstance().put(`chatter/mark-read/${chat.id}`)
    }
  }

  const formatTime = (time) => new Date(time).toTimeString().split(":");

  return (
    <Fragment>
      <ListItem
        button
        divider
        onClick={onChatClick}
        alignItems="flex-start">
        {/* <ListItemAvatar>
          <Avatar alt="Remy Sharp" />
          </ListItemAvatar> */}
        <ListItemText
          primary={
            <Fragment>
              <p className="chat-listTitle">{chat.chatTitle}</p>
            </Fragment>}
              
          secondary={
            <Fragment>
              <div title={chat.message?.message} className="chat-listSubtext">
                <div className="chat-listSubtitle">
                  <p className={`who ${chat?.unseen > 0 ? "unseen" : ""}`}>
                    {chat?.message?.userid === userId ? "You:" : ""}
                  </p>
                  <p className={`msg text-truncate ${chat?.unseen > 0 ? "unseen" : ""}`}>
                    {chat.message?.message ? chat.message?.message : "\'New chat\'"}
                  </p>
                </div>
                {chat?.unseen > 0
                  ? <p className={`message-time count ${chat?.unseen > 0 ? "unseen" : ""}`}>{chat?.unseen}</p>
                  : chat.message?.message
                  && <p className="message-time">
                  {`${formatTime(chat.message.date)[0]}:${formatTime(chat.message.date)[1]}`}
                </p>}
              </div>
            </Fragment>
          }
        />
      </ListItem>
    </Fragment>
  )
}

export default ChatList
