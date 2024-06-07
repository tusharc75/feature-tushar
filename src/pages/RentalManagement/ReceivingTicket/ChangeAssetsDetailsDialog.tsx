import { useContext, useState } from 'react';
import Button from '@material-ui/core/Button';
import { CustomDialogTransition, } from 'src/constants/helpers';
import { Box, Dialog, TextField } from '@material-ui/core';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import Autocomplete from '@material-ui/lab/Autocomplete/Autocomplete';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import routes from 'src/components/Helpers/Routes';

const ChangeAssetsDetailsDialog = ({ wellNumberOptions, assets, handleClose, handleSucess }) => {

  const toastConfig = useContext(CustomToastContext);
  const [selectedWellNumbers, setSelectedWellNumbers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    setSubmitting(true)
    const data = []
    assets?.forEach((e) => {
      data.push({ _id: e, wellNumber: selectedWellNumbers?.map((d) => d.optionValue) })
    })
    axiosInstance().put(`${routes?.serializedAsset?.path}/update-multiple-data-selected-field`, data).then(({ data }) => {
      setSubmitting(false)
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: data?.message
      });
      handleSucess();
    }).catch((err) => {
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
        <Button variant="outlined" color="primary" size="small" onClick={handleClose} >
          Cancel
        </Button>
        <CustomButton
          loading={submitting}
          variant="contained"
          color="primary"
          disabled={submitting}
          onClick={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          Save
        </CustomButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default ChangeAssetsDetailsDialog;
