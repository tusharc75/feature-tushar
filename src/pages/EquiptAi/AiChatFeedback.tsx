import { useState, useContext } from 'react';
import { Dialog } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { TextField, Button, Grid } from '@material-ui/core';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomDialogTransition } from 'src/constants/helpers';

const Comments = ({ handleClose, chatData, chatId }) => {
  const toastConfig = useContext(CustomToastContext);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    const { message, content } = chatData;
    axiosInstance()
      .post(`/generative-ai/${chatId}/feedback`, {
        comment: comment,
        content: content,
        message: message
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
      fullScreen={false}
      TransitionComponent={CustomDialogTransition}
      fullWidth
      maxWidth="sm"
      open={true}
      onClose={handleClose}
      aria-labelledby="comments-dialog"
    >
      <CustomDialogHeader title={`Feedback`} showRequiredLabel={false} onClose={handleClose} showManimizeMaximize={false} />
      <CustomDialogContent style={{ padding: '18px 24px 12px' }}>
        <Grid container justifyContent="center" alignItems="center" spacing={2}>
          <Grid item xs={12}>
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
          </Grid>
        </Grid>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button variant="outlined" color="primary" size="small" onClick={handleClose}>
          Cancel
        </Button>
        <CustomButton disabled={comment === '' || loading} loading={loading} variant="contained" color="primary" size="small" onClick={handleSubmit}>
          Save
        </CustomButton>
      </CustomDialogFooter>
    </Dialog>
  );
};
export default Comments;
