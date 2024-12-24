import { Box, Button, CircularProgress, Dialog, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition, STEPS_STYLE } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { object, string } from 'yup';

const tabSchema = object().shape({
  tabName: string().required('Please enter Tab name')
});

const ManageTabs = ({ onClose, data, onSuccess, resource, resourceId, workflowId = null }) => {
  const toastConfig = useContext(CustomToastContext);

  const [initialValues, setInitialValues] = useState({});
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (data) {
      setInitialValues({
        tabName: data?.tabName,
        stepsStyle: data?.stepsStyle
      });
    } else {
      setInitialValues({
        tabName: '',
        stepsStyle: STEPS_STYLE.step
      });
    }
  }, [data]);

  const handleSubmit = (values) => {
    if (data && (resourceId || workflowId)) {
      let api = `/sa-formbuilder/tabs/${resourceId}`;
      if (workflowId) api = `${routes.workflow.path}/tabs/${workflowId}`;
      axiosInstance()
        .put(api, { ...values, tabId: data?._id })
        .then(({ data }) => {
          setIsSubmitting(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          onSuccess();
        })
        .catch((error) => {
          setIsSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      let api = `/sa-formbuilder/tabs/${resource}`;
      if (workflowId) api = `${routes.workflow.path}/tabs/${workflowId}`;
      axiosInstance()
        .post(api, values)
        .then(({ data }) => {
          setIsSubmitting(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          onSuccess();
        })
        .catch((error) => {
          setIsSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const validate = (values) => {
    const errors = {};
    if (!values?.tabName) {
      errors['tabName'] = 'Tab Name is required';
    }

    if (!values?.stepsStyle) {
      errors['stepsStyle'] = 'Steps Style is required';
    }

    return errors;
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
          setShowConfirmDialog(true);
        }
      }}
    >
      <Formik initialValues={initialValues} validationSchema={tabSchema} onSubmit={handleSubmit} validate={validate}>
        {({ values, errors, setFieldValue, touched, submitForm }) => (
          <>
            <CustomDialogHeader
              onClose={() => {
                if (isEqual(initialValues, values)) onClose();
                else setShowConfirmDialog(true);
              }}
              title={data ? `Edit - ${data?.tabName}` : 'Add New Tab'}
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
                    label="Tab Name"
                    required={true}
                    name="tabName"
                    fullWidth
                    margin="dense"
                    value={values['tabName']}
                    error={touched['tabName'] && Boolean(errors['tabName'])}
                    helperText={touched['tabName'] && errors['tabName']}
                    onChange={(e) => setFieldValue('tabName', e.target.value.trimStart())}
                  />
                </Box>
                <Box>
                  <Autocomplete
                    id="stepsStyle"
                    options={[STEPS_STYLE.list, STEPS_STYLE.step, STEPS_STYLE.sideBar]}
                    getOptionLabel={(option: any) => (option ? option : '')}
                    isOptionEqualToValue={(option: any, val) => option === val}
                    value={values['stepsStyle']}
                    onChange={(e: any, value) => {
                      setFieldValue('stepsStyle', value);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        margin="dense"
                        variant="outlined"
                        label="Steps Style"
                        placeholder="Steps Style"
                        name="stepsStyle"
                        required
                        error={touched['stepsStyle'] && Boolean(errors['stepsStyle'])}
                        helperText={touched['stepsStyle'] && errors['stepsStyle']}
                      />
                    )}
                  />
                </Box>
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button
                size="small"
                color="primary"
                disabled={isSubmitting}
                onClick={() => {
                  if (isEqual(initialValues, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={isSubmitting}
                variant="contained"
                color="primary"
                size="small"
                type="submit"
                onClick={submitForm}
                endIcon={isSubmitting && <CircularProgress color="inherit" size={18} />}
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

export default ManageTabs;
