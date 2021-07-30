import {Fragment} from 'react'
import {
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography
} from '@material-ui/core'



const ChatList = ({ socket, chat, setSelectedChat, userId }) => {
  

    const formatTime = (time) => new Date(time).toTimeString().split(":");
    
    return (
      <Fragment>
        <ListItem
            button
            divider
            onClick={() => setSelectedChat(chat)}
            alignItems="flex-start">
          {/* <ListItemAvatar>
          <Avatar alt="Remy Sharp" />
          </ListItemAvatar> */}
          <ListItemText
          primary={<p className="chat-listTitle">{chat.chatTitle}</p>}
          secondary={
            <Fragment>
              <div title={chat.message?.message} className="chat-listSubtext">
                <div className="chat-listSubtitle">
                  <p className="who">
                    {chat?.message?.userid === userId ? "You:" : ""}
                  </p>
                  <p className="msg">
                   {chat.message?.message ? chat.message?.message : "\'New chat\'"}
                  </p>
                </div>
                {chat.message?.message && <p className="message-time">
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
