import { Box, Button, Dialog, Grid, IconButton, TextField, Typography } from '@material-ui/core';
import { AddCircleOutline, RemoveCircleOutline } from '@material-ui/icons';
import { Autocomplete } from '@material-ui/lab';
import { FieldArray, Form, Formik } from 'formik';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomDialogTransition, MATERIAL_TYPE, leadTimeStatusDropdown } from 'src/constants/helpers';

const ManageLeadTime = ({ onClose, onSuccess, referenceType, referenceId, referenceData, referenceLabel, loading = false }) => {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [steps, setSteps] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (referenceType === MATERIAL_TYPE.product || referenceType === MATERIAL_TYPE.package || referenceType === MATERIAL_TYPE.service) {
      setSteps(referenceData?.steps || []);
    } else {
      setSteps(referenceData?.leadTimeData || []);
    }
  }, [referenceData]);

  const add = () => {
    const newSteps = [...steps];
    setSteps([...newSteps]);
  };

  const handleSubmit = (values) => {
    if (
      (referenceType === MATERIAL_TYPE.product || referenceType === MATERIAL_TYPE.package || referenceType === MATERIAL_TYPE.service) &&
      referenceId
    ) {
      setIsSubmitting(true);
      axiosInstance()
        .post('/lead-time', {
          steps: values?.steps,
          leadTimeDays: values?.steps?.reduce((acc, curr) => acc + (parseInt(curr.days) || 0), 0),
          referenceType: referenceType,
          referenceId: referenceId
        })
        .then((res) => {
          setIsSubmitting(false);
          onSuccess();
        });
    } else {
      onSuccess(values);
    }
  };

  const validate = (values) => {
    const errors: any = {};
    if (values?.steps?.length > 0) {
      values?.steps?.forEach((d, i) => {
        if (!d.leadTimeStatus) {
          if (!errors?.steps) {
            errors['steps'] = [];
          }
          errors.steps[i] = { leadTimeStatus: 'Lead Time Status is required' };
        }
        if (!d.days) {
          if (!errors?.steps) {
            errors['steps'] = [];
          }
          errors.steps[i] = { ...errors.steps[i], days: 'Days is required' };
        }
      });
    }
    return errors;
  };

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
      open={true}
    >
      <Formik initialValues={{ steps }} enableReinitialize={true} validate={validate} onSubmit={handleSubmit}>
        {({ values, submitForm, touched, errors }) => (
          <>
            <CustomDialogHeader
              title={referenceLabel}
              onClose={onClose}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
            <CustomDialogContent>
              <Box mt={2} mb={1} style={{ maxHeight: fullScreen ? 'calc(100vh - 150px)' : '350px', overflow: 'auto' }} border={1} borderColor="var(--common-border-color)">
                <Box p={1} bgcolor="var(--dark-secondary, grey.200)">
                  <Grid container>
                    <Grid item xs={6}>
                      <Typography variant="body2">Lead Time Status</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2">
                        {values?.steps?.length && values?.steps?.reduce((acc, curr) => acc + (parseInt(curr.days) || 0), 0)
                          ? `${values?.steps?.reduce((acc, curr) => acc + (parseInt(curr.days) || 0), 0)} Days`
                          : 'Days'}
                      </Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Grid container justifyContent="flex-end">
                        <HtmlTooltip title="Add">
                          <IconButton
                            size="small"
                            aria-label="add"
                            onClick={() => {
                              values.steps.push({
                                leadTimeStatus: '',
                                days: ''
                              });
                              add();
                            }}
                          >
                            <AddCircleOutline fontSize="small" color="primary" />
                          </IconButton>
                        </HtmlTooltip>
                      </Grid>
                    </Grid>
                  </Grid>
                </Box>
                <Form>
                  <FieldArray
                    name="steps"
                    render={(arrayHelpers) => (
                      <>
                        {values?.steps?.length
                          ? values?.steps?.map((step, index) => {
                            return (
                              <Box key={index} p={1} borderTop={1} borderColor="var(--common-border-color)" width={'100%'}>
                                <Grid container spacing={1}>
                                  <Grid item xs={12} sm={12} md={6} lg={6}>
                                    <Autocomplete
                                      options={leadTimeStatusDropdown || []}
                                      getOptionLabel={(option) => option}
                                      value={step?.leadTimeStatus || ''}
                                      onChange={(event: any, val) => {
                                        arrayHelpers.replace(index, {
                                          ...values?.steps[index],
                                          ['leadTimeStatus']: val || ''
                                        });
                                      }}
                                      renderInput={(params) => (
                                        <TextField
                                          {...params}
                                          label="Lead Time Status"
                                          variant="outlined"
                                          name="leadTimeStatus"
                                          size="small"
                                          fullWidth
                                          required
                                          error={
                                            touched?.steps &&
                                            touched?.steps[index]?.leadTimeStatus &&
                                            errors?.steps &&
                                            Boolean(errors?.steps[index]?.leadTimeStatus)
                                          }
                                          helperText={
                                            touched?.steps &&
                                            touched?.steps[index]?.leadTimeStatus &&
                                            errors?.steps &&
                                            errors?.steps[index]?.leadTimeStatus
                                          }
                                        />
                                      )}
                                    />
                                  </Grid>
                                  <Grid item xs={10} sm={10} md={4} lg={4}>
                                    <TextField
                                      id="Days-Field"
                                      variant="outlined"
                                      margin="dense"
                                      name="days"
                                      label="Days"
                                      type="number"
                                      fullWidth
                                      style={{ margin: 0 }}
                                      value={step?.days || ''}
                                      required
                                      onChange={(e) => {
                                        arrayHelpers.replace(index, {
                                          ...values?.steps[index],
                                          ['days']: parseInt(e.target.value) ?? 0
                                        });
                                      }}
                                      error={touched?.steps && touched?.steps[index]?.days && errors?.steps && Boolean(errors?.steps[index]?.days)}
                                      helperText={touched?.steps && touched?.steps[index]?.days && errors?.steps && errors?.steps[index]?.days}
                                    />
                                  </Grid>
                                  <Grid item xs={2} sm={2} md={2} lg={2}>
                                    <Grid container justifyContent="flex-end">
                                      <HtmlTooltip title="Remove">
                                        <IconButton size="small" aria-label="remove" onClick={() => arrayHelpers.remove(index)}>
                                          <RemoveCircleOutline fontSize="small" color="primary" />
                                        </IconButton>
                                      </HtmlTooltip>
                                    </Grid>
                                  </Grid>
                                </Grid>
                              </Box>
                            );
                          })
                          : null}
                      </>
                    )}
                  />
                </Form>
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button disabled={isSubmitting || loading} type="button" variant="outlined" color="primary" size="small" onClick={onClose}>
                Cancel
              </Button>
              <CustomButton
                loading={isSubmitting || loading}
                variant="contained"
                color="primary"
                disabled={isSubmitting || loading}
                onClick={submitForm}
              >
                Save
              </CustomButton>
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default ManageLeadTime;
