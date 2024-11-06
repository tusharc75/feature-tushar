import { Dialog, DialogContent, IconButton } from '@material-ui/core';
import { Mic } from '@material-ui/icons';
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import { cn, CustomDialogTransition } from 'src/constants/helpers';
import { useVoiceRecognition } from 'src/hooks';

type VoiceInputProps = {
  setMessage: Dispatch<SetStateAction<string>>;
};

let timeout: NodeJS.Timeout;
const VoiceInput = ({ setMessage }: VoiceInputProps) => {
  const { browserSupportsSpeechRecognition, listening, resetTranscript, startListening, stopListening, transcript, voiceIntensity } =
    useVoiceRecognition();
  const [open, setOpen] = useState(false);

  const openDialog = () => {
    startListening();
    setOpen(true);
  };

  const handleCLose = useCallback(() => {
    stopListening();
    setMessage(transcript);
    setOpen(false);
    setTimeout(() => {
      resetTranscript();
    }, 200);
  }, [resetTranscript, setMessage, stopListening, transcript]);

  useEffect(() => {
    if (transcript && !listening) {
      timeout = setTimeout(() => {
        handleCLose();
      }, 3000);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [listening, transcript, setMessage, handleCLose]);

  return (
    <>
      {browserSupportsSpeechRecognition && (
        <IconButton size="small" onClick={openDialog} style={{ padding: 4, borderRadius: 10 }}>
          <Mic />
        </IconButton>
      )}
      <Dialog
        open={open}
        TransitionComponent={CustomDialogTransition}
        keepMounted
        onClose={handleCLose}
        fullWidth={true}
        fullScreen
        aria-labelledby="alert-dialog-slide-title"
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogContent style={{ padding: 30, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="flex items-center justify-center gap-5">
            <p className="max-w-[min(100%,400px)] text-[20px] font-medium text-gray-500">{transcript ? transcript : 'Listening...'}</p>
            <div className="relative isolate mb-5 flex h-[70px] w-[70px] md:h-[100px] md:w-[100px]">
              <div
                className={cn(
                  'absolute inset-0 m-auto h-[calc(100%-3px)] w-[calc(100%-3px)] rounded-full bg-blue-500/25 transition-transform duration-300 dark:bg-white/25'
                )}
                style={{ transform: `scale(${voiceIntensity + 100}%)` }}
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[var(--dark-secondary,white)] shadow-md">
                <Mic className="text-[40px] text-red-500 md:!text-[50px]" />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VoiceInput;
