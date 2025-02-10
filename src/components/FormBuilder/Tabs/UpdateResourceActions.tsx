import { Fragment, useContext, useEffect, useState } from 'react';
import { Autocomplete, Box, CircularProgress, Dialog, IconButton, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from 'src/constants/helpers';
import { FieldArray, Form, Formik } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { getResourceField } from 'src/components/FormBuilder/helper';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

export default function UpdateResourceActions({ onClose, onSuccess, resource, resourceData }) {
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

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialValues, setInitialValues] = useState({ updateResourceActions: [] });
  const [submitting, setSubmitting] = useState(false);
  const [fields, setFields] = useState([]);

  useEffect(() => {
    getResourceFieldList(resource);
  }, []);

  useEffect(() => {
    if (resourceData?.updateResourceActions?.length) {
      setInitialValues({ updateResourceActions: resourceData?.updateResourceActions });
    }
  }, [resourceData]);

  const handleSave = (values) => {
    setSubmitting(true);
    axiosInstance()
      .put(`/sa-formbuilder/tabs/update-resource-action/${resource}`, { updateResourceActions: values?.updateResourceActions })
      .then(({ data }) => {
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
  };

  const getResourceFieldList = async (resource) => {
    try {
      const data: any = await getResourceField(resource, true);
      setFields(data);
    } catch (e) {}
  };

  function validate(values) {
    const errors = {};
    if (values?.updateResourceActions?.length > 0) {
      values?.updateResourceActions?.forEach((cnd: any, index) => {
        if (!cnd?.updateField) {
          errors[`updateResourceActions.${index}.updateField`] = 'Update field is Required';
        }
        if (!cnd?.updateValue) {
          errors[`updateResourceActions.${index}.updateValue`] = 'Update value is Required';
        }
        if (cnd?.checkFields?.length > 0) {
          cnd?.checkFields?.forEach((c, i) => {
            if (!c?.fieldName) {
              errors[`updateResourceActions.${index}.checkFields.${i}.fieldName`] = 'Field name is Required';
            }
            if (!c?.value) {
              errors[`updateResourceActions.${index}.checkFields.${i}.value`] = 'Value is Required';
            }
            if (!c?.operator) {
              errors[`updateResourceActions.${index}.checkFields.${i}.operator`] = 'Operator is Required';
            }
          });
        }
      });
    }
    return errors;
  }

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
    >
      {fields?.length ? (
        <Formik initialValues={initialValues} validateOnMount validate={validate} onSubmit={handleSave}>
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={onClose}
                title={'Actions'}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
                showRequiredLabel={false}
              />
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <FieldArray name="updateResourceActions">
                    {({ push, remove }) => (
                      <>
                        <Box border={1} p={2} borderColor="var(--common-border-color)">
                          <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
                            <Box>
                              <Typography variant="subtitle2">Update Resource Actions</Typography>
                            </Box>
                            <Box>
                              <HtmlTooltip title="Add">
                                <IconButton
                                  size="small"
                                  aria-label="setting"
                                  onClick={() =>
                                    push({ checkFields: [{ fieldName: '', value: '', operator: '' }], updateField: '', updateValue: '' })
                                  }
                                >
                                  <AddCircleOutline color="primary" fontSize="small" />
                                </IconButton>
                              </HtmlTooltip>
                            </Box>
                          </Box>
                          {values?.updateResourceActions?.map((action, index) => (
                            <Card
                              values={values}
                              index={index}
                              parentRemove={remove}
                              setFieldValue={setFieldValue}
                              errors={errors}
                              touched={touched}
                              fields={fields}
                              operators={OPERATOR}
                            />
                          ))}
                        </Box>
                      </>
                    )}
                  </FieldArray>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton buttonType="transparent" onClick={onClose}>
                  Cancel
                </ThemeButton>
                <ThemeButton disabled={submitting} buttonType="theme" onClick={submitForm} isLoading={submitting}>
                  Save
                </ThemeButton>
              </CustomDialogFooter>
            </Fragment>
          )}
        </Formik>
      ) : (
        <Box height={500}>
          <CommonSkeleton lenArray={[...Array(6).keys()]} />
        </Box>
      )}
    </Dialog>
  );
}

