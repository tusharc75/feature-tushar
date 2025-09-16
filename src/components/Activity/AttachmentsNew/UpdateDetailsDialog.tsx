import { Form, Formik } from "formik";
import { isEqual } from "lodash";
import { useContext, useEffect, useState } from "react";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import { ThemeButton } from "src/components/Helpers/Buttons";
import { fetch_resource_fields } from "src/components/ResourceFields";
import { CustomDialogTransition, getObjKeysWithValues, sidebarResource, yupSchema } from "src/constants/helpers";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import ConfirmCancelDialog from '../../ConfirmCancelDialog';
import { Box, Dialog } from "@mui/material";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import InputField from "src/components/Helpers/InputField";
import { isMobile, isTablet } from "react-device-detect";
import axiosInstance from "src/axios/axiosInstance";

const UpdateDetailsDialog = ({ onClose, onSuccess, data }) => {

  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialData, setInitialData] = useState({ fields: [], values: null });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchFields()
  }, [])

  const fetchFields = async () => {
    try {
      let { fieldsDataForCreate } = await fetch_resource_fields(sidebarResource.attachment);
      const tempInitialData: any = getObjKeysWithValues({ ...data }, fieldsDataForCreate);
      setInitialData({
        fields: fieldsDataForCreate,
        values: tempInitialData
      });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  }

  const handleSubmit = (values) => {
    setIsSubmitting(true)
    axiosInstance().put(`/attachment-new/update-details`, { ...values, _id: data?._id })
      .then(({ data }) => {
        onSuccess();
        setIsSubmitting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });

      }).catch(err => {
        setIsSubmitting(false)
        toastConfig.setToastConfig(err);
      })
  }

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
    >
      {initialData?.fields?.length > 0 ? (
        <Formik
          initialValues={initialData?.values}
          validationSchema={yupSchema(initialData.fields)}
          onSubmit={handleSubmit}
        >
          {({ submitForm, touched, errors, setFieldValue, values }) => (
            <>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData?.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={`Update - ${data?.name}`}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              ></CustomDialogHeader>
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <div className="p-1">
                    <div>
                      <InputField
                        errors={errors}
                        values={values}
                        setFieldValue={setFieldValue}
                        touched={touched}
                        fieldsData={initialData.fields}
                        size="small"
                        fullWidth
                      />
                    </div>
                  </div>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton
                  buttonType="transparent"
                  onClick={() => {
                    if (isEqual(initialData?.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </ThemeButton>
                <ThemeButton
                  buttonType="theme"
                  disabled={isSubmitting || isEqual(initialData?.values, values)}
                  loading={isSubmitting}
                  onClick={submitForm}
                >
                  Save
                </ThemeButton>
              </CustomDialogFooter>
              {showConfirmDialog && (
                <ConfirmCancelDialog
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
  )
}

export default UpdateDetailsDialog;
