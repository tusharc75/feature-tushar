import { useState, useEffect, useContext, Fragment } from 'react';
import { Formik, Form } from 'formik';
import { Box, Button } from '@mui/material';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomButton from '../../../components/Helpers/CustomButton';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { useData } from '../../../StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  getObjKeys,
  getObjKeysWithValues,
  packages,
  setFieldsInAscendingOrder,
  sidebarResource,
  yupSchema
} from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import Dialog from '@mui/material/Dialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { useHistory } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import { FaDiceOne } from 'react-icons/fa';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { isEqual, isString } from 'lodash';
import InputField from 'src/components/Helpers/InputField';

const ManagePackageDialog = ({ isClone, packageId, onClose, onSuccess, open, isRedirectToDetailPage = true, referenceData = null }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [packageName, setPackageName] = useState('');
  const {
    state: { user, resources }
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    fetchFields();
  }, [packageId]);

  const fetchFields = async () => {
    try {
      let fieldData;
      const response: any = await axiosInstance().get(`/field?resource=${sidebarResource.packages}`);
      fieldData = response?.data?.data;
      const fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = fieldData?.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
      if (packageId) {
        try {
          let data;
          const response: any = await axiosInstance().get(`${packages.api}/${packageId}`);
          data = response?.data?.data;
          if (data?.customerAccount && data?.customerAccount !== '') {
            const emDashIndex = data?.packageName?.indexOf('—');
            if (emDashIndex !== -1) {
              const resultString = data?.packageName?.slice(0, emDashIndex).trim();
              data['packageName'] = resultString;
            }
          }
          if (isClone) {
            const { _id, brand, createdBy, entity, packageName, history, updatedBy, ...rest } = data;
            setPackageName(packageName);
            setInitialData({
              fields: fieldsDataForCreate,
              values: { ...getObjKeysWithValues(rest, fieldsDataForCreate, true, user) }
            });
          } else {
            setInitialData({
              fields: fieldsDataForUpdate,
              values: getObjKeysWithValues(data, fieldsDataForUpdate)
            });
          }
        } catch (error) {
          toastConfig.setToastConfig(error);
        }
      } else {
        let initialData = getObjKeys('', fieldsDataForCreate);
        if (referenceData) {
          for (const key in referenceData) {
            const foundField = fieldsDataForCreate?.find((e) => e.fieldName === key);
            if (referenceData[key] && foundField) {
              if (foundField?.type === 'multiSelect' && isString(referenceData[key])) {
                initialData[key] = [referenceData[key]];
              } else {
                initialData[key] = referenceData[key];
              }
            }
          }
        }
        setInitialData({
          fields: fieldsDataForCreate,
          values: initialData
        });
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const findCustomerName = (value: any) => {
    const customerOption = initialData?.fields?.find((e) => e.fieldName === 'customerAccount')?.option;
    const findOptions = customerOption.filter((item) => item.optionValue === value);
    if (findOptions?.length) {
      return findOptions[0]?.optionLabel;
    } else {
      return null;
    }
  };

  const handleSubmit = (values: any) => {
    const newValues = { ...values };

    setSubmitting(true);
    if (packageId && isClone === false) {
      newValues._id = packageId;
      axiosInstance()
        .put(`${packages.api}`, newValues)
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
        .post(`${packages.api}`, newValues)
        .then(({ data: { data, message } }) => {
          if (isRedirectToDetailPage) {
            history.push(`${routes.packagesDetail.path}/${data._id}`);
          }
          setSubmitting(false);
          onSuccess(data);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleScroll = (errors) => {
    const err = Object.keys(errors);
    if (err.length) {
      const input = document.querySelector(`input[name=${err[0]}]`);
      input.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'start'
      });
    }
  };

  return (
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
      {initialData?.fields?.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} validateOnMount onSubmit={handleSubmit}>
          {({ values, errors, touched, setFieldValue, handleSubmit }) => (
            <Fragment>
              <CustomDialogHeader
                title={!packageId ? `Create ${resources?.packages?.titleSingular}` : `${isClone ? `Clone - ${packageName}` : 'Edit'}`}
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
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
                    setFieldValue={setFieldValue}
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  disabled={submitting}
                  type="button"
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={() => {
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <CustomButton
                  loading={submitting}
                  variant="contained"
                  color="primary"
                  disabled={submitting}
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    handleSubmit();
                  }}
                >
                  Save
                </CustomButton>
              </CustomDialogFooter>
              {showConfirmDialog && (
                <ConfirmCancelDialog
                  close={() => setShowConfirmDialog(false)}
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    handleScroll(errors);
                    handleSubmit();
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    onClose();
                  }}
                />
              )}
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

export default ManagePackageDialog;
