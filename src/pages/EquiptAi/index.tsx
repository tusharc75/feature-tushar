import { IconButton, List, ListItem, ListItemText, Menu, MenuItem, useMediaQuery } from '@material-ui/core';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { BsStars } from 'react-icons/bs';
import { FaArrowUp } from 'react-icons/fa6';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

import { Chat, Delete } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';
import { BiDislike } from 'react-icons/bi';
import { FiEdit, FiSidebar } from 'react-icons/fi';
import { LuCopy } from 'react-icons/lu';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cn, copyTextToClipboard } from 'src/constants/helpers';
import { HiOutlineSpeakerWave, HiOutlineSpeakerXMark } from 'react-icons/hi2';
import { Speak } from 'src/pages/EquiptAi/Speak';
import { CgSpinner } from 'react-icons/cg';
import AiChatFeedback from 'src/pages/EquiptAi/AiChatFeedback';
import { DownloadIcon } from 'src/assets/svg/svgIcons';
import xlsx from 'xlsx-js-style';
import moment from 'moment';
import { groupBy, indexOf, orderBy } from 'lodash';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const EquiptAi = () => {
  const toastConfig = useContext(CustomToastContext);
  const isMobile = useMediaQuery('(max-width:768px)');
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [chats, setChats] = useState(null);
  const [chatTitle, setChatTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = () => {
    axiosInstance()
      .get('/generative-ai/chat')
      .then(({ data: { data } }) => {
        setChatHistory(data);
        setChatId(null);
        setChats([]);
      });
  };

  const getOneChatHistory = (chatId) => {
    setChatId(chatId);
    axiosInstance()
      .get(`/generative-ai/chat/${chatId}`)
      .then(({ data: { data } }) => {
        setChats(data?.history);
        setChatTitle(data?.title);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const askQuestion = () => {
    const tempChat = [...chats];
    setChats([...chats, { message: question, content: null }]);
    const body: any = { question: question };
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
          setChats([...tempChat, message]);
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

  const handleExportChat = async () => {
    try {
      const colName = ['Message', 'Content'];

      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.aoa_to_sheet([colName]);

      chats.forEach((item, index) => {
        const rowIndex = index + 1;
        xlsx.utils.sheet_add_aoa(ws, [[item.message, item.content]], { origin: `A${rowIndex + 1}` });
      });

      for (let col = 0; col < colName.length; col++) {
        const cellRef = xlsx.utils.encode_cell({ r: 0, c: col });
        ws[cellRef].s = {
          font: { bold: true },
          alignment: { horizontal: 'center' }
        };
      }

      for (let row = 1; row <= chats.length; row++) {
        for (let col = 0; col < colName.length; col++) {
          const cellRef = xlsx.utils.encode_cell({ r: row, c: col });
          ws[cellRef].s = {
            alignment: { horizontal: 'left', vertical: 'center', wrapText: true, truncation: true }
          };
        }
      }

      ws['!cols'] = [{ wch: 40 }, { wch: 100 }];

      xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
      xlsx.writeFile(wb, `${chatTitle}.xlsx`);
    } catch (err) {
      toastConfig.setToastConfig(err);
    }
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: routes.equiptAi.title }]} />
      </div>
      <CustomContainer className="!min-h-[var(--container-height)] !p-0 [--container-height:calc(100vh-150px)] max-[768px]:[--container-height:calc(100vh-179px)]">
        <div className="relative flex h-[var(--container-height)] min-h-[400px] gap-3 overflow-hidden [--head-h:56px] [--sidebar-w:280px]">
          <HistorySidebar
            chatHistory={chatHistory}
            hadleNewChat={hadleNewChat}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            chatId={chatId}
            getOneChatHistory={getOneChatHistory}
            handleDelete={handleDelete}
            isMobile={isMobile}
          />
          <div
            className={cn(
              'relative min-h-full flex-grow p-[15px] transition-all duration-300 md:p-[25px]',
              isSidebarOpen && !isMobile ? '' : 'ml-[calc(var(--sidebar-w)_*_-1_-_11px)] w-[calc(100%_+_var(--sidebar-w))]'
            )}
          >
            <div className="head mb-3 flex items-center justify-between gap-2">
              {!isSidebarOpen && (
                <div className="flex items-center gap-2">
                  <HtmlTooltip title={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}>
                    <IconButton size="small" onClick={() => setIsSidebarOpen((prev) => !prev)} style={{ padding: 8 }}>
                      <FiSidebar />
                    </IconButton>
                  </HtmlTooltip>
                  <ThemeButton
                    mobileTooltip="New Chat"
                    iconForMobile={<Chat fontSize={'small'} />}
                    color="primary"
                    borderColor="none"
                    startIcon={<Chat fontSize={'small'} />}
                    size="small"
                    onClick={() => hadleNewChat()}
                    style={{ padding: 8 }}
                  >
                    New Chat
                  </ThemeButton>
                </div>
              )}
              <div className="ml-auto">
                {chats?.length ? (
                  <HtmlTooltip title={'Download Chat'}>
                    <IconButton size="small" style={{ padding: 8 }} onClick={() => handleExportChat()}>
                      <DownloadIcon />
                    </IconButton>
                  </HtmlTooltip>
                ) : null}
              </div>
            </div>
            <DisplayMessages chats={chats} chatId={chatId} />
            <div className="absolute bottom-0 left-0 right-0 bg-[var(--dark-primary,white)] p-2">
              <div className="flex rounded-full bg-[#f2f2f2] p-2 [border:1px_solid_var(--common-border-color)]">
                <input
                  type="text"
                  name="question"
                  className="w-full border-0 bg-transparent px-4 text-[var(--primery-text)] outline-none"
                  placeholder="Message Equipt AI"
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
                  style={{ borderRadius: 999, padding: 10 }}
                  size="small"
                  disabled={question ? false : true}
                  onClick={askQuestion}
                  className={cn(question ? '!bg-[var(--new-theme-color)]' : '!bg-gray-300 dark:!bg-gray-800')}
                >
                  <FaArrowUp className="text-white" />
                </IconButton>
              </div>
              <span className="mx-auto block pt-2 text-center text-[12px] text-gray-400">Equipt AI can make mistakes. Check important info.</span>
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
  chatId: string | null;
  isMobile: boolean;
};

type ChatHistory = {
  _id: string;
  title: string;
  createdAt: Date;
};

const HistorySidebar = ({
  setIsSidebarOpen,
  isSidebarOpen,
  hadleNewChat,
  chatHistory,
  getOneChatHistory,
  handleDelete,
  chatId,
  isMobile
}: HistorySidebarProps) => {
  const [selectedChatHistory, setSelectedChatHistory] = useState<string>(null);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [groupedHistory, setGroupedHistory] = useState<Record<string, ChatHistory[]>>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setSelectedChatHistory(id);
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setSelectedChatHistory(null);
    setAnchorEl(null);
  };

  const handleDeleteWrapper = () => {
    handleCloseMenu();
    if (selectedChatHistory) handleDelete(selectedChatHistory);
  };

  const groupHistory = useCallback((history: ChatHistory[]) => {
    if (!history || !history?.length) return;
    const formatter = (date: Date) => {
      const momentDate = moment(date);
      const currentYear = moment().year();
      const currentMonth = moment().month();
      let format = '';

      if (momentDate.year() < currentYear) {
        format = momentDate.format('YYYY');
      } else if (momentDate.month() === currentMonth) {
        format = `Previous 30 days`;
      } else {
        // Current year (other than current month)
        format = momentDate.format('MMM');
      }
      return format;
    };

    const grouped = groupBy(history, (item) => formatter(item.createdAt));
    setGroupedHistory(grouped);
  }, []);

  function customSort(items) {
    // Separate items into three arrays: Previous 30 days, months, and years
    const months = [];
    const years = [];
    const monthArray = ['Dec', 'Nov', 'Oct', 'Sep', 'Aug', 'Jul', 'Jun', 'May', 'Apr', 'Mar', 'Feb', 'Jan'];

    for (const item of items) {
      if (item === 'Previous 30 days') {
      } else if (monthArray.includes(item)) {
        months.push(item);
      } else {
        years.push(item);
      }
    }
    // Sort months in reverse order
    months.sort((a, b) => monthArray.findIndex((d) => d === a) - monthArray.findIndex((d) => d === b));
    // Sort years in reverse order
    years.sort((a, b) => b.localeCompare(a));
    // Combine the arrays in the desired order
    return ['Previous 30 days', ...months, ...years];
  }

  useEffect(() => {
    groupHistory(chatHistory);
  }, [chatHistory, groupHistory]);

  return (
    <aside
      className={cn(
        'z-10 min-h-full w-[var(--sidebar-w)] flex-shrink-0 bg-[white] px-3 transition-transform duration-300 [border-right:1px_solid_var(--common-border-color)] dark:bg-[#070712]',
        isSidebarOpen ? '[transform:translateX(0)]' : '[transform:translateX(calc(var(--sidebar-w)_*_-1))]'
      )}
    >
      <div className="head flex min-h-[var(--head-h)] items-center justify-between gap-2 ">
        <HtmlTooltip title={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}>
          <IconButton size="small" onClick={() => setIsSidebarOpen((prev) => !prev)} style={{ padding: 8 }}>
            <FiSidebar />
          </IconButton>
        </HtmlTooltip>
        <ThemeButton
          mobileTooltip="New Chat"
          iconForMobile={<Chat fontSize={'small'} />}
          color="primary"
          borderColor="none"
          startIcon={<Chat fontSize={'small'} />}
          size="small"
          onClick={() => hadleNewChat()}
          style={{ padding: 8 }}
        >
          New Chat
        </ThemeButton>
      </div>
      <div className="body max-h-[calc(100%_-_var(--head-h))] overflow-y-auto">
        {groupedHistory ? (
          <>
            {customSort(Object.keys(groupedHistory)).map((date) => (
              <div key={date} className="mt-5">
                <h3 className="px-2 text-[12px] font-semibold text-gray-400 dark:text-gray-600">{date}</h3>
                <List dense>
                  {groupedHistory[date]?.map((history) => (
                    <ListItem
                      button
                      onClick={() => {
                        if (isMobile) setIsSidebarOpen(false);
                        getOneChatHistory(history._id);
                      }}
                      key={history._id}
                      className="group"
                      style={{ borderRadius: 8, padding: '4px 8px' }}
                      selected={chatId === history._id}
                    >
                      <ListItemText primary={<span className="line-clamp-1 text-[14px]">{history.title}</span>} />
                      <div
                        className={cn(
                          'absolute right-2 pl-6 opacity-0 group-hover:opacity-100  ',
                          chatId === history._id
                            ? '[background-image:linear-gradient(270deg,_#ebebeb_66%,_transparent_100%)] dark:[background-image:linear-gradient(270deg,_#2f2f38_60%,_transparent_100%)]'
                            : '[background-image:linear-gradient(270deg,_#f5f5f5_66%,_transparent_100%)] dark:[background-image:linear-gradient(270deg,_#1a1a25_60%,_transparent_100%)]'
                        )}
                      >
                        <IconButton edge="end" aria-label="delete" size="small" onClick={(event) => handleOpenMenu(event, history._id)}>
                          <MoreHorizIcon />
                        </IconButton>
                      </div>
                    </ListItem>
                  ))}
                </List>
              </div>
            ))}
          </>
        ) : (
          Array.from(Array(3).keys()).map((i) => (
            <ListItem button key={i} className="group" style={{ borderRadius: 8 }}>
              <ListItemText primary={<span className="line-clamp-1">{<Skeleton width={Math.random() * (200 - 100) + 100} height={20} />}</span>} />
              <div className="absolute right-2 pl-6 opacity-0 [background-image:linear-gradient(270deg,_#f5f5f5_66%,_transparent_100%)] group-hover:opacity-100 dark:[background-image:linear-gradient(270deg,_#212134_60%,_transparent_100%)] ">
                <IconButton edge="end" aria-label="delete" size="small">
                  <MoreHorizIcon />
                </IconButton>
              </div>
            </ListItem>
          ))
        )}
        {/* <List dense>
          {chatHistory ? (
            <>
              {chatHistory?.map((history) => (
                <ListItem
                  button
                  onClick={() => {
                    if (isMobile) setIsSidebarOpen(false);
                    getOneChatHistory(history._id);
                  }}
                  key={history._id}
                  className="group"
                  style={{ borderRadius: 8, padding: '4px 8px' }}
                  selected={chatId === history._id}
                >
                  <ListItemText primary={<span className="line-clamp-1">{history.title}</span>} />
                  <div
                    className={cn(
                      'absolute right-2 pl-6 opacity-0 group-hover:opacity-100  ',
                      chatId === history._id
                        ? '[background-image:linear-gradient(270deg,_#ebebeb_66%,_transparent_100%)] dark:[background-image:linear-gradient(270deg,_#2f2f38_60%,_transparent_100%)]'
                        : '[background-image:linear-gradient(270deg,_#f5f5f5_66%,_transparent_100%)] dark:[background-image:linear-gradient(270deg,_#1a1a25_60%,_transparent_100%)]'
                    )}
                  >
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
        </List> */}
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
  chatId: string;
};

const DisplayMessages = ({ chats, chatId }: DisplayMessagesProps) => {
  const toastConfig = useContext(CustomToastContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const [speakerState, setSpeakerState] = useState({ isPlaying: false, isPaused: false, isFinished: false, isLoading: false });
  const speakerInstance = useRef<Speak>(new Speak(setSpeakerState)).current;
  const [currentIndex, setCurrentIndex] = useState<number>(null);
  const [openFeedbackDialog, setOpenFeedbackDialog] = useState({ open: false, data: null });

  useEffect(() => {
    containerRef.current?.scrollTo(0, containerRef.current?.scrollHeight || 0);
    return () => {
      speakerInstance.stop();
    };
  }, [chats, speakerInstance]);

  const RenderIcon = () => {
    if (speakerState.isLoading) {
      return <CgSpinner className=" animate-spin " />;
    }
    if (speakerState.isPlaying) {
      return <HiOutlineSpeakerXMark size={15} />;
    }
    if (speakerState.isFinished) {
      return <HiOutlineSpeakerWave size={15} />;
    }
    if (speakerState.isPaused) {
      return <HiOutlineSpeakerWave size={15} />;
    }
    return <HiOutlineSpeakerWave size={15} />;
  };

  if (!chatId && !chats?.length) {
    return (
      <div className="flex h-[calc(100%_-_var(--head-h)_-_100px)] w-full items-center justify-center">
        <BsStars className="text-[var(--new-theme-color)]" size={50} />
      </div>
    );
  }
  return (
    <div className="max-h-[calc(100%_-_var(--head-h)_-_100px)] overflow-y-auto scroll-smooth" ref={containerRef}>
      {chats ? (
        <>
          {chats?.map((chat, i) => {
            const isLastChat = i === chats.length - 1;
            return (
              <div key={i}>
                <div className="m-[18px_20px] ml-auto w-fit max-w-[75%] rounded-md bg-[#f4f4f4] p-[10px_20px] text-right dark:bg-[var(--dark-secondary)]">
                  {chat?.message}
                </div>
                <div className="group m-[18px_20px]  flex max-w-[75%] items-start gap-2 rounded-md p-[10px_20px]">
                  <BsStars className="flex-shrink-0 text-[var(--new-theme-color)]" size={25} />
                  {chat?.content ? (
                    <div>
                      {chat?.content}
                      <div
                        className={cn(
                          'mt-1 flex max-w-fit items-center gap-2 transition-opacity',
                          isLastChat ? '' : 'rounded-xl p-[3px] opacity-0 [border:1px_solid_var(--common-border-color)] group-hover:opacity-100'
                        )}
                      >
                        <HtmlTooltip title={speakerState.isPlaying ? 'Stop' : 'Read Aloud'}>
                          <IconButton
                            size="small"
                            style={{ width: 30, height: 30, borderRadius: 8 }}
                            onClick={() => {
                              if (speakerInstance.text === chat?.content) {
                                if (speakerState.isPaused) {
                                  speakerInstance.play(chat?.content);
                                } else {
                                  speakerInstance.pause();
                                }
                              } else {
                                setCurrentIndex(i);
                                speakerInstance.play(chat?.content);
                              }
                            }}
                          >
                            {currentIndex === i ? <RenderIcon /> : <HiOutlineSpeakerWave size={15} />}
                          </IconButton>
                        </HtmlTooltip>
                        <HtmlTooltip title={'Copy'}>
                          <IconButton
                            size="small"
                            style={{ width: 30, height: 30, borderRadius: 8 }}
                            onClick={() =>
                              copyTextToClipboard(chat?.content, () => {
                                toastConfig.setToastConfig({
                                  open: true,
                                  type: 'success',
                                  message: `Text copied!`
                                });
                              })
                            }
                          >
                            <LuCopy size={15} />
                          </IconButton>
                        </HtmlTooltip>
                        <HtmlTooltip title={'Bad Response'}>
                          <IconButton size="small" style={{ width: 30, height: 30, borderRadius: 8 }}>
                            <BiDislike
                              size={15}
                              onClick={() => setOpenFeedbackDialog({ open: true, data: { message: chat.message, content: chat.content } })}
                            />
                          </IconButton>
                        </HtmlTooltip>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="m-[10px_10px] rounded-md bg-[#f4f4f4] p-[10px_10px] text-right dark:bg-[var(--dark-secondary)]">
                        <Skeleton width={300} height={15} />
                      </div>
                      <div className="m-[10px_10px] rounded-md bg-[#f4f4f4] p-[10px_10px] text-right dark:bg-[var(--dark-secondary)]">
                        <Skeleton width={300} height={15} />
                      </div>
                    </div>
                  )}
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
      {openFeedbackDialog.open && (
        <AiChatFeedback handleClose={() => setOpenFeedbackDialog({ open: false, data: null })} chatData={openFeedbackDialog.data} chatId={chatId} />
      )}
    </div>
  );
};
