import { useContext, useEffect, useState } from 'react';
import { Box, Button, Checkbox, CircularProgress, Dialog, FormControlLabel, TextField } from '@mui/material';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from 'src/constants/helpers';
import { Form, Formik } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Autocomplete } from '@mui/material';

const Setting = ({ onClose, onSuccess, resource, resourceData }) => {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);
  const [fields, setFields] = useState([]);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    const response = await axiosInstance().get(`/field?resource=${resource}`);
    setFields(
      response?.data?.data
        ? response?.data?.data
            ?.filter((d) => d?.fieldData?.primaryField)
            ?.map((r) => ({ optionLabel: r?.fieldData?.fieldLabel, optionValue: r?.fieldData?.fieldName }))
        : []
    );
  };

  const handleSubmit = (values) => {
    setSubmitting(true);
    axiosInstance()
      .put(`/sa-formbuilder/tabs/setting/${resource}`, {
        ...values,
        collaborateToolsField: values?.collaborateTools ? values?.collaborateToolsField : ''
      })
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

  const validate = (values) => {
    const errors = {};
    if (values.collaborateTools && !values?.collaborateToolsField) {
      errors['collaborateToolsField'] = 'Please Select Workspace Tools Field';
    }
    return errors;
  };

  return (
    <Dialog
      maxWidth="sm"
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
      <Formik
        initialValues={{
          collaborateTools: resourceData?.collaborateTools || false,
          collaborateToolsField: resourceData?.collaborateToolsField || ''
        }}
        validate={validate}
        onSubmit={handleSubmit}
      >
        {({ values, errors, setFieldValue, touched, submitForm }) => (
          <>
            <CustomDialogHeader
              onClose={onClose}
              title={'Setting'}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
            <CustomDialogContent>
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="collaborateTools"
                        checked={values['collaborateTools']}
                        onChange={(e) => {
                          setFieldValue('collaborateTools', e.target.checked);
                        }}
                      />
                    }
                    label="Workspace Tools"
                  />
                </Box>
                {values['collaborateTools'] && (
                  <Box>
                    <Autocomplete
                      id="collaborateToolsField"
                      options={fields}
                      getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                      getOptionSelected={(option: any, val) => option.optionValue === val}
                      value={
                        fields && fields?.filter((data) => data.optionValue === values['collaborateToolsField'])?.length
                          ? fields && fields?.filter((data) => data.optionValue === values['collaborateToolsField'])[0]
                          : ''
                      }
                      onChange={(e: any, value) => {
                        setFieldValue('collaborateToolsField', value && value?.optionValue ? value.optionValue : '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          margin="dense"
                          variant="outlined"
                          label="Workspace Tools Field"
                          placeholder="Workspace Tools Field"
                          name="collaborateToolsField"
                          required
                          error={touched['collaborateToolsField'] && Boolean(errors['collaborateToolsField'])}
                          helperText={touched['collaborateToolsField'] && errors['collaborateToolsField']}
                        />
                      )}
                    />
                  </Box>
                )}
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button size="small" color="primary" disabled={submitting} onClick={onClose}>
                Cancel
              </Button>
              <Button
                disabled={submitting}
                variant="contained"
                color="primary"
                size="small"
                type="submit"
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

export default Setting;
