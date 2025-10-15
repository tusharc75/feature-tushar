import { Box, Dialog, IconButton, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import { FieldArray, Form, Formik } from 'formik';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomDialogTransition, serviceMaster } from 'src/constants/helpers';

const ManageAllocationPercentage = ({ onClose, onSuccess, referenceData, referenceLabel, loading = false }) => {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [allocations, setAllocations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    setAllocations(referenceData?.allocations || []);
  }, [referenceData]);

  const add = () => {
    const newAllocations = [...allocations];
    setAllocations([...newAllocations]);
  };

  const handleSubmit = (values) => {
    const totalPercentage = values?.allocations?.reduce((acc, curr) => {
      const val = curr.percentage === '' || curr.percentage === null || curr.percentage === undefined ? 0 : parseFloat(curr.percentage) || 0;
      return acc + val;
    }, 0) || 0;

    if (values?.allocations?.length > 0 && Math.abs(totalPercentage - 100) > 0.01) {
      setShowError(true);
      return;
    }

    setShowError(false);

    if (referenceData?._id) {
      setIsSubmitting(true);
      axiosInstance()
        .post(`${serviceMaster.api}/allocation`, {
          _id: referenceData._id,
          allocations: values?.allocations?.map(allocation => ({
            revenueClass: allocation?.revenueClass,
            department: allocation?.department,
            percentage: parseFloat(allocation?.percentage) || 0
          }))
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setIsSubmitting(false);
          onSuccess();
        })
        .catch((error) => {
          setIsSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      onSuccess(values);
    }
  };

  const validate = (values) => {
    const errors: any = {};
    let totalPercentage = 0;

    if (values?.allocations?.length > 0) {
      values?.allocations?.forEach((d, i) => {
        if (!d.revenueClass) {
          if (!errors?.allocations) {
            errors['allocations'] = [];
          }
          errors.allocations[i] = { revenueClass: 'Revenue Class is required' };
        }
        if (!d.department) {
          if (!errors?.allocations) {
            errors['allocations'] = [];
          }
          errors.allocations[i] = { ...errors.allocations[i], department: 'Department is required' };
        }
        if (d.percentage === '' || d.percentage === null || d.percentage === undefined) {
          if (!errors?.allocations) {
            errors['allocations'] = [];
          }
          errors.allocations[i] = { ...errors.allocations[i], percentage: 'Percentage is required' };
        }

        if (d.percentage !== '' && d.percentage !== null && d.percentage !== undefined) {
          const percentageVal = parseFloat(d.percentage) || 0;
          if (percentageVal < 0 || percentageVal > 100) {
            if (!errors?.allocations) {
              errors['allocations'] = [];
            }
            errors.allocations[i] = { ...errors.allocations[i], percentage: 'Percentage must be between 0 and 100' };
          } else {
            totalPercentage += percentageVal;
          }
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
      <Formik initialValues={{ allocations }} enableReinitialize={true} validate={validate} onSubmit={handleSubmit}>
        {({ values, submitForm, touched, errors }) => {
          return (
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
                <Box
                  mt={2}
                  mb={1}
                  style={{ maxHeight: fullScreen ? 'calc(100vh - 150px)' : '350px', overflow: 'auto' }}
                  border={1}
                  borderColor="var(--common-border-color)"
                >
                  <Box p={1} bgcolor="var(--dark-secondary, grey.200)">
                    <Grid container>
                      <Grid size={{ xs: 10, sm: 10, md: 3, lg: 3 }}>
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="body2">Revenue Class</Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 10, sm: 10, md: 3, lg: 3 }}>
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="body2">Department</Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 10, sm: 10, md: 4, lg: 4 }}>
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="body2">Percentage</Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 2 }}>
                        <Grid container justifyContent="flex-end">
                          <HtmlTooltip title="Add">
                            <IconButton
                              size="small"
                              aria-label="add"
                              onClick={() => {
                                values.allocations.push({
                                  revenueClass: '',
                                  department: '',
                                  percentage: ''
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
                      name="allocations"
                      render={(arrayHelpers) => (
                        <>
                          {values?.allocations?.length
                            ? values?.allocations?.map((allocation, index) => {
                              return (
                                <Box key={index} p={1} borderTop={1} borderColor="var(--common-border-color)" width={'100%'}>
                                  <Grid container spacing={1} alignItems="center">
                                    <Grid size={{ xs: 10, sm: 10, md: 3, lg: 3 }}>
                                      <TextField
                                        id="revenue-class-field"
                                        variant="outlined"
                                        margin="dense"
                                        size="small"
                                        name="revenueClass"
                                        label="Revenue Class"
                                        autoComplete='off'
                                        fullWidth
                                        value={allocation?.revenueClass || ''}
                                        required
                                        onChange={(e) => {
                                          arrayHelpers.replace(index, {
                                            ...values?.allocations[index],
                                            ['revenueClass']: e.target.value
                                          });
                                        }}
                                        error={
                                          touched?.allocations &&
                                          touched?.allocations[index]?.revenueClass &&
                                          errors?.allocations &&
                                          Boolean(errors?.allocations[index]?.revenueClass)
                                        }
                                        helperText={
                                          touched?.allocations &&
                                          touched?.allocations[index]?.revenueClass &&
                                          errors?.allocations &&
                                          errors?.allocations[index]?.revenueClass
                                        }
                                      />
                                    </Grid>
                                    <Grid size={{ xs: 10, sm: 10, md: 3, lg: 3 }}>
                                      <TextField
                                        id="department-field"
                                        variant="outlined"
                                        margin="dense"
                                        size="small"
                                        name="department"
                                        label="Department"
                                        autoComplete='off'
                                        fullWidth
                                        value={allocation?.department || ''}
                                        required
                                        onChange={(e) => {
                                          arrayHelpers.replace(index, {
                                            ...values?.allocations[index],
                                            ['department']: e.target.value
                                          });
                                        }}
                                        error={
                                          touched?.allocations &&
                                          touched?.allocations[index]?.department &&
                                          errors?.allocations &&
                                          Boolean(errors?.allocations[index]?.department)
                                        }
                                        helperText={
                                          touched?.allocations &&
                                          touched?.allocations[index]?.department &&
                                          errors?.allocations &&
                                          errors?.allocations[index]?.department
                                        }
                                      />
                                    </Grid>
                                    <Grid size={{ xs: 10, sm: 10, md: 4, lg: 4 }}>
                                      <TextField
                                        id="percentage-field"
                                        variant="outlined"
                                        margin="dense"
                                        size="small"
                                        name="percentage"
                                        label="Percentage"
                                        type="number"
                                        fullWidth
                                        InputProps={{
                                          endAdornment: '%'
                                        }}
                                        style={{ margin: 0 }}
                                        value={allocation?.percentage !== undefined && allocation?.percentage !== null ? allocation?.percentage : ''}
                                        required
                                        onChange={(e) => {
                                          const value = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                                          arrayHelpers.replace(index, {
                                            ...values?.allocations[index],
                                            ['percentage']: value
                                          });
                                        }}
                                        error={
                                          touched?.allocations &&
                                          touched?.allocations[index]?.percentage &&
                                          errors?.allocations &&
                                          Boolean(errors?.allocations[index]?.percentage)
                                        }
                                        helperText={
                                          touched?.allocations &&
                                          touched?.allocations[index]?.percentage &&
                                          errors?.allocations &&
                                          errors?.allocations[index]?.percentage
                                        }
                                      />
                                    </Grid>
                                    <Grid size={{ xs: 2, sm: 2, md: 2, lg: 2 }}>
                                      <Grid container justifyContent="flex-end">
                                        <HtmlTooltip title="Remove">
                                          <IconButton size="small" aria-label="remove" onClick={() => arrayHelpers.remove(index)}>
                                            <RemoveCircleOutline fontSize="small" color="error" />
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
              {showError && (
                <Box px={2} pb={1} className="flex justify-end">
                  <Typography variant="body2" color="error" textAlign="center">
                    Total percentage must equal 100%
                  </Typography>
                </Box>
              )}
              <CustomDialogFooter>
                <ThemeButton disabled={isSubmitting || loading} buttonType="transparent" onClick={onClose}>
                  Cancel
                </ThemeButton>
                <ThemeButton isLoading={isSubmitting || loading} buttonType="theme" disabled={isSubmitting || loading} onClick={submitForm}>
                  Save
                </ThemeButton>
              </CustomDialogFooter>
            </>
          );
        }}
      </Formik>
    </Dialog>
  );
};

export default ManageAllocationPercentage;
