import { useState, useContext, Fragment } from 'react';
import { Box, Divider, TextField, Typography } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, productInventory } from '../../../constants/helpers';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { Formik, Form } from 'formik';
import { Autocomplete } from '@mui/material';
import CustomButton from 'src/components/Helpers/CustomButton';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';

const AddSerialNumber = ({ handleClose, handleSucess, product, warehouse, serialNumberCount }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);
  const toastConfig = useContext(CustomToastContext);

  const handleSubmit = (values) => {
    setLoading(true);
    axiosInstance()
      .post(`${productInventory.api}/add-serial-number/${product}/${warehouse}`, { serialNumber: values?.serialNumber })
      .then(({ data: { data } }) => {
        setLoading(false);
        handleSucess();
      })
      .catch((err) => {
        setLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  function validate(values) {
    const errors = {};
    if (values['serialNumber']?.length === 0) {
      errors['serialNumber'] = `Please enter serial number`;
    }
    if (values['serialNumber']?.length > serialNumberCount) {
      errors['serialNumber'] = `serial number not more then inventory`;
    }
    return errors;
  }

  return (
    <Dialog
      maxWidth="sm"
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullScreen={fullScreen}
      fullWidth
      PaperProps={{
        component: 'form',
        'aria-autocomplete': 'none',
        autoCorrect: 'off'
      }}
    >
      <Formik initialValues={{ serialNumber: [] }} onSubmit={handleSubmit} validateOnMount validate={validate}>
        {({ touched, errors, setFieldValue, values, submitForm }) => (
          <Form autoComplete="off" autoCorrect="off" noValidate className="flex min-h-full flex-col">
            <CustomDialogHeader
              title={'Add Serial Numbers'}
              onClose={(e, reason) => {
                if (reason !== 'backdropClick') {
                  handleClose();
                }
              }}
              showRequiredLabel={false}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            ></CustomDialogHeader>
            <CustomDialogContent isFooterPresent={true}>
              <Box pt={1} pb={1}>
                <Typography>{`Inventory without Serial Number - ${serialNumberCount}`}</Typography>
                <Box pt={2} pb={2}>
                  <Divider />
                </Box>
                <Autocomplete
                  size="small"
                  options={[]}
                  freeSolo={true}
                  multiple={true}
                  disableCloseOnSelect
                  value={values['serialNumber']}
                  onChange={(_, val) => {
                    setFieldValue('serialNumber', val);
                  }}
                  getOptionSelected={(item, current) => item === current}
                  getOptionLabel={(option) => option}
                  renderInput={(props) => (
                    <TextField
                      {...props}
                      placeholder={'Enter serial number and press enter'}
                      variant="outlined"
                      name="serialNumber"
                      label={'Serial Number'}
                      error={touched['serialNumber'] && Boolean(errors['serialNumber'])}
                      helperText={touched['serialNumber'] && errors['serialNumber']}
                    />
                  )}
                />
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <CustomButton loading={loading} disabled={loading} variant="contained" color="primary" type="button" onClick={submitForm}>
                Add
              </CustomButton>
            </CustomDialogFooter>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default AddSerialNumber;
