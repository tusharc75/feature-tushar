import { Box, Button, CircularProgress, Dialog } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import InputField from 'src/components/Helpers/InputField';
import { useHistory } from 'react-router-dom';
import { CustomDialogTransition, GenerateResourceLineNumber, rentalManagement } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../../constants/helpers';

const ManageDynamicForm = ({
  resource,
  resourcePath = '',
  onClose,
  onSuccess,
  redirected = true,
  isClone = false,
  id = null,
  referenceData = null,
  collaborateTools = false
}) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
  const [loading, setLoading] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      let data;
      const response = await axiosInstance().get(`/field?resource=${resource}`);
      data = response?.data?.data;
      const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

      if (id) {
        axiosInstance()
          .get(`/dynamic-form/${id}`, {
            headers: {
              Resource: resource
            }
          })
          .then(({ data: { data } }) => {
            if (referenceData) {
              Object.keys(referenceData)?.forEach((_r) => {
                fieldsDataForUpdate?.forEach((_f) => {
                  if (_f?.fieldName === _r) {
                    _f.disabled = true;
                    return;
                  }
                });
              });
            }
            setInitialData({
              fields: isClone ? fieldsDataForCreate : fieldsDataForUpdate,
              values: getObjKeysWithValues(data, isClone ? fieldsDataForCreate : fieldsDataForUpdate)
            });
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      } else {
        const tempInitialData = getObjKeys('', fieldsDataForCreate);
        const primaryField = fieldsDataForCreate?.find((e) => e?.primaryField && e?.isSystemGenerate);
        if (primaryField) {
          tempInitialData[primaryField?.fieldName] = GenerateResourceLineNumber(fieldsDataForCreate);
        }
        if (referenceData) {
          Object.keys(referenceData)?.forEach((_r) => {
            fieldsDataForCreate?.forEach((_f) => {
              if (_f?.fieldName === _r) {
                _f.disabled = true;
                tempInitialData[_f?.fieldName] = referenceData[_f?.fieldName];
                return;
              }
            });
          });
        }
        setInitialData({
          fields: fieldsDataForCreate,
          values: tempInitialData
        });
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
    const primaryField = initialData?.fields?.find((e) => e?.primaryField);
    setSubmitting(true);
    if (id && !isClone) {
      values._id = id;
      axiosInstance()
        .put(`/dynamic-form`, values, {
          headers: {
            Resource: resource
          }
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
    } else {
      axiosInstance()
        .post(`/dynamic-form`, values, {
          headers: {
            Resource: resource
          }
        })
        .then(({ data: { data, message } }) => {
          setLoading(false);
          if (redirected) {
            history.push(`${resourcePath}/detail/${data._id}`);
            onSuccess(data.data);
          } else {
            onSuccess(data, primaryField);
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

  function validate(values) {
    const errors = {};
    const counterFields = initialData?.fields?.filter((f) => f?.type === 'counter');
    if (counterFields?.length) {
      counterFields?.forEach((field) => {
        field?.subFields.forEach((_field) => {
          if (_field?.required && values[field?.fieldName]?.some((v) => !v[_field?.fieldName])) {
            errors[field?.fieldName] = `${field?.fieldLabel} is required`;
          }
        });
      });
    }
    return errors;
  }

  const handleScroll = (errors) => {
    const err = Object.keys(errors);
    if (err?.length) {
      const input = document.querySelector(`input[name=${err[0]}]`);
      input?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'start'
      });
    }
  };

  //This is for fixed logic
  const handleFixedBrandWiseLogic = async (name, value, setFieldValue) => {
    if (name === 'rentalJob' && resource === 'Daily Inspection Report' && initialData?.fields?.find((e) => e.fieldName === 'assets')) {
      const response: any = await axiosInstance().get(`${rentalManagement.api}/${value}`);
      if (response?.data?.data?.productInventory?.length) {
        setFieldValue(
          'assets',
          response?.data?.data?.productInventory?.map((e) => e.inventory)
        );
      } else {
        setFieldValue('assets', []);
      }
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
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} onSubmit={handleSubmit} validate={validate}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={`${id ? (isClone ? `Clone` : `Edit`) : `Create`}`}
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
                    setFieldValue={(name, value) => {
                      setFieldValue(name, value);
                      handleFixedBrandWiseLogic(name, value, setFieldValue);
                    }}
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                    onImageUploadCompletePercentage={(completePercentage) => {
                      setUploadingImageOrFileProgress(completePercentage);
                    }}
                    resource={resource}
                    referenceId={id || null}
                    collaborateTools={collaborateTools}
                  />
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
                  disabled={uploadingImageOrFileProgress > 0 || loading || submitting}
                  variant="contained"
                  color="primary"
                  type="submit"
                  size="small"
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
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
                    handleScroll(errors);
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

export default ManageDynamicForm;
