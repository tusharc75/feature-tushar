import { Box, Dialog, TextField } from '@mui/material';
import { useContext, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomDialogTransition } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const Comment = ({ onClose, file, onSuccess }) => {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setComment(event.target.value.trimStart());
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    axiosInstance()
      .put('/attachment/deleteRequest', { _id: file?._id, comment: comment, type: 'create' })
      .then(({ data }) => {
        setIsSubmitting(false);
        onSuccess();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog
      maxWidth="sm"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {}}
    >
      <>
        <CustomDialogHeader
          onClose={onClose}
          title={'Comment'}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
          showRequiredLabel={false}
        />
        <CustomDialogContent>
          <Box>
            <TextField
              id="outlined-multiline-static"
              label="Comment"
              placeholder={`Comment`}
              fullWidth
              multiline
              rows={4}
              value={comment}
              onChange={handleChange}
              variant="outlined"
              sx={{
                '& .MuiInputBase-root textarea': {
                  resize: 'vertical',
                  overflow: 'auto'
                }
              }}
            />
          </Box>
        </CustomDialogContent>
        <CustomDialogFooter>
          <ThemeButton buttonType="transparent" disabled={isSubmitting} onClick={onClose}>
            Cancel
          </ThemeButton>
          <ThemeButton
            disabled={isSubmitting}
            isLoading={isSubmitting}
            buttonType="theme"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            Submit
          </ThemeButton>
        </CustomDialogFooter>
      </>
    </Dialog>
  );
};

export default Comment;
