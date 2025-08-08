import { useState } from 'react';
import { Dialog } from '@mui/material';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import DownloadHistory from 'src/components/PreviewDownload/DownloadHistory';
import { ThemeButton } from 'src/components/Helpers/Buttons';

export const AsyncDownloadDialog = ({ handleClose, loadingType, resource, referenceId, btnLoading, generatePdf }) => {

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  return (
    <>
      <Dialog
        open={true}
        aria-labelledby="customized-dialog-title"
        maxWidth="sm"
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            handleClose();
          }
        }}
        fullWidth
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
      >
        <CustomDialogHeader
          title={`History`}
          onClose={() => {
            handleClose();
          }}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
          showRequiredLabel={false}
        />
        <CustomDialogContent>
          <ThemeButton
            id={'details-page-preview-button'}
            mobileTooltip="Generate PDF"
            buttonType='theme'
            disabled={btnLoading ? true : false}
            onClick={generatePdf}
          >
            Generate PDF
          </ThemeButton>
          <DownloadHistory referenceId={referenceId} resource={resource} loadingType={loadingType} />
        </CustomDialogContent>
      </Dialog >
    </>
  );
};
