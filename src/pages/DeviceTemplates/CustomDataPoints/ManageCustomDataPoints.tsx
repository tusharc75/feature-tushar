import { Fragment, useContext, useEffect, useState, useRef } from 'react';
import { Box, Button, Dialog, TextField, Grid, Chip, Typography } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from 'src/constants/helpers';
import { Form, Formik } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomButton from 'src/components/Helpers/CustomButton';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { Autocomplete } from '@material-ui/lab';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { camelCase, isEqual } from 'lodash';
import { DecimalPlaces } from 'src/components/FormBuilder/AddField/decimalPlaces';
import { checkFormula } from 'src/constants/formulaUtility';

export default function ManageRules({ deviceTemplate, open, isClone = false, id = null, onClose, onSuccess }) {

  const inputRef = useRef<any>();

  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(false);
  const [iotDataPoints, setIotDataPoints] = useState(null);
  const [initialValue, setInitialValue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formulaError, setFormulaError] = useState(null);

  useEffect(() => {
    findIotDataoints();
  }, []);

  useEffect(() => {
    fetchData();
  }, [id]);

  const findIotDataoints = () => {
    const query = [{ field: 'deviceTemplate', term: deviceTemplate }];
    axiosInstance()
      .get(`${routes.iotDataPoints.path}?filterById=${JSON.stringify(query)}&filterType=and`)
      .then(({ data: { data: { data } }
      }) => {
        setIotDataPoints(data?.map((d) => ({ optionLabel: d?.fieldLabel, optionValue: d?._id, optionName: d?.fieldName })));
      }
      );
  };

  const fetchData = () => {
    setLoading(true);
    if (id) {
      axiosInstance()
        .get(`${routes.deviceTemplates.path}/custom-data-points/${id}`)
        .then(({ data: { data } }) => {
          setInitialValue({
            fieldLabel: isClone ? '' : data?.fieldLabel,
            dataPoints: data?.dataPoints,
            formula: data?.formula,
            unit: data?.unit,
            decimalPlaces: data?.decimalPlaces
          });
          setLoading(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    } else {
      setInitialValue({
        fieldLabel: '',
        dataPoints: [],
        formula: '',
        unit: '',
        decimalPlaces: 0
      });
      setLoading(false);
    }
  };

  const handleSubmit = (values) => {
    values.fieldName = camelCase(values?.fieldLabel)
    setLoading(true);
    if (id && !isClone) {
      values._id = id;
      axiosInstance()
        .put(`${routes.deviceTemplates.path}/custom-data-points`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
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
        .post(`${routes.deviceTemplates.path}/custom-data-points`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
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
    if (values.fieldLabel === '') {
      errors['fieldLabel'] = 'Please enter Field Label';
    }
    if (!values.dataPoints) {
      errors['dataPoints'] = 'Please select Data Points';
    }
    if (values.formula === '') {
      errors['formula'] = 'Please enter Formula';
    }
    if (values.unit === '') {
      errors['unit'] = 'Please enter Unit';
    }
    let dataPoints = {};
    iotDataPoints?.filter((option) => values?.dataPoints?.includes(option.optionValue)).forEach((_input) => {
      dataPoints[_input.optionName] = 1;
    });
    if (!checkFormula(values.formula, dataPoints)) {
      errors['formula'] = 'Please enter valid formula';
    }
    return errors;
  }

  const handleAddDataPoint = (dataPoint, values, setFieldValue) => {
    let pushPosition = inputRef.current.selectionStart;
    let newFormula = [values['formula'].slice(0, pushPosition), dataPoint, values['formula'].slice(pushPosition)].join('');
    setFieldValue('formula', newFormula);
    inputRef.current.focus();
  };

  const handleCheckSyntax = (values) => {
    if (values['formula'] && values['formula'] !== '') {
      let dataPoints = {};
      iotDataPoints?.filter((option) => values?.dataPoints?.includes(option.optionValue))?.forEach((_input) => {
        dataPoints[_input.optionName] = 1;
      });
      if (checkFormula(values['formula'], dataPoints)) {
        setFormulaError('Valid Formula');
      } else {
        setFormulaError('Invalid Formula');
      }
    }
  };

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
        {initialValue && iotDataPoints ? (
          <Formik initialValues={initialValue} validateOnMount validate={validate} onSubmit={handleSubmit}>
            {({ values, errors, touched, setFieldValue, submitForm }) => (
              <Fragment>
                <CustomDialogHeader
                  title={
                    id
                      ? isClone
                        ? `Clone - ${initialValue?.fieldLabel}`
                        : `Update - ${initialValue?.fieldLabel}`
                      : 'Create'
                  }
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
                          label="Field Label"
                          name="fieldLabel"
                          variant="outlined"
                          required
                          fullWidth
                          disabled={false}
                          value={values['fieldLabel']}
                          error={touched['fieldLabel'] && Boolean(errors['fieldLabel'])}
                          helperText={touched['fieldLabel'] && errors['fieldLabel']}
                          onChange={(e) => setFieldValue('fieldLabel', e.target.value)}
                        />
                      </div>
                      <div className="conditions-container container-with-border p-2 sm:p-3 md:p-4 mb-2 sm:mb-3 md:mb-4">
                        <Box>
                          <Autocomplete
                            multiple
                            disableCloseOnSelect={true}
                            options={iotDataPoints}
                            value={iotDataPoints?.filter((option) => values?.dataPoints?.includes(option.optionValue))}
                            getOptionLabel={(option) => option?.optionLabel}
                            fullWidth
                            onChange={(e, newValues) => {
                              setFieldValue('dataPoints', newValues?.map((e) => e.optionValue));
                            }}
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
                          {iotDataPoints?.filter((option) => values?.dataPoints?.includes(option.optionValue))?.length > 0 && (
                            <Box pt={0.5} pb={0.5}>
                              {iotDataPoints?.filter((option) => values?.dataPoints?.includes(option.optionValue))?.map((_dataPoint) => (
                                <Chip
                                  className="ml-1 cursor-pointer mb-1"
                                  key={_dataPoint.optionValue}
                                  label={`${_dataPoint.optionLabel}-${_dataPoint.optionName}`}
                                  onClick={() => handleAddDataPoint(_dataPoint.optionLabel, values, setFieldValue)}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                        <Box>
                          <TextField
                            inputRef={inputRef}
                            margin="dense"
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
                          <Grid item xs={6}>
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
                        <Box pt={2}>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <TextField
                                margin="dense"
                                type="text"
                                label="Unit"
                                name="unit"
                                variant="outlined"
                                required
                                fullWidth
                                disabled={false}
                                value={values['unit']}
                                error={touched['unit'] && Boolean(errors['unit'])}
                                helperText={touched['unit'] && errors['unit']}
                                onChange={(e) => setFieldValue('unit', e.target.value)}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <DecimalPlaces
                                values={values}
                                setFieldValue={(name, value) => {
                                  setFieldValue(name, value);
                                }}
                              />
                            </Grid>
                          </Grid>
                        </Box>
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
