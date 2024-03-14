import { useContext, useEffect, useState } from 'react';
import { Box, Button, Checkbox, CircularProgress, Dialog, FormControlLabel, TextField } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition } from 'src/constants/helpers';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { object, string } from 'yup';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const stepSchema = object().shape({
  stepName: string().required('Please enter Step name')
});

const ManageSteps = ({ resource, resourceId, data, onSuccess, onClose }) => {
  const toastConfig = useContext(CustomToastContext);

  const [initialValues, setInitialValues] = useState({});
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (data) {
      setInitialValues(data);
    } else {
      setInitialValues({ stepName: '', multipleStepData: true, stepDataRequired: false, showInPdf: false });
    }
  }, [data]);

  const handleSubmit = (values) => {
    setSubmitting(true);
    if (data?._id) {
      delete values?._id;
      delete values?.order;
      delete values?.fields;
      axiosInstance()
        .put(`/sa-formbuilder/steps/${resourceId}`, { ...values, stepId: data?._id })
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
    } else {
      axiosInstance()
        .post(`/sa-formbuilder/steps/${resource}`, values)
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
    }
  };

  const validate = (values) => {
    const errors = {};
    if (!values?.stepName) {
      errors['stepName'] = 'Required field';
    }
    return errors;
  };

  return (
    <Dialog
      maxWidth="sm"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
    >
      <Formik initialValues={initialValues} validationSchema={stepSchema} onSubmit={handleSubmit} validate={validate}>
        {({ values, errors, setFieldValue, touched, submitForm }) => (
          <>
            <CustomDialogHeader
              onClose={() => {
                if (isEqual(initialValues, values)) onClose();
                else setShowConfirmDialog(true);
              }}
              title={data ? `Edit - ${data?.stepName}` : 'Add New Step'}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
            <CustomDialogContent>
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <Box>
                  <TextField
                    variant="outlined"
                    type="text"
                    label="Step Name"
                    required={true}
                    name="stepName"
                    fullWidth
                    margin="dense"
                    value={values['stepName']}
                    error={touched['stepName'] && Boolean(errors['stepName'])}
                    helperText={touched['stepName'] && errors['stepName']}
                    onChange={(e) => setFieldValue('stepName', e.target.value.trimStart())}
                  />
                </Box>
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="multipleStepData"
                        checked={values['multipleStepData']}
                        onChange={(e) => {
                          setFieldValue('multipleStepData', e.target.checked);
                        }}
                      />
                    }
                    label="Multiple Step Data"
                  />
                </Box>
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="stepDataRequired"
                        checked={values['stepDataRequired']}
                        onChange={(e) => {
                          setFieldValue('stepDataRequired', e.target.checked);
                        }}
                      />
                    }
                    label="Step Data Required"
                  />
                </Box>
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="showInPdf"
                        checked={values['showInPdf']}
                        onChange={(e) => {
                          setFieldValue('showInPdf', e.target.checked);
                        }}
                      />
                    }
                    label="Show In Pdf"
                  />
                </Box>
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button
                size="small"
                color="primary"
                disabled={submitting}
                onClick={() => {
                  if (isEqual(initialValues, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
              >
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
                {' '}
                Save
              </Button>
            </CustomDialogFooter>

            {showConfirmDialog ? (
              <ConfirmationCancelDialog
                close={() => setShowConfirmDialog(false)}
                open={showConfirmDialog}
                onSave={() => {
                  setShowConfirmDialog(false);
                  submitForm();
                }}
                onClose={() => {
                  setShowConfirmDialog(false);
                  onClose();
                }}
              />
            ) : null}
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default ManageSteps;
