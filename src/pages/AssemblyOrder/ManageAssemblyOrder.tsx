import { Box, Button, Dialog } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import {
  CustomDialogTransition,
  GenerateResourceLineNumber,
  getObjKeys,
  getObjKeysWithValues,
  sidebarResource,
  yupSchema
} from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { isEqual } from 'lodash';
import CustomButton from 'src/components/Helpers/CustomButton';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import InputField from 'src/components/Helpers/InputField';

const ManageAssemblyOrder = ({ isClone = false, assemblyOrderId = null, onClose, onSuccess, referenceData = null }) => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [assemblyOrderData, setAssemblyOrderData] = useState(null);
  const [cloneHeading, setCloneHeading] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchFields();
  }, [assemblyOrderId]);

  const fetchFields = async () => {
    try {
      let fieldData;
      const response: any = await axiosInstance().get(`/field?resource=${sidebarResource.assemblyOrder}`);
      fieldData = response?.data?.data;

      const fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = fieldData?.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
      if (assemblyOrderId) {
        try {
          let data;
          const response: any = await axiosInstance().get(`${routes.assemblyOrder.path}/${assemblyOrderId}`);
          data = response?.data?.data;
          setAssemblyOrderData(data);
          if (isClone) {
            const { _id, brand, createdBy, entity, history, products, status, assemblyOrderNumber, updatedBy, ...rest } = data;
            rest.status = 'New';
            rest.assemblyOrderNumber = GenerateResourceLineNumber(fieldsDataForCreate);
            setCloneHeading(assemblyOrderNumber);
            setInitialData({
              fields: fieldsDataForCreate,
              values: { ...getObjKeysWithValues(rest, fieldsDataForCreate, true, user) }
            });
            setLoading(false);
          } else {
            setInitialData({
              fields: fieldsDataForUpdate,
              values: getObjKeysWithValues(data, fieldsDataForUpdate)
            });
            setLoading(false);
          }
        } catch (error) {
          toastConfig.setToastConfig(error);
        }
      } else {
        let initialData = { ...getObjKeys('', fieldsDataForCreate) };
        initialData['assemblyOrderNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);

        if (referenceData) {
          Object.keys(referenceData)?.forEach((key) => {
            if (fieldsDataForCreate?.find((i) => i.fieldName === key)) {
              initialData[key] = referenceData[key];
            }
            const field = fieldsDataForCreate?.find((f) => f?.fieldName === key);
            if (field) {
              field.disableOnEdit = true;
              field.isUneditable = true;
            }
          });
        }
        setInitialData({
          fields: fieldsDataForCreate,
          values: initialData
        });
        setLoading(false);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmit = (values) => {
    setLoading(true);
    if (assemblyOrderId && isClone === false) {
      values._id = assemblyOrderId;
      axiosInstance()
        .put(`${routes.assemblyOrder.path}`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          onSuccess();
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${routes.assemblyOrder.path}`, values)
        .then(({ data: { data, message } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
          history.push(`${routes.assemblyOrderDetail.path}/${data?._id}`);
          onSuccess(data);
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleScroll = (errors) => {
    const err = Object.keys(errors);
    if (err?.length) {
      const input = document.querySelector(`input[name=${err[0]}]`);
      input.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'start'
      });
    }
  };

  function validate(values) {
    const errors = {};
    return errors;
  }

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
      open={true}
    >
      {initialData?.fields?.length ? (
        <Formik
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <>
              <CustomDialogHeader
                title={
                  !assemblyOrderId
                    ? `Create ${routes.assemblyOrder.title}`
                    : `${isClone ? `Clone - ${cloneHeading}` : `Update ${assemblyOrderData?.assemblyOrderNumber || ''}`}`
                }
                onClose={() => {
                  if (isEqual(initialData.values, values)) {
                    onClose();
                  } else {
                    setShowConfirmDialog(true);
                  }
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
                    resource={sidebarResource.assemblyOrder}
                    referenceId={assemblyOrderId || null}
                    collaborateTools={true}
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  type="button"
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={() => {
                    if (isEqual(initialData.values, values)) {
                      onClose();
                    } else {
                      setShowConfirmDialog(true);
                    }
                  }}
                >
                  Cancel
                </Button>
                <CustomButton
                  loading={loading}
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
                >
                  Save
                </CustomButton>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmCancelDialog
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

export default ManageAssemblyOrder;
