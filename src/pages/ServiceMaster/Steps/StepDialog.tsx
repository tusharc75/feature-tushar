import { Fragment, useCallback, useContext, useEffect } from 'react';
import { Box, Button, Dialog, Divider, FormControlLabel, InputAdornment, TextField, Switch } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { useState } from 'react';
import { currencyCodeToSymbol, CustomDialogTransition, getUniqueCurrencies, workOrder } from 'src/constants/helpers';
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
import { useData } from 'src/StateProvider/Provider';
import FieldDialog from 'src/pages/ServiceMaster/Steps/FieldDialog';

export default function StepDialog({
  handleClose, // function to close the dialog
  handleSucess, // function to handle success
  serviceId, // service id
  stepId, // step id
  steps, // steps
  reference = null,
  workOrderId = null,
  uniqueId = null,
  notEditable = false,
  stepData = null
}) {
  const {
    state: {
      user: { user }
    }
  } = useData();
  const toastConfig = useContext(CustomToastContext);
  const [stepDetails, setStepDetails] = useState(null);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [stepOption, setStepOption] = useState([]);
  const [currencyData, setCurrencyData] = useState([]);

  const [openFieldDialog, setOpenFieldDialog] = useState(false);
  const [fields, setFields] = useState(stepData ? stepData?.fields : []);
  const [allFollowingStepToJump, setAllFollowingStepToJump] = useState([]);

  useEffect(() => {
    fllowingStep();
  }, [stepId]);

  const fllowingStep = () => {
    const thisStep = steps?.find((e: any) => e._id == stepId);
    const options = [];
    steps?.forEach((e: any) => {
      if (e._id !== stepId && e?.order > (thisStep?.order || -1)) {
        options.push({ optionValue: e._id, optionLabel: e.stepName });
      }
    });
    setAllFollowingStepToJump(options);
  };

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
      a?.name?.toUpperCase() < b?.name?.toUpperCase() ? -1 : a?.name?.toUpperCase() > b?.name?.toUpperCase() ? 1 : 0
    );
    setCurrencyData(sortedArr);
  }, []);

  useEffect(() => {
    if (stepData) {
      setStepDetails({
        stepName: stepData?.stepName,
        leadDay: stepData?.leadDay || 0,
        costPrice: stepData?.costPrice || 0,
        listPrice: stepData?.listPrice || 0,
        currency: stepData?.currency || user?.brandCurrency || '',
        isPassFail: stepData?.isPassFail === null ? false : stepData?.isPassFail,
        isFailAddon: stepData?.isFailAddon === null ? false : stepData?.isFailAddon,
        failAddon: stepData?.failAddon && Array.isArray(stepData?.failAddon) ? stepData?.failAddon : [],
        isPassAddon: stepData?.isPassAddon === null ? false : stepData?.isPassAddon,
        passAddon: stepData?.passAddon && Array.isArray(stepData?.passAddon) ? stepData?.passAddon : [],
        isJumpStepPass: stepData?.isJumpStepPass === null ? false : stepData?.isJumpStepPass,
        jumpStepsPass: stepData?.jumpStepsPass && Array.isArray(stepData?.jumpStepsPass) ? stepData?.jumpStepsPass : [],
        isJumpStepFail: stepData?.isJumpStepFail === null ? false : stepData?.isJumpStepFail,
        jumpStepsFail: stepData?.jumpStepsFail && Array.isArray(stepData?.jumpStepsFail) ? stepData?.jumpStepsFail : [],
        isQuoteRevisionOnFail: stepData?.isQuoteRevisionOnFail === null ? false : stepData?.isQuoteRevisionOnFail,
        isReturnToStepOnFail: stepData?.isReturnToStepOnFail === null ? false : stepData?.isReturnToStepOnFail,
        returnToStepOnFail: stepData?.returnToStepOnFail || '',
        isReturnToServiceOnFail: stepData?.isReturnToServiceOnFail === null ? false : stepData?.isReturnToServiceOnFail,
        returnToServiceOnFail: stepData?.returnToServiceOnFail || '',
      });
    } else if (stepId != '') {
      axiosInstance()
        .get(`${serviceMaster.api}/steps/${serviceId}/${stepId}`)
        .then(({ data: { data } }) => {
          setStepDetails({
            stepName: data?.stepName,
            leadDay: data?.leadDay || 0,
            costPrice: data?.costPrice || 0,
            listPrice: data?.listPrice || 0,
            currency: data?.currency || user?.brandCurrency || '',
            isPassFail: data?.isPassFail === null ? false : data?.isPassFail,
            isFailAddon: data?.isFailAddon === null ? false : data?.isFailAddon,
            failAddon: data?.failAddon && Array.isArray(data?.failAddon) ? data?.failAddon : [],
            isPassAddon: data?.isPassAddon === null ? false : data?.isPassAddon,
            passAddon: data?.passAddon && Array.isArray(data?.passAddon) ? data?.passAddon : [],
            isJumpStepPass: data?.isJumpStepPass === null ? false : data?.isJumpStepPass,
            jumpStepsPass: data?.jumpStepsPass && Array.isArray(data?.jumpStepsPass) ? data?.jumpStepsPass : [],
            isJumpStepFail: data?.isJumpStepFail === null ? false : data?.isJumpStepFail,
            jumpStepsFail: data?.jumpStepsFail && Array.isArray(data?.jumpStepsFail) ? data?.jumpStepsFail : [],
            isQuoteRevisionOnFail: data?.isQuoteRevisionOnFail === null ? false : data?.isQuoteRevisionOnFail,
            isReturnToStepOnFail: data?.isReturnToStepOnFail === null ? false : data?.isReturnToStepOnFail,
            returnToStepOnFail: data?.returnToStepOnFail || '',
            isReturnToServiceOnFail: data?.isReturnToServiceOnFail === null ? false : data?.isReturnToServiceOnFail,
            returnToServiceOnFail: data?.returnToServiceOnFail || '',
          });
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    } else {
      setStepDetails({
        stepName: '',
        leadDay: 0,
        costPrice: 0,
        listPrice: 0,
        currency: user?.currency || user?.brandCurrency,
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

  const handleSubmit = async (values) => {
    values.leadDay = parseInt(values.leadDay);
    values.costPrice = parseFloat(values.costPrice);
    values.listPrice = parseFloat(values.listPrice);
    setLoading(true);
    if (reference === 'workOrder') {
      if (!workOrderId || !uniqueId) toastConfig.setToast({ open: true, message: 'Something went wrong', severity: 'error' });
      values.serviceId = serviceId;
      if (stepData?._id) {
        values.stepId = stepData?._id;
      }
      values.fields = fields;
      handleSucess(values);
      setLoading(false);
    } else {
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
    <>
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
        {stepDetails ? (
          <Formik initialValues={stepDetails} onSubmit={handleSubmit} validateOnMount validate={validate}>
            {({ submitForm, touched, errors, setFieldValue, values }) => (
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
                />
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <CustomDialogContent>
                    <Grid container spacing={2}>
                      <Grid xs={12} md={6} sm={6} item>
                        <Field
                          component={TextFieldFormik}
                          margin="dense"
                          type="text"
                          label="Step Name"
                          name="stepName"
                          variant="outlined"
                          required
                          fullWidth
                          disabled={notEditable}
                          value={values['stepName']}
                          error={touched['stepName'] && Boolean(errors['stepName'])}
                          helperText={touched['stepName'] && errors['stepName']}
                          onChange={(e) => {
                            setFieldValue('stepName', e.target.value);
                          }}
                        />
                      </Grid>
                      <Grid xs={12} md={6} sm={6} item>
                        <Field
                          component={TextFieldFormik}
                          margin="dense"
                          type="number"
                          onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                          label="Lead Time"
                          name="leadDay"
                          variant="outlined"
                          fullWidth
                          disabled={notEditable}
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
                          disabled={notEditable}
                          getOptionLabel={(option: any) =>
                            option ? `${option?.currencyCode} - ${option?.currencyName} - (${option?.symbolNative})` : ''
                          }
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
                              disabled={notEditable}
                              error={touched['currency'] && Boolean(errors['currency'])}
                              helperText={touched['currency'] && errors['currency']}
                              required
                            />
                          )}
                        />
                      </Grid>
                      <Grid xs={12} md={4} sm={4} item>
                        <TextField
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">{`${values['currency'] !== '' ? currencyCodeToSymbol(values['currency']) : ''
                                }`}</InputAdornment>
                            )
                          }}
                          margin="dense"
                          type="number"
                          onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                          label="Cost Price"
                          name="costPrice"
                          variant="outlined"
                          fullWidth
                          disabled={notEditable}
                          value={values['costPrice']}
                          error={touched['costPrice'] && Boolean(errors['costPrice'])}
                          helperText={touched['costPrice'] && errors['costPrice']}
                          onChange={(e) => {
                            setFieldValue('costPrice', e.target.value);
                          }}
                        />
                      </Grid>
                      <Grid xs={12} md={4} sm={4} item>
                        <TextField
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">{`${values['currency'] !== '' ? currencyCodeToSymbol(values['currency']) : ''
                                }`}</InputAdornment>
                            )
                          }}
                          margin="dense"
                          type="number"
                          onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                          label="List Price"
                          name="listPrice"
                          variant="outlined"
                          fullWidth
                          disabled={notEditable}
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
                        disabled={notEditable}
                        control={
                          <Switch
                            name="isPassFail"
                            disabled={notEditable}
                            checked={values['isPassFail']}
                            onChange={(e) => {
                              setFieldValue('isPassFail', e.target.checked);
                            }}
                            color="primary"
                          />}
                        label="Pass Fail Logic"
                      />
                    </Box>
                    {values['isPassFail'] && (
                      <Box>
                        <Box pt={2}>
                          <Grid container>
                            <Grid item xs={6}>
                              <FormControlLabel
                                disabled={notEditable}
                                control={
                                  <Checkbox
                                    name="isPassAddon"
                                    disabled={notEditable}
                                    checked={values['isPassAddon']}
                                    onChange={(e) => {
                                      setFieldValue('isPassAddon', e.target.checked);
                                      setFieldValue('passAddon', []);
                                    }}
                                    color="primary"
                                  />
                                }
                                label="Add Services on Pass"
                              />
                            </Grid>
                            <Grid item xs={6}>
                              {values['isPassAddon'] && (
                                <Autocomplete
                                  options={[
                                    { optionValue: 'all', optionLabel: 'Select All Consequent Services' },
                                    ...services?.filter((data: any) => data.optionValue !== serviceId)
                                  ]}
                                  fullWidth
                                  multiple
                                  disabled={notEditable}
                                  size="small"
                                  value={values?.passAddon ? services?.filter((data: any) => values?.passAddon?.includes(data.optionValue)) : []}
                                  getOptionLabel={(option) => option.optionLabel}
                                  getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                                  onChange={(_, newVal: any) => {
                                    const isAll = Boolean(newVal?.find((v) => v?.optionValue === 'all'));
                                    const values = isAll
                                      ? [...services?.filter((data: any) => data.optionValue !== serviceId)].map((o) => o.optionValue)
                                      : newVal?.map((val) => val.optionValue);
                                    setFieldValue('passAddon', values);
                                  }}
                                  renderInput={(params) => (
                                    <TextField {...params} label="Add Services on Pass" name="passAddon" disabled={notEditable} variant="outlined" />
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
                                disabled={notEditable}
                                control={
                                  <Checkbox
                                    name="isFailAddon"
                                    disabled={notEditable}
                                    checked={values['isFailAddon']}
                                    onChange={(e) => {
                                      setFieldValue('isFailAddon', e.target.checked);
                                      setFieldValue('failAddon', []);
                                    }}
                                    color="primary"
                                  />
                                }
                                label="Add Services on Fail"
                              />
                            </Grid>
                            <Grid item xs={6}>
                              {values['isFailAddon'] && (
                                <Autocomplete
                                  options={[
                                    { optionValue: 'all', optionLabel: 'Select All Consequent Services' },
                                    ...services?.filter((data: any) => data.optionValue !== serviceId)
                                  ]}
                                  fullWidth
                                  multiple
                                  disabled={notEditable}
                                  size="small"
                                  value={values?.failAddon ? services?.filter((data: any) => values?.failAddon?.includes(data.optionValue)) : []}
                                  getOptionLabel={(option) => option.optionLabel}
                                  getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                                  onChange={(_, newVal: any) => {
                                    const isAll = Boolean(newVal?.find((v) => v?.optionValue === 'all'));
                                    const values = isAll
                                      ? [...services?.filter((data: any) => data.optionValue !== serviceId)].map((o) => o.optionValue)
                                      : newVal?.map((val) => val.optionValue);

                                    setFieldValue('failAddon', values);
                                  }}
                                  renderInput={(params) => (
                                    <TextField {...params} label="Add Services on Fail" name="failAddon" disabled={notEditable} variant="outlined" />
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
                                disabled={notEditable}
                                control={
                                  <Checkbox
                                    name="isJumpStepPass"
                                    disabled={notEditable}
                                    checked={values?.isJumpStepPass}
                                    onChange={(e) => {
                                      setFieldValue('isJumpStepPass', e.target.checked);
                                      setFieldValue('jumpStepsPass', []);
                                    }}
                                    color="primary"
                                  />
                                }
                                label="Skip Steps on Pass"
                              />
                            </Grid>
                            <Grid item xs={6}>
                              {values['isJumpStepPass'] && (
                                <Autocomplete
                                  options={[{ optionValue: 'all', optionLabel: 'Select All Consequent Steps' }, ...allFollowingStepToJump]}
                                  fullWidth
                                  multiple
                                  disabled={notEditable}
                                  size="small"
                                  value={
                                    values?.jumpStepsPass ? stepOption?.filter((data: any) => values?.jumpStepsPass?.includes(data.optionValue)) : []
                                  }
                                  getOptionLabel={(option) => option.optionLabel}
                                  getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                                  onChange={(_, newVal: any) => {
                                    const isAll = Boolean(newVal?.find((v) => v?.optionValue === 'all'));
                                    const values = isAll
                                      ? [...allFollowingStepToJump].map((o) => o.optionValue)
                                      : newVal?.map((val) => val.optionValue);

                                    setFieldValue('jumpStepsPass', values);
                                  }}
                                  renderInput={(params) => (
                                    <TextField {...params} label="Skip Steps on Pass" name="jumpStepsPass" disabled={notEditable} variant="outlined" />
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
                                disabled={notEditable}
                                control={
                                  <Checkbox
                                    name="isJumpStepFail"
                                    disabled={notEditable}
                                    checked={values?.isJumpStepFail}
                                    onChange={(e) => {
                                      setFieldValue('isJumpStepFail', e.target.checked);
                                      setFieldValue('jumpStepsFail', []);
                                    }}
                                    color="primary"
                                  />
                                }
                                label="Skip Steps on Fail"
                              />
                            </Grid>
                            <Grid item xs={6}>
                              {values['isJumpStepFail'] && (
                                <Autocomplete
                                  options={[{ optionValue: 'all', optionLabel: 'Select All Consequent Steps' }, ...allFollowingStepToJump]}
                                  fullWidth
                                  multiple
                                  disabled={notEditable}
                                  size="small"
                                  value={
                                    values?.jumpStepsFail ? stepOption?.filter((data: any) => values?.jumpStepsFail?.includes(data.optionValue)) : []
                                  }
                                  getOptionLabel={(option) => option.optionLabel}
                                  getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                                  onChange={(_, newVal: any[]) => {
                                    const isAll = Boolean(newVal?.find((v) => v?.optionValue === 'all'));
                                    const values = isAll ? allFollowingStepToJump?.map((o) => o.optionValue) : newVal?.map((val) => val.optionValue);

                                    setFieldValue('jumpStepsFail', values);
                                  }}
                                  renderInput={(params) => (
                                    <TextField {...params} label="Skip Steps on Fail" name="jumpStepsFail" disabled={notEditable} variant="outlined" />
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
                                    name="isQuoteRevisionOnFail"
                                    disabled={notEditable}
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
                                disabled={notEditable}
                                control={
                                  <Checkbox
                                    name="isReturnToStepOnFail"
                                    disabled={notEditable}
                                    checked={values?.isReturnToStepOnFail}
                                    onChange={(e) => {
                                      setFieldValue('isReturnToStepOnFail', e.target.checked);
                                      setFieldValue('returnToStepOnFail', '');
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
                                  disabled={notEditable}
                                  size="small"
                                  value={values?.returnToStepOnFail ? stepOption?.find((data) => data?.optionValue === values?.returnToStepOnFail) : ''}
                                  getOptionLabel={(option) => option.optionLabel}
                                  getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                                  onChange={(_, newVal: any) => {
                                    setFieldValue('returnToStepOnFail', newVal ? newVal?.optionValue : '');
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label="Return To Step On Fail"
                                      name="returnToStepOnFail"
                                      disabled={notEditable}
                                      variant="outlined"
                                    />
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
                                disabled={notEditable}
                                control={
                                  <Checkbox
                                    name="isReturnToServiceOnFail"
                                    disabled={notEditable}
                                    checked={values?.isReturnToServiceOnFail}
                                    onChange={(e) => {
                                      setFieldValue('isReturnToServiceOnFail', e.target.checked);
                                      setFieldValue('returnToServiceOnFail', '');
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
                                  disabled={notEditable}
                                  value={services?.find((data) => data?.optionValue === values?.returnToServiceOnFail) ?? ''}
                                  getOptionLabel={(option) => option?.optionLabel}
                                  renderOption={(option) => option?.optionLabel}
                                  // getOptionSelected={(option: any, val: any) => option?.optionValue === val?.optionValue}
                                  onChange={(_, newVal: any) => {
                                    setFieldValue('returnToServiceOnFail', newVal?.optionValue ?? '');
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label="Return To Service On Fail"
                                      name="returnToServiceOnFail"
                                      disabled={notEditable}
                                      variant="outlined"
                                    />
                                  )}
                                />
                              )}
                            </Grid>
                          </Grid>
                        </Box>
                      </Box>
                    )}
                    {reference === 'workOrder' && (
                      <Box mt={2}>
                        <Divider />
                        <Box mb={2} />
                        <Button size="small" color="primary" variant="contained" onClick={() => setOpenFieldDialog(true)}>
                          Configure Fields
                        </Button>
                      </Box>
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
                    {reference === 'workOrder' && notEditable ? null : (
                      <CustomButton
                        loading={loading}
                        disabled={loading}
                        onSubmit={submitForm}
                        variant="contained"
                        color="primary"
                        type="submit">
                        Save
                      </CustomButton>
                    )}
                  </CustomDialogFooter>
                </Form>
              </Fragment>
            )}
          </Formik>
        ) : <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>}
      </Dialog>
      {openFieldDialog && (
        <FieldDialog
          reference={'workOrder'}
          serviceId={serviceId}
          stepIds={[stepId]}
          steps={[]}
          fields={fields}
          notEditable={notEditable}
          handleClose={() => {
            setOpenFieldDialog(false);
          }}
          handleSucess={(data: any) => {
            setFields(data);
            setOpenFieldDialog(false);
          }}
        />
      )}
    </>
  );
}
