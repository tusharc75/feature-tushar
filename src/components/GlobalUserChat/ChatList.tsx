import { Fragment } from 'react'
import {
  ListItem,
  ListItemText} from '@material-ui/core'
import moment from 'moment'

import axiosInstance from '../../axios/axiosInstance'


const ChatList = (props) => {
  const { chat, setSelectedChat, userId } = props

  const onChatClick = () => {
    setSelectedChat(chat)

    if (chat.unseen > 0) {
      axiosInstance().put(`chatter/mark-read/${chat.id}`)
    }
  }

  const formatTime = (time) => moment(time).fromNow(true);

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
              <p title={chat.chatTitle} className={`chat-listTitle text-truncate ${chat?.unseen > 0 ? "new-msg" : ""}`}>{chat.chatTitle}</p>
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
                {chat.message?.message
                  && <p className={`message-time ${chat?.unseen > 0 ? "new-msg" : ""}`}>
                  {formatTime(chat.message.date)}
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
