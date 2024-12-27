import { Chip, IconButton, useMediaQuery } from '@mui/material';
import { useCallback, useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import Chatbox, { Topics, useChatboxReducer } from 'src/components/AiChatbox';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Chat } from '@mui/icons-material';
import { isArray } from 'lodash';
import { FiSidebar } from 'react-icons/fi';
import { DownloadIcon } from 'src/assets/svg/svgIcons';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { cn } from 'src/constants/helpers';
import HistorySidebar from 'src/pages/EquiptAi/HistorySidebar';
import SelectTopicModal from 'src/pages/EquiptAi/SelectTopicModal';
import { useData } from 'src/StateProvider/Provider';
import xlsx from 'xlsx-js-style';

const EquiptAi = () => {
  const {
    state: { permissions }
  }: any = useData();
  const [state, setState] = useChatboxReducer();
  const toastConfig = useContext(CustomToastContext);
  const isMobile = useMediaQuery('(max-width:768px)');
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const { chats, chatId, selectedTopics } = state;

  const [chatHistory, setChatHistory] = useState(null);
  const [chatTitle, setChatTitle] = useState('');
  const [topics, setTopics] = useState<any[]>(null);
  const [selectTopicModalOpen, setSelectTopicModalOpen] = useState(false);

  const fetchTopics = useCallback(async () => {
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
  }, [toastConfig]);

  useEffect(() => {
    if (permissions?.aiModelTopic?.isRead) {
      fetchTopics();
    }
  }, [fetchTopics, permissions?.aiModelTopic?.isRead]);

  const fetchChatHistory = useCallback(() => {
    axiosInstance()
      .get('/generative-ai/chat')
      .then(({ data: { data } }) => {
        setChatHistory(data);
        setState({ type: 'reset' });
      });
  }, [setState]);

  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  const getOneChatHistory = (chatId) => {
    setState({ type: 'setGlobalLoading', payload: true });
    axiosInstance()
      .get(`/generative-ai/chat/${chatId}`)
      .then(({ data: { data } }) => {
        const selectedTopics =
          isArray(data?.topics) && data?.topics?.length
            ? data?.topics?.map((e) => {
                return { _id: e.optionValue, aiModelTopicName: e.optionLabel };
              })
            : [];
        setState({ type: 'setSelectedTopics', payload: selectedTopics });
        setState({ type: 'setMessageFromHistory', payload: data });
        setChatTitle(data?.title);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setState({ type: 'setGlobalLoading', payload: false });
      });
  };

  const handleDelete = (id: string) => {
    if (chatId === id) {
      setState({ type: 'reset' });
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
    setState({ type: 'reset' });
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

  const setSelectedTopics = (topics: Topics[]) => {
    setState({ type: 'setSelectedTopics', payload: topics });
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: 'Equipt Genie' }]} />
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
              'relative flex min-h-full min-w-0 flex-grow flex-col p-[15px] transition-all duration-300 md:p-[25px]',
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
                    borderColor="none"
                    backgroundColor="theme"
                    textColor="white"
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
                {/* <Chip size="small" color="primary" label={'hi'} /> */}
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
            <Chatbox state={state} setState={setState} />
            <p className="absolute bottom-1 left-0 right-0 mx-auto block select-none pt-2 text-center text-[11px] text-gray-400">
              Equipt Genie can make mistakes. Check important info.
            </p>
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
