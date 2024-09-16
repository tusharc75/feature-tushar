import { useContext, useEffect, useState } from 'react';
import { Box, Button, Checkbox, CircularProgress, Dialog, FormControlLabel, TextField } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, STEPS_STYLE } from 'src/constants/helpers';
import { Form, Formik } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Autocomplete } from '@material-ui/lab';
import routes from 'src/components/Helpers/Routes';


const Setting = ({ onClose, onSuccess, id, stepsStyle }) => {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (values) => {
    setSubmitting(true);
    axiosInstance()
      .put(`${routes.workflow.path}/${id}/steps/setting`, {
        ...values
      })
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

  const validate = (values) => {
    const errors = {};
    if (!values?.stepsStyle) {
      errors['stepsStyle'] = 'Please select steps style';
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
        }
      }}
    >
      <Formik
        initialValues={{
          stepsStyle: stepsStyle || STEPS_STYLE.list
        }}
        validate={validate}
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
                  <Autocomplete
                    id="stepsStyle"
                    options={[STEPS_STYLE.list, STEPS_STYLE.step, STEPS_STYLE.sideBar]}
                    getOptionLabel={(option: any) => (option ? option : '')}
                    getOptionSelected={(option: any, val) => option === val}
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
