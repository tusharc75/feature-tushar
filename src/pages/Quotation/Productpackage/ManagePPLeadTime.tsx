import { Button, Dialog } from '@material-ui/core';
import React, { useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import ConfirmCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomDialogTransition } from 'src/constants/helpers';

function ManagePPLeadTime({ data, onClose }) {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  return (
    <>
      <Dialog
        maxWidth="md"
        fullWidth
        open
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            onClose();
          }
        }}
      >
        <CustomDialogHeader
          title={'Motherchod'}
          onClose={(e, reason) => {
            onClose();
          }}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
        />
        datasdf sd fs df s d f sf
        <CustomDialogFooter>
          <Button
            type="button"
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => {
              onClose();
              setShowConfirmDialog(true);
            }}
          >
            Cancel
          </Button>
          <CustomButton
            loading={false}
            variant="contained"
            color="primary"
            disabled={
              false
              //   // loading || Object.keys(errors).length > 0 ? true : false
              //   uploadingImageOrFileProgress > 0 ||
              //   // isFieldNotTouched(quotationInitialData, values) ||
              //   loading
            }
            onClick={(e) => {
              e.preventDefault();
            }}
          >
            Save
          </CustomButton>
        </CustomDialogFooter>
        {showConfirmDialog ? (
          <ConfirmCancelDialog
            open={showConfirmDialog}
            onSave={() => {}}
            onClose={() => {
              setShowConfirmDialog(false);
              onClose();
            }}
          />
        ) : null}
      </Dialog>
    </>
  );
}

export default ManagePPLeadTime;
