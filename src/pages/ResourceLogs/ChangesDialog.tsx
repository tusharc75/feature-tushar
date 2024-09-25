import { Dialog } from '@material-ui/core';
import moment from 'moment';
import { useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, dateTimeFormat } from 'src/constants/helpers';
import ChangesDialogContent from 'src/pages/ResourceLogs/ChangesDialogContent';

const ChangesDialog = ({ open, onClose, data }) => {
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
        title={`Changes - ${data?.referenceId?.optionLabel || ''} - ${data?.updatedBy?.optionLabel || ''} - ${moment(data?.date)?.format(dateTimeFormat)}`}
        onClose={onClose}
      />
      <CustomDialogContent isFooterPresent={false}>
        <ChangesDialogContent
          changes={data?.changes || []}
          operations={data?.operations || []}
          updatedBy={data?.updatedBy?.optionValue} />
      </CustomDialogContent>
    </Dialog>
  );
};

export default ChangesDialog;
