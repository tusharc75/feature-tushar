import { Dialog, TextField } from '@mui/material';
import { useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomDialogTransition } from 'src/constants/helpers';

export default function QCcomment({ onClose, onSubmit, type }) {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [rejectSubmission, setRejectSubmission] = useState(false);
  const [comment, setComment] = useState('');

  return (
    <Dialog open onClose={onClose} fullWidth TransitionComponent={CustomDialogTransition}>
      <CustomDialogHeader
        title={`Reason for ${type === 'reject' ? 'rejection' : 'accptance'}`}
        onClose={onClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      />
      <CustomDialogContent>
        <TextField
          variant="outlined"
          type="text"
          label="Comment"
          multiline
          rows={4}
          required={true}
          name={'comment'}
          fullWidth
          margin="dense"
          size="small"
          value={comment || ''}
          onChange={(e) => {
            setComment(e.target.value);
          }}
        />
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton buttonType="transparent" onClick={onClose}>
          Cancel
        </ThemeButton>
        <ThemeButton
          buttonType="theme"
          onClick={() => {
            onSubmit(type, comment);
          }}
        >
          Submit
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
}
