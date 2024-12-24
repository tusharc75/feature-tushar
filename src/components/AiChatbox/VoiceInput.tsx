import { IconButton, Popover } from '@mui/material';
import { Mic } from '@material-ui/icons';
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import { cn, CustomDialogTransition } from 'src/constants/helpers';
import { useVoiceRecognition } from 'src/hooks';

type VoiceInputProps = {
  setMessage?: Dispatch<SetStateAction<string>>;
  onInputEnd?: (query: string) => Promise<void>;
  disabled?: boolean;
};

let timeout: NodeJS.Timeout;
const VoiceInput = ({ setMessage, onInputEnd, disabled = false }: VoiceInputProps) => {
  const { browserSupportsSpeechRecognition, listening, resetTranscript, startListening, stopListening, transcript, voiceIntensity } =
    useVoiceRecognition();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);

  const openDialog = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    startListening();
    setAnchor(e.currentTarget);
  };

  const handleCLose = useCallback(() => {
    stopListening();
    if (transcript.trim().length > 0) {
      setMessage?.(transcript);
      onInputEnd?.(transcript);
    }
    setAnchor(null);
    setTimeout(() => {
      resetTranscript();
    }, 200);
  }, [resetTranscript, setMessage, stopListening, transcript, onInputEnd]);

  useEffect(() => {
    if (transcript && !listening) {
      timeout = setTimeout(() => {
        handleCLose();
      }, 2000);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [listening, transcript, setMessage, handleCLose]);

  return (
    <>
      {browserSupportsSpeechRecognition && (
        <IconButton disabled={disabled} size="small" onClick={openDialog} style={{ padding: 4, borderRadius: 10 }}>
          <Mic />
        </IconButton>
      )}
      <Popover
        open={open}
        TransitionComponent={CustomDialogTransition}
        keepMounted
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        onClose={handleCLose}
        anchorEl={anchor}
        aria-labelledby="alert-dialog-slide-title"
        aria-describedby="alert-dialog-slide-description"
        PaperProps={{
          style: { borderRadius: 20, background: 'var(--dark-secondary, white)', width: 'min(100%, 350px)' }
        }}
      >
        <div className=" bg-[var(--dark-primary,white)] p-5 text-center shadow-md">
          <div className="relative isolate mx-auto mb-7 mt-4 flex h-[70px] w-[70px] md:h-[80px] md:w-[80px]">
            <div
              className={cn(
                'absolute inset-0 m-auto h-[calc(100%-3px)] w-[calc(100%-3px)] rounded-full bg-blue-500/25 transition-transform duration-300 dark:bg-white/25'
              )}
              style={{ transform: `scale(${voiceIntensity * 0.6 + 100}%)` }}
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[var(--dark-secondary,white)] shadow-md">
              <Mic className="text-[30px] text-red-500 md:!text-[40px]" />
            </div>
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            <p className="text-[16px] font-medium text-gray-500">{transcript ? transcript : 'Listening...'}</p>
          </div>
        </div>
      </Popover>
    </>
  );
};

export default VoiceInput;
