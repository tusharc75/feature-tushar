import {useState,useEffect,useContext} from 'react'
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import './style.css'
import SendIcon from '@material-ui/icons/Send';
import {Button} from '@material-ui/core'
export default function ChatRender({id}){
    
    const toastConfig = useContext(CustomToastContext)
    const[messages,setMessages]=useState([]);
    const[user,setUser]=useState("");
    const[newMessage,setNewMessage]=useState("");


    useEffect(()=>{
        fetchMessages();
    },[id])

    const fetchMessages=()=>{
        axiosInstance().get(`/chatter/`+id).then(({ data: { data } }) => {
            console.log(data);
            setMessages(data.Messages);
            setUser(data.currentUser)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }

    const sendMessage=()=>{
        console.log("Sending message");
        const message={message:newMessage}
        axiosInstance().put(`/chatter/`+id,message).then(({ data: { data } }) => {
            setNewMessage("");
            fetchMessages();
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const handleChange=(event)=>{
        setNewMessage(event.target.value);
    }

    return(
        <div className="chatWindow">
        <ul className="chat" id="chatList">
          {messages.map(data => (
            <div key={data.userid+data.date}>
              {user=== data.userid ? (
                <li className="self">
                  <div className="msg">
                    <p>{data.userName}</p>
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
        <form onSubmit={()=>sendMessage()}>
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
        <button onClick={()=>sendMessage()}>
          <SendIcon/>Send
        </button>
      </div>
    );
}