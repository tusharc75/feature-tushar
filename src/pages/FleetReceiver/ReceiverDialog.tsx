import { Box, Button, CircularProgress, Dialog, Grid, TextField } from '@mui/material';
import React, { useContext, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FaDiceOne } from 'react-icons/fa';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import FormTypes from 'src/components/Helpers/FormTypes';
import { CustomDialogTransition } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const ReceiverDialog = ({ handleClose, handleSucess, data }) => {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [dispatchData, setDispatchData] = useState({ documents: [], signature: '' });

  const handleReceive = () => {
    setSubmitting(true);
    const value = {
      _id: data?._id,
      receiverComment: comment,
      receiverDocuments: dispatchData.documents,
      receiverSignature: dispatchData.signature
    };
    axiosInstance()
      .post(`/fleet-receiver`, value)
      .then(({ data }) => {
        setSubmitting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Received Successfully'
        });
        handleSucess();
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
      open={true}
    >
      <CustomDialogHeader
        title={'Receive Fleet'}
        onClose={(e, reason) => {
          handleClose();
        }}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      />
      <CustomDialogContent>
        <div className={'detail-box-content'}>
          <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
          <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{'Receive Fleet Details'}</h2>
        </div>
        <Box marginY={2}>
          <Grid spacing={2} container>
            <Grid item xs={12} sm={6} md={6}>
              <TextField variant="outlined" type="text" label="Job Number" fullWidth margin="dense" value={data?.job?.jobNumber} />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <TextField variant="outlined" type="text" label="PRS" fullWidth margin="dense" value={data?.asset?.assetNumber} />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <TextField variant="outlined" type="text" label="Fleet Number" fullWidth margin="dense" value={data?.fleet?.fleetNumber} />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <TextField variant="outlined" type="text" label="Location" fullWidth margin="dense" value={data?.job?.shippingAddress?.optionLabel} />
            </Grid>
          </Grid>
        </Box>
        <div className={'detail-box-content'}>
          <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
          <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{'Receiver Information'}</h2>
        </div>
        <Box marginY={2}>
          <Grid spacing={2} container>
            <Grid item xs={12} sm={6} md={6}>
              <FormTypes
                fieldData={null}
                values={dispatchData}
                errors={{}}
                touched={{}}
                label={'Signature'}
                name={'signature'}
                type={'signature'}
                options={[]}
                setFieldValue={(name, dataURL) => {
                  setDispatchData((prevState) => {
                    prevState.signature = dataURL;
                    return prevState;
                  });
                }}
                required={true}
                fullWidth
                isTooltip={false}
                tooltipMessage={''}
                size="small"
                imageOrFileUploadCompletePercentage={null}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <FormTypes
                fieldData={null}
                values={dispatchData}
                errors={{}}
                touched={{}}
                label={'Documents'}
                name={'documents'}
                type={'multiFileUpload'}
                options={[]}
                setFieldValue={(name, documents) => {
                  setDispatchData((prevState) => {
                    prevState.documents = documents;
                    return prevState;
                  });
                }}
                required={true}
                fullWidth
                isTooltip={false}
                tooltipMessage={''}
                size="small"
                imageOrFileUploadCompletePercentage={null}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <TextField
                variant="outlined"
                type="text"
                label="Comment"
                multiline
                fullWidth
                rows={3}
                margin="dense"
                value={comment}
                onChange={(e: any) => setComment(e.target.value)}
              />
            </Grid>
          </Grid>
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button
          type="button"
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => {
            handleClose();
          }}
        >
          Cancel
        </Button>
        <CustomButton
          loading={false}
          variant="contained"
          color="primary"
          startIcon={submitting && <CircularProgress size={20} color="inherit" />}
          disabled={submitting}
          onClick={(e) => {
            handleReceive();
          }}
        >
          Receive
        </CustomButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default ReceiverDialog;
