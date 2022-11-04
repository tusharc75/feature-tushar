import { Fragment, useCallback, useContext, useEffect } from 'react';
import { Box, Button, Dialog, FormControlLabel, TextField } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { useState } from 'react';
import { CustomDialogTransition, getUniqueCurrencies, workOrder } from 'src/constants/helpers';
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

export default function StepDialog({
  handleClose,
  handleSucess,
  serviceId,
  stepId,
  steps,
  reference = null,
  workOrderId = null,
  uniqueId = null,
  setOpenFieldDialog = null
}) {
  const toastConfig = useContext(CustomToastContext);
  const [stepDetails, setStepDetails] = useState(null);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [stepOption, setStepOption] = useState([]);
  const [currencyData, setCurrencyData] = useState([]);

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=Service Master`)
      .then(({ data: { data } }) => {
        setServices(data['Service Master']);
      });
    const options = [];
    steps?.forEach((e: any) => {
      options.push({ optionValue: e._id, optionLabel: e.stepName });
    });
    setStepOption(options);
  }, []);

  useEffect(() => {
    const sortedArr = getUniqueCurrencies().sort((a, b) =>
      a.name.toUpperCase() < b.name.toUpperCase() ? -1 : a.name.toUpperCase() > b.name.toUpperCase() ? 1 : 0
    );
    setCurrencyData(sortedArr);
  }, []);

  useEffect(() => {
    if (stepId != '') {
      axiosInstance()
        .get(`${serviceMaster.api}/steps/${serviceId}/${stepId}`)
        .then(({ data: { data } }) => {
          setStepDetails({
            stepName: data?.stepName,
            leadDay: data?.leadDay || 0,
            costPrice: data?.costPrice || 0,
            listPrice: data?.listPrice || 0,
            currency: data?.currency,
            isPassFail: data?.isPassFail,
            isFailAddon: data?.isFailAddon,
            failAddon: data?.failAddon,
            isPassAddon: data?.isPassAddon,
            passAddon: data?.passAddon,
            isJumpStepPass: data?.isJumpStepPass,
            jumpStepsPass: data?.jumpStepsPass,
            isJumpStepFail: data?.isJumpStepFail,
            jumpStepsFail: data?.jumpStepsFail,
            isQuoteRevisionOnFail: data?.isQuoteRevisionOnFail,
            isReturnToStepOnFail: data?.isReturnToStepOnFail,
            returnToStepOnFail: data?.returnToStepOnFail,
            isReturnToServiceOnFail: data?.isReturnToServiceOnFail,
            returnToServiceOnFail: data?.returnToServiceOnFail
          });
        })
        .catch((err) => {});
    } else {
      setStepDetails({
        stepName: '',
        leadDay: 0,
        costPrice: 0,
        listPrice: 0,
        currency: '',
        isPassFail: false,
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
    }
  }, []);

  const handleSubmit = (values) => {
    values.leadDay = parseInt(values.leadDay);
    values.costPrice = parseFloat(values.costPrice);
    values.listPrice = parseFloat(values.listPrice);
    setLoading(true);

    if (reference === 'workOrder') {
      if (!workOrderId || !uniqueId) toastConfig.setToast({ open: true, message: 'Something went wrong', severity: 'error' });

      values.serviceId = serviceId;
      axiosInstance()
        .put(`${workOrder.api}/service/${workOrderId}/${uniqueId}/add-step`, values)
        .then(({ data }) => {
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
      return;
    }
    if (stepId != '') {
      axiosInstance()
        .put(`${serviceMaster.api}/steps/${serviceId}/${stepId}`, values)
        .then(({ data }) => {
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
    } else {
      axiosInstance()
        .post(`${serviceMaster.api}/steps/${serviceId}`, values)
        .then(({ data }) => {
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
    }
  };

  function validate(values) {
    const errors = {};
    if (values.stepName === '') {
      errors['stepName'] = 'Please enter step name';
    }
    if (values.leadDay === '' || parseInt(values.leadDay) < 0) {
      errors['leadDay'] = 'Please enter valid lead day';
    }

    if (values.costPrice === '' || parseInt(values.costPrice) < 0) {
      errors['costPrice'] = 'Please enter valid cost price';
    }
    if (values.listPrice === '' || parseInt(values.listPrice) < 0) {
      errors['listPrice'] = 'Please enter valid list price';
    }
    if (values.currency === '') {
      errors['currency'] = 'Please select currency';
    }
    return errors;
  }

  return (
    <Dialog
      maxWidth="md"
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
                  <Grid xs={12} md={4} sm={4} item>
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
                  <Grid xs={12} md={4} sm={4} item>
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
                  </Grid>
                  <Grid xs={12} md={4} sm={4} item>
                    <Autocomplete
                      id="currency"
                      value={
                        currencyData.filter((data) => data.currencyCode === values['currency']).length
                          ? currencyData.filter((data) => data.currencyCode === values['currency'])[0]
                          : ''
                      }
                      options={currencyData}
                      getOptionLabel={(option: any) => (option ? `${option.currencyCode} - ${option.currencyName} - (${option.symbolNative})` : '')}
                      getOptionSelected={(option: any, val) => option.currencyCode === val}
                      onChange={(event, newValue) => {
                        setFieldValue('currency', newValue && newValue.currencyCode ? newValue.currencyCode : '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          margin="dense"
                          size="small"
                          variant="outlined"
                          name="currency"
                          label="Currency"
                          error={touched['currency'] && Boolean(errors['currency'])}
                          helperText={touched['currency'] && errors['currency']}
                          required
                        />
                      )}
                    />
                  </Grid>
                  <Grid xs={12} md={6} sm={6} item>
                    <Field
                      component={TextFieldFormik}
                      margin="dense"
                      type="number"
                      label="Cost Price"
                      name="costPrice"
                      variant="outlined"
                      fullWidth
                      value={values['costPrice']}
                      error={touched['costPrice'] && Boolean(errors['costPrice'])}
                      helperText={touched['costPrice'] && errors['costPrice']}
                      onChange={(e) => {
                        setFieldValue('costPrice', e.target.value);
                      }}
                    />
                  </Grid>
                  <Grid xs={12} md={6} sm={6} item>
                    <Field
                      component={TextFieldFormik}
                      margin="dense"
                      type="number"
                      label="List Price"
                      name="listPrice"
                      variant="outlined"
                      fullWidth
                      value={values['listPrice']}
                      error={touched['listPrice'] && Boolean(errors['listPrice'])}
                      helperText={touched['listPrice'] && errors['listPrice']}
                      onChange={(e) => {
                        setFieldValue('listPrice', e.target.value);
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
                {values['isPassFail'] && (
                  <Box>
                    <Box pt={2}>
                      <Grid container>
                        <Grid item xs={6}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="isPassAddon"
                                checked={values['isPassAddon']}
                                onChange={(e) => {
                                  setFieldValue('isPassAddon', e.target.checked);
                                }}
                                color="primary"
                              />
                            }
                            label="Addon Service on Pass"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          {values['isPassAddon'] && (
                            <Autocomplete
                              options={[{ optionValue: 'all', optionLabel: 'Select All' }, ...services]}
                              fullWidth
                              multiple
                              size="small"
                              value={values?.passAddon ? services?.filter((data: any) => values?.passAddon?.includes(data.optionValue)) : []}
                              getOptionLabel={(option) => option.optionLabel}
                              getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                              onChange={(_, newVal: any) => {
                                const isAll = Boolean(newVal?.find((v) => v?.optionValue === 'all'));
                                const values = isAll ? services.map((o) => o.optionValue) : newVal?.map((val) => val.optionValue);
                                setFieldValue('passAddon', values);
                              }}
                              renderInput={(params) => <TextField {...params} label="Pass Addon Services" name="passAddon" variant="outlined" />}
                            />
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                    <Box pt={2}>
                      <Grid container>
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
                          {values['isFailAddon'] && (
                            <Autocomplete
                              options={[{ optionValue: 'all', optionLabel: 'Select All' }, ...services]}
                              fullWidth
                              multiple
                              size="small"
                              value={values?.failAddon ? services?.filter((data: any) => values?.failAddon?.includes(data.optionValue)) : []}
                              getOptionLabel={(option) => option.optionLabel}
                              getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                              onChange={(_, newVal: any) => {
                                const isAll = Boolean(newVal?.find((v) => v?.optionValue === 'all'));
                                const values = isAll ? services.map((o) => o.optionValue) : newVal?.map((val) => val.optionValue);

                                setFieldValue('failAddon', values);
                              }}
                              renderInput={(params) => <TextField {...params} label="Fail Addon Services" name="failAddon" variant="outlined" />}
                            />
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                    <Box pt={2}>
                      <Grid container>
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
                          {values['isJumpStepPass'] && (
                            <Autocomplete
                              options={[{ optionValue: 'all', optionLabel: 'Select All' }, ...stepOption]}
                              fullWidth
                              multiple
                              size="small"
                              value={
                                values?.jumpStepsPass ? stepOption?.filter((data: any) => values?.jumpStepsPass?.includes(data.optionValue)) : []
                              }
                              getOptionLabel={(option) => option.optionLabel}
                              getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                              onChange={(_, newVal: any) => {
                                const isAll = Boolean(newVal?.find((v) => v?.optionValue === 'all'));
                                const values = isAll ? stepOption.map((o) => o.optionValue) : newVal?.map((val) => val.optionValue);

                                setFieldValue('jumpStepsPass', values);
                              }}
                              renderInput={(params) => <TextField {...params} label="Jump Steps On Pass" name="jumpStepsPass" variant="outlined" />}
                            />
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                    <Box pt={2}>
                      <Grid container>
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
                          {values['isJumpStepFail'] && (
                            <Autocomplete
                              options={[{ optionValue: 'all', optionLabel: 'Select All' }, ...stepOption]}
                              fullWidth
                              multiple
                              size="small"
                              value={
                                values?.jumpStepsFail ? stepOption?.filter((data: any) => values?.jumpStepsFail?.includes(data.optionValue)) : []
                              }
                              getOptionLabel={(option) => option.optionLabel}
                              getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                              onChange={(_, newVal: any[]) => {
                                const isAll = Boolean(newVal?.find((v) => v?.optionValue === 'all'));
                                const values = isAll ? stepOption.map((o) => o.optionValue) : newVal?.map((val) => val.optionValue);

                                setFieldValue('jumpStepsFail', values);
                              }}
                              renderInput={(params) => <TextField {...params} label="Jump Steps On Fail" name="jumpStepsFail" variant="outlined" />}
                            />
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                    <Box pt={2}>
                      <Grid container>
                        <Grid item xs={6}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="isQuoteRevisionOnFail"
                                checked={values?.isQuoteRevisionOnFail}
                                onChange={(e) => {
                                  setFieldValue('isQuoteRevisionOnFail', e.target.checked);
                                }}
                                color="primary"
                              />
                            }
                            label="Quote Revision On Fail"
                          />
                        </Grid>
                      </Grid>
                    </Box>
                    <Box pt={2}>
                      <Grid container>
                        <Grid item xs={6}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="isReturnToStepOnFail"
                                checked={values?.isReturnToStepOnFail}
                                onChange={(e) => {
                                  setFieldValue('isReturnToStepOnFail', e.target.checked);
                                }}
                                color="primary"
                              />
                            }
                            label="Return To Step On Fail"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          {values['isReturnToStepOnFail'] && (
                            <Autocomplete
                              options={stepOption}
                              fullWidth
                              size="small"
                              value={values?.returnToStepOnFail ? stepOption?.find((data) => data?.optionValue === values?.returnToStepOnFail) : ''}
                              getOptionLabel={(option) => option.optionLabel}
                              getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                              onChange={(_, newVal: any) => {
                                setFieldValue('returnToStepOnFail', newVal ? newVal?.optionValue : '');
                              }}
                              renderInput={(params) => (
                                <TextField {...params} label="Return To Step On Fail" name="returnToStepOnFail" variant="outlined" />
                              )}
                            />
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                    <Box pt={2}>
                      <Grid container>
                        <Grid item xs={6}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="isReturnToServiceOnFail"
                                checked={values?.isReturnToServiceOnFail}
                                onChange={(e) => {
                                  setFieldValue('isReturnToServiceOnFail', e.target.checked);
                                }}
                                color="primary"
                              />
                            }
                            label="Return To Service On Fail"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          {values['isReturnToServiceOnFail'] && (
                            <Autocomplete
                              options={services}
                              fullWidth
                              size="small"
                              value={services?.find((data) => data?.optionValue === values?.returnToServiceOnFail) ?? ''}
                              getOptionLabel={(option) => option?.optionLabel}
                              renderOption={(option) => option?.optionLabel}
                              // getOptionSelected={(option: any, val: any) => option?.optionValue === val?.optionValue}
                              onChange={(_, newVal: any) => {
                                setFieldValue('returnToServiceOnFail', newVal?.optionValue ?? '');
                              }}
                              renderInput={(params) => (
                                <TextField {...params} label="Return To Service On Fail" name="returnToServiceOnFail" variant="outlined" />
                              )}
                            />
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                )}
                {reference === 'workOrder' && (
                  <Button size="small" color="primary" onClick={() => setOpenFieldDialog(true)}>
                    Configure Fields
                  </Button>
                )}
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
