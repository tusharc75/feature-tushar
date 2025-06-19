import { useState, useEffect, useContext } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import { Formik, Form } from 'formik';
import { object, string } from 'yup';
import PropTypes from 'prop-types';
import CustomDialogHeader from '../../CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../CustomDialog/CustomDialogFooter';
import FormTypes from '../../Helpers/FormTypes';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import TextField from '@mui/material/TextField';
import ImagePreview from '../Email/ImagePreview';
import ConfirmationDialog from '../../Helpers/ConfirmationDialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import AttachmentThumbnail from 'src/components/AttachmentThumbnail';
import { isArray, isEqual, isString } from 'lodash';
import { ATTACHMENT_TYPE, checkSuperAdminAccess, displayDate, getObjKeys, getObjKeysWithValues, sidebarResource, yupSchema } from 'src/constants/helpers';
import Autocomplete from '@mui/material/Autocomplete';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { useData } from 'src/StateProvider/Provider';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { fetch_resource_fields } from 'src/components/ResourceFields';
import { updateDisable } from 'src/constants/messageHelpers';
import DeleteRequest from 'src/components/Activity/Attachments/DeleteRequest';
import DigitalSignature from 'src/components/DigitalSignature';

const AttachmentSchema = object().shape({
  name: string().required('Attachment Name is required'),
  attachmentType: string().nullable()
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
  isMinimized,
  onMinimizeMaximize,
  showManimizeMaximize,
  parentFolder = null,
  type = 'file',
  attachmentType = null,
  customhandleAdd = null
}) {
  const toastConfig = useContext(CustomToastContext);

  const [initialData, setInitialData] = useState({ fields: [], values: null });
  const [allAttachments, setAllAttachments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [imageSource, setImageSource] = useState(null);
  const [open, setOpen] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [attachmentToDelete, setAttachemnetToDelete] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [documentScanDialog, setDocumentScanDialog] = useState(false);

  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [attachmentData, setAttachmentData] = useState(null);

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchAttachmentData();
  }, []);

  const fetchAttachmentData = async () => {
    try {
      setIsFetching(true);
      if (type === 'file') {
        let { fieldsDataAll, fieldsDataForCreate, fieldsDataForUpdate } = await fetch_resource_fields(sidebarResource.attachment);
        if (attachmentId) {
          const attachmentResponce: any = await axiosInstance().get(`/attachment/${attachmentId}`);
          const data = attachmentResponce?.data?.data;
          if (data.file && data.file.length) {
            data?.file?.sort((a: any, b: any) => {
              return new Date(b?.date).getTime() - new Date(a?.date).getTime();
            });
            setAllAttachments(data.file);
          }
          setIsFetching(false);
          let initialValue: any = { name: data?.name, attachmentType: data?.attachmentType };
          if (fieldsDataForUpdate?.length) {
            initialValue = { ...initialValue, ...getObjKeysWithValues(data, fieldsDataAll) };
          }
          setAllowedToEdit(
            isClone
              ? true : checkSuperAdminAccess(user, sidebarResource.attachment) ?
                data?.canEdit : data?.createdBy?.user?._id === user?.user?._id && data?.canEdit
          );
          if (!isClone) {
            setAttachmentData(data);
          }
          setInitialData({
            fields: fieldsDataForUpdate,
            values: initialValue
          });
        } else {
          let initialValue: any = { name: '', attachmentType: '' };
          if (fieldsDataForCreate?.length) {
            initialValue = { ...initialValue, ...getObjKeys('', fieldsDataForCreate) };
          }
          if (attachmentType) {
            initialValue.attachmentType = attachmentType;
          }
          setInitialData({
            fields: fieldsDataForCreate,
            values: initialValue
          });
          setAllowedToEdit(true);
          setIsFetching(false);
        }
      } else if (type === 'folder') {
        if (attachmentId) {
          axiosInstance()
            .get(`/attachment/folder/${attachmentId}`)
            .then(({ data: { data } }) => {
              setInitialData({
                fields: [],
                values: data
              });
              parentFolder = data?.parentFolder;
              setAllowedToEdit(
                isClone ? true
                  : checkSuperAdminAccess(user, sidebarResource.attachment)
                    ? data?.canEdit
                    : data?.createdBy?.user?._id === user?.user?._id && data?.canEdit
              );
              setIsFetching(false);
            })
            .catch((error) => {
              setIsFetching(false);
              toastConfig.setToastConfig(error);
            });
        } else {
          setInitialData({
            fields: [],
            values: { name: '' }
          });
          setAllowedToEdit(true);
          setIsFetching(false);
        }
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleSave = (values) => {
    let request: any = {};
    delete values?.fileUrl;
    if (type === 'file') {
      request = {
        ...values,
        file: allAttachments,
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
      if (customhandleAdd) {
        customhandleAdd(request, setLoading);
      } else {
        if (attachmentId && !isClone) {
          axiosInstance()
            .put(`/attachment/${attachmentId}`, { _id: attachmentId, ...request })
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

  const onUploadFile = (files) => {
    if (isArray(files)) {
      setAllAttachments((prevState) => [
        ...files?.map((e) => {
          return {
            name: e?.fileName?.split('_OMS_TS_')?.pop() || e?.fileName,
            url: e?.fileName,
            date: new Date()
          };
        }),
        ...prevState
      ]);
    } else if (isString(files)) {
      setAllAttachments((prevState) => [{ name: files?.split('_OMS_TS_')?.pop() || files, url: files, date: new Date() }, ...prevState]);
    }
  };

  const handleDeleteAttachment = (file) => {
    setAllAttachments(allAttachments.filter((current) => current?.url !== file.url));
    setAttachemnetToDelete('');
    setShowConfirmationDialog(false);
  };

  function validate(values) {
    const errors = {};
    if (!values?.name) {
      errors['name'] = 'Name is required';
    }
    return errors;
  }

  return !isFetching ? (
    initialData?.values ? (
      <Formik
        initialValues={initialData?.values}
        validationSchema={initialData?.fields?.length ? yupSchema(initialData.fields) : type === 'file' ? AttachmentSchema : FolderSchema}
        validate={validate}
        onSubmit={handleSave}
      >
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <>
            <CustomDialogHeader
              onClose={() => {
                if (isEqual(initialData?.values, values)) handleClose();
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
                    <Grid size={{ xs: 12, md: type === 'file' ? 6 : 12 }}>
                      <TextField
                        variant="outlined"
                        type="text"
                        label={type === 'file' ? 'Name' : 'Folder Name'}
                        required={true}
                        disabled={!allowedToEdit}
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
                    {type === 'file' &&
                      (initialData?.fields && initialData?.fields?.length > 0 ? (
                        initialData?.fields?.map((field) => (
                          <Grid size={{ xs: 12, md: 6 }}>
                            <FormTypes
                              {...field}
                              size="small"
                              fields={initialData.fields}
                              fieldData={field}
                              values={values}
                              errors={errors}
                              disabled={!allowedToEdit}
                              touched={touched}
                              label={field.fieldLabel}
                              name={field.fieldName}
                              type={field.type}
                              options={field.option}
                              setFieldValue={(name, value) => {
                                setFieldValue(name, value);
                              }}
                              required={field.required}
                              fullWidth
                            />
                          </Grid>
                        ))
                      ) : (
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Autocomplete
                            id="attachmentType"
                            size="small"
                            options={Object.values(ATTACHMENT_TYPE)}
                            renderInput={(params) => <TextField {...params} size="small" variant="outlined" label="Attachment Type" margin="none" />}
                            disabled={attachmentType ? true : !allowedToEdit}
                            getOptionLabel={(option) => option || ''}
                            isOptionEqualToValue={(option: any, value: any) => option === value}
                            onChange={(e, val) => {
                              setFieldValue('attachmentType', val);
                            }}
                            value={values['attachmentType']}
                          />
                        </Grid>
                      ))}
                    {type === 'file' && (
                      <Grid container size={{ xs: 12, md: 12, sm: 12 }}>
                        <Grid size={{ xs: 12, md: 12, sm: 12 }}>
                          <FormTypes
                            label=""
                            name="fileUrl"
                            required={true}
                            type="multiFileUploadNew"
                            values={values}
                            disabled={!allowedToEdit}
                            errors={errors}
                            touched={touched}
                            size="small"
                            setFieldValue={(fname, file, isScanning = false) => {
                              if (isScanning) {
                                setFieldValue(fname, file);
                              }
                              onUploadFile(file);
                            }}
                            doNotShowUploadedFile={true}
                            fileUploadProgress={uploadingImageOrFileProgress}
                            imageOrFileUploadCompletePercentage={(completePercentage) => {
                              setUploadingImageOrFileProgress(completePercentage);
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <AttachmentThumbnail
                            attachments={allAttachments}
                            handleDeleteAttachment={handleDeleteAttachment}
                            allowedToEdit={allowedToEdit}
                          />
                        </Grid>
                        {attachmentData && (
                          <>
                            <Grid size={{ xs: 6 }}>
                              <div className="flex flex-col p-2">
                                <p>
                                  Uploaded By: <span>{attachmentData?.createdBy?.user?.concatedName}</span>
                                </p>
                                <p>
                                  Uploaded Date: <span>{displayDate(attachmentData?.createdBy?.date)}</span>
                                </p>
                              </div>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <DeleteRequest
                                file={attachmentData}
                                handleSucess={() => {
                                  fetchData();
                                  handleClose();
                                }}
                                showWithoutPopOver={true}
                              />
                            </Grid>
                          </>
                        )}
                        {/* <Grid size={{ xs: 12 }}>
                          <DigitalSignature
                            attachmentId={attachmentId}
                            type={type}
                            allAttachments={allAttachments}
                          />
                        </Grid> */}
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <ThemeButton
                buttonType="transparent"
                onClick={() => {
                  if (isEqual(initialData?.values, values)) handleClose();
                  else setShowConfirmDialog(true);
                }}
              >
                Cancel
              </ThemeButton>
              <HtmlTooltip title={allowedToEdit ? '' : updateDisable}>
                <ThemeButton
                  buttonType="theme"
                  disabled={!allowedToEdit ? true : loading || ((uploadingImageOrFileProgress > 0 || allAttachments.length === 0) && type === 'file')}
                  isLoading={loading}
                  onClick={submitForm}
                >
                  Save
                </ThemeButton>
              </HtmlTooltip>
            </CustomDialogFooter>
            {showConfirmDialog ? (
              <ConfirmCancelDialog
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
