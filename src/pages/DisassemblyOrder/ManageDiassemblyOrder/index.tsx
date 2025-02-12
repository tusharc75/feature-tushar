import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import { sidebarResource, disassemblyOrder, GenerateResourceLineNumber, getObjKeysWithValues, DIASSEMBLY_ORDER_STATUS, getObjKeys, yupSchema, CustomDialogTransition } from 'src/constants/helpers';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { Box, Dialog } from '@mui/material';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { isEqual } from 'lodash';
import { Form, Formik } from 'formik';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import InputField from 'src/components/Helpers/InputField';

export const ManageDiassemblyOrder = ({ isClone = false, disassemblyOrderId = null, isRedirectToDetailPage = true, onClose, onSuccess }) => {

  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, resources }
  }: any = useData();
  const [initialData, setInitialData] = useState({ fields: [], values: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [cloneHeading, setCloneHeading] = useState('');

  useEffect(() => {
    axiosInstance().get(`/field?resource=${sidebarResource.disassemblyOrder}`).then(({ data: { data } }) => {
      const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
      if (disassemblyOrderId) {
        axiosInstance()
          .get(`${disassemblyOrder.api}/` + disassemblyOrderId)
          .then(({ data: { data } }) => {
            if (isClone) {
              const { _id, createdBy, disassemblyOrderNumber, ...rest } = data;
              rest['status'] = DIASSEMBLY_ORDER_STATUS.new;
              setCloneHeading(disassemblyOrderNumber);
              const tempInitialData = getObjKeysWithValues(rest, fieldsDataForCreate, true, user);
              const primaryField = fieldsDataForCreate?.find((e) => e?.primaryField && e?.isSystemGenerate);
              if (primaryField) {
                tempInitialData[primaryField?.fieldName] = GenerateResourceLineNumber(fieldsDataForCreate);
              }
              setInitialData({
                fields: fieldsDataForCreate,
                values: tempInitialData
              });
            }
            else {
              setInitialData({
                fields: fieldsDataForUpdate,
                values: getObjKeysWithValues(data, fieldsDataForUpdate)
              });
            }
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      }
      else {
        let initialData = getObjKeys('', fieldsDataForCreate);
        initialData['disassemblyOrderNumber'] = GenerateResourceLineNumber(fieldsDataForCreate);
        setInitialData({
          fields: fieldsDataForCreate,
          values: initialData
        });
      }
    })
  }, []);


  const handleSubmit = (values) => {
    setIsSubmitting(true);
    if (disassemblyOrderId && isClone === false) {
      values._id = disassemblyOrderId;
      axiosInstance().put(`${disassemblyOrder.api}`, values).then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        onSuccess();
        setIsSubmitting(false);
      }).catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
    } else {
      axiosInstance().post(`${disassemblyOrder.api}/`, values).then(({ data: { data, message } }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: message
        });
        if (isRedirectToDetailPage) {
          history.push(`${routes.disassemblyOrderDetail.path}/${data._id}`);
        }
        onSuccess(data);
        setIsSubmitting(false);
      }).catch((error) => {
        setIsSubmitting(false);
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
      open={true}
    >
      {initialData && initialData?.fields?.length ? (
        <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} validateOnMount onSubmit={handleSubmit}>
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <>
              <CustomDialogHeader
                title={
                  !disassemblyOrderId
                    ? `Create ${resources?.demandOrder?.titleSingular}`
                    : `${isClone ? `Clone - ${cloneHeading}` : `Update ${initialData?.values?.disassemblyOrderNumber}`}`
                }
                onClose={() => {
                  if (isEqual(values, initialData.values)) {
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
                <Form>
                  <InputField
                    errors={errors}
                    values={values}
                    setFieldValue={setFieldValue}
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                    resource={sidebarResource.disassemblyOrder}
                    referenceId={disassemblyOrderId || null}
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton
                  buttonType="transparent"
                  id="dialog-cancel-button"
                  onClick={() => {
                    if (isEqual(values, initialData.values)) {
                      onClose();
                    } else {
                      setShowConfirmDialog(true);
                    }
                  }}
                >
                  Cancel
                </ThemeButton>
                <ThemeButton
                  isLoading={isSubmitting}
                  buttonType="theme"
                  id="dialog-save-button"
                  disabled={isSubmitting}
                  onClick={(e) => {
                    submitForm();
                  }}
                >
                  Save
                </ThemeButton>
              </CustomDialogFooter>
              {showConfirmDialog && (
                <ConfirmationCancelDialog
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
              )}
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


