import { Box, Button, Grid, IconButton, makeStyles, Menu, MenuItem, TextField, Typography } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';

const useStyles = makeStyles((theme) => ({
  text: {
    color: 'rgb(107 114 128 / 1)',
    fontSize: '14px'
  }
}));

const EquiptAi = () => {
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);

  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteChatId, setDeleteChatId] = useState(null);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = () => {
    axiosInstance()
      .get('/generative-ai/chat')
      .then(({ data: { data } }) => {
        setChatHistory(data);
        getOneChatHistory(data[0]?._id);
      });
  };

  const getOneChatHistory = (chatId) => {
    setChatId(chatId);
    axiosInstance()
      .get(`/generative-ai/chat/${chatId}`)
      .then(({ data: { data } }) => {
        setChats(data?.history);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const askQuestion = () => {
    const body: any = {
      question: question
    };
    setQuestion('');
    if (chatId) {
      body._id = chatId;
    }

    axiosInstance()
      .post('/generative-ai/chat/ask', body)
      .then(({ data: { data } }) => {
        if (data) {
          setChatId(data?._id);
          const message = data?.history;
          setChats([...chats, message]);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = () => {
    if (chatId === deleteChatId) {
      setChatId(null);
      setChats([]);
    }
    axiosInstance()
      .put(`/generative-ai/chat/remove`, { ids: [deleteChatId] })
      .then((res) => {
        fetchChatHistory();
        handleCloseMenu();
      })
      .catch((error) => {
        handleCloseMenu();
        toastConfig.setToastConfig(error);
      });
  };

  const handleOpenMenu = (event, _id) => {
    setAnchorEl(event.currentTarget);
    setDeleteChatId(_id);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setDeleteChatId(null);
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: routes.equiptAi.title }]} />
      </div>
      <CustomContainer>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3} lg={3}>
            <Box p={1}>
              <Box textAlign={'right'}>
                <Button
                  variant="outlined"
                  size="small"
                  color="primary"
                  onClick={() => {
                    setChatId(null);
                    setChats([]);
                  }}
                >
                  New Chat
                </Button>
              </Box>
              {chatHistory &&
                chatHistory?.map((_data) => {
                  return (
                    <Box mt={1} display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
                      <Box
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          getOneChatHistory(_data?._id);
                        }}
                      >
                        <Typography className={classes.text}>{_data?.title}</Typography>
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          color="primary"
                          aria-label="delete"
                          onClick={(event) => {
                            handleOpenMenu(event, _data?._id);
                          }}
                        >
                          <MoreHorizIcon />
                        </IconButton>
                      </Box>
                      {anchorEl && (
                        <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseMenu}>
                          <MenuItem
                            onClick={() => {
                              handleDelete();
                            }}
                          >
                            Delete
                          </MenuItem>
                        </Menu>
                      )}
                    </Box>
                  );
                })}
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={9} lg={9}>
            <Box p={1} width={'100%'} minHeight={'calc(100vh - 150px)'} display={'flex'} flexDirection={'column'}>
              {chats &&
                chats?.map((chat, i) => {
                  return (
                    <Box key={i}>
                      <Box mt={1} display={'flex'} justifyContent={'end'}>
                        <Box maxWidth={'80%'} textAlign={'right'}>
                          <Typography className={classes.text}>{chat?.message}</Typography>
                        </Box>
                      </Box>
                      <Box mt={1} textAlign={'start'} maxWidth={'80%'}>
                        <Typography className={classes.text}>{chat?.content}</Typography>
                      </Box>
                    </Box>
                  );
                })}
              <Box mt={'auto'} mb={1} display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
                <TextField
                  style={{ marginRight: '10px' }}
                  variant="outlined"
                  type="text"
                  name="question"
                  fullWidth
                  placeholder="Type your message"
                  margin="dense"
                  size={'small'}
                  value={question}
                  onChange={(e) => {
                    setQuestion(e?.target?.value);
                  }}
                />
                <Button
                  style={{ padding: '7px 10px', marginTop: '2px' }}
                  variant="contained"
                  size="small"
                  color="primary"
                  disabled={question ? false : true}
                  onClick={askQuestion}
                >
                  Send
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CustomContainer>
    </section>
  );
};

export default EquiptAi;
