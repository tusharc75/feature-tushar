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

import ImagePreview from '../Email/ImagePreview';
import ConfirmationDialog from '../../Helpers/ConfirmationDialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import AttachmentThumbnail from 'src/components/AttachmentThumbnail';

const AttachmentSchema = object().shape({
  name: string().required('please add attachment name'),
  fileUrl: string().required('please upload attachment')
});

const FolderSchema = object().shape({
  name: string().required('please add folder name')
});

export default function ManageAttachment({
  relatedTo,
  attachmentId,
  handleClose,
  fetchData = null,
  attachmentData = null,
  isMinimized,
  onMinimizeMaximize,
  showManimizeMaximize,
  parentFolder = null,
  type = 'file'
}) {
  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(false);

  const toastConfig = useContext(CustomToastContext);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [imageSource, setImageSource] = useState(null);
  const [open, setOpen] = useState(false);
  const [otherAttachments, setOtherAttachments] = useState([]);
  const [canEdit, setCanEdit] = useState(true);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [attachmentToDelete, setAttachemnetToDelete] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    fetchAttachmentDetail();
  }, []);

  const checkImageUrl = (url) => {
    let extension = url.substring(url.lastIndexOf('.')).toLowerCase();
    let imageExtensions = ['.tif', 'tiff', '.bmp', '.jpg', 'jpeg', '.gif', '.png', '.eps', '.raw', '.cr2', '.nef', '.orf', '.sr2'];
    return imageExtensions.indexOf(extension) >= 0;
  };

  const fetchAttachmentDetail = async () => {
    setIsFetching(true);
    if (attachmentId && type === 'file') {
      axiosInstance()
        .get(`/attachment/${attachmentId}`)
        .then(({ data: { data } }) => {
          setCanEdit(data?.canEdit);
          if (data.file && data.file.length) {
            let imageAttachments = [];
            let nonImageAttachments = [];
            data.file.map((file) => {
              let isImageUrl = checkImageUrl(file.url);
              if (!isImageUrl) {
                nonImageAttachments.push({ name: file.name, url: file.url });
              } else {
                imageAttachments.push({ name: file.name, url: file.url });
              }
            });
            setOtherAttachments([...nonImageAttachments, ...imageAttachments]);
          }
          setFormValues(data);
          setIsFetching(false);
          setInitialValues({ ...data, fileUrl: data.file && data.file.length && data.file ? data.file[0]?.url : '' });
        })
        .catch((error) => {
          setIsFetching(false);
          toastConfig.setToastConfig(error);
        });
    } else if (attachmentId && type === 'folder') {
      axiosInstance()
        .get(`/attachment/folder/${attachmentId}`)
        .then(({ data: { data } }) => {
          setCanEdit(data?.canEdit);
          setInitialValues(data);
          setFormValues(data);
          parentFolder = data?.parentFolder;
          setIsFetching(false);
        })
        .catch((error) => {
          setIsFetching(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      if (type === 'file') {
        setInitialValues({ name: '', fileUrl: '' });
        setFormValues({ name: '', fileUrl: '' });
      } else {
        setInitialValues({ name: '' });
        setFormValues({ name: '' });
      }
      setIsFetching(false);
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
    let request: any = {};
    if (type === 'file') {
      request = {
        name: values.name,
        file: otherAttachments,
        relatedTo: relatedTo
      };
    } else {
      request = {
        name: values.name,
        relatedTo: relatedTo
      };
    }
    if (parentFolder) {
      request.parentFolder = parentFolder;
    }
    setLoading(true);
    if (type === 'file') {
      if (attachmentId) {
        axiosInstance()
          .put(`/attachment/${attachmentId}`, request)
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
          .post(`/attachment`, request)
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
    } else {
      if (attachmentId) {
        axiosInstance()
          .put(`/attachment/folder/${attachmentId}`, request)
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
    }
  };

  const onUploadFile = (file) => {
    setOtherAttachments((prevState) => [...prevState, { name: file.split('_')[3] || file, url: file }]);
  };

  const handleDeleteAttachment = (file) => {
    setOtherAttachments(otherAttachments.filter((current) => current?.url !== file.url));
    setAttachemnetToDelete('');
    setShowConfirmationDialog(false);
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

  return !isFetching ? (
    initialValues ? (
      <Formik initialValues={initialValues} validationSchema={type === 'file' ? AttachmentSchema : FolderSchema} onSubmit={handleSave}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <>
            <CustomDialogHeader
              onClose={() => {
                if (isFieldNotTouched(initialValues, formValues)) handleClose();
                else setShowConfirmDialog(true);
              }}
              title={`${attachmentId ? 'Edit' : 'New'} ${type === 'file' ? 'Attachment' : 'Folder'}`}
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
                        label={type === 'file' ? 'Name' : 'Folder Name'}
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
                    {type === 'file' && (
                      <Grid container item xs={12}>
                        <Grid item xs={10} sm={11} md={11}>
                          <FormTypes
                            label="File"
                            name="fileUrl"
                            required={true}
                            type="fileUpload"
                            values={values}
                            canEdit={canEdit}
                            errors={errors}
                            touched={touched}
                            size="small"
                            setFieldValue={(fname, file) => {
                              setFieldValue('fileUrl', file);
                              handleValuesChange({ fileUrl: file });
                              onUploadFile(file);
                            }}
                            doNotShowUploadedFile={true}
                            imageOrFileUploadCompletePercentage={(completePercentage) => {
                              setUploadingImageOrFileProgress(completePercentage);
                            }}
                          />
                        </Grid>
                        <AttachmentThumbnail attachments={otherAttachments} handleDeleteAttachment={handleDeleteAttachment} canEdit={canEdit} />
                      </Grid>
                    )}
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
                <CustomButton
                  type="button"
                  color="primary"
                  disabled={loading || ((uploadingImageOrFileProgress > 0 || otherAttachments.length === 0) && type === 'file')}
                  loading={loading}
                  variant="contained"
                  onClick={submitForm}
                >
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
                heading={imageSource ? imageSource.substring(imageSource.lastIndexOf('/') + 1) : 'image preview'}
                close={() => {
                  setImageSource(null);
                  setOpen(false);
                }}
                image={imageSource}
              />
            ) : null}
            {showConfirmationDialog && (
              <ConfirmationDialog
                open={showConfirmationDialog}
                message="Are you sure you want to delete this attachment?"
                onClose={() => {
                  setShowConfirmationDialog(false);
                }}
                onOk={() => handleDeleteAttachment(attachmentToDelete)}
              />
            )}
          </>
        )}
      </Formik>
    ) : null
  ) : (
    <div>
      <Box p={2} height={500} bgcolor="white">
        <CommonSkeleton lenArray={[...Array(10).keys()]} />
      </Box>
    </div>
  );
}

ManageAttachment.propTypes = {
  relatedTo: PropTypes.any,
  attachmentId: PropTypes.any,
  handleClose: PropTypes.any
};
