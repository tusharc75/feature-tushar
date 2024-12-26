import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, Checkbox, CircularProgress, Dialog, FormControlLabel, TextField } from '@mui/material';
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
import Autocomplete from '@mui/material/Autocomplete';
import { getLookupResource, getResourceField } from '../../helper';
import StepActions from './StepActions';
import ConfigureField from 'src/components/FormBuilder/Tabs/Steps/ConfigureField';

const stepSchema = object().shape({
  stepName: string().required('Please enter Step name')
});

const MATERIAL_TYPE = ['product', 'service', 'package'];

const ManageSteps = ({ isSubmitting, data, onSuccess, onClose, resource }) => {
  const toastConfig = useContext(CustomToastContext);

  const [initialValues, setInitialValues] = useState({});
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [resourceOption, setResourceOption] = useState([]);
  const [resourceFieldOption, setResourceFieldOption] = useState([]);
  const [resourceFieldsLoading, setResourceFieldsLoading] = React.useState(false);
  const [openField, setOpenField] = useState(false);
  const [openStepActions, setOpenStepActions] = useState(false);

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
        order: data?.order,
        multipleStepData: data?.multipleStepData || false,
        stepDataRequired: data?.stepDataRequired || false,
        showInPdf: data?.showInPdf || false,
        linkWithMaterial: data?.linkWithMaterial || false,
        linkedMaterial: data?.linkedMaterial || [],
        linkWithResource: data?.linkWithResource || false,
        linkResourceName: data?.linkResourceName || '',
        linkResourceField: data?.linkResourceField || '',
        readOnly: data?.readOnly || false,
        fields: data?.fields || [],
        createActions: data?.createActions || []
      });
    } else {
      setInitialValues({
        stepName: '',
        multipleStepData: true,
        stepDataRequired: false,
        showInPdf: false,
        linkWithMaterial: false,
        linkedMaterial: [],
        linkWithResource: false,
        linkResourceName: '',
        linkResourceField: '',
        readOnly: false,
        fields: [],
        createActions: []
      });
    }
  }, [data]);

  const handleSubmit = (values) => {
    if (!values.linkWithResource && !values.linkWithMaterial && !values?.fields?.length) {
      toastConfig.setToastConfig({ open: true, type: 'error', message: 'Please add fields' });
      return;
    }
    let updatedValues = values;
    if (data?._id) {
      updatedValues = { ...values, stepId: data?._id };
    }
    if (updatedValues?.linkWithResource) {
      updatedValues.fields = [];
    }
    onSuccess(updatedValues);
  };

  const validate = (values) => {
    const errors = {};
    if (!values?.stepName) {
      errors['stepName'] = 'Step Name is required';
    }
    if (values.linkWithResource && !values?.linkResourceName) {
      errors['linkResourceName'] = 'please select Resource';
    }
    if (values.linkWithResource && !values?.linkResourceField) {
      errors['linkResourceField'] = 'please select Field';
    }
    if (values.linkWithMaterial && !values?.linkedMaterial?.length) {
      errors['linkedMaterial'] = 'please select Material';
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
                    size='small'
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
                        name="linkWithMaterial"
                        disabled={values['linkWithResource']}
                        checked={values['linkWithMaterial']}
                        onChange={(e) => {
                          setFieldValue('linkWithMaterial', e.target.checked);
                          setFieldValue('linkedMaterial', []);
                        }}
                      />
                    }
                    label="Link With Material"
                  />
                </Box>
                {values['linkWithMaterial'] && (
                  <Box>
                    <Autocomplete
                      id="linkedMaterial"
                      multiple
                      disableCloseOnSelect
                      options={MATERIAL_TYPE}
                      getOptionLabel={(option: any) => (option ? startCase(option) || '' : '')}
                      isOptionEqualToValue={(option: any, val) => option === val}
                      value={values['linkedMaterial']}
                      onChange={(e: any, value) => {
                        setFieldValue('linkedMaterial', value);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          margin="dense"
                          size='small'
                          variant="outlined"
                          label="Linked Material"
                          placeholder="Linked Material"
                          name="linkedMaterial"
                          required
                          error={touched['linkedMaterial'] && Boolean(errors['linkedMaterial'])}
                          helperText={touched['linkedMaterial'] && errors['linkedMaterial']}
                        />
                      )}
                    />
                  </Box>
                )}
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        disabled={values['linkWithMaterial']}
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
                        getOptionLabel={(option: any) => (option ? option?.optionLabel || '' : '')}
                        isOptionEqualToValue={(option: any, val) => option.optionValue === val}
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
                            size='small'
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
                        options={resourceFieldOption?.filter((e) => e?.lookup)}
                        disabled={resourceFieldsLoading}
                        getOptionLabel={(option: any) => (option ? option?.fieldLabel || '' : '')}
                        isOptionEqualToValue={(option: any, val) => option?.fieldName === val}
                        value={
                          resourceFieldOption && resourceFieldOption.filter((data) => data?.fieldName === values['linkResourceField']).length
                            ? resourceFieldOption && resourceFieldOption.filter((data) => data?.fieldName === values['linkResourceField'])[0]
                            : ''
                        }
                        onChange={(e, val) => {
                          setFieldValue('linkResourceField', val && val?.fieldName ? val?.fieldName : '');
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            margin="dense"
                            size='small'
                            variant="outlined"
                            label="Resource Field"
                            placeholder="Resource Field"
                            required
                            slotProps={{
                              input: {
                                ...params.InputProps,
                                endAdornment: (
                                  <React.Fragment>
                                    {resourceFieldsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                  </React.Fragment>
                                )
                              },
                            }}
                            error={touched['linkResourceField'] && Boolean(errors['linkResourceField'])}
                            helperText={touched['linkResourceField'] && errors['linkResourceField']}
                          />
                        )}
                      />
                    </Box>
                    <Box>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="readOnly"
                            checked={values['readOnly']}
                            onChange={(e) => {
                              setFieldValue('readOnly', e.target.checked);
                            }}
                          />
                        }
                        label="Read Only"
                      />
                    </Box>
                  </>
                )}
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="multipleStepData"
                        checked={values['multipleStepData']}
                        onChange={(e) => {
                          setFieldValue('multipleStepData', e.target.checked);
                        }}
                      />
                    }
                    label="Multiple Step Data"
                  />
                </Box>
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="stepDataRequired"
                        checked={values['stepDataRequired']}
                        onChange={(e) => {
                          setFieldValue('stepDataRequired', e.target.checked);
                        }}
                      />
                    }
                    label="Step Data Required"
                  />
                </Box>
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="showInPdf"
                        checked={values['showInPdf']}
                        onChange={(e) => {
                          setFieldValue('showInPdf', e.target.checked);
                        }}
                      />
                    }
                    label="Show In Pdf"
                  />
                </Box>
                {!values['linkWithResource'] && (
                  <Box className="mt-2">
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => {
                        setOpenField(true);
                      }}
                    >
                      Add Fields
                    </Button>
                    {!values['linkWithMaterial'] && (
                      <>
                        <Button
                          className="ml-2"
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => {
                            setOpenStepActions(true);
                          }}
                        >
                          Create Actions
                        </Button>
                      </>
                    )}
                  </Box>
                )}
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button
                size="small"
                color="primary"
                disabled={isSubmitting}
                onClick={() => {
                  if (isEqual(initialValues, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={isSubmitting}
                variant="contained"
                color="primary"
                size="small"
                type="submit"
                onClick={submitForm}
                endIcon={isSubmitting && <CircularProgress color="inherit" size={18} />}
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

            {openField && (
              <ConfigureField
                step={values}
                handleClose={() => {
                  setOpenField(false);
                }}
                handleSucess={(data) => {
                  setFieldValue('fields', data);
                  setOpenField(false);
                }}
              />
            )}
            {openStepActions && (
              <StepActions
                resource={resource}
                onClose={() => {
                  setOpenStepActions(false);
                }}
                onSuccess={(data) => {
                  setFieldValue('createActions', data);
                  setOpenStepActions(false);
                }}
                stepData={values}
              />
            )}
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default ManageSteps;
