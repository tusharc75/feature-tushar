import { Box, Dialog } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition } from 'src/constants/helpers';
import TinyMce from '../../../components/TinyMCE/index';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const GeneralRemarkManagement = (props) => {
  const { classes, generalRemarkOpen, setGeneralRemarkOpen, generalRemarkData, setGeneralRemarkData, initialValues } = props;
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  return (
    <>
      <Dialog
        maxWidth="md"
        fullWidth
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="General Remark Title"
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            setGeneralRemarkOpen(false);
          }
        }}
        open={generalRemarkOpen}
        disableEnforceFocus={true}
      >
        <CustomDialogHeader
          title={`General Remark`}
          onClose={() => {
            setGeneralRemarkOpen(false);
          }}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
        />
        <CustomDialogContent>
          <Grid container spacing={2}>
            <Box className={classes.tinyMCEContainer}>
              <TinyMce
                id="generalRemark"
                onChange={(e) => {
                  setGeneralRemarkData(e);
                }}
                width={'100%'}
                height={300}
                initialValue={initialValues?.generalRemark || ''}
                imageOrFileUploadCompletePercentage={(completePercentage) => null}
                isCheckHeight={true}
                doNotShowUploadFile={true}
              />
            </Box>
          </Grid>
        </CustomDialogContent>
        <CustomDialogFooter>
          <ThemeButton
            onClick={() => {
              setGeneralRemarkOpen(false);
            }}
            buttonType='transparent'
          >
            Close
          </ThemeButton>
        </CustomDialogFooter>
      </Dialog>
    </>
  );
};

export default GeneralRemarkManagement;
