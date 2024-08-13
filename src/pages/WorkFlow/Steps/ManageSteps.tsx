import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, Checkbox, CircularProgress, Dialog, FormControlLabel, TextField } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { isEqual, startCase } from 'lodash';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition } from 'src/constants/helpers';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { object, string } from 'yup';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Autocomplete } from '@material-ui/lab';
import { getLookupResource, getResourceField } from 'src/components/FormBuilder/helper';
import routes from 'src/components/Helpers/Routes';

const stepSchema = object().shape({
  stepName: string().required('Please enter Step name')
});

const MATERIAL_TYPE = ['product', 'service', 'package'];

const ManageSteps = ({ data, onSuccess, onClose, id }) => {
  const toastConfig = useContext(CustomToastContext);

  const [initialValues, setInitialValues] = useState({});
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resourceOption, setResourceOption] = useState([]);
  const [resourceFieldOption, setResourceFieldOption] = useState([]);
  const [resourceFieldsLoading, setResourceFieldsLoading] = React.useState(false);

  useEffect(() => {
    getResourceList();
    if (data?.linkResourceName) {
      getResourceFieldList(data?.linkResourceName);
    }
  }, []);

  const getResourceList = async () => {
    const resourceOption = await getLookupResource();
    setResourceOption(resourceOption);
  };

  const getResourceFieldList = async (linkResourceName) => {
    setResourceFieldsLoading(true);
    try {
      const data: any = await getResourceField(linkResourceName, true);
      setResourceFieldOption(data);
      setResourceFieldsLoading(false);
    } catch (e) {
      setResourceFieldsLoading(false);
    }
  };

  useEffect(() => {
    if (data) {
      setInitialValues({
        stepName: data?.stepName,
        linkWithResource: data?.linkWithResource || false,
        linkResourceName: data?.linkResourceName || '',
        linkResourceField: data?.linkResourceField || '',
      });
    } else {
      setInitialValues({
        stepName: '',
        linkWithResource: false,
        linkResourceName: '',
        linkResourceField: [],
      });
    }
  }, [data]);

  const handleSubmit = (values) => {
    setSubmitting(true);
    if (data?._id) {
      axiosInstance()
        .put(`${routes.workFlow.path}/${id}/steps`, { ...values, stepId: data?._id })
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
    } else {
      axiosInstance()
        .post(`${routes?.workFlow.path}/${id}/steps`, values)
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
    }
  };

  const validate = (values) => {
    const errors = {};
    if (!values?.stepName) {
      errors['stepName'] = 'Required field';
    }
    if (values.linkWithResource && !values?.linkResourceName) {
      errors['linkResourceName'] = 'please select Resource';
    }

    if (values.linkWithResource && !values?.linkResourceField) {
      errors['linkResourceField'] = 'please select Field';
    }
    return errors;
  };

  return (
    <Dialog
      maxWidth="sm"
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
      <Formik initialValues={initialValues} validationSchema={stepSchema} onSubmit={handleSubmit} validate={validate}>
        {({ values, errors, setFieldValue, touched, submitForm }) => (
          <>
            <CustomDialogHeader
              onClose={() => {
                if (isEqual(initialValues, values)) onClose();
                else setShowConfirmDialog(true);
              }}
              title={data ? `Edit - ${data?.stepName}` : 'Add New Step'}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
            <CustomDialogContent>
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <Box>
                  <TextField
                    variant="outlined"
                    type="text"
                    label="Step Name"
                    required={true}
                    name="stepName"
                    fullWidth
                    margin="dense"
                    value={values['stepName']}
                    error={touched['stepName'] && Boolean(errors['stepName'])}
                    helperText={touched['stepName'] && errors['stepName']}
                    onChange={(e) => setFieldValue('stepName', e.target.value.trimStart())}
                  />
                </Box>
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="linkWithResource"
                        checked={values['linkWithResource']}
                        onChange={(e) => {
                          setFieldValue('linkWithResource', e.target.checked);
                        }}
                      />
                    }
                    label="Link With Resource"
                  />
                </Box>
                {values['linkWithResource'] && (
                  <>
                    <Box>
                      <Autocomplete
                        id="linkResourceName"
                        options={resourceOption}
                        getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                        getOptionSelected={(option: any, val) => option.optionValue === val}
                        value={
                          resourceOption && resourceOption?.filter((data) => data.optionValue === values['linkResourceName'])?.length
                            ? resourceOption && resourceOption?.filter((data) => data.optionValue === values['linkResourceName'])[0]
                            : ''
                        }
                        onChange={(e: any, value) => {
                          getResourceFieldList(value && value?.optionValue ? value.optionValue : '');
                          setFieldValue('linkResourceName', value && value?.optionValue ? value.optionValue : '');
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            margin="dense"
                            variant="outlined"
                            label="Resource"
                            placeholder="Resource"
                            name="linkResourceName"
                            required
                            error={touched['linkResourceName'] && Boolean(errors['linkResourceName'])}
                            helperText={touched['linkResourceName'] && errors['linkResourceName']}
                          />
                        )}
                      />
                    </Box>
                    <Box>
                      <Autocomplete
                        id="linkResourceField"
                        options={resourceFieldOption}
                        disabled={resourceFieldsLoading}
                        multiple
                        getOptionLabel={(option: any) => (option ? option?.fieldLabel : '')}
                        getOptionSelected={(option: any, val) => option?.fieldName === val}
                        value={
                          resourceFieldOption && resourceFieldOption.filter((data) => values['linkResourceField']?.includes(data?.fieldName)).length>0
                            ? resourceFieldOption && resourceFieldOption.filter((data) => values['linkResourceField']?.includes(data?.fieldName))
                            : []
                        }
                        onChange={(e, val) => {
                          setFieldValue('linkResourceField', val && val?.length>0 ? val?.map((ele)=> ele.fieldName) : []);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            margin="dense"
                            variant="outlined"
                            label="Resource Fields"
                            placeholder="Resource Fields"
                            required
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <React.Fragment>
                                  {resourceFieldsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </React.Fragment>
                              )
                            }}
                            error={touched['linkResourceField'] && Boolean(errors['linkResourceField'])}
                            helperText={touched['linkResourceField'] && errors['linkResourceField']}
                          />
                        )}
                      />
                    </Box>
                  </>
                )}
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button
                size="small"
                color="primary"
                disabled={submitting}
                onClick={() => {
                  if (isEqual(initialValues, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
              >
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
                {' '}
                Save
              </Button>
            </CustomDialogFooter>

            {showConfirmDialog ? (
              <ConfirmationCancelDialog
                close={() => setShowConfirmDialog(false)}
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
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default ManageSteps;
