import { useState, useEffect, useContext } from 'react';
import { Box, Button, Dialog, TextField } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomButton from '../Helpers/CustomButton';
import axiosInstance from 'src/axios/axiosInstance';
import { Autocomplete } from '@material-ui/lab';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const MergeRecordsDialog = ({ id, onClose, resource, onSuccess }) => {

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState(null);

  const [mergeValue, setMergeValue] = useState(null);
  const [fromLabel, setFromLabel] = useState("");

  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${resource}`)
      .then(({ data: { data } }) => {
        setFromLabel(data[resource]?.find((item) => item.optionValue === id)?.optionLabel)
        let options = data[resource]?.filter((item) => item.optionValue !== id);
        setOptions(options);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

  const handleSave = () => {
    setLoading(true);
    const values = {
      resource: resource,
      from: id,
      to: mergeValue.optionValue
    };
    axiosInstance()
      .post(`/merge`, values)
      .then(({ data }) => {
        setLoading(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        onClose();
        onSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (<Dialog
    maxWidth="sm"
    fullScreen={fullScreen || isMobile || isTablet}
    TransitionComponent={CustomDialogTransition}
    aria-labelledby="customized-dialog-title"
    open={true}
    onClose={(e, reason) => {
      if (reason !== 'backdropClick') {
      }
    }}
    fullWidth
  >
    <CustomDialogHeader
      title={`Merge - ${fromLabel}`}
      onClose={onClose}
      isMinimized={!fullScreen}
      onMinimizeMaximize={() => {
        setFullScreen((prevState) => !prevState);
      }}
      showManimizeMaximize={true}
    />
    <CustomDialogContent>
      <Box py={2}>
        <Autocomplete
          size="small"
          options={options}
          value={mergeValue}
          onChange={(_, val) => {
            setMergeValue(val);
          }}
          getOptionSelected={(option, val) => (option ? option.optionLabel === val.optionLabel : false)}
          getOptionLabel={(option) => option.optionLabel}
          renderInput={(props) => <TextField {...props} required variant="outlined" label={`${resource}`} />}
        />
      </Box>
    </CustomDialogContent>
    <CustomDialogFooter>
      <Button size="small" color="primary" onClick={onClose}>
        Cancel
      </Button>
      <CustomButton
        loading={loading}
        disabled={loading || !mergeValue}
        variant="contained"
        color="primary"
        type="submit"
        onClick={handleSave}>
        Save
      </CustomButton>
    </CustomDialogFooter>
  </Dialog>

  );
};

export default MergeRecordsDialog;
