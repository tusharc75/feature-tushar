import { Fragment, useContext, useEffect } from 'react';
import { Box, Dialog, FormControlLabel, InputAdornment, TextField, Switch } from '@mui/material';
import { isMobile, isTablet } from 'react-device-detect';
import { useState } from 'react';
import { currencyCodeToSymbol, CustomDialogTransition, getUniqueCurrencies, workOrder } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { serviceMaster } from 'src/constants/helpers';
import { Formik, Form } from 'formik';
import Checkbox from '@mui/material/Checkbox';
import Autocomplete from '@mui/material/Autocomplete';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';
import FieldDialog from './FieldDialog';
import Grid from '@mui/material/Grid2';
import CurrencyAutocomplete from 'src/components/Helpers/CurrencyAutocomplete';
import { ThemeButton } from 'src/components/Helpers/Buttons';

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
  stepData = null,
  isClone = false
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
  const [openFieldDialog, setOpenFieldDialog] = useState(false);
  const [fields, setFields] = useState(stepData ? stepData?.fields : []);
  const [allFollowingStepToJump, setAllFollowingStepToJump] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        isSkipServiceOnPass: stepData?.isSkipServiceOnPass === null ? false : stepData?.isSkipServiceOnPass,
        skipServiceOnPass: stepData?.skipServiceOnPass && Array.isArray(stepData?.skipServiceOnPass) ? stepData?.skipServiceOnPass : [],
        isSkipServiceOnFail: stepData?.isSkipServiceOnFail === null ? false : stepData?.isSkipServiceOnFail,
        skipServiceOnFail: stepData?.skipServiceOnFail && Array.isArray(stepData?.skipServiceOnFail) ? stepData?.skipServiceOnFail : [],
        isReperformServicesOnPass: stepData?.isReperformServicesOnPass === null ? false : stepData?.isReperformServicesOnPass,
        reperformServicesOnPass:
          stepData?.reperformServicesOnPass && Array.isArray(stepData?.reperformServicesOnPass) ? stepData?.reperformServicesOnPass : [],
        isReperformServicesOnFail: stepData?.isReperformServicesOnFail === null ? false : stepData?.isReperformServicesOnFail,
        reperformServicesOnFail:
          stepData?.reperformServicesOnFail && Array.isArray(stepData?.reperformServicesOnFail) ? stepData?.reperformServicesOnFail : [],
        isAddStepsOnPass: stepData?.isAddStepsOnPass === null ? false : stepData?.isAddStepsOnPass,
        isAddStepsOnFail: stepData?.isAddStepsOnFail === null ? false : stepData?.isAddStepsOnFail,
        isJumpStepPass: stepData?.isJumpStepPass === null ? false : stepData?.isJumpStepPass,
        jumpStepsPass: stepData?.jumpStepsPass && Array.isArray(stepData?.jumpStepsPass) ? stepData?.jumpStepsPass : [],
        isJumpStepFail: stepData?.isJumpStepFail === null ? false : stepData?.isJumpStepFail,
        jumpStepsFail: stepData?.jumpStepsFail && Array.isArray(stepData?.jumpStepsFail) ? stepData?.jumpStepsFail : [],
        isQuoteRevisionOnFail: stepData?.isQuoteRevisionOnFail === null ? false : stepData?.isQuoteRevisionOnFail,
        isReturnToStepOnFail: stepData?.isReturnToStepOnFail === null ? false : stepData?.isReturnToStepOnFail,
        returnToStepOnFail: stepData?.returnToStepOnFail || '',
        isReturnToServiceOnFail: stepData?.isReturnToServiceOnFail === null ? false : stepData?.isReturnToServiceOnFail,
        returnToServiceOnFail: stepData?.returnToServiceOnFail || '',
        stepDataCloneFromService: stepData?.stepDataCloneFromService || []
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
            isSkipServiceOnPass: data?.isSkipServiceOnPass === null ? false : data?.isSkipServiceOnPass,
            skipServiceOnPass: data?.skipServiceOnPass && Array.isArray(data?.skipServiceOnPass) ? data?.skipServiceOnPass : [],
            isSkipServiceOnFail: data?.isSkipServiceOnFail === null ? false : data?.isSkipServiceOnFail,
            skipServiceOnFail: data?.skipServiceOnFail && Array.isArray(data?.skipServiceOnFail) ? data?.skipServiceOnFail : [],
            isReperformServicesOnPass: data?.isReperformServicesOnPass === null ? false : data?.isReperformServicesOnPass,
            reperformServicesOnPass:
              data?.reperformServicesOnPass && Array.isArray(data?.reperformServicesOnPass) ? data?.reperformServicesOnPass : [],
            isReperformServicesOnFail: data?.isReperformServicesOnFail === null ? false : data?.isReperformServicesOnFail,
            reperformServicesOnFail:
              data?.reperformServicesOnFail && Array.isArray(data?.reperformServicesOnFail) ? data?.reperformServicesOnFail : [],
            isAddStepsOnPass: data?.isAddStepsOnPass === null ? false : data?.isAddStepsOnPass,
            isAddStepsOnFail: data?.isAddStepsOnFail === null ? false : data?.isAddStepsOnFail,
            isJumpStepPass: data?.isJumpStepPass === null ? false : data?.isJumpStepPass,
            jumpStepsPass: data?.jumpStepsPass && Array.isArray(data?.jumpStepsPass) ? data?.jumpStepsPass : [],
            isJumpStepFail: data?.isJumpStepFail === null ? false : data?.isJumpStepFail,
            jumpStepsFail: data?.jumpStepsFail && Array.isArray(data?.jumpStepsFail) ? data?.jumpStepsFail : [],
            isQuoteRevisionOnFail: data?.isQuoteRevisionOnFail === null ? false : data?.isQuoteRevisionOnFail,
            isReturnToStepOnFail: data?.isReturnToStepOnFail === null ? false : data?.isReturnToStepOnFail,
            returnToStepOnFail: data?.returnToStepOnFail || '',
            isReturnToServiceOnFail: data?.isReturnToServiceOnFail === null ? false : data?.isReturnToServiceOnFail,
            returnToServiceOnFail: data?.returnToServiceOnFail || '',
            stepDataCloneFromService: data?.stepDataCloneFromService || []
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
        isSkipServiceOnPass: false,
        skipServiceOnPass: [],
        isSkipServiceOnFail: false,
        skipServiceOnFail: [],
        isReperformServicesOnPass: false,
        reperformServicesOnPass: [],
        isReperformServicesOnFail: false,
        reperformServicesOnFail: [],
        isAddStepsOnPass: false,
        isAddStepsOnFail: false,
        isJumpStepPass: false,
        jumpStepsPass: [],
        isJumpStepFail: false,
        jumpStepsFail: [],
        isQuoteRevisionOnFail: false,
        isReturnToStepOnFail: false,
        returnToStepOnFail: '',
        isReturnToServiceOnFail: false,
        returnToServiceOnFail: '',
        stepDataCloneFromService: []
      });
    }
  }, []);

  const handleSubmit = (values) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    values.leadDay = parseInt(values.leadDay);
    values.costPrice = parseFloat(values.costPrice);
    values.listPrice = parseFloat(values.listPrice);
    setLoading(true);
    if (reference === 'workOrder') {
      if (!workOrderId || !uniqueId) toastConfig.setToastConfig({ open: true, message: 'Something went wrong', type: 'error' });
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
              type: 'success'
            });
            setLoading(false);
          })
          .catch((err) => {
            setLoading(false);
            toastConfig.setToastConfig(err);
          })
          .finally(() => setIsSubmitting(false));
      } else {
        axiosInstance()
          .post(`${serviceMaster.api}/steps/${serviceId}`, values)
          .then(({ data }) => {
            handleSucess();
            toastConfig.setToastConfig({
              open: true,
              message: data.message,
              type: 'success'
            });
            setLoading(false);
          })
          .catch((err) => {
            setLoading(false);
            toastConfig.setToastConfig(err);
          })
          .finally(() => setIsSubmitting(false));
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
        fullScreen={fullScreen}
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
                  title={isClone ? `Clone ${stepData?.stepName}` : 'Step Information'}
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
                <CustomDialogContent>
                  <Form autoComplete="off" autoCorrect="off" noValidate>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6, sm: 6 }}>
                        <TextField
                          margin="dense"
                          size="small"
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
                      <Grid size={{ xs: 12, md: 6, sm: 6 }}>
                        <TextField
                          margin="dense"
                          size="small"
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
                      <Grid size={{ xs: 12, md: 6, sm: 6 }}>
                        <CurrencyAutocomplete
                          limitTags={2}
                          value={values['currency']}
                          name={'currency'}
                          variant="outlined"
                          fullWidth={true}
                          size="small"
                          margin='none'
                          onChange={(event, newValue) => {
                            setFieldValue('currency', newValue && newValue.currencyCode ? newValue.currencyCode : '');
                          }}
                          error={touched['currency'] && Boolean(errors['currency'])}
                          helperText={touched['currency'] && errors['currency']}
                          disabled={notEditable}
                        />
                        {/* <Autocomplete
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
                          isOptionEqualToValue={(option: any, val) => option.currencyCode === val}
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
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">{`${values['currency'] !== '' ? currencyCodeToSymbol(values['currency']) : ''
                                  }`}</InputAdornment>
                              )
                            },
                          }}
                          margin="dense"
                          size="small"
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
                        /> */}
                      </Grid>
                      <Grid size={{ xs: 10, md: 6, sm: 6 }}>
                        <TextField
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">{`${values['currency'] !== '' ? currencyCodeToSymbol(values['currency']) : ''
                                  }`}</InputAdornment>
                              )
                            },
                          }}
                          type="number"
                          margin='none'
                          size="small"
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
                      <Grid>
                        <Grid size={{ xs: 12, md: 6, sm: 6 }}>
                          <Autocomplete
                            options={[
                              { optionValue: 'all', optionLabel: 'Select All Consequent Services' },
                              ...services?.filter((data: any) => data.optionValue !== serviceId)
                            ]}
                            fullWidth
                            multiple
                            disabled={notEditable}
                            size="small"
                            value={
                              values?.stepDataCloneFromService
                                ? services?.filter((data: any) => values?.stepDataCloneFromService?.includes(data.optionValue))
                                : []
                            }
                            getOptionLabel={(option) => option.optionLabel}
                            isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
                            onChange={(_, newVal: any) => {
                              const isAll = Boolean(newVal?.find((v) => v?.optionValue === 'all'));
                              const values = isAll
                                ? [...services?.filter((data: any) => data.optionValue !== serviceId)].map((o) => o.optionValue)
                                : newVal?.map((val) => val.optionValue);
                              setFieldValue('stepDataCloneFromService', values);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Step Data Clone From Service"
                                name="stepDataCloneFromService"
                                disabled={notEditable}
                                variant="outlined"
                              />
                            )}
                          />
                        </Grid>
                      </Grid>
                    </Box>
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
                          />
                        }
                        label="Pass Fail Logic"
                      />
                    </Box>
                    {values['isPassFail'] && (
                      <Box>
                        <Box pt={2}>
                          <Grid container>
                            <Grid size={{ xs: 12, md: 6 }}>
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
                            <Grid size={{ xs: 12, md: 6 }}>
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
                                  isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
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
                            <Grid size={{ xs: 12, md: 6 }}>
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
                            <Grid size={{ xs: 12, md: 6 }}>
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
                                  isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
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
                            <Grid size={{ xs: 12, md: 6 }}>
                              <FormControlLabel
                                disabled={notEditable}
                                control={
                                  <Checkbox
                                    name="isSkipServiceOnPass"
                                    disabled={notEditable}
                                    checked={values['isSkipServiceOnPass']}
                                    onChange={(e) => {
                                      setFieldValue('isSkipServiceOnPass', e.target.checked);
                                      setFieldValue('skipServiceOnPass', []);
                                    }}
                                    color="primary"
                                  />
                                }
                                label="Skip Services on Pass"
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              {values['isSkipServiceOnPass'] && (
                                <Autocomplete
                                  options={[
                                    { optionValue: 'all', optionLabel: 'Select All Consequent Services' },
                                    ...services?.filter((data: any) => data.optionValue !== serviceId)
                                  ]}
                                  fullWidth
                                  multiple
                                  disabled={notEditable}
                                  size="small"
                                  value={
                                    values?.skipServiceOnPass
                                      ? services?.filter((data: any) => values?.skipServiceOnPass?.includes(data.optionValue))
                                      : []
                                  }
                                  getOptionLabel={(option) => option.optionLabel}
                                  isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
                                  onChange={(_, newVal: any) => {
                                    const isAll = Boolean(newVal?.find((v) => v?.optionValue === 'all'));
                                    const values = isAll
                                      ? [...services?.filter((data: any) => data.optionValue !== serviceId)].map((o) => o.optionValue)
                                      : newVal?.map((val) => val.optionValue);
                                    setFieldValue('skipServiceOnPass', values);
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label="Skip Services on Pass"
                                      name="skipServiceOnPass"
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
                            <Grid size={{ xs: 12, md: 6 }}>
                              <FormControlLabel
                                disabled={notEditable}
                                control={
                                  <Checkbox
                                    name="isSkipServiceOnFail"
                                    disabled={notEditable}
                                    checked={values['isSkipServiceOnFail']}
                                    onChange={(e) => {
                                      setFieldValue('isSkipServiceOnFail', e.target.checked);
                                      setFieldValue('skipServiceOnFail', []);
                                    }}
                                    color="primary"
                                  />
                                }
                                label="Skip Services on Fail"
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              {values['isSkipServiceOnFail'] && (
                                <Autocomplete
                                  options={[
                                    { optionValue: 'all', optionLabel: 'Select All Consequent Services' },
                                    ...services?.filter((data: any) => data.optionValue !== serviceId)
                                  ]}
                                  fullWidth
                                  multiple
                                  disabled={notEditable}
                                  size="small"
                                  value={
                                    values?.skipServiceOnFail
                                      ? services?.filter((data: any) => values?.skipServiceOnFail?.includes(data.optionValue))
                                      : []
                                  }
                                  getOptionLabel={(option) => option.optionLabel}
                                  isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
                                  onChange={(_, newVal: any) => {
                                    const isAll = Boolean(newVal?.find((v) => v?.optionValue === 'all'));
                                    const values = isAll
                                      ? [...services?.filter((data: any) => data.optionValue !== serviceId)].map((o) => o.optionValue)
                                      : newVal?.map((val) => val.optionValue);
                                    setFieldValue('skipServiceOnFail', values);
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label="Skip Services on Fail"
                                      name="skipServiceOnFail"
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
                            <Grid size={{ xs: 12, md: 6 }}>
                              <FormControlLabel
                                disabled={notEditable}
                                control={
                                  <Checkbox
                                    name="isReperformServicesOnPass"
                                    disabled={notEditable}
                                    checked={values['isReperformServicesOnPass']}
                                    onChange={(e) => {
                                      setFieldValue('isReperformServicesOnPass', e.target.checked);
                                      setFieldValue('reperformServicesOnPass', []);
                                    }}
                                    color="primary"
                                  />
                                }
                                label="Reperform Services on Pass"
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              {values['isReperformServicesOnPass'] && (
                                <Autocomplete
                                  options={[
                                    { optionValue: 'all', optionLabel: 'Select All Consequent Services' },
                                    ...services?.filter((data: any) => data.optionValue !== serviceId)
                                  ]}
                                  fullWidth
                                  multiple
                                  disabled={notEditable}
                                  size="small"
                                  value={
                                    values?.reperformServicesOnPass
                                      ? services?.filter((data: any) => values?.reperformServicesOnPass?.includes(data.optionValue))
                                      : []
                                  }
                                  getOptionLabel={(option) => option.optionLabel}
                                  isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
                                  onChange={(_, newVal: any) => {
                                    const isAll = Boolean(newVal?.find((v) => v?.optionValue === 'all'));
                                    const values = isAll
                                      ? [...services?.filter((data: any) => data.optionValue !== serviceId)].map((o) => o.optionValue)
                                      : newVal?.map((val) => val.optionValue);
                                    setFieldValue('reperformServicesOnPass', values);
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label="Reperform Services on Pass"
                                      name="reperformServicesOnPass"
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
                            <Grid size={{ xs: 12, md: 6 }}>
                              <FormControlLabel
                                disabled={notEditable}
                                control={
                                  <Checkbox
                                    name="isReperformServicesOnFail"
                                    disabled={notEditable}
                                    checked={values['isReperformServicesOnFail']}
                                    onChange={(e) => {
                                      setFieldValue('isReperformServicesOnFail', e.target.checked);
                                      setFieldValue('reperformServicesOnFail', []);
                                    }}
                                    color="primary"
                                  />
                                }
                                label="Reperform Services on Fail"
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              {values['isReperformServicesOnFail'] && (
                                <Autocomplete
                                  options={[
                                    { optionValue: 'all', optionLabel: 'Select All Consequent Services' },
                                    ...services?.filter((data: any) => data.optionValue !== serviceId)
                                  ]}
                                  fullWidth
                                  multiple
                                  disabled={notEditable}
                                  size="small"
                                  value={
                                    values?.reperformServicesOnFail
                                      ? services?.filter((data: any) => values?.reperformServicesOnFail?.includes(data.optionValue))
                                      : []
                                  }
                                  getOptionLabel={(option) => option.optionLabel}
                                  isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
                                  onChange={(_, newVal: any) => {
                                    const isAll = Boolean(newVal?.find((v) => v?.optionValue === 'all'));
                                    const values = isAll
                                      ? [...services?.filter((data: any) => data.optionValue !== serviceId)].map((o) => o.optionValue)
                                      : newVal?.map((val) => val.optionValue);
                                    setFieldValue('reperformServicesOnFail', values);
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label="Reperform Services on Fail"
                                      name="reperformServicesOnFail"
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
                            <Grid size={{ xs: 12, md: 6 }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    name="isAddStepsOnPass"
                                    disabled={notEditable}
                                    checked={values?.isAddStepsOnPass}
                                    onChange={(e) => {
                                      setFieldValue('isAddStepsOnPass', e.target.checked);
                                    }}
                                    color="primary"
                                  />
                                }
                                label="Add Steps On Pass"
                              />
                            </Grid>
                          </Grid>
                        </Box>
                        <Box pt={2}>
                          <Grid container>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    name="isAddStepsOnFail"
                                    disabled={notEditable}
                                    checked={values?.isAddStepsOnFail}
                                    onChange={(e) => {
                                      setFieldValue('isAddStepsOnFail', e.target.checked);
                                    }}
                                    color="primary"
                                  />
                                }
                                label="Add Steps On Fail"
                              />
                            </Grid>
                          </Grid>
                        </Box>
                        <Box pt={2}>
                          <Grid container>
                            <Grid size={{ xs: 12, md: 6 }}>
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
                            <Grid size={{ xs: 12, md: 6 }}>
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
                                  isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
                                  onChange={(_, newVal: any) => {
                                    const isAll = Boolean(newVal?.find((v) => v?.optionValue === 'all'));
                                    const values = isAll
                                      ? [...allFollowingStepToJump].map((o) => o.optionValue)
                                      : newVal?.map((val) => val.optionValue);

                                    setFieldValue('jumpStepsPass', values);
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label="Skip Steps on Pass"
                                      name="jumpStepsPass"
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
                            <Grid size={{ xs: 12, md: 6 }}>
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
                            <Grid size={{ xs: 12, md: 6 }}>
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
                                  isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
                                  onChange={(_, newVal: any[]) => {
                                    const isAll = Boolean(newVal?.find((v) => v?.optionValue === 'all'));
                                    const values = isAll ? allFollowingStepToJump?.map((o) => o.optionValue) : newVal?.map((val) => val.optionValue);

                                    setFieldValue('jumpStepsFail', values);
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label="Skip Steps on Fail"
                                      name="jumpStepsFail"
                                      disabled={notEditable}
                                      variant="outlined"
                                    />
                                  )}
                                />
                              )}
                            </Grid>
                          </Grid>
                        </Box>
                        {user?.brandPolicy?.repairOrderQuotation && (
                          <Box pt={2}>
                            <Grid container>
                              <Grid size={{ xs: 12, md: 6 }}>
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
                                  label="Quotation Revision On Fail"
                                />
                              </Grid>
                            </Grid>
                          </Box>
                        )}
                        <Box pt={2}>
                          <Grid container>
                            <Grid size={{ xs: 12, md: 6 }}>
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
                            <Grid size={{ xs: 12, md: 6 }}>
                              {values['isReturnToStepOnFail'] && (
                                <Autocomplete
                                  options={stepOption}
                                  fullWidth
                                  disabled={notEditable}
                                  size="small"
                                  value={
                                    values?.returnToStepOnFail ? stepOption?.find((data) => data?.optionValue === values?.returnToStepOnFail) : ''
                                  }
                                  getOptionLabel={(option) => option.optionLabel}
                                  isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
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
                            <Grid size={{ xs: 12, md: 6 }}>
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
                            <Grid size={{ xs: 12, md: 6 }}>
                              {values['isReturnToServiceOnFail'] && (
                                <Autocomplete
                                  options={services}
                                  fullWidth
                                  size="small"
                                  disabled={notEditable}
                                  value={services?.find((data) => data?.optionValue === values?.returnToServiceOnFail) ?? ''}
                                  getOptionLabel={(option) => option?.optionLabel}
                                  renderOption={(props, option, state, ownerState) => {
                                    const { key, ...optionProps } = props;
                                    return (
                                      <Box key={key} component="li" {...optionProps}>
                                        {ownerState.getOptionLabel(option)}
                                      </Box>
                                    );
                                  }}
                                  // isOptionEqualToValue={(option: any, val: any) => option?.optionValue === val?.optionValue}
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
                  </Form>
                </CustomDialogContent>
                <CustomDialogFooter>
                  {reference === 'workOrder' && (
                    <ThemeButton buttonType="theme" onClick={() => setOpenFieldDialog(true)}>
                      Configure Fields
                    </ThemeButton>
                  )}
                  <div style={{ flex: '1 0 0' }} />
                  <ThemeButton
                    buttonType="transparent"
                    onClick={() => {
                      handleClose();
                    }}
                  >
                    Cancel
                  </ThemeButton>
                  {reference === 'workOrder' && notEditable ? null : (
                    <ThemeButton
                      isLoading={loading}
                      disabled={loading || isSubmitting}
                      onClick={(e) => {
                        e.preventDefault();
                        submitForm();
                      }}
                      buttonType="theme"
                    >
                      Save
                    </ThemeButton>
                  )}
                </CustomDialogFooter>
              </Fragment>
            )}
          </Formik>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Dialog>
      {openFieldDialog && (
        <FieldDialog
          reference={'workOrder'}
          serviceIds={[serviceId]}
          stepIds={[stepId]}
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
