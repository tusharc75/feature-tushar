import { useState, useEffect, useContext } from 'react'
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import './style.scss'
import SendIcon from '@material-ui/icons/Send';
import { CgSearchLoading } from 'react-icons/cg';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  loadingContent: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "1.5rem",
    flexDirection: "column",
    justifyContent: "center",
    paddingTop: "20vh",
    color: "#ccc6c6"
  }
}));


export default function ChatRender({ id, isLoaded }) {
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext)
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState("");
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    fetchMessages();
  }, [id])

  const fetchMessages = () => {
    axiosInstance().get(`/chatter/` + id).then(({ data: { data } }) => {
      console.log(data);
      setMessages(data.Messages);
      setUser(data.currentUser)
    }).catch((error) => {
    });
  }

  const sendMessage = () => {
    console.log("Sending message");
    const message = { message: newMessage }
    axiosInstance().put(`/chatter/` + id, message).then(({ data: { data } }) => {
      setNewMessage("");
      fetchMessages();
    }).catch((error) => {
      toastConfig.setToastConfig(error);
    });
  };

  const handleChange = (event) => {
    setNewMessage(event.target.value);
  }

  return (<>
    <div className="chat-box" id="chatList">
      <div className="chat-box-header">
        Chat Support
      </div>
      <div className="chat-box-body">
        <div className="chat-logs">
          {
            isLoaded ?
              messages.length > 0 ? messages.map(data => (
                <div key={data.userid + data.date}>
                  {user === data.userid ? (
                    <div className="chat-msg self">
                      <div className="cm-msg-text self">
                        <p className="chat-user">{data.userName}</p>
                        <div className="message"> {data.message}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="chat-msg user">
                      <div className="cm-msg-text user">
                        <p className="chat-user">{data.userName}</p>
                        <div className="message"> {data.message} </div>
                      </div>
                    </div>
                  )}
                </div>
              )) : <span className={classes.loadingContent}>No message to display!</span>
              : <span className={classes.loadingContent}><CgSearchLoading />Loading...</span>
          }
        </div>
      </div>
      <div className="chat-input">
        <form>
          <input type="text" id="chat-input" placeholder="Send a message..." value={newMessage} onChange={handleChange} />
          <button type="button" className="chat-submit" id="chat-submit" onClick={() => sendMessage()} disabled={newMessage === ""}><SendIcon /></button>
        </form>
      </div>
    </div>
    {/* <div className="chatWindow">
      <ul className="chat" id="chatList">
        {messages.map(data => (
          <div key={data.userid + data.date}>
            {user === data.userid ? (
              <li className="self">
                <div className="msg">
                  <div className="message"> {data.message}</div>
                </div>
              </li>
            ) : (
              <li className="other">
                <div className="msg">
                  <p>{data.userName}</p>
                  <div className="message"> {data.message} </div>
                </div>
              </li>
            )}
          </div>
        ))}
      </ul>
      <form onSubmit={() => sendMessage()}>
        <div className="chatInputWrapper">
          <input
            className="textarea input"
            type="text"
            placeholder="Enter your message..."
            defaultValue={newMessage}
            onChange={handleChange}
          />
        </div>
      </form>
      <button onClick={() => sendMessage()}>
        <SendIcon />
      </button> 
       </div>*/}
  </>
  );

}