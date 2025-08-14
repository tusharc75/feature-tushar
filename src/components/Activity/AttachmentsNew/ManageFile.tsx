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
  parentId = null,
  attachmentType = null,
  fetchData = null,
  setUploads
}) => {

  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState(false)
  const [initialData, setInitialData] = useState({ fields: [], values: null });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchFields()
  }, [])

  const fetchFields = async () => {
    try {
      setLoading(true)
      let { fieldsDataAll, fieldsDataForCreate, fieldsDataForUpdate } = await fetch_resource_fields(sidebarResource.attachment);
      const tempInitialData: any = getObjKeys('', fieldsDataForCreate);
      if (attachmentType) {
        tempInitialData.attachmentType = attachmentType
      }
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

  const handleSubmit = async (values) => {
    const { files, ...rest } = values

    onClose()
    if (files?.length) {
      const newUploads = files?.map(file => ({ file, progress: 0, status: 'uploading', _id: Math.random().toString(36).substring(7) }))
      setUploads((prev) => [...prev, ...newUploads]);

      await Promise.allSettled(
        newUploads.map(({ file, _id }) => {
          return new Promise(async (resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('data', JSON.stringify(rest))
            if (parentId) formData.append('parentId', parentId);
            formData.append('relatedTo', JSON.stringify(relatedTo))

            let fake = 0;
            const fakeInterval = setInterval(() => {
              fake = Math.min(fake + Math.random() * 15, 90);
              setUploads((prev) => prev.map((u) => (u?._id === _id ? { ...u, progress: Math.round(fake) } : u)));
            }, 200);

            axiosInstance()
              .post(`/attachment-new`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              })
              .then(({ data }) => {
                clearInterval(fakeInterval);
                setUploads((prev) => prev.map((u) => (u?._id === _id ? { ...u, status: 'completed', progress: 100 } : u)));
                toastConfig.setToastConfig({
                  open: true,
                  type: 'success',
                  message: data.message
                });
                resolve('success');
              })
              .catch((error) => {
                clearInterval(fakeInterval);
                setUploads((prev) => prev.map((u) => (u?._id === _id ? { ...u, status: 'failed' } : u)));
                toastConfig.setToastConfig(error);
                reject('failed');
              });
          });
        })
      );
    }
    if (fetchData) {
      fetchData()
    }
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
                  disabled={isEqual(initialData?.values, values)}
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
