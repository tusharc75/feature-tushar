import { Box } from "@mui/material";
import { Form, Formik } from "formik";
import { isEqual } from "lodash";
import { useContext, useEffect, useState } from "react";
import axiosInstance from "src/axios/axiosInstance";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import { fetch_resource_fields } from "src/components/ResourceFields";
import { getObjKeys, sidebarResource, yupSchema } from "src/constants/helpers";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import ConfirmCancelDialog from '../../ConfirmCancelDialog';
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import { ThemeButton } from "src/components/Helpers/Buttons";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import InputField from "src/components/Helpers/InputField";
import MultiFileUpload from "src/components/Activity/AttachmentsNew/MultiFileUpload";

const ManageFile = ({
  relatedTo,
  isMinimized,
  onMinimizeMaximize,
  showManimizeMaximize,
  onClose,
  onSuccess,
  parentId = null
}) => {

  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState(false)
  const [initialData, setInitialData] = useState({ fields: [], values: null });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchFields()
  }, [])

  const fetchFields = async () => {
    try {
      setLoading(true)
      let { fieldsDataAll, fieldsDataForCreate, fieldsDataForUpdate } = await fetch_resource_fields(sidebarResource.attachment);
      const tempInitialData: any = getObjKeys('', fieldsDataForCreate);
      tempInitialData.files = []
      setInitialData({
        fields: fieldsDataForCreate,
        values: tempInitialData
      });
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  }

  const handleSubmit = (values) => {
    setSubmitting(true)
    const formData = new FormData();
    const { files, ...rest } = values
    for (const file of files) {
      formData.append('files', file);
    }
    formData.append('data', JSON.stringify(rest))
    formData.append('relatedTo', JSON.stringify(relatedTo))
    if (parentId) {
      formData.append('parentId', parentId)
    }
    axiosInstance()
      .post(`/attachment-new`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setSubmitting(false);
        onSuccess();
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  }

  const validate = (values) => {
    const errors: any = {}

    if (!values?.files?.length) {
      errors['files'] = 'Select at least one file'
    }

    return errors;
  }

  return (
    !loading ? (
      initialData?.values ? (
        <Formik
          initialValues={initialData?.values}
          validationSchema={yupSchema(initialData.fields)}
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ submitForm, touched, errors, setFieldValue, values }) => (
            <>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData?.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={`New Attachment`}
                isMinimized={isMinimized}
                onMinimizeMaximize={onMinimizeMaximize}
                showManimizeMaximize={showManimizeMaximize}
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
                      <MultiFileUpload
                        name="files"
                        required={true}
                        values={values}
                        setFieldValue={setFieldValue}
                        errors={errors}
                        touched={touched}
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
                >
                  Cancel
                </ThemeButton>
                <ThemeButton
                  buttonType="theme"
                  disabled={submitting || isEqual(initialData?.values, values)}
                  isLoading={submitting}
                  onClick={submitForm}
                >
                  Upload
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
      ) : null
    ) : (
      <Box p={2} height={500}>
        <CommonSkeleton lenArray={[...Array(10).keys()]} />
      </Box>
    )
  )
}

export default ManageFile;
