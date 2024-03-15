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

function LeadTimeDialog({ quotationId, data, versionId, onClose, handleSucess }) {
  const toastConfig = useContext(CustomToastContext);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leadTimeMasterSteps, setLeadTimeMasterSteps] = useState(data?.leadTimeData || []);
  const [totalDays, setTotalDays] = useState(0);

  const handleSubmit = () => {
    setLoading(true);
    const value = {
      leadTime: leadTimeMasterSteps,
      _id: data?._id
    };
   let api = '';
   if(data.type==='Manual Entry'){
    api = `${quotation.api}/additionalcost/${quotationId}/${versionId}/lead-time`
   }else{
    api = `${quotation.api}/productpackage/${quotationId}/${versionId}/lead-time`
   }
    axiosInstance()
      .put(api, value)
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
          title={
            data?.detail ||
            data?.productDetail?.productName ||
            data?.serviceDetail?.serviceName ||
            data?.packageDetail?.packageName ||
            'Lead Time Status'
          }
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
          <Box className="rounded-md" border={1} mt={2} mb={1} borderColor="var(--common-border-color)" width={'100%'}>
            <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[6fr_4fr_auto] gap-2 p-2">
              <Typography variant="body2" className="pl-3  sm:block hidden">
                Lead Time Status
              </Typography>

              <Typography variant="body2" className="pl-3 ">
                {leadTimeMasterSteps?.length && totalDays ? `${totalDays} Days` : 'Days'}
              </Typography>

              <div className="sm:mr-[4px_!important] mr-0">
                <IconButton
                  size="small"
                  aria-label="setting"
                  onClick={() => {
                    handleAddLTMSteps();
                  }}
                >
                  <AddCircleOutlineIcon fontSize="small" />
                </IconButton>
              </div>
            </div>
            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {leadTimeMasterSteps?.map((steps, index) => (
                <Box
                  key={index}
                  borderTop={1}
                  borderColor="var(--common-border-color)"
                  className="grid grid-cols-[1fr_auto] sm:grid-cols-[6fr_4fr_auto]  gap-2 p-2"
                >
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
                  <div className="col-span-1 col-start-1 sm:col-span-[unset] sm:col-start-[unset]">
                    <TextField
                      id="Days-Field"
                      variant="outlined"
                      margin="dense"
                      name="Days"
                      label="Days"
                      type="number"
                      onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                      fullWidth
                      style={{ margin: 0 }}
                      value={steps?.days || ''}
                      onChange={(event) => handleOnDaysChangeValue(index, event.target.value)}
                    />
                  </div>
                  <IconButton size="small" aria-label="setting" onClick={() => handleRemoveLTMSteps(index)}>
                    <RemoveCircleOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </div>
          </Box>
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
