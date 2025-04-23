import { Box, Dialog, TextField } from '@mui/material';
import { useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomDialogTransition } from 'src/constants/helpers';

const Comment = ({ onClose }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    setComment(event.target.value.trimStart());
  };

  return (
    <Dialog
      maxWidth="md"
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
          <ThemeButton
            buttonType="transparent"
            // disabled={isSubmitting || loading}
            onClick={() => {}}
          >
            Cancel
          </ThemeButton>
          <ThemeButton
            // disabled={isSubmitting || loading}
            isLoading={false}
            buttonType="theme"
            onClick={(e) => {
              e.preventDefault();
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
