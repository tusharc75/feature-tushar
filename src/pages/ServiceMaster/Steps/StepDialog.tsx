import { Fragment, useCallback, useContext, useEffect } from 'react';
import { Box, Button, Dialog, FormControlLabel, TextField } from '@material-ui/core';
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
import Checkbox from '@material-ui/core/Checkbox';
import { Autocomplete } from '@material-ui/lab';
import Grid from '@material-ui/core/Grid';

export default function StepDialog({ handleClose, handleSucess, serviceId, stepId, steps }) {

  const toastConfig = useContext(CustomToastContext);
  const [stepDetails, setStepDetails] = useState(null);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [stepOption, setStepOption] = useState([]);

  useEffect(() => {
    axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=Service Master`).then(({ data: { data } }) => {
      setServices(data["Service Master"])
    })
    const options = []
    steps?.forEach((e: any) => {
      options.push({ optionValue: e._id, optionLabel: e.stepName })
    })
    setStepOption(options)
  }, []);

  useEffect(() => {
    if (stepId != "") {
      axiosInstance()
        .get(`${serviceMaster.api}/steps/${serviceId}/${stepId}`)
        .then(({ data: { data } }) => {
          setStepDetails({
            stepName: data?.stepName, leadDay: data?.leadDay, isPassFail: data?.isPassFail,
            isFailAddon: data?.isFailAddon, failAddon: data?.failAddon, ispassAddon: data?.ispassAddon, passAddon: data?.passAddon,
            isJumpStepPass: data?.isJumpStepPass, jumpStepsPass: data?.jumpStepsPass, isJumpStepFail: data?.isJumpStepFail, jumpStepsFail: data?.jumpStepsFail
          })
        })
        .catch((err) => {
        });
    }
    else {
      setStepDetails({
        stepName: "", leadDay: 0, isPassFail: false, isFailAddon: false, failAddon: [], ispassAddon: false, passAddon: [],
        isJumpStepPass: false, jumpStepsPass: [], isJumpStepFail: false, jumpStepsFail: []
      })
    }
  }, []);

  const handleSubmit = (values) => {
    values.leadDay = parseInt(values.leadDay)
    setLoading(true)
    if (stepId != "") {
      axiosInstance().put(`${serviceMaster.api}/steps/${serviceId}/${stepId}`, values).then(({ data }) => {
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

  function validate(values) {
    const errors = {};
    if (values.stepName === "") {
      errors['stepName'] = 'Please enter step name';
    }
    if (values.leadDay === "" || parseInt(values.leadDay) < 0) {
      errors['leadDay'] = 'Please enter valid lead day';
    }
    return errors;
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
        {stepDetails &&
          <Formik initialValues={stepDetails} onSubmit={handleSubmit} validateOnMount validate={validate} >
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
                    required
                    fullWidth
                    value={values['stepName']}
                    error={touched['stepName'] && Boolean(errors['stepName'])}
                    helperText={touched['stepName'] && errors['stepName']}
                    onChange={(e) => {
                      setFieldValue('stepName', e.target.value);
                    }}
                  />
                  <Field
                    component={TextFieldFormik}
                    margin="dense"
                    type="number"
                    label="Lead Day"
                    name="leadDay"
                    variant="outlined"
                    fullWidth
                    value={values['leadDay']}
                    error={touched['leadDay'] && Boolean(errors['leadDay'])}
                    helperText={touched['leadDay'] && errors['leadDay']}
                    onChange={(e) => {
                      setFieldValue('leadDay', e.target.value);
                    }}
                  />
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
                  {values['isPassFail'] &&
                    <Box>
                      <Box pt={2}>
                        <Grid container >
                          <Grid item xs={6}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  name="ispassAddon"
                                  checked={values['ispassAddon']}
                                  onChange={(e) => {
                                    setFieldValue('ispassAddon', e.target.checked);
                                  }}
                                  color="primary"
                                />
                              }
                              label="Addon Service on Pass"
                            />
                          </Grid>
                          <Grid item xs={6}>
                            {values['ispassAddon'] &&
                              <Autocomplete
                                options={services}
                                fullWidth
                                multiple
                                size="small"
                                value={values?.passAddon ? services?.filter((data: any) => values?.passAddon?.includes(data.optionValue)) : []}
                                getOptionLabel={(option) => option.optionLabel}
                                getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                                onChange={(_, newVal: any) => {
                                  setFieldValue('passAddon', newVal?.map((val) => val.optionValue));
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Pass Addon Services"
                                    name="passAddon"
                                    variant="outlined"
                                  />
                                )}
                              />}
                          </Grid>
                        </Grid>
                      </Box>
                      <Box pt={2}>
                        <Grid container >
                          <Grid item xs={6}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  name="isFailAddon"
                                  checked={values['isFailAddon']}
                                  onChange={(e) => {
                                    setFieldValue('isFailAddon', e.target.checked);
                                  }}
                                  color="primary"
                                />
                              }
                              label="Addon Service on Fail"
                            />
                          </Grid>
                          <Grid item xs={6}>
                            {values['isFailAddon'] &&
                              <Autocomplete
                                options={services}
                                fullWidth
                                multiple
                                size="small"
                                value={values?.failAddon ? services?.filter((data: any) => values?.failAddon?.includes(data.optionValue)) : []}
                                getOptionLabel={(option) => option.optionLabel}
                                getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                                onChange={(_, newVal: any) => {
                                  setFieldValue('failAddon', newVal?.map((val) => val.optionValue));
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Fail Addon Services"
                                    name="failAddon"
                                    variant="outlined"
                                  />
                                )}
                              />}
                          </Grid>
                        </Grid>
                      </Box>
                      <Box pt={2}>
                        <Grid container >
                          <Grid item xs={6}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  name="isJumpStepPass"
                                  checked={values?.isJumpStepPass}
                                  onChange={(e) => {
                                    setFieldValue('isJumpStepPass', e.target.checked);
                                  }}
                                  color="primary"
                                />
                              }
                              label="Jump Step On Pass"
                            />
                          </Grid>
                          <Grid item xs={6}>
                            {values['isJumpStepPass'] &&
                              <Autocomplete
                                options={stepOption}
                                fullWidth
                                multiple
                                size="small"
                                value={values?.jumpStepsPass ? stepOption?.filter((data: any) => values?.jumpStepsPass?.includes(data.optionValue)) : []}
                                getOptionLabel={(option) => option.optionLabel}
                                getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                                onChange={(_, newVal: any) => {
                                  setFieldValue('jumpStepsPass', newVal?.map((val) => val.optionValue));
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Jump Steps On Pass"
                                    name="jumpStepsPass"
                                    variant="outlined"
                                  />
                                )}
                              />}
                          </Grid>
                        </Grid>
                      </Box>
                      <Box pt={2}>
                        <Grid container >
                          <Grid item xs={6}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  name="isJumpStepFail"
                                  checked={values?.isJumpStepFail}
                                  onChange={(e) => {
                                    setFieldValue('isJumpStepFail', e.target.checked);
                                  }}
                                  color="primary"
                                />
                              }
                              label="Jump Step On Fail"
                            />
                          </Grid>
                          <Grid item xs={6}>
                            {values['isJumpStepFail'] &&
                              <Autocomplete
                                options={stepOption}
                                fullWidth
                                multiple
                                size="small"
                                value={values?.jumpStepsFail ? stepOption?.filter((data: any) => values?.jumpStepsFail?.includes(data.optionValue)) : []}
                                getOptionLabel={(option) => option.optionLabel}
                                getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                                onChange={(_, newVal: any) => {
                                  setFieldValue('jumpStepsFail', newVal?.map((val) => val.optionValue));
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Jump Steps On Fail"
                                    name="jumpStepsFail"
                                    variant="outlined"
                                  />
                                )}
                              />}
                          </Grid>
                        </Grid>
                      </Box>
                    </Box>}
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
        }
      </Fragment>
    </Dialog>
  );
}
