import { Dialog, TextField } from '@mui/material';
import React, { useContext, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomDialogTransition } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';

type FeedbackDialogProps = {
  handleClose: () => void;
  chatData: { question: string; reply: string };
  chatId: string;
};

const FeedbackDialog = ({ handleClose, chatData, chatId }: FeedbackDialogProps) => {
  const toastConfig = useContext(CustomToastContext);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    const { question, reply } = chatData;
    axiosInstance()
      .post(`/generative-ai/${chatId}/feedback`, {
        comment: comment,
        content: reply,
        message: question
      })
      .then(({ data: { data } }) => {
        setLoading(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Feedback given successfully'
        });
        handleClose();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoading(false);
      });
    setComment('');
  };

  return (
    <Dialog
      maxWidth="sm"
      fullScreen={ fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
    >
      <CustomDialogHeader
        onClose={() => handleClose()}
        title={'Feedback'}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      />
      <CustomDialogContent>
      <TextField
          fullWidth
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          variant="outlined"
          placeholder="Feedback"
          label={'Feedback'}
          multiline
          rows={2}
        />
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton buttonType="transparent" onClick={handleClose}>
          Cancel
        </ThemeButton>
        <ThemeButton disabled={comment === '' || loading} isLoading={loading} buttonType="theme" onClick={handleSubmit}>
          Save
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default FeedbackDialog;
