import { Box, TextField } from "@mui/material";
import { Form, Formik } from "formik";
import { isEqual } from "lodash";
import { useContext, useEffect, useState } from "react";
import axiosInstance from "src/axios/axiosInstance";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import { fetch_resource_fields } from "src/components/ResourceFields";
import { getObjKeys, getObjKeysWithValues, sidebarResource, yupSchema } from "src/constants/helpers";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import { useData } from "src/StateProvider/Provider";
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import { ThemeButton } from "src/components/Helpers/Buttons";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import Grid from '@mui/material/Grid2';
import { object, string } from "yup";
import FormTypes from "src/components/Helpers/FormTypes";
import InputField from "src/components/Helpers/InputField";


const FolderSchema = object().shape({
  name: string().required('Folder Name is required')
});

const ManageAttachmentsNew = ({
  relatedTo,
  isMinimized,
  onMinimizeMaximize,
  showManimizeMaximize,
  type = 'file',
  onClose,
  onSuccess,
  parentId = null
}) => {

  const toastConfig = useContext(CustomToastContext);


  const {
    state: { user }
  }: any = useData();

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
      if (type === 'file') {
        let { fieldsDataAll, fieldsDataForCreate, fieldsDataForUpdate } = await fetch_resource_fields(sidebarResource.attachment);
        const tempInitialData: any = getObjKeys('', fieldsDataForCreate);
        tempInitialData.files = []
        setInitialData({
          fields: fieldsDataForCreate,
          values: tempInitialData
        });
        setLoading(false);
      } else if (type === 'folder') {
        setInitialData({
          fields: [],
          values: { name: '' }
        });
        setLoading(false);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  }

  const handleSubmit = (values) => {
    setSubmitting(true)
    if (type === 'file') {
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
    } else {
      const data: any = {
        name: values?.name,
        relatedTo: relatedTo
      }
      if (parentId) {
        data.parentId = parentId
      }
      axiosInstance()
        .post(`/attachment-new/folder`, data)
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
  }

  return (
    !loading ? (
      initialData?.values ? (
        <Formik
          initialValues={initialData?.values}
          validationSchema={type === 'file' ? yupSchema(initialData.fields) : FolderSchema}
          onSubmit={handleSubmit}
        >
          {({ submitForm, touched, errors, setFieldValue, values }) => (
            <>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData?.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={`New ${type === 'file' ? 'Attachment' : 'Folder'}`}
                isMinimized={isMinimized}
                onMinimizeMaximize={onMinimizeMaximize}
                showManimizeMaximize={showManimizeMaximize}
              ></CustomDialogHeader>
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <div className="p-1">
                    {type === 'file' ? (
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
                        <div className="mt-2 mb-5">
                          <FormTypes
                            label=""
                            name="files"
                            required={true}
                            type="multipleFileUploadNew"
                            values={values}
                            errors={errors}
                            touched={touched}
                            size="small"
                            margin="dense"
                            setFieldValue={(name, files) => {
                              setFieldValue(name, files)
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <TextField
                          variant="outlined"
                          type="text"
                          label={'Folder Name'}
                          required={true}
                          name="name"
                          fullWidth
                          margin="dense"
                          size={'small'}
                          value={values['name']}
                          error={touched['name'] && Boolean(errors['name'])}
                          helperText={touched['name'] && errors['name']}
                          onChange={(e) => {
                            setFieldValue('name', e.target.value.trimStart());
                          }}
                        />
                      </div>
                    )}
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
                  {type === 'folder' ? 'Save' : 'Upload'}
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

export default ManageAttachmentsNew;
