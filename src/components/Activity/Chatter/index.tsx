import { useCallback, useContext, useEffect, useState } from "react";
import {
  Box,
  IconButton,
  InputBase,
  Typography,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { Send } from "@material-ui/icons";
import io, { Socket } from "socket.io-client";

import { useData } from "../../../StateProvider/Provider";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { backendApi } from './../../../config';
import moment from "moment";

const Chatter = (props) => {
  const { relatedTo } = props;

  const {
    state: {
      user: { user },
    },
  } = useData();

  const { setToastConfig } = useContext(CustomToastContext);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [chatterId, setChatterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket>(null);
  const [isFocused, setFocused] = useState(false);

  const getChatter = useCallback(() => {
    if (relatedTo && relatedTo.length) {
      setLoading(true);
      axiosInstance()
        .get(`/chatter/resource?relatedTo=${JSON.stringify(relatedTo)}`)
        .then(({ data }) => {
          if (data.hasOwnProperty("data")) {
            setMessages(data.data.Messages.reverse());
            setChatterId(data.data._id);
          } else {
            createChatter();
          }
          setLoading(false);
        })
        .catch((err) => {
          setToastConfig(err);
          setLoading(false);
        });
    }
  }, []);

  useEffect(() => {
    getChatter();
  }, [getChatter]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const s = io(`${backendApi}/chatter`, {
      auth: {
        token
      },
      reconnectionAttempts:5,
      reconnectionDelay:5000,
      transports: ['websocket',"pooling"]

    });
    setSocket(s);
  }, [chatterId]);

  // Socket listening for data
  useEffect(() => {
    if (!socket && !chatterId) return;

    socket.on("connect", () => {
      socket.emit("join", chatterId);
    });

    socket.on("data", (data) => {
      setMessages(data.Messages.reverse());
    });

    return () => {
      if (socket) {
        socket.disconnect()
        socket.off("connect");
      }
    };
  }, [socket, chatterId]);

  const createChatter = () => {
    axiosInstance()
      .post(`/chatter`, { relatedTo })
      .then(({ data: { data } }) => {
        setChatterId(data._id);
      })
      .catch((err) => {
        setToastConfig(err);
      });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance().put(`/chatter/${chatterId}`, { message });
    } catch (error) {
      setToastConfig(error);
    }
    setMessage("");
  };

  return (
    <Box p={1}>
      <div className="chat-box" id="chatList">
        <div className="chat-box-header">
          <Typography variant="h6"> Chatter</Typography>
        </div>
        <div className="chat-box-body">
          <div className="chat-logs" style={{ height: 300 }}>
            {loading ? (
              <Box
                height="100%"
                display="flex"
                flexDirection="column"
                justifyContent="flex-end"
              >
                {[100, 180, 120, 160].map((i) => (
                  <Box
                    height={60}
                    key={i}
                    display="flex"
                    alignSelf={i < 150 ? "flex-start" : "flex-end"}
                  >
                    <Skeleton
                      height="100%"
                      width={i}
                      style={{ borderRadius: 16 }}
                    />
                  </Box>
                ))}
              </Box>
            ) : messages.length ? (
              messages.map((data, idx) => (
                // <Box
                //   key={idx}
                //   mt={1}
                //   display="flex"
                //   flexDirection="column"
                //   alignItems={
                //     msg.userid === user._id ? "flex-end" : "flex-start"
                //   }
                // >
                //   <div ref={msgBoxRef}>
                //     <Box display="flex">
                //       <Avatar
                //         title={msg.userName}
                //         style={{
                //           width: "28px",
                //           height: "28px",
                //           order: user._id === msg.userid ? 1 : 0,
                //           marginRight: user._id === msg.userid ? 0 : "8px",
                //         }}
                //       >
                //         {msg.userName.split(" ")[0].charAt(0)}
                //       </Avatar>

                //       <Box
                //         mr={user._id === msg.userid ? "8px" : 0}
                //         className={classes.messageBubble}
                //         style={{
                //           background:
                //             msg.userid === user._id ? "grey" : "white",
                //           color: msg.userid === user._id ? "white" : "black",
                //         }}
                //       >
                //         <Typography variant="body1">{msg.message}</Typography>
                //         <Box textAlign="right">
                //           <Typography variant="caption">
                //             {moment(msg.date).fromNow()}
                //           </Typography>
                //         </Box>
                //       </Box>
                //     </Box>
                //   </div>
                // </Box>
                <div key={idx}>
                  {user._id === data.userid ? (
                    <div className="chat-msg self">
                      <div className="cm-msg-text self">
                        <p className="chat-user">{data.userName}</p>
                        <div className="message"> {data.message}</div>
                        <Box textAlign="right" className="chatTimer">
                          <Typography variant="caption">
                            {moment(data.date).fromNow()}
                          </Typography>
                        </Box>
                      </div>
                    </div>
                  ) : (
                    <div className="chat-msg user">
                      <div className="cm-msg-text user">
                        <p className="chat-user">{data.userName}</p>
                        <div className="message"> {data.message} </div>
                        <Box textAlign="right" className="chatTimer"> 
                          <Typography variant="caption">
                            {moment(data.date).fromNow()}
                          </Typography>
                        </Box>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <Box textAlign="center">
                <Typography>No Messages</Typography>
              </Box>
            )}
          </div>
        </div>

        <Box component="form" onSubmit={sendMessage}>
          <Box
            style={{ padding: "8px 10px" }}
            display="flex"
            alignItems="center"
            boxShadow={1}
          >
            <Box
              border="1px solid #aaa"
              borderRadius={20}
              width="100%"
              height={34}
              borderColor={isFocused ? "#555" : "#aaa"}
            >
              <InputBase
                style={{ padding: "0 10px" }}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                fullWidth
                placeholder="Write message..."
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </Box>
            <Box mx={1} />
            <IconButton
              size="small"
              type="submit"
              disabled={!message}
              color="secondary"
            >
              <Send />
            </IconButton>
          </Box>
        </Box>
      </div>
    </Box>
  );
};

export default Chatter;
