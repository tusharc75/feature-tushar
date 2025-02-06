import { CircularProgress, IconButton, Typography } from '@mui/material';
import { Skeleton } from '@mui/material';
import { useContext, useRef, useState } from 'react';
import { BsStars } from 'react-icons/bs';
import Markdown from 'react-markdown';
import { TMessage } from 'src/components/AiChatbox/chatboxReducer';
import { getRandomNumber } from 'src/components/AiChatbox/utils';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cn } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

import { BiDislike } from 'react-icons/bi';
import { CgSpinner } from 'react-icons/cg';
import { HiOutlineSpeakerWave, HiOutlineSpeakerXMark } from 'react-icons/hi2';
import { LuCopy } from 'react-icons/lu';
import { copyTextToClipboard } from 'src/constants/helpers';
import { Speak } from 'src/components/AiChatbox/Speak';
import FeedbackDialog from 'src/components/AiChatbox/FeedbackDialog';

const RenderSingleChat = ({
  message,
  loading = false,
  chatId,
  align = 'left',
  status = '',
  error = ''
}: {
  message?: TMessage;
  loading?: boolean;
  chatId?: string;
  align?: 'left' | 'right';
  status?: string;
  error?: string;
}) => {
  const isUserMessage = message?.role === 'user' || false;
  const toastConfig = useContext(CustomToastContext);
  const [openFeedbackDialog, setOpenFeedbackDialog] = useState<{ open: boolean; data: { question: string; reply: string } }>({
    open: false,
    data: null
  });
  const [speakerState, setSpeakerState] = useState({ isPlaying: false, isPaused: false, isFinished: false, isLoading: false });
  const speakerInstance = useRef<Speak>(new Speak(setSpeakerState)).current;

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

  return (
    <>
      <div className={cn('py-[18px]', isUserMessage ? ' ml-auto' : 'flex gap-2 text-base ', loading ? 'w-full' : 'w-fit max-w-fit')}>
        {!isUserMessage && align === 'left' && (
          <span className="user mb-[6px] block text-[14px] font-medium" aria-hidden>
            <span className="flex h-10 w-10 items-center justify-center rounded-full [border:1px_solid_var(--common-border-color)]">
              <BsStars className="text-[var(--new-theme-color)]" />
            </span>
          </span>
        )}

        {error && (
          <Typography
            component={'pre'}
            variant="body2"
            className="!ml-[46px] whitespace-pre-wrap rounded-3xl bg-[#f4f4f4] px-[20px] py-[10px] text-[#fa3232] dark:bg-[#1e4358] dark:text-[#ffa8a8]"
          >
            {error}
          </Typography>
        )}
        {loading ? (
          <div
            className={cn(
              'w-[70%]',
              align === 'left' ? '' : 'ml-auto rounded-3xl bg-[#f4f4f4] px-[20px] py-[10px] text-[black] dark:bg-[#1e4358] dark:text-[white]'
            )}
          >
            <Skeleton animation="wave" />
            <Skeleton />
            <Skeleton animation="wave" />
            <Skeleton width={`${getRandomNumber(30, 80)}%`} className={align === 'left' ? 'mr-auto' : 'ml-auto'} />
          </div>
        ) : isUserMessage ? (
          <Typography
            component={'pre'}
            variant="body2"
            className="!ml-[46px] whitespace-pre-wrap rounded-3xl bg-[#f4f4f4] px-[20px] py-[10px] text-[black] dark:bg-[#1e4358] dark:text-[white]"
          >
            {message.content}
          </Typography>
        ) : (
          <div className="group prose relative rounded-lg pt-[8px] text-sm text-[var(--primary)] dark:text-white [&_pre]:whitespace-pre-wrap">
            <Markdown>{message.content}</Markdown>
            <div
              className={cn(
                'mt-1 flex max-w-fit items-center gap-2 rounded-xl p-[3px] opacity-0 transition-opacity [border:1px_solid_var(--common-border-color)] group-hover:opacity-100'
              )}
            >
              <HtmlTooltip title={speakerState.isPlaying ? 'Stop' : 'Read Aloud'}>
                <IconButton
                  size="small"
                  style={{ width: 30, height: 30, borderRadius: 8 }}
                  onClick={() => {
                    if (speakerInstance.text === message?.content) {
                      if (speakerState.isPaused) {
                        speakerInstance.play(message?.content);
                      } else {
                        speakerInstance.pause();
                      }
                    } else {
                      speakerInstance.play(message?.content);
                    }
                  }}
                >
                  <RenderIcon />
                </IconButton>
              </HtmlTooltip>
              <HtmlTooltip title={'Copy'}>
                <IconButton
                  size="small"
                  style={{ width: 30, height: 30, borderRadius: 8 }}
                  onClick={() =>
                    copyTextToClipboard(message?.content, () => {
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
                    onClick={() => setOpenFeedbackDialog({ open: true, data: { question: message.question, reply: message.content } })}
                  />
                </IconButton>
              </HtmlTooltip>
            </div>
          </div>
        )}
      </div>
      {openFeedbackDialog.open && (
        <FeedbackDialog handleClose={() => setOpenFeedbackDialog({ open: false, data: null })} chatData={openFeedbackDialog.data} chatId={chatId} />
      )}
    </>
  );
};

export default RenderSingleChat;
