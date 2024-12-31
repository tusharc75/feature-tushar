import { TextField } from '@mui/material';
import React, { useContext, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import DashboardModal from 'src/components/DashboardModal';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomDialogTransition } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

type FeedbackDialogProps = {
  handleClose: () => void;
  chatData: { question: string; reply: string };
  chatId: string;
};

const FeedbackDialog = ({ handleClose, chatData, chatId }: FeedbackDialogProps) => {
  const toastConfig = useContext(CustomToastContext);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

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
    <DashboardModal
      open={true}
      handleClose={handleClose}
      dialogProps={{
        fullScreen: false,
        TransitionComponent: CustomDialogTransition,
        maxWidth: 'sm'
      }}
      modalHead={{
        title: `Create Channel`,
        fullScreenOption: true
      }}
      footer={
        <>
          <ThemeButton buttonType="transparent" onClick={handleClose}>
            Cancel
          </ThemeButton>
          <ThemeButton disabled={comment === '' || loading} isLoading={loading} buttonType="theme" onClick={handleSubmit}>
            Save
          </ThemeButton>
        </>
      }
    >
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
    </DashboardModal>
  );
};

export default FeedbackDialog;
