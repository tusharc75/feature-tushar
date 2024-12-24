import { Dialog } from '@mui/material';
import React from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition } from 'src/constants/helpers';

const MobileDialog = ({ onClose, children }) => {
  return (
    <Dialog open={true} fullWidth TransitionComponent={CustomDialogTransition} fullScreen>
      <CustomDialogHeader
        onClose={onClose}
        title={'Consumables Requests'}
        isMinimized={false}
        showRequiredLabel={false}
        showManimizeMaximize={false}
      />
      <CustomDialogContent isFooterPresent={false}>{children}</CustomDialogContent>
    </Dialog>
  );
};

export default MobileDialog;
