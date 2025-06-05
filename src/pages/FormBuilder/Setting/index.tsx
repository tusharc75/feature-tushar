import { Autocomplete, Box, Checkbox, Dialog, FormControlLabel, TextField } from '@mui/material';
import { Form, Formik } from 'formik';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { resourcePolicy } from 'src/components/FormBuilder/Tabs/helper';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { ACTIVITY_RESOURCE, CustomDialogTransition, sidebarResource } from 'src/constants/helpers';
import EntityResource from 'src/pages/FormBuilder/Setting/EntityResource';
import Policy from 'src/pages/FormBuilder/Setting/Policy';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const SettingPolicyDialog = ({ entities, resource, onClose }) => {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialValues, setInitialValues] = useState({
    entityWiseResourceName: false,
    entityResources: [],
    policies: [],
    collaborateTools: false,
    collaborateToolsField: ''
  });
  const [resourceData, setResourceData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fields, setFields] = useState([]);

  useEffect(() => {
    fetchData();
    fetchFields()
  }, [resource]);

  const fetchData = async () => {
    axiosInstance()
      .get(`/sa-formbuilder/tabs/${resource}`)
      .then(({ data: { data } }) => {
        setResourceData(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

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

  useEffect(() => {
    if (resourceData) {
      let currentPolicy = resourceData?.policy || {};
      let defaultPolicy: any = resourcePolicy.find((e) => e.resource === resource)?.policy || [];
      setInitialValues({
        ...initialValues,
        entityWiseResourceName: resourceData?.entityResources?.length > 0 ? true : false,
        entityResources: resourceData?.entityResources?.map((e) => ({
          entity: e?.entity,
          resourceLabel: e?.resourceLabel,
          homePageLabel: e?.homePageLabel
        })),
        policies: defaultPolicy?.map((e) => {
          return {
            ...e,
            fieldName: e.fieldName,
            fieldLabel: e.fieldLabel,
            type: e.type,
            data: currentPolicy && currentPolicy?.hasOwnProperty(e.fieldName) ? currentPolicy[e.fieldName] : e.defaultValue,
            fields: e?.fields || []
          };
        }),
        collaborateTools: resourceData?.collaborateTools,
        collaborateToolsField: resourceData?.collaborateToolsField
      });
    }
  }, [resourceData]);

  const handleSave = (values) => {
    setIsSubmitting(true);
    let updatedPolicy = values?.policies?.reduce((acc, { fieldName, data }) => { return { ...acc, [fieldName]: data } }, {});
    let data = {
      policy: {
        ...updatedPolicy,
      },
      entityResources: [...values?.entityResources],
      otherData: {
        collaborateTools: values?.collaborateTools,
        collaborateToolsField: values?.collaborateTools ? values?.collaborateToolsField : ''
      }
    };
    axiosInstance()
      .put(`/sa-formbuilder/tabs/policy/${resource}`, data)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        onClose();
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const validation = (values) => {
    const errors: any = {};
    if (values?.entityWiseResourceName) {
      values?.entityResources?.forEach((_d, idx) => {
        if (!_d?.resourceLabel) {
          errors[`entityResources.${idx}.resourceLabel`] = 'Required';
        }
        if (!_d?.homePageLabel) {
          errors[`entityResources.${idx}.homePageLabel`] = 'Required';
        }
      });
    }
    if (values.collaborateTools && !values?.collaborateToolsField) {
      errors['collaborateToolsField'] = 'Please Select Workspace Tools Field';
    }
    if (resource === sidebarResource.serializedAsset) {
      const validationFields = initialValues[`policies`]?.[0]?.fields?.filter((e) => e.required);
      values.policies.forEach((value, index) => {
        if (value.fieldName === 'statusChangeFields') {
          value?.data?.forEach((ele, idx) => {
            validationFields?.forEach((e) => {
              if (!ele[e?.fieldName]) {
                errors[`policies.${index}.data.${idx}.status`] = `${e?.fieldLabel} is required`;
              } else if (e?.type === 'multiSelect' && (!ele[e?.fieldName] || !ele[e?.fieldName].length)) {
                errors[`policies.${index}.data.${idx}.fields`] = `${e?.fieldLabel} is required`;
              }
            });
          });
        }
      });
    }
    return errors;
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
          onClose();
        }
      }}
    >
      <Formik enableReinitialize={true} initialValues={initialValues} onSubmit={handleSave} validate={validation}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <>
            <CustomDialogHeader
              title={`Settings/Policy`}
              onClose={onClose}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
              showRequiredLabel={false}
            ></CustomDialogHeader>
            <CustomDialogContent>
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <EntityResource
                  values={values}
                  setFieldValue={setFieldValue}
                  errors={errors}
                  touched={touched}
                  entities={entities} />
                {!ACTIVITY_RESOURCE?.hasOwnProperty(camelCase(resource)) &&
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
                    {values['collaborateTools'] && (
                      <Box>
                        <Autocomplete
                          id="collaborateToolsField"
                          options={fields}
                          getOptionLabel={(option: any) => (option ? option?.optionLabel || '' : '')}
                          isOptionEqualToValue={(option: any, val) => option.optionValue === val}
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
                              size="small"
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
                  </Box>}
                <Policy
                  values={values}
                  setFieldValue={setFieldValue}
                  errors={errors}
                  touched={touched}
                  resource={resource}
                  initialValues={initialValues}
                />
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <ThemeButton disabled={isSubmitting} buttonType="transparent" onClick={onClose}>
                Cancel
              </ThemeButton>
              <ThemeButton disabled={isSubmitting} isLoading={isSubmitting} buttonType="theme" onClick={submitForm}>
                Save
              </ThemeButton>
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default SettingPolicyDialog;
