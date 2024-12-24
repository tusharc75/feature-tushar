import React, { useState, useEffect, useContext } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
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
import TextField from '@mui/material/TextField';

import ImagePreview from '../Email/ImagePreview';
import ConfirmationDialog from '../../Helpers/ConfirmationDialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import AttachmentThumbnail from 'src/components/AttachmentThumbnail';
import { isEqual } from 'lodash';
import DocumentScanner from '../Helpers/DocumentScanner';
import { ATTACHMENT_TYPE } from 'src/constants/helpers';
import Autocomplete from '@mui/material/Autocomplete';

const AttachmentSchema = object().shape({
  name: string().required('Attachment Name is required'),
  attachmentType: string().nullable(),
  fileUrl: string().required('please upload attachment')
});

const FolderSchema = object().shape({
  name: string().required('Folder Name is required')
});

export default function ManageAttachment({
  relatedTo,
  attachmentId,
  isClone = false,
  handleClose,
  fetchData = null,
  attachmentData = null,
  isMinimized,
  onMinimizeMaximize,
  showManimizeMaximize,
  parentFolder = null,
  type = 'file',
  defaultAttachmentType = ''
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
  const [isFetching, setIsFetching] = useState(false);
  const [documentScanDialog, setDocumentScanDialog] = useState(false);

  useEffect(() => {
    fetchAttachmentDetail();
  }, []);

  const fetchAttachmentDetail = async () => {
    setIsFetching(true);
    if (attachmentId && type === 'file') {
      axiosInstance()
        .get(`/attachment/${attachmentId}`)
        .then(({ data: { data } }) => {
          setCanEdit(data?.canEdit);
          if (data.file && data.file.length) {
            data?.file?.sort((a: any, b: any) => {
              return new Date(b?.date).getTime() - new Date(a?.date).getTime();
            });
            setOtherAttachments(data.file);
          }
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
          parentFolder = data?.parentFolder;
          setIsFetching(false);
        })
        .catch((error) => {
          setIsFetching(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      if (type === 'file') {
        setInitialValues({ name: '', fileUrl: '', attachmentType: defaultAttachmentType });
      } else {
        setInitialValues({ name: '' });
      }
      setIsFetching(false);
    }
  };

  const handleSave = (values) => {
    let request: any = {};
    if (type === 'file') {
      request = {
        name: values.name,
        file: otherAttachments,
        relatedTo: relatedTo,
        attachmentType: values?.attachmentType || ''
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
      if (attachmentId && !isClone) {
        axiosInstance()
          .put(`/attachment/${attachmentId}`, request)
          .then(({ data }) => {
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: data.message
            });
            setLoading(false);
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
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: data.message
            });
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
      if (attachmentId && !isClone) {
        axiosInstance()
          .put(`/attachment/folder/${attachmentId}`, request)
          .then(({ data }) => {
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: data.message
            });
            setLoading(false);
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
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: data.message
            });
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
    setOtherAttachments((prevState) => [{ name: file.split('_OMS_TS_')?.pop() || file, url: file, date: new Date() }, ...prevState]);
  };

  const handleDeleteAttachment = (file) => {
    setOtherAttachments(otherAttachments.filter((current) => current?.url !== file.url));
    setAttachemnetToDelete('');
    setShowConfirmationDialog(false);
  };

  return !isFetching ? (
    initialValues ? (
      <Formik initialValues={initialValues} validationSchema={type === 'file' ? AttachmentSchema : FolderSchema} onSubmit={handleSave}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <>
            <CustomDialogHeader
              onClose={() => {
                if (isEqual(initialValues, values)) handleClose();
                else setShowConfirmDialog(true);
              }}
              title={`${isClone ? 'Clone' : attachmentId ? 'Edit' : 'New'} ${type === 'file' ? 'Attachment' : 'Folder'}`}
              isMinimized={isMinimized}
              onMinimizeMaximize={onMinimizeMaximize}
              showManimizeMaximize={showManimizeMaximize}
            ></CustomDialogHeader>
            <CustomDialogContent>
              <Form autoComplete="off" autoCorrect="off" noValidate>
                <Box padding={1}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={type === 'file' ? 6 : 12}>
                      <TextField
                        variant="outlined"
                        type="text"
                        label={type === 'file' ? 'Name' : 'Folder Name'}
                        required={true}
                        disabled={!canEdit && !isClone}
                        name="name"
                        fullWidth
                        margin="none"
                        size={'small'}
                        value={values['name']}
                        error={touched['name'] && Boolean(errors['name'])}
                        helperText={touched['name'] && errors['name']}
                        onChange={(e) => {
                          setFieldValue('name', e.target.value.trimStart());
                        }}
                      />
                    </Grid>
                    {type === 'file' && (
                      <Grid item xs={12} md={6}>
                        <Autocomplete
                          id="attachmentType"
                          size="small"
                          options={Object.values(ATTACHMENT_TYPE)}
                          renderInput={(params) => <TextField {...params} size="small" variant="outlined" label="Attachment Type" margin="none" />}
                          disabled={defaultAttachmentType === '' ? !canEdit : true}
                          getOptionLabel={(option) => option}
                          isOptionEqualToValue={(option: any, value: any) => option === value}
                          onChange={(e, val) => {
                            setFieldValue('attachmentType', val);
                          }}
                          value={values['attachmentType']}
                        />
                      </Grid>
                    )}
                    {type === 'file' && (
                      <Grid container item xs={12}>
                        <Grid item xs={12}>
                          <div style={{ width: '100%' }}>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="ml-0">
                                <FormTypes
                                  label=""
                                  name="fileUrl"
                                  required={true}
                                  type="fileUpload"
                                  values={values}
                                  canEdit={canEdit || isClone}
                                  errors={errors}
                                  touched={touched}
                                  size="small"
                                  setFieldValue={(fname, file) => {
                                    setFieldValue('fileUrl', file);
                                    onUploadFile(file);
                                  }}
                                  doNotShowUploadedFile={true}
                                  imageOrFileUploadCompletePercentage={(completePercentage) => {
                                    setUploadingImageOrFileProgress(completePercentage);
                                  }}
                                />
                              </div>
                              <CustomButton variant="contained" color="primary" disabled={!canEdit} onClick={() => setDocumentScanDialog(true)}>
                                Scan Document
                              </CustomButton>
                            </div>
                          </div>
                        </Grid>
                        <Grid item xs={12}>
                          <AttachmentThumbnail
                            attachments={otherAttachments}
                            handleDeleteAttachment={handleDeleteAttachment}
                            canEdit={canEdit || isClone}
                          />
                        </Grid>
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
                  if (isEqual(initialValues, values)) handleClose();
                  else setShowConfirmDialog(true);
                }}
              >
                Cancel
              </Button>
              {(canEdit || isClone) && (
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
            {documentScanDialog && (
              <DocumentScanner
                open={setDocumentScanDialog}
                onClose={() => setDocumentScanDialog(false)}
                setFieldValue={setFieldValue}
                onUploadFile={onUploadFile}
              />
            )}
          </>
        )}
      </Formik>
    ) : null
  ) : (
    <div>
      <Box p={2} height={500}>
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
