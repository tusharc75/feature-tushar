import { Fragment, useCallback, useContext, useEffect } from 'react';
import { Box, Button, Dialog } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { useState } from 'react';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { serviceMaster } from 'src/constants/helpers';
import { Formik, Form, Field } from 'formik';
import { TextField as TextFieldFormik, Select } from 'formik-material-ui';
import CustomButton from 'src/components/Helpers/CustomButton';

export default function StepDialog({ handleClose, handleSucess, serviceId, stepData }) {

  const toastConfig = useContext(CustomToastContext);
  const [stepDetails, setStepDetails] = useState(stepData ? { stepName: stepData.stepName } : { stepName: "" });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (values) => {
    setLoading(true)
    if (stepData) {
      axiosInstance().put(`${serviceMaster.api}/steps/${serviceId}/${stepData?._id}`, values).then(({ data }) => {
        handleSucess()
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
        setLoading(false)
      })
        .catch((err) => {
          setLoading(false)
          toastConfig.setToastConfig(err);
        });
    }
    else {
      axiosInstance().post(`${serviceMaster.api}/steps/${serviceId}`, values).then(({ data }) => {
        handleSucess()
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
        setLoading(false)
      })
        .catch((err) => {
          setLoading(false)
          toastConfig.setToastConfig(err);
        });
    }
  }

  return (
    <Dialog
      maxWidth="sm"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      fullWidth
    >
      <Fragment>
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
        ></CustomDialogHeader>
        <Formik initialValues={stepDetails} onSubmit={handleSubmit} validateOnMount >
          {({ submitForm, touched, errors, setFieldValue, values }) => (
            <Form autoComplete="off" autoCorrect="off" noValidate>
              <CustomDialogContent>
                <Field
                  component={TextFieldFormik}
                  margin="dense"
                  type="text"
                  label="Step Name"
                  name="stepName"
                  variant="outlined"
                  fullWidth
                  value={values['stepName']}
                  error={touched['stepName'] && Boolean(errors['stepName'])}
                  helperText={touched['stepName'] && errors['stepName']}
                  onChange={(e) => {
                    setFieldValue('stepName', e.target.value);
                  }}
                />
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
                <CustomButton
                  loading={loading}
                  disabled={loading}
                  variant="contained"
                  color="primary"
                  type="submit"
                  onClick={submitForm}>
                  Save
                </CustomButton>
              </CustomDialogFooter>
            </Form>
          )}
        </Formik>
      </Fragment>
    </Dialog>
  );
}
