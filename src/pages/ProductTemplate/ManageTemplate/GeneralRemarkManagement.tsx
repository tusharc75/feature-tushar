import { Box, Dialog, Grid, makeStyles } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import React, { useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition } from 'src/constants/helpers';
import TinyMce from '../../../components/TinyMCE/index';

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
      >
        <CustomDialogHeader
          title={`General Remark`}
          onClose={(e, reason) => {
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
          <Button
            variant="contained"
            size="small"
            color="primary"
            onClick={() => {
              setGeneralRemarkOpen(false);
            }}
          >
            Close
          </Button>
        </CustomDialogFooter>
      </Dialog>
    </>
  );
};

export default GeneralRemarkManagement;
