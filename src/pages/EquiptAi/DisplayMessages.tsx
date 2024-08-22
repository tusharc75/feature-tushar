import { Chip, IconButton } from '@material-ui/core';
import { useContext, useEffect, useRef, useState } from 'react';
import { BsStars } from 'react-icons/bs';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

import { Skeleton } from '@material-ui/lab';
import { BiDislike } from 'react-icons/bi';
import { CgSpinner } from 'react-icons/cg';
import { HiOutlineSpeakerWave, HiOutlineSpeakerXMark } from 'react-icons/hi2';
import { LuCopy } from 'react-icons/lu';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cn, copyTextToClipboard } from 'src/constants/helpers';
import AiChatFeedback from 'src/pages/EquiptAi/AiChatFeedback';
import { Speak } from 'src/pages/EquiptAi/Speak';

type DisplayMessagesProps = {
  chats: { message: string; content: string }[];
  chatId: string;
  selectedTopics: any[];
};

const DisplayMessages = ({ chats, chatId, selectedTopics }: DisplayMessagesProps) => {
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
      <>
        <div className=" flex flex-wrap items-center gap-2">
          {selectedTopics.map((t) => (
            <Chip key={t._id} variant="outlined" size="small" label={t.aiModelTopicName} />
          ))}
        </div>
        <div className="flex h-[calc(100%_-_var(--head-h)_-_100px)] w-full items-center justify-center">
          <BsStars className="text-[var(--new-theme-color)]" size={50} />
        </div>
      </>
    );
  }

  return (
    <div className="max-h-[calc(100%_-_var(--head-h)_-_100px)] overflow-y-auto scroll-smooth" ref={containerRef}>
      <div className="flex flex-wrap gap-2">
        {selectedTopics.map((t) => (
          <Chip key={t._id} variant="outlined" size="small" label={t.aiModelTopicName} />
        ))}
      </div>
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

export default DisplayMessages;
