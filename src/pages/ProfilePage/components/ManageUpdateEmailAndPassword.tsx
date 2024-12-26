import React, { useState, useContext } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { Formik, Form } from 'formik';
import { object, string } from 'yup';
import InputAdornment from '@mui/material/InputAdornment';
import Dialog from '@mui/material/Dialog';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import axiosInstance from '../../../axios/axiosInstance';
import CustomButton from '../../../components/Helpers/CustomButton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { IconButton, TextField } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';

const updatePassWordSchema = object().shape({
  oldPassword: string().required('please enter Old Password'),
  newPassword: string().required('please enter New Password'),
  confirmPassword: string().required('please enter Confirm Password')
});

const updateEmailSchema = object().shape({
  email: string().required('please enter valid email')
});

export default function ManageUpdateEmailAndPassword({
  open,
  onClose,
  isUpdatePassword = false,
  isUpdateEmail = false,
  userData = null,
  onFetchUserData,
  logoutUser
}) {
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);
  const [visibity, setVisibity] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const toggleVisibility = (key) => {
    setVisibity({ ...visibity, [key]: !visibity[key] });
  };
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };
  const handleSubmit = (values) => {
    if (isUpdatePassword) {
      // delete values["confirmPassword"]
      setLoading(true);
      axiosInstance()
        .put(`/user/me/password`, { oldPassword: values.oldPassword, newPassword: values.newPassword })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setLoading(false);
          logoutUser();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setLoading(false);
        });
    } else if (isUpdateEmail) {
      setLoading(true);
      axiosInstance()
        .put(`/user/me/email`, { email: values.email })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          logoutUser();
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const PasswordEndAdornment = ({ fieldName }) => (
    <InputAdornment position="end">
      <IconButton
        aria-label="toggle password visibility"
        onClick={() => toggleVisibility(fieldName)}
        onMouseDown={handleMouseDownPassword}
        edge="end"
      >
        {visibity[fieldName] ? <Visibility /> : <VisibilityOff />}
      </IconButton>
    </InputAdornment>
  );

  const validateForm = (values) => {
    const errors: any = {};

    if (!values.oldPassword) {
      errors.oldPassword = 'Required field';
    } else if (!values.newPassword) {
      errors.newPassword = 'Required field';
    } else if (!values.confirmPassword) {
      errors.confirmPassword = 'Required field';
    } else if (!/^(?=.*?[A-Z])(?=(.*[a-z]){1,})(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{8,}$/.test(values.newPassword)) {
      errors.newPassword = 'Minimum eight characters, at least one uppercase, one lowercase, one number and one special character';
    } else if (values.newPassword !== values.confirmPassword) {
      errors.confirmPassword = 'New Password and Confirm Password should be same';
    } else if (values.oldPassword == values.newPassword) {
      errors.newPassword = 'Old Password and New Password should not be same';
    }
    return errors;
  };
  return (
    <Dialog
      maxWidth="sm"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={open}
      onClose={(event, reason) => {
        if (reason !== 'backdropClick') {
          onClose()
        }
      }}
    >
      <CustomDialogHeader
        title={isUpdateEmail ? 'Update Email' : 'Update Password'}
        onClose={onClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      />
      <Formik
        onSubmit={handleSubmit}
        // onSubmit={() => { }}
        initialValues={isUpdateEmail ? { email: userData?.email ?? '' } : { oldPassword: '', newPassword: '', confirmPassword: '' }}
        validationSchema={isUpdateEmail ? updateEmailSchema : updatePassWordSchema}
        validate={isUpdateEmail ? null : validateForm}
      >
        {({ values, setFieldValue, setErrors, errors }) => (
          <>
            <CustomDialogContent>
              <Form noValidate autoComplete="off" autoCorrect="off">
                <div>
                  <Box marginY={2}>
                    <Grid spacing={3} container>
                      {isUpdatePassword ? (
                        <>
                          <Grid style={{ display: 'flex' }} item sm={10}>
                            <TextField
                              fullWidth
                              margin="dense"
                              size="small"
                              type={visibity['oldPassword'] ? 'string' : 'password'}
                              label="Old Password"
                              name="oldPassword"
                              variant="outlined"
                              required={true}
                              value={values['oldPassword']}
                              onChange={(e) => setFieldValue('oldPassword', e.target.value)}
                              InputProps={{
                                endAdornment: <PasswordEndAdornment fieldName="oldPassword" />
                              }}
                              error={Boolean(errors['oldPassword'])}
                              helperText={errors['oldPassword']}
                            />
                          </Grid>

                          <Grid item sm={10}>
                            <TextField
                              fullWidth
                              margin="dense"
                              size="small"
                              type={visibity['newPassword'] ? 'string' : 'password'}
                              label="New Password"
                              name="newPassword"
                              variant="outlined"
                              required={true}
                              value={values['newPassword']}
                              onChange={(e) => setFieldValue('newPassword', e.target.value)}
                              InputProps={{
                                endAdornment: <PasswordEndAdornment fieldName="newPassword" />
                              }}
                              error={Boolean(errors['newPassword'])}
                              helperText={errors['newPassword']}
                            />
                          </Grid>
                          <Grid item sm={10}>
                            <TextField
                              fullWidth
                              margin="dense"
                              size="small"
                              type={visibity['confirmPassword'] ? 'string' : 'password'}
                              label="Confirm Password"
                              name="confirmPassword"
                              variant="outlined"
                              required={true}
                              value={values['confirmPassword']}
                              onChange={(e) => {
                                setFieldValue('confirmPassword', e.target.value);
                              }}
                              InputProps={{
                                endAdornment: <PasswordEndAdornment fieldName="confirmPassword" />
                              }}
                              error={Boolean(errors['confirmPassword'])}
                              helperText={errors['confirmPassword']}
                            />
                          </Grid>
                        </>
                      ) : null}
                      {isUpdateEmail ? (
                        <Grid item sm={12}>
                          <TextField
                            style={{ width: '400px' }}
                            fullWidth
                            margin="dense"
                            size="small"
                            type="email"
                            label="Email"
                            name="email"
                            variant="outlined"
                            required={true}
                            value={values['email']}
                            onChange={(e) => setFieldValue('email', e.target.value.trimStart())}
                          />
                        </Grid>
                      ) : null}
                    </Grid>
                  </Box>
                </div>
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button type="button" variant="outlined" color="primary" size="small" onClick={onClose}>
                Cancel
              </Button>

              <CustomButton
                loading={loading}
                variant="contained"
                color="primary"
                disabled={loading ? true : (isUpdateEmail && values.email === userData.email) || false}
                onClick={() => {
                  if (isUpdatePassword) {
                    let errors = validateForm(values);
                    setErrors(errors);
                    if (Object.keys(errors).length === 0) {
                      handleSubmit(values);
                    }
                  } else {
                    handleSubmit(values);
                  }
                }}
              >
                Update
              </CustomButton>
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    </Dialog>
  );
}
