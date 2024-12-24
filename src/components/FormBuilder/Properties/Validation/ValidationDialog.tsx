import { Box, Button, Dialog, TextField } from '@mui/material';
import { Autocomplete } from '@mui/material';
import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { OPERATOR } from 'src/components/FormBuilder/helper';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomDialogTransition } from 'src/constants/helpers';

const ValidationDialog = ({ onClose, data, fields, fieldsToExclude, fieldValue, setValue }) => {
  const [initialValues, setInitialValues] = useState(null);

  const [fieldOptions, setFieldOptions] = useState([]);

  useEffect(() => {
    const value: any = { fieldName: '', operator: '' };
    if (data) {
      value.fieldName = data?.fieldName;
      value.operator = data?.operator;
    }
    setInitialValues(value);
  }, [data]);

  useEffect(() => {
    const options: any = [];
    if (data) {
      const field = fields?.find((f) => f?.fieldName === data?.fieldName);
      if (field) {
        options.push({
          optionLabel: field?.fieldLabel,
          optionValue: field?.fieldName
        });
      }
    } else {
      fields?.forEach((field) => {
        if (
          ['date', 'dateTime']?.includes(field?.type) &&
          !fieldsToExclude?.includes(field?.fieldName) &&
          !fieldValue?.dateValidation?.map((d) => d?.fieldName)?.includes(field?.fieldName)
        ) {
          options.push({
            optionLabel: field?.fieldLabel,
            optionValue: field?.fieldName
          });
        }
      });
    }
    setFieldOptions(options);
  }, [fields]);

  const handleSubmit = (values) => {
    let dateValidation = fieldValue?.dateValidation || [];
    if (data) {
      dateValidation = dateValidation?.map((d) => {
        if (d?.fieldName === values?.fieldName) {
          return { fieldName: values?.fieldName, operator: values?.operator };
        }
        return d;
      });
    } else {
      dateValidation?.push({ ...values });
    }
    setValue('dateValidation', dateValidation);
    onClose();
  };

  const validate = (values: any) => {
    const errors: any = {};
    if (!values?.fieldName) {
      errors['fieldName'] = 'Required Field';
    }
    if (!values?.operator) {
      errors['operator'] = 'Required Field';
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
      {initialValues ? (
        <Formik initialValues={initialValues} onSubmit={handleSubmit} validate={validate}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <>
              <CustomDialogHeader title={'Validation'} onClose={onClose} />
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <Box>
                    <Autocomplete
                      id="fields"
                      disabled={data ? true : false}
                      options={fieldOptions}
                      getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                      getOptionSelected={(option: any, val) => option.optionValue === val}
                      value={
                        fieldOptions?.filter((f) => f?.optionValue === values?.fieldName)?.length > 0
                          ? fieldOptions?.filter((f) => f?.optionValue === values?.fieldName)[0]
                          : ''
                      }
                      onChange={(e: any, value) => {
                        setFieldValue('fieldName', value && value?.optionValue ? value.optionValue : '');
                        setFieldValue('operator', '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          margin="dense"
                          variant="outlined"
                          label="Fields"
                          placeholder="Select Field"
                          name="fieldName"
                          required
                          error={touched['fieldName'] && Boolean(errors['fieldName'])}
                          helperText={touched['fieldName'] && errors['fieldName']}
                        />
                      )}
                    />

                    <Autocomplete
                      id="operator"
                      options={OPERATOR}
                      getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                      getOptionSelected={(option: any, val) => option.optionValue === val}
                      value={
                        OPERATOR?.filter((f) => f?.optionValue === values?.operator)?.length > 0
                          ? OPERATOR?.filter((f) => f?.optionValue === values?.operator)[0]
                          : ''
                      }
                      onChange={(e: any, value) => {
                        setFieldValue('operator', value && value?.optionValue ? value.optionValue : '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          margin="dense"
                          variant="outlined"
                          label="Operator"
                          placeholder="Select Operator"
                          name="operator"
                          required
                          error={touched['operator'] && Boolean(errors['operator'])}
                          helperText={touched['operator'] && errors['operator']}
                        />
                      )}
                    />
                  </Box>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button size="small" onClick={onClose} color="primary">
                  Cancel
                </Button>
                <Button size="small" type="submit" color="primary" variant="contained" onClick={submitForm}>
                  Save
                </Button>
              </CustomDialogFooter>
            </>
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

export default ValidationDialog;
