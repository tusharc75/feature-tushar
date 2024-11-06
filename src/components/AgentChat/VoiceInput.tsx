import { Dialog, DialogContent, IconButton } from '@material-ui/core';
import { Mic } from '@material-ui/icons';
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import { CustomDialogTransition } from 'src/constants/helpers';
import { useVoiceRecognition } from 'src/hooks';

type VoiceInputProps = {
  setMessage: Dispatch<SetStateAction<string>>;
};

let timeout: NodeJS.Timeout;
const VoiceInput = ({ setMessage }: VoiceInputProps) => {
  const { browserSupportsSpeechRecognition, listening, resetTranscript, startListening, stopListening, transcript } = useVoiceRecognition();
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
            <div className="mb-5 flex h-[70px] w-[70px] items-center justify-center rounded-full shadow-md md:h-[100px] md:w-[100px]">
              <Mic className="text-[50px] text-red-500 md:!text-[60px]" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VoiceInput;
