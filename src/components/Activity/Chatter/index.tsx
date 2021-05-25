import { useCallback, useContext, useEffect, useState } from "react";
import {
  Avatar,
  Box,
  IconButton,
  InputBase,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { Send } from "@material-ui/icons";
import moment from "moment";
import io from "socket.io-client";

import { useData } from "../../../StateProvider/Provider";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";

const useStyles = makeStyles((theme) => ({
  messageBubble: {
    backgroundColor: "gray",
    color: "white",
    padding: theme.spacing(1, 2),
    borderRadius: 16,
    width: "max-content",
  },
}));

const Chatter = (props) => {
  const { relatedTo } = props;

  const {
    state: {
      user: { user },
    },
  } = useData();
  const classes = useStyles();

  const { setToastConfig } = useContext(CustomToastContext);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [chatterId, setChatterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);

  const msgBoxRef = useCallback(
    (elem: HTMLElement) => {
      if (elem) {
        elem.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "start",
        });
      }
    },
    [messages]
  );

  const getChatter = useCallback(() => {
    if (relatedTo && relatedTo.length) {
      setLoading(true);
      axiosInstance()
        .get(`/chatter/resource?relatedTo=${JSON.stringify(relatedTo)}`)
        .then(({ data: { data } }) => {
          if (data && data.length) {
            setMessages(data && data[0].Messages);
            setChatterId(data && data[0]._id);
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

    const token = localStorage.getItem("token");
    const s = io("https://oms-backend.vebholic.com/chatter", {
      auth: {
        token,
      },
    });
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [getChatter]);

  // Socket listening for data
  useEffect(() => {
    if (!socket && !chatterId) return;

    socket.on("connect", (data) => {
      socket.emit("join", chatterId);
    });

    socket.on("data", (data) => {
      setMessages(data.Messages);
    });

    return () => {
      if (socket) {
        socket.off("connect");
      }
    };
  }, [socket, chatterId]);

  const createChatter = () => {
    axiosInstance()
      .post(`/chatter`, { relatedTo })
      .then(({ data: { data } }) => {
        console.log(data);
      })
      .catch((err) => {
        setToastConfig(err);
      });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    axiosInstance()
      .put(`/chatter/${chatterId}`, { message })
      .then(({ data: { data } }) => {
        setMessages(data.Messages);
      })
      .catch((err) => {
        setToastConfig(err);
      });
    setMessage("");
  };

  return (
    <Box p={1}>
      <Box
        borderRadius={4}
        height={350}
        border="1px solid #dfdfdf"
        width="100%"
        display="flex"
        flexDirection="column"
        justifyContent="flex-end"
      >
        <div
          style={{
            width: "100%",
            overflow: "auto",
            padding: "0 10px",
          }}
        >
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
            messages.map((msg, idx) => (
              <Box
                key={idx}
                mt={1}
                display="flex"
                flexDirection="column"
                alignItems={msg.userid === user._id ? "flex-end" : "flex-start"}
              >
                <div ref={msgBoxRef}>
                  <Box display="flex">
                    <Avatar
                      title={msg.userName}
                      style={{
                        width: "28px",
                        height: "28px",
                        order: user._id === msg.userid ? 1 : 0,
                        marginRight: user._id === msg.userid ? 0 : "8px",
                      }}
                    >
                      {msg.userName.split(" ")[0].charAt(0)}
                    </Avatar>

                    <Box
                      mr={user._id === msg.userid ? "8px" : 0}
                      className={classes.messageBubble}
                      style={{
                        background: msg.userid === user._id ? "grey" : "white",
                        color: msg.userid === user._id ? "white" : "black",
                      }}
                    >
                      <Typography variant="body1">{msg.message}</Typography>
                      <Box textAlign="right">
                        <Typography variant="caption">
                          {moment(msg.date).fromNow()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </div>
              </Box>
            ))
          ) : (
            <Box textAlign="center">No Messages</Box>
          )}
        </div>

        <Box component="form" onSubmit={sendMessage}>
          <Box
            style={{ padding: "8px 10px" }}
            mt="10px"
            display="flex"
            alignItems="center"
          >
            <Box
              border="1px solid #aaa"
              borderRadius={20}
              width="100%"
              height={34}
            >
              <InputBase
                style={{ padding: "0 10px" }}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                fullWidth
                placeholder="Write message..."
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
      </Box>
    </Box>
  );
};

export default Chatter;
