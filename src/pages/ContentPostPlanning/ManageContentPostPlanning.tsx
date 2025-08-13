import { Box, Dialog } from '@mui/material';
import { Form, Formik } from 'formik';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomDialogTransition, getObjKeys, getObjKeysWithValues, sidebarResource, yupSchema } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { isEqual } from 'lodash';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import ConfirmCancelDialog from 'src/components/ConfirmCancelDialog';
import InputField from 'src/components/Helpers/InputField';
import { fetch_resource_fields } from 'src/components/ResourceFields';
interface ManageContentPostPlanningProps {
  open: boolean;
  isEdit?: boolean;
  idToEdit?: string | null;
  onClose: () => void;
  onSuccess: (data?: any) => void;
}

const ManageContentPostPlanning = ({ open, isEdit = false, idToEdit = null, onClose, onSuccess }: ManageContentPostPlanningProps) => {
  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const {
    state: { resources }
  } = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchFields();
    }
  }, [open, isEdit, idToEdit]);

  const fetchFields = async () => {
    try {
      const { fieldsDataForCreate, fieldsDataForUpdate, fieldsDataAll } = await fetch_resource_fields(sidebarResource.contentPostPlanning);

      if (isEdit && idToEdit) {
        const response = await axiosInstance().get(`${routes.contentPostPlanning.path}/${idToEdit}`);
        const data = response?.data?.data;

        setInitialData({
          fields: fieldsDataForUpdate,
          values: getObjKeysWithValues(data, fieldsDataAll)
        });
      } else {
        setInitialData({
          fields: fieldsDataForCreate,
          values: getObjKeys('', fieldsDataForCreate)
        });
      }
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
      setLoading(false);
    }
  };

  const handleSubmit = (values: any) => {
    setLoading(true);

    if (isEdit && idToEdit) {
      values._id = idToEdit;
      axiosInstance()
        .put(`${routes.contentPostPlanning.path}`, values)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          onSuccess();
        })
        .catch((error) => toastConfig.setToastConfig(error))
        .finally(() => setLoading(false));
    } else {
      axiosInstance()
        .post(`${routes.contentPostPlanning.path}`, values)
        .then(({ data: { data, message } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message
          });
          onSuccess(data);
        })
        .catch((error) => toastConfig.setToastConfig(error))
        .finally(() => setLoading(false));
    }
  };

  const handleScroll = (errors: any) => {
    const err = Object.keys(errors);
    if (err?.length) {
      const input = document.querySelector(`input[name=${err[0]}]`);
      if (input) {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

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
      open={open}
    >
      {initialData?.fields?.length ? (
        <Formik
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
          onSubmit={(values) => handleSubmit(values)}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <>
              <CustomDialogHeader
                title={isEdit ? `Update Post` : `Create Post`}
                onClose={() => {
                  if (isEqual(initialData.values, values)) {
                    onClose();
                  } else {
                    setShowConfirmDialog(true);
                  }
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => setFullScreen((prev) => !prev)}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form autoComplete="off" noValidate>
                  <InputField
                    errors={errors}
                    values={values}
                    setFieldValue={setFieldValue}
                    touched={touched}
                    fieldsData={initialData.fields}
                    size="small"
                    fullWidth
                    resource={sidebarResource.contentPostPlanning}
                    referenceId={idToEdit || null}
                  />
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton
                  buttonType="transparent"
                  onClick={() => {
                    if (isEqual(initialData.values, values)) {
                      onClose();
                    } else {
                      setShowConfirmDialog(true);
                    }
                  }}
                >
                  Cancel
                </ThemeButton>
                <ThemeButton
                  isLoading={loading}
                  buttonType="theme"
                  disabled={loading}
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
                >
                  Save
                </ThemeButton>
              </CustomDialogFooter>

              {showConfirmDialog && (
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

export default ManageContentPostPlanning;
