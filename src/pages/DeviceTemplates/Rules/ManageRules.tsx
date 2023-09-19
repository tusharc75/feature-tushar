import { Fragment, useContext, useEffect, useState } from 'react';
import { Box, Button, Checkbox, Dialog, FormControlLabel, Grid, IconButton, TextField } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, sidebarResource, yupSchema } from 'src/constants/helpers';
import { FieldArray, Form, Formik, getIn } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomButton from 'src/components/Helpers/CustomButton';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import { Autocomplete } from '@material-ui/lab';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { UserDropdown } from 'src/components/Activity/Helpers/userDropdown';
import { TbRuler2Off } from 'react-icons/tb';
import { isEqual } from 'lodash';

export default function ManageRules({ deviceTemplate, open, isClone = false, id = null, onClose, onSuccess }) {
  const OPERATOR = [
    {
      optionLabel: 'Less than',
      optionValue: 'lessThan'
    },
    {
      optionLabel: 'Less than or equals',
      optionValue: 'lessThanOrEquals'
    },
    {
      optionLabel: 'Greater than',
      optionValue: 'greaterThan'
    },
    {
      optionLabel: 'Greater than or equals',
      optionValue: 'greaterThanOrEquals'
    }
  ];

  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(true);
  const [iotDataPoints, setIotDataPoints] = useState([]);
  const [initialValue, setInitialValue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [cloneHeading, setCloneHeading] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = () => {
    setLoading(true);
    if (id) {
      axiosInstance()
        .get(`${routes.deviceTemplates.path}/rule/${id}`)
        .then(({ data: { data } }) => {
          setInitialValue({
            ruleName: isClone ? '' : data?.ruleName,
            condition: data?.condition,
            isEmailAlert: data?.isEmailAlert,
            emailAlertUsers: data?.emailAlertUsers?.map((e) => ({ userId: e })),
            isCreateTask: data?.isCreateTask,
            taksAssignUsers: data?.taksAssignUsers?.map((t) => ({ userId: t }))
          });
          setLoading(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    } else {
      setInitialValue({
        ruleName: '',
        condition: [{ dataPoint: null, operator: null, value: null }],
        isEmailAlert: false,
        emailAlertUsers: [],
        isCreateTask: false,
        taksAssignUsers: []
      });
      setLoading(false);
    }
  };

  const findIotDataoints = () => {
    const query = [{ field: 'deviceTemplate', term: deviceTemplate }];
    axiosInstance()
      .get(`${routes.iotDataPoints.path}?filterById=${JSON.stringify(query)}&filterType=and`)
      .then(
        ({
          data: {
            data: { data }
          }
        }) => {
          setIotDataPoints(data?.map((d) => ({ optionLabel: d?.fieldLabel, optionValue: d?._id })));
        }
      );
  };

  useEffect(() => {
    findIotDataoints();
  }, []);

  const handleSubmit = (values) => {
    setLoading(true);
    if (id && !isClone) {
      values._id = id;
      axiosInstance()
        .put(`${routes.deviceTemplates.path}/rule`, values)
        .then(({ data: { data, message } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
          onSuccess();
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      values.deviceTemplate = deviceTemplate;
      axiosInstance()
        .post(`${routes.deviceTemplates.path}/rule`, values)
        .then(({ data: { data, message } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
          onSuccess();
          setLoading(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setLoading(false);
        });
    }
  };

  function validate(values) {
    const errors = {};
    if (values.ruleName === '') {
      errors['ruleName'] = 'Please enter rule name';
    }

    if (values?.condition?.length > 0) {
      values?.condition?.forEach((cnd: any, i) => {
        if (!cnd?.dataPoint) {
          errors[`condition.${i}.dataPoint`] = 'Data Point is Required';
        }
        if (!cnd?.operator) {
          errors[`condition.${i}.operator`] = 'Operator is Required';
        }
        if (!cnd?.value) {
          errors[`condition.${i}.value`] = 'Value is Required';
        }
      });
    }

    if (values?.isEmailAlert) {
      if (values?.emailAlertUsers?.length <= 0) {
        errors['emailAlertUsers'] = 'Email Alert Users is Required';
      }
    }

    if (values?.isCreateTask) {
      if (values?.taksAssignUsers?.length <= 0) {
        errors['taksAssignUsers'] = 'Taks Assign Users is Required';
      }
    }

    return errors;
  }

  return (
    <>
      <Dialog
        maxWidth="md"
        fullWidth
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            setShowConfirmDialog(true);
          }
        }}
        open={open}
      >
        {initialValue ? (
          <Formik initialValues={initialValue} validateOnMount validate={validate} onSubmit={handleSubmit}>
            {({ values, errors, touched, setFieldValue, submitForm }) => (
              <Fragment>
                <CustomDialogHeader
                  title={id ? isClone ? `Clone - ${initialValue?.ruleName}` : `Update Rule - ${initialValue?.ruleName}` : 'Create Rule'}
                  onClose={(e, reason) => {
                    if (isEqual(initialValue, values)) {
                      onClose();
                    } else {
                      setShowConfirmDialog(true);
                    }
                  }}
                  isMinimized={!fullScreen}
                  onMinimizeMaximize={() => {
                    setFullScreen((prevState) => !prevState);
                  }}
                  showManimizeMaximize={true}
                />
                <CustomDialogContent>
                  <Form autoComplete="off" autoCorrect="off" noValidate>
                    <div className="main-wrapper">
                      <div className="name-container mb-2 sm:mb-3 md:mb-4">
                        <TextField
                          margin="dense"
                          type="text"
                          label="Rule Name"
                          name="ruleName"
                          variant="outlined"
                          required
                          fullWidth
                          disabled={false}
                          value={values['ruleName']}
                          error={touched['ruleName'] && Boolean(errors['ruleName'])}
                          helperText={touched['ruleName'] && errors['ruleName']}
                          onChange={(e) => {
                            setFieldValue('ruleName', e.target.value);
                          }}
                        />
                      </div>
                      <div className="conditions-container container-with-border p-2 sm:p-3 md:p-4 mb-2 sm:mb-3 md:mb-4">
                        <h2 style={{ margin: 0 }} className="form-label-style mb-3">
                          Conditions
                        </h2>
                        <div className="grid gap-4">
                          <FieldArray name="condition">
                            {({ push, remove }) => (
                              <>
                                {values?.condition?.map((cnd, i) => {
                                  return (
                                    <Box className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] md:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                                      <Box>
                                        <Autocomplete
                                          options={iotDataPoints}
                                          getOptionLabel={(option) => option?.optionLabel}
                                          value={iotDataPoints?.find((data) => data?.optionValue === values?.condition[i]?.dataPoint) ?? ''}
                                          fullWidth
                                          onChange={(e, newValue) => {
                                            setFieldValue(`condition.${i}.dataPoint`, newValue?.optionValue);
                                          }}
                                          size="small"
                                          renderInput={(params) => (
                                            <TextField
                                              {...params}
                                              label="Data Points"
                                              margin="none"
                                              size="small"
                                              error={
                                                touched?.condition && touched?.condition[i]?.dataPoint && Boolean(errors[`condition.${i}.dataPoint`])
                                              }
                                              helperText={
                                                touched?.condition && touched?.condition[i]?.dataPoint && errors[`condition.${i}.dataPoint`]
                                              }
                                              variant="outlined"
                                            />
                                          )}
                                        />
                                      </Box>
                                      <Box>
                                        <Autocomplete
                                          options={OPERATOR}
                                          getOptionLabel={(option: any) => option?.optionLabel ?? ''}
                                          value={OPERATOR?.find((data) => data?.optionValue === values?.condition[i]?.operator) ?? ''}
                                          fullWidth
                                          onChange={(event, newValue: any) => {
                                            setFieldValue(`condition.${i}.operator`, newValue?.optionValue);
                                          }}
                                          size="small"
                                          renderInput={(params) => (
                                            <TextField
                                              {...params}
                                              label="Operator"
                                              margin="none"
                                              size="small"
                                              error={
                                                touched?.condition && touched?.condition[i]?.operator && Boolean(errors[`condition.${i}.operator`])
                                              }
                                              helperText={touched?.condition && touched?.condition[i]?.operator && errors[`condition.${i}.operator`]}
                                              variant="outlined"
                                            />
                                          )}
                                        />
                                      </Box>
                                      <Box>
                                        <TextField
                                          margin="none"
                                          size="small"
                                          type="number"
                                          label="Value"
                                          name="value"
                                          variant="outlined"
                                          fullWidth
                                          value={values?.condition[i]?.value}
                                          error={touched?.condition && touched?.condition[i]?.value && Boolean(errors[`condition.${i}.value`])}
                                          helperText={touched?.condition && touched?.condition[i]?.value && errors[`condition.${i}.value`]}
                                          onChange={(e) => {
                                            setFieldValue(`condition.${i}.value`, parseFloat(e.target.value));
                                          }}
                                        />
                                      </Box>
                                      <Box className=" max-w-fit ml-auto" display="flex" justifyContent="space-between" alignItems="center">
                                        <IconButton size="small" aria-label="close" onClick={() => remove(i)}>
                                          <CloseIcon fontSize="small" color={'primary'} />
                                        </IconButton>
                                        <IconButton
                                          size="small"
                                          aria-label="add"
                                          onClick={() => push({ dataPoint: null, operator: null, value: null })}
                                        >
                                          <AddIcon fontSize="small" color={'primary'} />
                                        </IconButton>
                                      </Box>
                                    </Box>
                                  );
                                })}
                              </>
                            )}
                          </FieldArray>
                        </div>
                      </div>
                      <div className="actions-container container-with-border p-2 sm:p-3 md:p-4 mb-2 sm:mb-3 md:mb-4">
                        <h2 style={{ margin: 0 }} className="form-label-style  mb-2">
                          Actions
                        </h2>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 items-center mb-2 min-h-[52px]">
                          <div className="min-w-[138px]">
                            <FormControlLabel
                              style={{ margin: 0 }}
                              control={
                                <Checkbox
                                  checked={values['isEmailAlert']}
                                  onChange={(e) => {
                                    setFieldValue('isEmailAlert', e.target.checked);
                                  }}
                                  name="isEmailAlert"
                                  color="primary"
                                />
                              }
                              label="Email Alert"
                            />
                          </div>
                          {values['isEmailAlert'] && (
                            <div className="flex-grow max-w-md min-w-[min(250px,100%)]">
                              <UserDropdown
                                name="emailAlertUsers"
                                label="Email Alert Users"
                                errors={errors}
                                touched={touched}
                                required={true}
                                setFieldValue={(name, value) => {
                                  setFieldValue(name, value);
                                }}
                                multiple={true}
                                value={values['emailAlertUsers']}
                                email={[]}
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 items-center mb-2 min-h-[52px]">
                          <div className="min-w-[138px]">
                            <FormControlLabel
                              style={{ margin: 0 }}
                              control={
                                <Checkbox
                                  checked={values['isCreateTask']}
                                  onChange={(e) => {
                                    setFieldValue('isCreateTask', e.target.checked);
                                  }}
                                  name="isCreateTask"
                                  color="primary"
                                />
                              }
                              label="Create Task"
                            />
                          </div>
                          {values['isCreateTask'] && (
                            <div className="flex-grow max-w-md min-w-[min(250px,100%)]">
                              <UserDropdown
                                name="taksAssignUsers"
                                label="Taks Assign Users"
                                errors={errors}
                                touched={touched}
                                required={true}
                                setFieldValue={(name, value) => {
                                  setFieldValue(name, value);
                                }}
                                multiple={true}
                                value={values['taksAssignUsers']}
                                email={[]}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Form>
                </CustomDialogContent>
                <CustomDialogFooter>
                  <Button
                    type="button"
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => {
                      if (isEqual(initialValue, values)) {
                        onClose();
                      } else {
                        setShowConfirmDialog(true);
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <CustomButton
                    loading={loading}
                    variant="contained"
                    color="primary"
                    disabled={isEqual(initialValue, values)}
                    onClick={(e) => {
                      e.preventDefault();
                      submitForm();
                    }}
                  >
                    Save
                  </CustomButton>
                </CustomDialogFooter>

                {showConfirmDialog ? (
                  <ConfirmCancelDialog
                    open={showConfirmDialog}
                    onSave={() => {
                      setShowConfirmDialog(false);
                      submitForm();
                    }}
                    close={() => setShowConfirmDialog(false)}
                    onClose={() => {
                      setShowConfirmDialog(false);
                      onClose();
                    }}
                  />
                ) : null}
              </Fragment>
            )}
          </Formik>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Dialog>
    </>
  );
}
