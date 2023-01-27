import React, { useState, useEffect, useContext } from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { Formik, Form } from 'formik';
import { object, string } from 'yup';
import PropTypes from 'prop-types';
import CustomDialogHeader from '../../CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../CustomDialog/CustomDialogFooter';
import FormTypes from '../../Helpers/FormTypes';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from '../../../components/Helpers/CustomButton';
import TextField from '@material-ui/core/TextField';
import { IconButton, Typography, Paper, Tooltip } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import GetAppIcon from '@material-ui/icons/GetApp';
import { csvIcon, docIcon, excelSheetIcon, pdfFileIcon, pptIcon, textFileIcon, imageIcon } from '../../../assets/file_icons';
import emailStyles from '../../../pages/Activity/Email/email.module.scss';
import ImagePreview from '../Email/ImagePreview';
import ConfirmationDialog from '../../Helpers/ConfirmationDialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { useData } from '../../../StateProvider/Provider';

const AttachmentSchema = object().shape({
  name: string().required('please add folder name')
});

function ManageAttachmentFolder({
  relatedTo,
  folderId,
  handleClose,
  fetchData = null,
  attachmentData = null,
  isMinimized,
  onMinimizeMaximize,
  showManimizeMaximize,
  parentFolder = null
}) {
  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const [imageSource, setImageSource] = useState(null);
  const [open, setOpen] = useState(false);
  const [canEdit, setCanEdit] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formValues, setFormValues] = useState({});

  const {
    state: { permissions }
  }: any = useData();
  useEffect(() => {
    fetchAttachmentDetail();
  }, []);

  const fetchAttachmentDetail = async () => {
    if (folderId) {
      setLoading(true);
      axiosInstance()
        .get(`/attachment/${folderId}`)
        .then(({ data: { data } }) => {
          setCanEdit(data?.canEdit);
          setInitialValues(data);
          setFormValues(data);
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      setInitialValues({ folderName: '' });
      setFormValues({ folderName: '' });
    }
  };

  const showSuccessMessage = (message) => {
    toastConfig.setToastConfig({
      open: true,
      type: 'success',
      message: message
    });
  };

  const handleSave = (values) => {
    let request: any = {
      name: values.name,
      relatedTo: relatedTo
    };
    if (parentFolder) request.parentFolder = parentFolder;
    setLoading(true);
    if (folderId) {
      axiosInstance()
        .put(`/attachment/${folderId}`, request)
        .then(({ data }) => {
          showSuccessMessage(data.message);
          setLoading(false);
          // setInitialValues(null)
          handleClose();
          if (fetchData) fetchData();
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`/attachment/folder`, request)
        .then(({ data }) => {
          showSuccessMessage(data.message);
          setLoading(false);
          handleClose();
          if (fetchData) fetchData();
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const isFieldNotTouched = (initialValues, values) => {
    return Object.values(initialValues).toString() === Object.values(values).toString();
  };
  const handleValuesChange = (data) => {
    setFormValues((prevState) => ({
      ...prevState,
      ...data
    }));
  };

  return (
    initialValues && (
      <Formik initialValues={initialValues} validationSchema={AttachmentSchema} onSubmit={handleSave}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <>
            <CustomDialogHeader
              onClose={() => {
                if (isFieldNotTouched(initialValues, formValues)) handleClose();
                else setShowConfirmDialog(true);
              }}
              title={`${folderId ? 'Edit' : 'New'} Folder`}
              isMinimized={isMinimized}
              onMinimizeMaximize={onMinimizeMaximize}
              showManimizeMaximize={showManimizeMaximize}
            ></CustomDialogHeader>
            <CustomDialogContent>
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <Box padding={1}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        variant="outlined"
                        type="text"
                        label="Folder Name"
                        required={true}
                        disabled={!canEdit}
                        name="name"
                        fullWidth
                        margin="dense"
                        value={values['name']}
                        error={touched['name'] && Boolean(errors['name'])}
                        helperText={touched['name'] && errors['name']}
                        onChange={(e) => {
                          setFieldValue('name', e.target.value.trimStart());
                          handleValuesChange({ name: e.target.value.trimStart() });
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button
                color="primary"
                size="small"
                onClick={() => {
                  if (isFieldNotTouched(initialValues, values)) handleClose();
                  else setShowConfirmDialog(true);
                }}
              >
                Cancel
              </Button>
              {canEdit && (
                <CustomButton type="button" color="primary" disabled={loading} loading={loading} variant="contained" onClick={submitForm}>
                  Save
                </CustomButton>
              )}
            </CustomDialogFooter>
            {showConfirmDialog ? (
              <ConfirmCancelDialog
                close={() => setShowConfirmDialog(false)}
                open={showConfirmDialog}
                onSave={() => {
                  setShowConfirmDialog(false);
                  submitForm();
                }}
                onClose={() => {
                  setShowConfirmDialog(false);
                  handleClose();
                }}
              />
            ) : null}
            {open ? (
              <ImagePreview
                open={open}
                aria-labelledby="customized-dialog-title"
                // heading="image preview"
                heading={imageSource ? imageSource.substring(imageSource.lastIndexOf('/') + 1) : 'image preview'}
                close={() => {
                  setImageSource(null);
                  setOpen(false);
                }}
                image={imageSource}
              />
            ) : null}
          </>
        )}
      </Formik>
    )
  );
}

export default ManageAttachmentFolder;
