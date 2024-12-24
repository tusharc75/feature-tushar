import React, { useState, useEffect, useContext } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { Formik, Form } from 'formik';
import { object, string } from 'yup';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from '../../../components/Helpers/CustomButton';
import TextField from '@mui/material/TextField';
import { Dialog } from '@mui/material';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import FormTypes from 'src/components/Helpers/FormTypes';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import ImagePreview from 'src/components/Activity/Email/ImagePreview';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { isMobile, isTablet } from 'react-device-detect';
import { ATTACHMENT_TYPE, CustomDialogTransition, workOrder } from 'src/constants/helpers';
import AttachmentThumbnail from 'src/components/AttachmentThumbnail';
import { sortBy } from 'lodash';
import { Autocomplete } from '@mui/material';
import DocumentScanner from 'src/components/Activity/Helpers/DocumentScanner';

const AttachmentSchema = object().shape({
  name: string().required('please add attachment name'),
  fileUrl: string().required('please upload attachment')
});

export default function AttachmentDialog({ workOrderId, uniqueServiceId, stepId, serviceName, stepName, handleClose, handleSuccess }) {
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
  const [isEdit, setIsEdit] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [documentScanDialog, setDocumentScanDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsFetching(true);
    var api = `${workOrder.api}/step/attachment?workOrderId=${workOrderId}`;
    if (uniqueServiceId) {
      api = api + `&uniqueServiceId=${uniqueServiceId}`;
    }
    if (stepId) {
      api = api + `&stepId=${stepId}`;
    }
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        if (!data) {
          setInitialValues({ name: stepName, fileUrl: '' });
          setIsFetching(false);
          setIsEdit(false);
        } else {
          setIsEdit(true);
          setCanEdit(data?.canEdit);
          if (data?.file && data?.file?.length) {
            data?.file?.sort((a: any, b: any) => {
              return new Date(b?.date).getTime() - new Date(a?.date).getTime();
            });
            setOtherAttachments(data.file);
          }
          setIsFetching(false);
          setInitialValues({ ...data, fileUrl: data.file && data.file.length && data.file ? data.file[0]?.url : '' });
        }
      })
      .catch((error) => {
        setInitialValues({ name: '', fileUrl: '' });
        setIsFetching(false);
        setIsEdit(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleSave = (values) => {
    if (isEdit && otherAttachments?.length === 0) {
      setLoading(true);
      axiosInstance()
        .put('attachment/deletemany', { ids: [values?._id] })
        .then(({ data }) => {
          setLoading(false);
          handleSuccess();
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      let data = {
        name: values.name,
        attachmentType: values?.attachmentType || '',
        file: otherAttachments,
        serviceName: serviceName,
        workOrderId: workOrderId,
        ...(uniqueServiceId && { uniqueServiceId: uniqueServiceId }),
        ...(stepId && { stepId: stepId })
      };
      setLoading(true);
      axiosInstance()
        .post(`${workOrder.api}/step/attachment`, data)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setLoading(false);
          handleSuccess();
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
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

  return (
    <Dialog
      open
      aria-labelledby="customized-dialog-title"
      maxWidth="md"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
          setFullScreen(false);
        }
      }}
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
    >
      {!isFetching ? (
        initialValues ? (
          <Formik initialValues={initialValues} validationSchema={AttachmentSchema} onSubmit={handleSave}>
            {({ submitForm, touched, errors, setFieldValue, values }) => (
              <>
                <CustomDialogHeader
                  onClose={() => {
                    handleClose();
                  }}
                  title={`${serviceName} ${stepId ? `- ${stepName}` : ''} - Attachment`}
                  isMinimized={!fullScreen}
                  onMinimizeMaximize={() => {
                    setFullScreen((prevState) => !prevState);
                  }}
                  showManimizeMaximize={true}
                ></CustomDialogHeader>
                <CustomDialogContent>
                  <Form autoComplete="off" autoCorrect="off" noValidate>
                    <Box padding={1}>
                      <div className="grid max-w-[950px] grid-cols-1 gap-2 min-[600px]:grid-cols-2">
                        <TextField
                          variant="outlined"
                          type="text"
                          label={'Name'}
                          required={true}
                          disabled={!canEdit}
                          name="name"
                          fullWidth
                          margin="none"
                          size="small"
                          value={values['name']}
                          error={touched['name'] && Boolean(errors['name'])}
                          helperText={touched['name'] && errors['name']}
                          onChange={(e) => {
                            setFieldValue('name', e.target.value.trimStart());
                          }}
                        />
                        <Autocomplete
                          id="attachmentType"
                          size="small"
                          disabled={!canEdit}
                          options={Object.values(ATTACHMENT_TYPE)}
                          renderInput={(params) => <TextField {...params} size="small" variant="outlined" label="Attachment Type" margin="none" />}
                          getOptionLabel={(option) => option}
                          getOptionSelected={(option: any, value: any) => option === value}
                          onChange={(e, val) => {
                            setFieldValue('attachmentType', val);
                          }}
                          value={values['attachmentType']}
                        />
                      </div>
                      <div className="my-2 flex flex-wrap gap-2">
                        <div className="-ml-[0]">
                          <FormTypes
                            label=""
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
                      <AttachmentThumbnail attachments={otherAttachments} handleDeleteAttachment={handleDeleteAttachment} canEdit={canEdit} />
                    </Box>
                  </Form>
                </CustomDialogContent>
                <CustomDialogFooter>
                  <Button
                    color="primary"
                    size="small"
                    onClick={() => {
                      handleClose();
                    }}
                  >
                    Cancel
                  </Button>
                  {canEdit && (
                    <CustomButton
                      type="button"
                      color="primary"
                      disabled={
                        loading || isEdit ? uploadingImageOrFileProgress > 0 : uploadingImageOrFileProgress > 0 || otherAttachments.length === 0
                      }
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
      )}
    </Dialog>
  );
}
