import { Dialog, TextField } from '@mui/material';
import { useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import MultiLine from 'src/components/Helpers/FormTypes/MultiLine';
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
        <MultiLine
          label="Comment"
          value={comment || ''}
          required={true}
          onChange={(e: any) => setComment(e.target.value)}
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
