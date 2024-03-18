import { useContext, useEffect, useState } from 'react';
import { Box, Button, Checkbox, CircularProgress, Dialog, FormControlLabel } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from 'src/constants/helpers';
import { Form, Formik } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const Setting = ({ onClose, onSuccess, resource, resourceData }) => {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (values) => {
    setSubmitting(true);
    axiosInstance()
      .put(`/sa-formbuilder/steps/setting/${resource}`, values)
      .then(({ data }) => {
        setSubmitting(false);
        onSuccess();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog
      maxWidth="sm"
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
    >
      <Formik
        initialValues={{
          showStepsInList: resourceData.hasOwnProperty('showStepsInList') ? resourceData?.showStepsInList : false
        }}
        onSubmit={handleSubmit}
      >
        {({ values, errors, setFieldValue, touched, submitForm }) => (
          <>
            <CustomDialogHeader
              onClose={onClose}
              title={'Setting'}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
            <CustomDialogContent>
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="showStepsInList"
                        checked={values['showStepsInList']}
                        onChange={(e) => {
                          setFieldValue('showStepsInList', e.target.checked);
                        }}
                      />
                    }
                    label="Show Steps In List"
                  />
                </Box>
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button size="small" color="primary" disabled={submitting} onClick={onClose}>
                Cancel
              </Button>
              <Button
                disabled={submitting}
                variant="contained"
                color="primary"
                size="small"
                type="submit"
                onClick={submitForm}
                endIcon={submitting && <CircularProgress color="inherit" size={18} />}
              >
                Save
              </Button>
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default Setting;
