import { Dialog } from '@material-ui/core';
import { useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition } from 'src/constants/helpers';
import CertificationHistory from '../SerializedAsset/CertificationHistory';

const CertificateHistoryDialog = ({ onClose, id, supplierAccount }) => {

  const [fullScreen, setFullScreen] = useState(true);

  return (
    <Dialog
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={() => onClose()}
    >
      <CustomDialogHeader
        onClose={() => {
          onClose();
        }}
        title={'Certificate Histrory'}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
        showRequiredLabel={false}
      />
      <CustomDialogContent>
        <CertificationHistory
          id={id}
          canIssueCertificate={false}
          supplierAccount={supplierAccount}
        />
      </CustomDialogContent>
    </Dialog>
  );
};


export default CertificateHistoryDialog;
