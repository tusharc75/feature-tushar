import {Fragment} from 'react'
import {
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography
} from '@material-ui/core'



const ChatList = ({socket, chat, setSelectedChat, userId}) => {
    
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
              <p className="chat-listSubtitle">{`${chat?.message?.userid === userId ? "You: " : ""} 
              ${chat.message?.message ? chat.message?.message : "\'New chat\'"}`}</p>
              </Fragment>
          }
          />
        </ListItem>
      </Fragment>
    )
}

export default ChatList
