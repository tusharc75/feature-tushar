import { DateSelectArg } from '@fullcalendar/core';
import { Dialog } from '@mui/material';
import { useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomDialogTransition } from 'src/constants/helpers';

type OnRangeSelectDialogProps = {
  onClose: (event: {}, reason: 'backdropClick' | 'escapeKeyDown' | ('' & {})) => void;
  selectedRange: DateSelectArg;
};

const OnRangeSelectDialog = ({ onClose, selectedRange }: OnRangeSelectDialogProps) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  return (
    <Dialog
      open={true}
      slotProps={{
        transition: CustomDialogTransition
      }}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
    >
      <CustomDialogHeader
        onClose={() => onClose({}, '')}
        title={`Range Changed`}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      />
      <CustomDialogContent isFooterPresent={true}>
        <p>{selectedRange.start.toLocaleString()}</p>
        <p>{selectedRange.end.toLocaleString()}</p>
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton buttonType="transparent" onClick={() => onClose({}, '')}>
          Cancel
        </ThemeButton>

        <ThemeButton
          buttonType="theme"
          onClick={(e) => {
            onClose({}, '');
          }}
        >
          Save
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default OnRangeSelectDialog;
