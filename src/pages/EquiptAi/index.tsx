import {
  Box,
  Button,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  makeStyles,
  Menu,
  MenuItem,
  TextField,
  Typography,
  useMediaQuery
} from '@material-ui/core';
import React, { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import { BsStars } from 'react-icons/bs';
import { FaArrowUp } from 'react-icons/fa6';

import { cn } from 'src/constants/helpers';
import { FiEdit, FiSidebar } from 'react-icons/fi';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { Delete } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';

const EquiptAi = () => {
  const toastConfig = useContext(CustomToastContext);
  const isMobile = useMediaQuery('(max-width:768px)');
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [chats, setChats] = useState([]);

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

  const handleDelete = (id: string) => {
    if (chatId === id) {
      setChatId(null);
      setChats([]);
    }
    axiosInstance()
      .put(`/generative-ai/chat/remove`, { ids: [id] })
      .then((res) => {
        fetchChatHistory();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const hadleNewChat = () => {
    setChatId(null);
    setChats([]);
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: routes.equiptAi.title }]} />
      </div>
      <CustomContainer>
        <div className="relative flex h-[calc(100vh-152px)] min-h-[600px] gap-3 overflow-hidden [--head-h:56px] [--sidebar-w:250px]">
          <HistorySidebar
            chatHistory={chatHistory}
            hadleNewChat={hadleNewChat}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            getOneChatHistory={getOneChatHistory}
            handleDelete={handleDelete}
          />
          <div
            className={cn(
              'relative min-h-full flex-grow transition-all duration-300',
              isSidebarOpen && !isMobile ? '' : '-ml-[var(--sidebar-w)] w-[calc(100%_+_var(--sidebar-w))]'
            )}
          >
            <div className="head relative flex min-h-[var(--head-h)] items-center gap-2">
              {!isSidebarOpen && (
                <>
                  <HtmlTooltip title={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}>
                    <IconButton size="small" onClick={() => setIsSidebarOpen((prev) => !prev)}>
                      <FiSidebar />
                    </IconButton>
                  </HtmlTooltip>
                  <HtmlTooltip title={'New chat'}>
                    <IconButton size="small" onClick={() => hadleNewChat()}>
                      <FiEdit />
                    </IconButton>
                  </HtmlTooltip>
                </>
              )}
              <span className=" text-[18px] font-semibold">Equipt Ai</span>
            </div>
            <DisplayMessages chats={chats} />
            <div className="absolute bottom-0 left-0 right-0 bg-[var(--dark-primary,white)] p-2">
              <div className="flex rounded-full p-2 [border:1px_solid_var(--common-border-color)]">
                <input
                  type="text"
                  name="question"
                  className="w-full border-0 bg-transparent px-4 text-[var(--primery-text)] outline-none"
                  placeholder="Message Equipt Ai"
                  value={question}
                  onChange={(e) => {
                    setQuestion(e?.target?.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      askQuestion();
                    }
                  }}
                />

                <IconButton
                  style={{ borderRadius: 999, padding: '10px' }}
                  size="small"
                  disabled={question ? false : true}
                  onClick={askQuestion}
                  className={cn(question ? '!bg-[var(--new-theme-color)]' : '!bg-gray-300 dark:!bg-gray-800')}
                >
                  <FaArrowUp className="text-white" />
                </IconButton>
              </div>
              <span className="mx-auto block pt-2 text-center text-[12px] text-gray-400">Equipt Ai can make mistakes. Check important info.</span>
            </div>
          </div>
        </div>
      </CustomContainer>
    </section>
  );
};

export default EquiptAi;

type HistorySidebarProps = {
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSidebarOpen: boolean;
  hadleNewChat: () => void;
  chatHistory: ChatHistory[];
  getOneChatHistory: (id: string) => void;
  handleDelete: (id: string) => void;
};

type ChatHistory = {
  _id: string;
  title: string;
};

const HistorySidebar = ({ setIsSidebarOpen, isSidebarOpen, hadleNewChat, chatHistory, getOneChatHistory, handleDelete }: HistorySidebarProps) => {
  const [selectedChatHistory, setSelectedChatHistory] = useState<string>(null);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setSelectedChatHistory(id);
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setSelectedChatHistory(null);
    setAnchorEl(null);
  };

  const handleDeleteWrapper = () => {
    console.log(selectedChatHistory);
    handleCloseMenu();
    if (selectedChatHistory) handleDelete(selectedChatHistory);
  };

  return (
    <aside
      className={cn(
        'z-10 min-h-full w-[var(--sidebar-w)] flex-shrink-0  rounded-lg bg-[var(--dark-primary,white)] transition-transform duration-300 [border:1px_solid_var(--common-border-color)]',
        isSidebarOpen ? '[transform:translateX(0)]' : '[transform:translateX(calc(var(--sidebar-w)_*_-1))]'
      )}
    >
      <div className="head flex min-h-[var(--head-h)] items-center justify-between gap-2 px-4">
        <HtmlTooltip title={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}>
          <IconButton size="small" onClick={() => setIsSidebarOpen((prev) => !prev)}>
            <FiSidebar />
          </IconButton>
        </HtmlTooltip>
        <HtmlTooltip title={'New chat'}>
          <IconButton size="small" onClick={() => hadleNewChat()}>
            <FiEdit />
          </IconButton>
        </HtmlTooltip>
      </div>
      <div className="body max-h-[calc(100%_-_var(--head-h))] overflow-y-auto px-1">
        <List dense>
          {chatHistory?.length ? (
            <>
              {chatHistory?.map((history) => (
                <ListItem button onClick={() => getOneChatHistory(history._id)} key={history._id} className="group" style={{ borderRadius: 8 }}>
                  <ListItemText primary={<span className="line-clamp-1">{history.title}</span>} />
                  <div className="absolute right-2 pl-6 opacity-0 [background-image:linear-gradient(270deg,_#f5f5f5_66%,_transparent_100%)] group-hover:opacity-100 dark:[background-image:linear-gradient(270deg,_#212134_60%,_transparent_100%)] ">
                    <IconButton edge="end" aria-label="delete" size="small" onClick={(event) => handleOpenMenu(event, history._id)}>
                      <MoreHorizIcon />
                    </IconButton>
                  </div>
                </ListItem>
              ))}
            </>
          ) : (
            <>
              {Array.from(Array(3).keys()).map((i) => (
                <ListItem button key={i} className="group" style={{ borderRadius: 8 }}>
                  <ListItemText
                    primary={<span className="line-clamp-1">{<Skeleton width={Math.random() * (200 - 100) + 100} height={20} />}</span>}
                  />
                  <div className="absolute right-2 pl-6 opacity-0 [background-image:linear-gradient(270deg,_#f5f5f5_66%,_transparent_100%)] group-hover:opacity-100 dark:[background-image:linear-gradient(270deg,_#212134_60%,_transparent_100%)] ">
                    <IconButton edge="end" aria-label="delete" size="small">
                      <MoreHorizIcon />
                    </IconButton>
                  </div>
                </ListItem>
              ))}
            </>
          )}
        </List>
      </div>
      <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={handleDeleteWrapper}>
          <Delete fontSize="small" className="mr-2" />
          Delete
        </MenuItem>
      </Menu>
    </aside>
  );
};

