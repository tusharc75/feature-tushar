import { Box, Button, CircularProgress, Dialog, Grid, IconButton, TextField, Typography } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import React, { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import ConfirmCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomDialogTransition, leadTimeStatusDropdown, quotation } from 'src/constants/helpers';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import { FaDiceOne } from 'react-icons/fa';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

function LeadTimeDialog({ quotationId, data, onClose, handleSucess }) {
  const toastConfig = useContext(CustomToastContext);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leadTimeMasterSteps, setLeadTimeMasterSteps] = useState(data?.leadTime || []);
  const [totalDays, setTotalDays] = useState(0);
  console.log(data);
  const handleSubmit = () => {
    setLoading(true);
    const value = {
      leadTime: leadTimeMasterSteps,
      _id: data?._id
    };

    axiosInstance()
      .put(`${quotation.api}/service/${quotationId}/lead-time`, value)
      .then((res) => {
        setLoading(false);
        handleSucess();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Lead time updated successfully'
        });
      })
      .catch((err) => {
        setLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleAddLTMSteps = () => {
    setLeadTimeMasterSteps([...leadTimeMasterSteps, { leadTimeStatus: '', days: '' }]);
  };

  const handleRemoveLTMSteps = (index) => {
    const data = leadTimeMasterSteps?.filter((e, i) => i !== index);
    setLeadTimeMasterSteps(data);
    setTotalDays(data?.reduce((acc, curr) => acc + parseInt(curr.days), 0));
  };

  const handleOnDaysChangeValue = (index, value) => {
    const data = [...leadTimeMasterSteps];
    data[index].days = parseInt(value) ?? 0;
    setLeadTimeMasterSteps(data);
    setTotalDays(data?.reduce((acc, curr) => acc + parseInt(curr.days), 0));
  };

  const handleOnLTMStatusChangeValue = (index, value) => {
    const data = [...leadTimeMasterSteps];
    data[index].leadTimeStatus = value;
    setLeadTimeMasterSteps(data);
  };

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
          title={data?.productDetail?.productName || data?.serviceDetail?.serviceName || data?.packageDetail?.packageName || 'mother'}
          onClose={(e, reason) => {
            onClose();
          }}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
        />
        <CustomDialogContent>
          <Grid container>
            <Grid item xs={12}>
              <Box style={{ maxHeight: '350px', overflow: 'auto' }} bgcolor="white" border={1} mt={2} mb={1} borderColor="grey.300" width={'100%'}>
                <Box p={1} bgcolor="grey.200">
                  <Grid container xs={12}>
                    <Grid item xs={6}>
                      <Typography variant="body2">Lead Time Status</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2">{leadTimeMasterSteps?.length && totalDays ? `${totalDays} Days` : 'Days'}</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Grid container justifyContent="flex-end">
                        <IconButton
                          size="small"
                          aria-label="setting"
                          onClick={() => {
                            handleAddLTMSteps();
                          }}
                        >
                          <AddCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Grid>
                </Box>
                {leadTimeMasterSteps?.map((steps, index) => (
                  <Box key={index} bgcolor="white" p={1} borderTop={1} borderColor="grey.300" width={'100%'}>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Autocomplete
                          options={leadTimeStatusDropdown || []}
                          getOptionLabel={(option) => option}
                          value={steps?.leadTimeStatus || ''}
                          onChange={(event: any, value) => {
                            handleOnLTMStatusChangeValue(index, value);
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Lead Time Status"
                              variant="outlined"
                              size="small"
                              fullWidth
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: <React.Fragment>{params.InputProps.endAdornment}</React.Fragment>
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          id="Days-Field"
                          variant="outlined"
                          margin="dense"
                          name="Days"
                          label="Days"
                          type="number"
                          fullWidth
                          style={{ margin: 0 }}
                          value={steps?.days || ''}
                          onChange={(event) => handleOnDaysChangeValue(index, event.target.value)}
                        />
                      </Grid>
                      <Grid item xs={2}>
                        <Grid container justifyContent="flex-end">
                          <IconButton size="small" aria-label="setting" onClick={() => handleRemoveLTMSteps(index)}>
                            <RemoveCircleOutlineIcon fontSize="small" />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </CustomDialogContent>
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
            loading={loading}
            variant="contained"
            color="primary"
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              handleSubmit();
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

export default LeadTimeDialog;
