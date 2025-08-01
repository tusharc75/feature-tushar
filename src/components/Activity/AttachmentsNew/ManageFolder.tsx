import { TextField } from "@mui/material";
import { Form, Formik } from "formik";
import { isEqual } from "lodash";
import { useContext, useState } from "react";
import axiosInstance from "src/axios/axiosInstance";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import { ThemeButton } from "src/components/Helpers/Buttons";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import { object, string } from "yup";

const FolderSchema = object().shape({
  name: string().required('Folder Name is required')
});

const ManageFolder = ({ onClose, onSuccess, relatedTo, isMinimized, onMinimizeMaximize, showManimizeMaximize, folderData = null, isRename = false }) => {

  const toastConfig = useContext(CustomToastContext);

  const [initialData, setInitialData] = useState({ name: folderData && isRename ? folderData?.name : '' });
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (values) => {
    setSubmitting(true)

    const data: any = {
      name: values?.name,
    }

    if (folderData && isRename) {
      axiosInstance()
        .put(`/attachment-new/folder`, { ...data, _id: folderData?._id })
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
      data.relatedTo = relatedTo
      if (folderData?._id) {
        data.parentId = folderData?._id
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
    <Formik
      initialValues={initialData}
      validationSchema={FolderSchema}
      onSubmit={handleSubmit}
    >
      {({ submitForm, touched, errors, setFieldValue, values }) => (
        <>
          <CustomDialogHeader
            onClose={onClose}
            title={`${folderData && isRename ? 'Rename' : 'New'} Folder`}
            isMinimized={isMinimized}
            onMinimizeMaximize={onMinimizeMaximize}
            showManimizeMaximize={showManimizeMaximize}
          ></CustomDialogHeader>
          <CustomDialogContent>
            <Form autoComplete="off" autoCorrect="off" noValidate>
              <div className="p-1">
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
            </Form>
          </CustomDialogContent>
          <CustomDialogFooter>
            <ThemeButton
              buttonType="transparent"
              onClick={onClose}
            >
              Cancel
            </ThemeButton>
            <ThemeButton
              buttonType="theme"
              disabled={submitting || isEqual(initialData, values)}
              isLoading={submitting}
              onClick={submitForm}
            >
              Save
            </ThemeButton>
          </CustomDialogFooter>

        </>
      )}
    </Formik>
  )
}

export default ManageFolder;
