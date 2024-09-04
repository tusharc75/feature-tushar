import { Box, Button, CircularProgress, Dialog, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { useContext, useEffect, useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, sidebarResource } from 'src/constants/helpers';
import { getLookupOption } from 'src/components/FormBuilder/helper';
import { Form, Formik } from 'formik';
import routes from 'src/components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const ConditionDialog = ({ onClose, data, fields, activationCondition, onSuccess, id }) => {
  const toastConfig = useContext(CustomToastContext);
  const [initialValues, setInitialValues] = useState({ fieldName: '', fieldValue: null });
  const [options, setOptions] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (data) {
      setInitialValues({ fieldName: data?.fieldName, fieldValue: data?.fieldValue });
      setSelectedField(
        fields?.filter((f) => f?.fieldName === data?.fieldName)?.length > 0 ? fields?.filter((f) => f?.fieldName === data?.fieldName)[0] : null
      );
    }
  }, [data]);

  useEffect(() => {
    if (selectedField?.fieldName && (selectedField?.type === 'dropDown' || selectedField?.type === 'multiSelect')) {
      if (selectedField?.lookup) {
        getData();
      } else {
        setOptions(fields?.find((f) => f?.fieldName === selectedField?.fieldName)?.option || []);
      }
    } else if (['checkBox', 'switch'].includes(selectedField?.type)) {
      setOptions([
        { optionLabel: 'YES', optionValue: 'yes' },
        { optionLabel: 'NO', optionValue: 'no' }
      ]);
    }
  }, [selectedField]);

  const getData = async () => {
    var data = await getLookupOption('', selectedField?.lookupResource);
    if (selectedField?.lookupResource === sidebarResource.user) {
      data = [{ optionLabel: 'Current User', optionValue: 'Current User' }, ...data];
    }
    setOptions(data);
  };

  const handleSubmit = (values) => {
    setSubmitting(true);
    if (data) {
      axiosInstance()
        .put(`${routes.workflow.path}/${id}/activation-condition`, { ...values, activationConditionId: data?._id })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setSubmitting(false);
          onSuccess();
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${routes.workflow.path}/${id}/activation-condition`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setSubmitting(false);
          onSuccess();
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const validate = (values: any) => {
    const errors: any = {};
    if (!values?.fieldName) {
      errors['fieldName'] = 'Required Field';
    }
    if (!values?.fieldValue) {
      errors['fieldValue'] = 'Required Value';
    }
    return errors;
  };

  return (
    <Dialog
      maxWidth="sm"
      fullScreen={false}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      className="properties_dialog_height"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
    >
      <Formik initialValues={initialValues} onSubmit={handleSubmit} validate={validate}>
        {({ values, errors, setFieldValue, touched, submitForm }) => (
          <>
            <CustomDialogHeader title={'Condition'} onClose={onClose} />
            <CustomDialogContent>
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <Box>
                  <Autocomplete
                    id="fields"
                    disabled={data ? true : false}
                    options={
                      fields?.filter((f) => !activationCondition?.map((d) => d?.fieldName)?.includes(f.fieldName))?.length > 0
                        ? fields
                            ?.filter((f) => !activationCondition?.map((d) => d?.fieldName)?.includes(f.fieldName))
                            ?.map((_f) => ({ optionLabel: _f?.fieldLabel, optionValue: _f?.fieldName }))
                        : []
                    }
                    getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                    getOptionSelected={(option: any, val) => option.optionValue === val}
                    value={
                      fields
                        ?.filter((f) => f?.fieldName === values?.fieldName)
                        ?.map((_f) => ({ optionLabel: _f?.fieldLabel, optionValue: _f?.fieldName }))[0]
                    }
                    onChange={(e: any, value) => {
                      setFieldValue('fieldName', value && value?.optionValue ? value.optionValue : '');
                      setSelectedField(fields?.filter((f) => f?.fieldName === value.optionValue)[0]);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        margin="dense"
                        variant="outlined"
                        label="Field Name"
                        placeholder="Select Field"
                        name="fieldName"
                        required
                        error={touched['fieldName'] && Boolean(errors['fieldName'])}
                        helperText={touched['fieldName'] && errors['fieldName']}
                      />
                    )}
                  />
                  {values?.fieldName &&
                    (selectedField?.type === 'dropDown' || selectedField?.type === 'multiSelect' || ['checkBox', 'switch'].includes(selectedField?.type) ? (
                      <Autocomplete
                        id="fieldValue"
                        options={options}
                        disableCloseOnSelect={['checkBox', 'switch'].includes(selectedField?.type) ? false : true}
                        getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                        multiple={['checkBox', 'switch'].includes(selectedField?.type) ? false : true}
                        value={
                          values?.fieldValue && ['checkBox', 'switch'].includes(selectedField?.type)
                            ? options?.filter((data) => data?.optionValue === values?.fieldValue)?.length > 0
                              ? options?.filter((data) => data?.optionValue === values?.fieldValue)[0]
                              : ''
                            : options?.filter((data) => values?.fieldValue?.split(',')?.includes(data?.optionValue))?.length > 0
                              ? options?.filter((data) => values?.fieldValue?.split(',')?.includes(data?.optionValue))
                              : []
                        }
                        onChange={(e, val) => {
                          if (['checkBox', 'switch'].includes(selectedField?.type)) {
                            setFieldValue('fieldValue', val && val?.optionValue ? val?.optionValue : '');
                          } else {
                            setFieldValue('fieldValue', val?.map((v) => v?.optionValue)?.join(',') || '');
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            margin="dense"
                            variant="outlined"
                            label="Field Value"
                            name="fieldValue"
                            placeholder="Field Value"
                            error={touched['fieldValue'] && Boolean(errors['fieldValue'])}
                            helperText={touched['fieldValue'] && errors['fieldValue']}
                          />
                        )}
                      />
                    ) : (
                      <TextField
                        variant="outlined"
                        type="text"
                        label="Field Value"
                        name="fieldValue"
                        rows={4}
                        fullWidth
                        margin="dense"
                        value={values?.value}
                        onChange={(e) => {
                          setFieldValue('fieldValue', e.target.value.trimStart());
                        }}
                        error={touched['fieldValue'] && Boolean(errors['fieldValue'])}
                        helperText={touched['fieldValue'] && errors['fieldValue']}
                      />
                    ))}
                </Box>
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button size="small" onClick={onClose} disabled={submitting} color="primary">
                Cancel
              </Button>
              <Button
                size="small"
                type="submit"
                disabled={submitting}
                color="primary"
                variant="contained"
                onClick={submitForm}
                endIcon={submitting && <CircularProgress color="inherit" size={18} />}
              >
                Save
              </Button>
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default ConditionDialog;
