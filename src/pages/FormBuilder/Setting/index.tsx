import { Dialog } from '@mui/material';
import { Form, Formik } from 'formik';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { resourcePolicy } from 'src/components/FormBuilder/Tabs/helper';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomDialogTransition, sidebarResource } from 'src/constants/helpers';
import EntityResource from 'src/pages/FormBuilder/Setting/EntityResource';
import Policy from 'src/pages/FormBuilder/Setting/Policy';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const SettingPolicyDialog = ({ entities, resource, onClose }) => {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialValues, setInitialValues] = useState({ entityWiseResourceName: false, entityResources: [], policies: [] });
  const [resourceData, setResourceData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    fetchData();
  }, [resource]);

  useEffect(() => {
    if (resourceData) {
      let currentPolicy = resourceData?.policy || {};
      let defaultPolicy = resourcePolicy.find((e) => e.resource === resource)?.policy || [];
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
        })
      });
    }
  }, [resourceData]);

  const handleSave = (values) => {
    setIsSubmitting(true);
    let updatedPolicy = values?.policies?.reduce((acc, { fieldName, data }) => {
      return { ...acc, [fieldName]: data };
    }, {});
    let data = {
      policy: { ...updatedPolicy },
      entityResources: [...values?.entityResources]
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
