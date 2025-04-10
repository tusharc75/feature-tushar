import { useContext, useEffect, useRef, useState } from 'react';
import { Box, Dialog } from '@mui/material';
import { Formik, Form } from 'formik';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { CustomDialogTransition, getObjKeys, getObjKeysWithValues, sidebarResource, yupSchema } from 'src/constants/helpers';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import InputField from 'src/components/Helpers/InputField';

function ManageUnavailability({ onClose, onSuccess, id, masterId }) {
  const toastConfig = useContext(CustomToastContext);
  const ref = useRef(null);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [title, setTitle] = useState('');

  useEffect(() => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.technicianUnavailability}`)
      .then(({ data: { data } }) => {
        const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
        const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
        if (id) {
          axiosInstance()
            .get(`${routes?.employeeMaster?.path}/unavailability/one/${id}`)
            .then(({ data: { data } }) => {
              setTitle(`Edit - ${data?.title}`);
              setInitialData({
                fields: fieldsDataForUpdate,
                values: { ...getObjKeysWithValues(data, fieldsDataForUpdate) }
              });
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
            });
        } else {
          setTitle(`Create - Unavailability`);
          let initialData = getObjKeys('', fieldsDataForCreate);
          setInitialData({
            fields: fieldsDataForCreate,
            values: initialData
          });
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

  const handleSave = (values: any) => {
    if (id) {
      values._id = id;
      values.technician = masterId;
      axiosInstance()
        .put(`${routes?.employeeMaster?.path}/unavailability`, values)
        .then(({ data }) => {
          onSuccess();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    } else {
      values.technician = masterId;
      axiosInstance()
        .post(`${routes?.employeeMaster?.path}/unavailability`, values)
        .then(({ data }) => {
          onSuccess();
          toastConfig.setToastConfig({ open: true, type: 'success', message: data.message });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
    >
      {initialData && initialData?.fields?.length ? (
        <Formik
          innerRef={ref}
          initialValues={initialData.values}
          validateOnMount
          validationSchema={yupSchema(initialData.fields)}
          onSubmit={handleSave}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <>
              <CustomDialogHeader
                onClose={() => {
                  if (!isEqual(ref.current.values, initialData.values)) {
                    setShowConfirmDialog(true);
                  } else {
                    onClose();
                  }
                }}
                title={title}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => setFullScreen((prev) => !prev)}
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
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton
                  buttonType="transparent"
                  id="dialog-cancel-button"
                  onClick={() => {
                    if (isEqual(initialData, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </ThemeButton>
                <ThemeButton
                  buttonType="theme"
                  id="dialog-save-button"
                  onClick={(e) => {
                    submitForm();
                  }}
                >
                  Save
                </ThemeButton>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmationCancelDialog
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
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
}

export default ManageUnavailability;
