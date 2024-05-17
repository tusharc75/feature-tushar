import { useContext, useEffect, useState } from 'react';
import Button from '@material-ui/core/Button';
import { CustomDialogTransition, sidebarResource, workOrder } from 'src/constants/helpers';
import { Box, CircularProgress, Dialog, TextField } from '@material-ui/core';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import Autocomplete from '@material-ui/lab/Autocomplete/Autocomplete';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import routes from 'src/components/Helpers/Routes';

const AssignWorkStationDialog = ({ wellNumberOptions, assets, handleClose, handleSucess }) => {
  const toastConfig = useContext(CustomToastContext);
  const [selectedWellNumbers, setSelectedWellNumbers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  
  const handleAssign = () => {
    setSubmitting(true)
    const api = `${routes?.serializedAsset?.path}/update-well-number`;
    const payload = {
      wellNumbers: selectedWellNumbers?.map((d) => d.optionValue),
      assetIds: assets
    };
    axiosInstance()
      .put(api, payload)
      .then(({ data }) => {
        setSubmitting(false)
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        handleSucess();
      })
      .catch((err) => {
        setSubmitting(false)
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <Dialog
      maxWidth="sm"
      fullScreen={isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
    >
      <CustomDialogHeader onClose={handleClose} title={`Change Well Numbers`} showRequiredLabel={false} showManimizeMaximize={false} />
      <CustomDialogContent>
        <Box m={1}>
          <Autocomplete
            size="small"
            options={wellNumberOptions}
            multiple
            value={selectedWellNumbers}
            onChange={(_, val) => {
              setSelectedWellNumbers(val);
            }}
            getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
            getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
            renderInput={(props) => <TextField {...props} placeholder={''} variant="outlined" name="wellNumberList" label={'Well Numbers'} />}
          />
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button variant="outlined" color="primary" size="small" onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <CustomButton
          variant="contained"
          color="primary"
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            handleAssign();
          }}
          disabled={submitting}
          endIcon={submitting && <CircularProgress color="inherit" size={18} />}
        >
          {' '}
          Save
        </CustomButton>
      </CustomDialogFooter>
    </Dialog>
  );
};
export default AssignWorkStationDialog;
