import { Dialog } from '@material-ui/core';
import { useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition } from 'src/constants/helpers';
import ChangesDialogContent from 'src/pages/ResourceLogs/ChangesDIalogContent';

const ChangesDialog = ({ open, onClose, changes, operations, updatedBy }) => {
  const [fullScreen, setFullScreen] = useState(true);

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={open}
      fullWidth
    >
      <CustomDialogHeader
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
        showRequiredLabel={false}
        title={`Changes`}
        onClose={onClose}
      />
      <CustomDialogContent isFooterPresent={false}>
        <ChangesDialogContent changes={changes} operations={operations} updatedBy={updatedBy} />
      </CustomDialogContent>
    </Dialog>
  );
};

export default ChangesDialog;