type DisplayMessagesProps = {
  chats: { message: string; content: string }[];
};

const DisplayMessages = ({ chats }: DisplayMessagesProps) => {
  return (
    <div className=" max-h-[calc(100%_-_var(--head-h)_-_100px)] overflow-y-auto">
      {chats?.length ? (
        <>
          {chats?.map((chat, i) => {
            return (
              <div key={i}>
                <div className="m-[18px_20px] ml-auto w-fit max-w-[75%] rounded-md bg-[#f4f4f4] p-[10px_20px] text-right dark:bg-[var(--dark-secondary)]">
                  {chat?.message}
                </div>
                <div className="m-[18px_20px] flex  max-w-[75%] items-start gap-2 rounded-md p-[10px_20px]">
                  <BsStars className="flex-shrink-0 text-[var(--new-theme-color)]" size={25} />
                  {chat?.content}
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <>
          {Array.from(Array(3).keys()).map((i) => (
            <div key={i}>
              <div className="m-[18px_20px] ml-auto w-fit max-w-[75%] rounded-md bg-[#f4f4f4] p-[10px_20px] text-right dark:bg-[var(--dark-secondary)]">
                <Skeleton width={Math.random() * (200 - 100) + 100} height={20} />
              </div>
              <div className="m-[18px_20px] flex  max-w-[75%] items-start gap-2 rounded-md p-[10px_20px]">
                <BsStars className="flex-shrink-0 text-[var(--new-theme-color)]" size={25} />
                <Skeleton width={Math.random() * (200 - 100) + 100} height={20} />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};
