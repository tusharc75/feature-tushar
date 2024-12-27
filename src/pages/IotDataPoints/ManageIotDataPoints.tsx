import { Box, Button, Chip, CircularProgress, Dialog, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import InputField from 'src/components/Helpers/InputField';
import routes from 'src/components/Helpers/Routes';
import { useHistory } from 'react-router-dom';
import { CustomDialogTransition, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../constants/helpers';
import Autocomplete from '@mui/material/Autocomplete';
import { checkFormula } from 'src/constants/formulaUtility';

const ManageIotDataPoints = ({ onClose, onSuccess, isClone = false, id = null, referenceData = null }) => {
  const history = useHistory();
  const inputRef = useRef<any>();
  const {
    state: { user, resources }
  }: any = useData();
  const toastConfig = useContext(CustomToastContext);
  const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
  const [loading, setLoading] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);
  const [cloneHeading, setCloneHeading] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [iotDataPoints, setIotDataPoints] = useState([]);
  const [formulaError, setFormulaError] = useState(null);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    findIotDataoints();
  }, []);

  const findIotDataoints = () => {
    axiosInstance()
      .get(`${routes.iotDataPoints.path}?deepFilter=${JSON.stringify([{ field: 'custom', term: 'no' }])}`)
      .then(
        ({
          data: {
            data: { data }
          }
        }) => {
          setIotDataPoints(data?.map((d) => ({ optionLabel: d?.minid ? d?.fieldLabel + '-' + d?.minid : d?.fieldLabel, optionValue: d?.fieldName })));
        }
      );
  };

  const fetchFields = async () => {
    try {
      let data;
      const response: any = await axiosInstance().get(`/field?resource=${sidebarResource?.iotDataPoints}`);
      data = response?.data?.data;
      let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

      if (id) {
        axiosInstance()
          .get(`${routes?.iotDataPoints?.path}/${id}`)
          .then(({ data: { data } }: any) => {
            let fields = fieldsDataForUpdate;
            let tempData = data;
            if (isClone) {
              fields = fieldsDataForCreate;
              const { fieldLabel, ...rest } = data;
              setCloneHeading(fieldLabel);
              tempData = rest;
            }
            if (referenceData?.deviceTemplate) {
              fields?.forEach((e) => {
                if (e.fieldName === 'deviceTemplate') {
                  e.disableOnEdit = true;
                  e.isUneditable = true;
                }
              });
            }

            const tempInitialData: any = isClone ? getObjKeysWithValues(tempData, fields, true, user) : getObjKeysWithValues(tempData, fields);
            tempInitialData.formula = tempData?.formula || '';
            tempInitialData.returnType = tempData?.returnType || 'decimal';
            tempInitialData.dataPoints = tempData?.dataPoints || [];
            setInitialData({
              fields: fields,
              values: tempInitialData
            });
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      } else {
        const tempInitialData: any = getObjKeys('', fieldsDataForCreate);
        if (referenceData?.deviceTemplate) {
          fieldsDataForCreate?.forEach((e) => {
            if (e.fieldName === 'deviceTemplate') {
              tempInitialData.deviceTemplate = referenceData?.deviceTemplate;
              e.disableOnEdit = true;
              e.isUneditable = true;
            }
          });
        }
        tempInitialData.formula = '';
        tempInitialData.returnType = 'decimal';
        tempInitialData.dataPoints = [];
        setInitialData({
          fields: fieldsDataForCreate,
          values: tempInitialData
        });
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleAddDataPoint = (dataPoint, values, setFieldValue) => {
    let pushPosition = inputRef.current.selectionStart;
    let newFormula = [values['formula'].slice(0, pushPosition), dataPoint, values['formula'].slice(pushPosition)].join('');
    setFieldValue('formula', newFormula);
    inputRef.current.focus();
  };

  const handleCheckSyntax = (values) => {
    if (values['formula'] && values['formula'] !== '') {
      let dataPoints = {};
      values?.dataPoints?.forEach((_input) => {
        dataPoints[_input] = 1;
      });
      if (checkFormula(values['formula'], dataPoints)) {
        setFormulaError('Valid Formula');
      } else {
        setFormulaError('Invalid Formula');
      }
    }
  };

  function validate(values) {
    const errors = {};
    if (values?.custom) {
      if (!values.dataPoints?.length) {
        errors['dataPoints'] = 'Please select Data Points';
      }
      if (values.formula === '') {
        errors['formula'] = 'Please enter Formula';
      }
      if (values.returnType === '') {
        errors['returnType'] = 'Please select return type';
      }
      let dataPoints = {};
      values?.dataPoints?.forEach((_input) => {
        dataPoints[_input] = 1;
      });
      if (!checkFormula(values.formula, dataPoints)) {
        errors['formula'] = 'Please enter valid formula';
      }
    }
    return errors;
  }

  const handleSubmit = (values) => {
    setSubmitting(true);
    if (!values?.custom) {
      values.formula = '';
      values.dataPoints = [];
    }
    if (id && !isClone) {
      values._id = id;
      axiosInstance()
        .put(`${routes.iotDataPoints?.path}`, values)
        .then(({ data }: any) => {
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
    } else {
      axiosInstance()
        .post(`${routes.iotDataPoints?.path}`, values)
        .then(({ data: { data, message } }: any) => {
          setLoading(false);
          if (referenceData) {
            onSuccess(data);
          } else {
            history.push(`${routes.iotDataPointsDetail.path}/${data._id}`);
          }
          setSubmitting(true);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
        })
        .catch((error) => {
          setLoading(false);
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
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
      {initialData.fields.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} validate={validate} onSubmit={handleSubmit}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={`${id
                    ? isClone
                      ? `Clone - ${cloneHeading}`
                      : `Update ${initialData.values?.fieldLabel ? `(${initialData.values?.fieldLabel})` : ''}`
                    : `Create ${resources?.iotDataPoints?.titleSingular}`
                  }`}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <InputField
                    errors={errors}
                    values={values}
                    setFieldValue={setFieldValue}
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                  />
                  {values?.custom && (
                    <div className="conditions-container container-with-border mb-2 p-2 sm:mb-3 sm:p-3 md:mb-4 md:p-4">
                      <Box>
                        <Autocomplete
                          multiple
                          options={iotDataPoints}
                          freeSolo
                          fullWidth
                          getOptionLabel={(option) => (option ? option.optionLabel : '')}
                          onChange={(e, newValues) => {
                            setFieldValue(
                              'dataPoints',
                              newValues?.map((v) => {
                                if (v?.optionValue) {
                                  return v?.optionValue;
                                }
                                return v;
                              })
                            );
                          }}
                          value={values.dataPoints}
                          renderTags={(value: readonly string[], getTagProps) =>
                            value.map((option: string, index: number) => (
                              <Chip
                                variant="outlined"
                                label={iotDataPoints?.find((d) => d?.optionValue === option)?.optionLabel || option || ''}
                                {...getTagProps({ index })}
                              />
                            ))
                          }
                          size="small"
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Data Points"
                              margin="none"
                              size="small"
                              variant="outlined"
                              error={touched?.dataPoints && Boolean(errors[`dataPoints`])}
                              helperText={touched?.dataPoints && errors[`dataPoints`]}
                            />
                          )}
                        />
                      </Box>
                      <Box pt={0.5} pb={0.5}>
                        {values?.dataPoints?.length > 0 && (
                          <Box pt={0.5} pb={0.5}>
                            {values?.dataPoints?.map((_dataPoint) => (
                              <Chip
                                className="mb-1 ml-1 cursor-pointer"
                                key={_dataPoint}
                                label={`${iotDataPoints?.find((d) => d?.optionValue === _dataPoint)?.optionLabel || _dataPoint || ''}`}
                                onClick={() => handleAddDataPoint(_dataPoint, values, setFieldValue)}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                      <Box>
                        <TextField
                          inputRef={inputRef}
                          margin="dense"
                          size="small"
                          type="text"
                          label="Formula"
                          name="formula"
                          placeholder="Formula (return field1 + field2)"
                          fullWidth
                          multiline
                          required
                          rows={4}
                          variant="outlined"
                          value={values['formula']}
                          error={touched['formula'] && Boolean(errors['formula'])}
                          helperText={touched['formula'] && errors['formula']}
                          onChange={(e) => setFieldValue('formula', e.target.value)}
                        />
                      </Box>
                      <Grid container>
                        <Grid size={{xs:6}}>
                          {formulaError && (
                            <Typography variant="caption" display="block">
                              {formulaError}{' '}
                            </Typography>
                          )}
                          <Button size="small" onClick={() => handleCheckSyntax(values)} color="primary">
                            Check Syntax
                          </Button>
                        </Grid>
                      </Grid>
                      <Box>
                        <FormControl fullWidth margin="dense" variant="outlined" size="small">
                          <InputLabel id="demo-simple-select-outlined-label">Return Type</InputLabel>
                          <Select
                            labelId="demo-simple-select-outlined-label"
                            id="demo-simple-select-outlined"
                            value={values['returnType']}
                            onChange={(e) => setFieldValue('returnType', e.target.value)}
                            label="Return Type"
                            size="small"
                            name="returnType"
                          >
                            <MenuItem value="decimal">Decimal</MenuItem>
                            <MenuItem value="string">String</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </div>
                  )}
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  disabled={submitting}
                  onClick={() => {
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={loading || submitting}
                  variant="contained"
                  color="primary"
                  type="submit"
                  size="small"
                  onClick={submitForm}
                  endIcon={submitting && <CircularProgress color="inherit" size={18} />}
                >
                  {' '}
                  Save
                </Button>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmationCancelDialog
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
            </Fragment>
          )}
        </Formik>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default ManageIotDataPoints;
