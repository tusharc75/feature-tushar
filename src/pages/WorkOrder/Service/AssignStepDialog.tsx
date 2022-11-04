import { Fragment, useCallback, useContext, useEffect } from 'react';
import { Box, Button, Dialog, FormControlLabel, TextField } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { useState } from 'react';
import { CustomDialogTransition, workOrder } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { serviceMaster } from 'src/constants/helpers';
import { Formik, Form, Field } from 'formik';
import { TextField as TextFieldFormik, Select } from 'formik-material-ui';
import CustomButton from 'src/components/Helpers/CustomButton';
import Checkbox from '@material-ui/core/Checkbox';
import { Autocomplete } from '@material-ui/lab';
import Grid from '@material-ui/core/Grid';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

export default function AssignStepDialog({ handleClose, handleSucess, workOrderId, serviceId, uniqueId }) {
  const toastConfig = useContext(CustomToastContext);
  const [stepDetails, setStepDetails] = useState(null);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [stepOption, setStepOption] = useState([]);

  useEffect(() => {
    setStepDetails({
      stepName: '',
      price: 0,
      isPassFail: false,
      leadDay: 0,
      isFailAddon: false,
      failAddon: [],
      isPassAddon: false,
      passAddon: [],
      isJumpStepPass: false,
      jumpStepsPass: [],
      isJumpStepFail: false,
      jumpStepsFail: [],
      isQuoteRevisionOnFail: false,
      isReturnToStepOnFail: false,
      returnToStepOnFail: '',
      isReturnToServiceOnFail: false,
      returnToServiceOnFail: ''
    });
  }, []);

  const handleSubmit = (values) => {
    values.price = parseFloat(values.price);
    values.serviceId = serviceId;
    setLoading(true);
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/${uniqueId}/add-step`, values)
      .then(({ data }) => {
        console.log('sdf');
        handleSucess();
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  function validate(values) {
    const errors = {};
    if (values.stepName === '') {
      errors['stepName'] = 'Please enter step name';
    }
    if (values.price === '' || parseInt(values.price) < 0) {
      errors['price'] = 'Please enter valid price';
    }
    return errors;
  }

  return (
    <Dialog
      maxWidth="sm"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      fullWidth
    >
      <CustomDialogHeader
        title={'Step Information'}
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
      {stepDetails ? (
        <Formik initialValues={stepDetails} onSubmit={handleSubmit} validateOnMount validate={validate}>
          {({ submitForm, touched, errors, setFieldValue, values }) => (
            <Form autoComplete="off" autoCorrect="off" noValidate>
              <CustomDialogContent>
                <Grid container spacing={2}>
                  <Grid xs={12} item>
                    <Field
                      component={TextFieldFormik}
                      margin="dense"
                      type="text"
                      label="Step Name"
                      name="stepName"
                      variant="outlined"
                      required
                      fullWidth
                      value={values['stepName']}
                      error={touched['stepName'] && Boolean(errors['stepName'])}
                      helperText={touched['stepName'] && errors['stepName']}
                      onChange={(e) => {
                        setFieldValue('stepName', e.target.value);
                      }}
                    />
                  </Grid>
                  <Grid xs={12} item>
                    <Field
                      component={TextFieldFormik}
                      margin="dense"
                      type="number"
                      label="Price"
                      name="price"
                      variant="outlined"
                      fullWidth
                      value={values['price']}
                      error={touched['price'] && Boolean(errors['price'])}
                      helperText={touched['price'] && errors['price']}
                      onChange={(e) => {
                        setFieldValue('price', e.target.value);
                      }}
                    />
                  </Grid>
                </Grid>
                <Box pt={2}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="isPassFail"
                        checked={values['isPassFail']}
                        onChange={(e) => {
                          setFieldValue('isPassFail', e.target.checked);
                        }}
                        color="primary"
                      />
                    }
                    label="Pass Fail"
                  />
                </Box>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => {
                    handleClose();
                  }}
                >
                  Cancel
                </Button>
                <CustomButton loading={loading} disabled={loading} variant="contained" color="primary" type="submit" onClick={submitForm}>
                  Save
                </CustomButton>
              </CustomDialogFooter>
            </Form>
          )}
        </Formik>
      ) : (
        <>
          <CustomDialogContent>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button size="small" color="primary" disabled>
              Cancel
            </Button>
            <CustomButton disabled variant="contained" color="primary">
              Save
            </CustomButton>
          </CustomDialogFooter>
        </>
      )}
    </Dialog>
  );
}
