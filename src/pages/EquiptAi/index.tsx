import { Chip, IconButton, useMediaQuery } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import { FaArrowUp } from 'react-icons/fa6';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

import { Chat } from '@material-ui/icons';
import { FiSidebar } from 'react-icons/fi';
import { DownloadIcon } from 'src/assets/svg/svgIcons';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { cn } from 'src/constants/helpers';
import HistorySidebar from 'src/pages/EquiptAi/HistorySidebar';
import xlsx from 'xlsx-js-style';
import DisplayMessages from 'src/pages/EquiptAi/DisplayMessages';
import { useData } from 'src/StateProvider/Provider';
import SelectTopicModal from 'src/pages/EquiptAi/SelectTopicModal';
import { isArray } from 'lodash';

const EquiptAi = () => {
  const {
    state: { permissions }
  }: any = useData();
  const toastConfig = useContext(CustomToastContext);
  const isMobile = useMediaQuery('(max-width:768px)');
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [chats, setChats] = useState(null);
  const [chatTitle, setChatTitle] = useState('');
  const [topics, setTopics] = useState<any[]>(null);
  const [selectedTopics, setSelectedTopics] = useState<any[]>([]);
  const [selectTopicModalOpen, setSelectTopicModalOpen] = useState(false);

  const fetchTopics = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`dynamic-form`, {
        headers: {
          Resource: 'Ai Model Topic'
        }
      });
      setTopics(data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    if (permissions?.aiModelTopic?.isRead) {
      fetchTopics();
    }
  }, []);

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
        setSelectedTopics(
          isArray(data?.topics) && data?.topics?.length
            ? data?.topics?.map((e) => {
                return { _id: e.optionValue, aiModelTopicName: e.optionLabel };
              })
            : []
        );
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
    const body: any = { question: question, topicIds: selectedTopics.map((d) => d._id) };
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
    setSelectedTopics([]);
    if (topics?.length) {
      handleOpenTopicModal();
    }
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

  const handleOpenTopicModal = () => {
    setSelectTopicModalOpen(true);
  };
  const handleCloseTopicModal = () => {
    setSelectTopicModalOpen(false);
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
              'relative min-h-full min-w-0 flex-grow p-[15px] transition-all duration-300 md:p-[25px]',
              isSidebarOpen && !isMobile ? '' : 'ml-[calc(var(--sidebar-w)_*_-1_-_11px)] w-[calc(100%_+_var(--sidebar-w))]'
            )}
          >
            <div className="head mb-3 flex items-center justify-between gap-3">
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
                    style={{ padding: 8, minWidth: 'max-content' }}
                  >
                    New Chat
                  </ThemeButton>
                </div>
              )}
              <div className="flex min-w-0 gap-2 overflow-x-auto py-1">
                {selectedTopics?.map((t) => <Chip size="small" key={t._id} color="primary" label={t?.aiModelTopicName} />)}
              </div>
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
            <DisplayMessages chats={chats} chatId={chatId} selectedTopics={selectedTopics} />
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
                  autoComplete="off"
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
      {selectTopicModalOpen && (
        <SelectTopicModal handleClose={handleCloseTopicModal} selectedTopics={selectedTopics} setSelectedTopics={setSelectedTopics} topics={topics} />
      )}
    </section>
  );
};

export default EquiptAi;