const Card = ({ values, index, parentRemove, setFieldValue, errors, touched, fields, operators }) => {
  return (
    <Box width={'100%'} display={'flex'} justifyContent={'space-between'}>
      <Box p={2} border={1} borderColor="var(--common-border-color)" mb={1} mt={1} display={'flex'} flexDirection={'column'} gap={2} width={'100%'}>
        <FieldArray name={`updateResourceActions.${index}.checkFields`}>
          {({ push, remove }) => (
            <>
              {values?.updateResourceActions[index]?.checkFields?.map((cnd, i, arr) => {
                return (
                  <Grid container spacing={2}>
                    <Grid size={{ sm: 3, md: 3, lg: 3 }}>
                      <Autocomplete
                        options={fields}
                        getOptionLabel={(option) => option?.fieldLabel || ''}
                        value={fields?.find((data) => data?.fieldName === values?.updateResourceActions?.[index]?.checkFields?.[i]?.fieldName) || {}}
                        fullWidth
                        onChange={(e, newValue) => {
                          setFieldValue(`updateResourceActions.${index}.checkFields.${i}.fieldName`, newValue?.fieldName);
                        }}
                        size="small"
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="FieldName"
                            margin="none"
                            size="small"
                            error={
                              touched?.updateResourceActions?.[index]?.checkFields?.[i]?.fieldName &&
                              Boolean(errors[`updateResourceActions.${index}.checkFields.${i}.fieldName`])
                            }
                            helperText={
                              touched?.updateResourceActions?.[index]?.checkFields?.[i]?.fieldName &&
                              errors[`updateResourceActions.${index}.checkFields.${i}.fieldName`]
                            }
                            variant="outlined"
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ sm: 3, md: 3, lg: 3 }}>
                      <Autocomplete
                        options={operators}
                        getOptionLabel={(option) => option?.optionLabel || ''}
                        value={
                          operators?.find((data) => data?.optionValue === values?.updateResourceActions?.[index]?.checkFields?.[i]?.operator) ?? null
                        }
                        fullWidth
                        onChange={(event, newValue) => {
                          setFieldValue(`updateResourceActions.${index}.checkFields.${i}.operator`, newValue?.optionValue || '');
                        }}
                        size="small"
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Operator"
                            margin="none"
                            size="small"
                            error={
                              touched?.updateResourceActions?.[index]?.checkFields?.[i]?.operator &&
                              Boolean(errors[`updateResourceActions.${index}.checkFields.${i}.operator`])
                            }
                            helperText={
                              touched?.updateResourceActions?.[index]?.checkFields?.[i]?.operator &&
                              errors[`updateResourceActions.${index}.checkFields.${i}.operator`]
                            }
                            variant="outlined"
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ sm: 3, md: 3, lg: 3 }}>
                      <TextField
                        margin="none"
                        size="small"
                        type="text"
                        label="Value"
                        variant="outlined"
                        fullWidth
                        value={values?.updateResourceActions?.[index]?.checkFields?.[i]?.value ?? ''}
                        error={
                          touched?.updateResourceActions?.[index]?.checkFields?.[i]?.value &&
                          Boolean(errors[`updateResourceActions.${index}.checkFields.${i}.value`])
                        }
                        helperText={
                          touched?.updateResourceActions?.[index]?.checkFields?.[i]?.value &&
                          errors[`updateResourceActions.${index}.checkFields.${i}.value`]
                        }
                        onChange={(e) => {
                          setFieldValue(`updateResourceActions.${index}.checkFields.${i}.value`, e.target.value || '');
                        }}
                      />
                    </Grid>
                    <Box className=" ml-auto max-w-fit" display="flex" justifyContent="space-between" alignItems="center">
                      <HtmlTooltip title={'Remove'}>
                        <IconButton size="small" aria-label="close" onClick={() => remove(i)} disabled={arr.length === 1}>
                          <RemoveCircleOutline fontSize="small" color={'primary'} />
                        </IconButton>
                      </HtmlTooltip>
                      <HtmlTooltip title={'Add'}>
                        <IconButton size="small" aria-label="add" onClick={() => push({ fieldName: '', operator: '', value: '' })}>
                          <AddCircleOutline fontSize="small" color={'primary'} />
                        </IconButton>
                      </HtmlTooltip>
                    </Box>
                  </Grid>
                );
              })}
            </>
          )}
        </FieldArray>
        <Grid container spacing={2}>
          <Grid size={{ sm: 3, md: 3, lg: 3 }}>
            <Autocomplete
              options={fields}
              getOptionLabel={(option) => option?.fieldLabel || ''}
              value={fields?.find((data) => data?.fieldName === values?.updateResourceActions?.[index]?.updateField)}
              fullWidth
              onChange={(e, newValue) => {
                setFieldValue(`updateResourceActions.${index}.updateField`, newValue?.fieldName || '');
              }}
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Update Field"
                  margin="none"
                  size="small"
                  error={touched?.updateResourceActions?.[index]?.updateField && Boolean(errors[`updateResourceActions.${index}.updateField`])}
                  helperText={touched?.updateResourceActions?.[index]?.updateField && errors[`updateResourceActions.${index}.updateField`]}
                  variant="outlined"
                />
              )}
            />
          </Grid>
          <Grid size={{ sm: 3, md: 3, lg: 3 }}>
            <TextField
              margin="none"
              size="small"
              type="text"
              label="Update Value"
              variant="outlined"
              fullWidth
              value={values?.updateResourceActions?.[index]?.updateValue ?? ''}
              error={touched?.updateResourceActions?.[index]?.updateValue && Boolean(errors[`updateResourceActions.${index}.updateValue`])}
              helperText={touched?.updateResourceActions?.[index]?.updateValue && errors[`updateResourceActions.${index}.updateValue`]}
              onChange={(e) => {
                setFieldValue(`updateResourceActions.${index}.updateValue`, e.target.value || '');
              }}
            />
          </Grid>
        </Grid>
      </Box>
      <Box className=" ml-auto max-w-fit" display="flex" justifyContent="space-between" alignItems="center">
        <HtmlTooltip title={'Remove'}>
          <IconButton size="small" aria-label="close" onClick={() => parentRemove(index)}>
            <RemoveCircleOutline fontSize="small" color={'primary'} />
          </IconButton>
        </HtmlTooltip>
      </Box>
    </Box>
  );
};
