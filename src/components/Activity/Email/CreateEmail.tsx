import { useAccount, useMsal } from '@azure/msal-react';
import { CircularProgress, FormControlLabel, Switch } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/styles';
import Autocomplete from '@mui/material/Autocomplete';
import axios, { CancelTokenSource } from 'axios';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';
import { Fragment, useContext, useEffect, useState } from 'react';
import RichTextEditor from 'react-rte';
import AttachmentThumbnail from 'src/components/AttachmentThumbnail';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { array, object, string } from 'yup';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import TinyMce from '../../../components/TinyMCE';
import { dateTimeFormat, imageUploadMaxSize, sidebarResource, validations } from '../../../constants/helpers';
import getAzureAcessToken from '../../Azure/getAzureAccessToken';
import { RelatedToDispay } from '../Helpers/RelatedToDispay';
import ImageAttachments from './ImageAttachments';
import ImagePreview from './ImagePreview';
import { StepDefination, useGetWalkmeInstance } from 'src/components/CustomIntro';

// const emailSchemaHelper = array()
//   .transform(function (value, originalValue) {
//     if (this.isType(value) && value !== null) {
//       return value;
//     }
//     return originalValue ? originalValue.split(/[\s,]+/) : [];
//   })
//   .of(string().email(({ value }) => `${value} is not a valid email`));

const EmailSchema = object().shape({
  subject: string().required('please enter subject'),
  to: array()
    .min(1, 'Please enter a valid email')
    .transform(function (value, originalValue) {
      if (this.isType(value) && value !== null) {
        return value;
      }
      return originalValue ? originalValue.split(/[\s,]+/) : [];
    })
    .of(string().email(({ value }) => `${value} is not a valid email`))
  // to: emailSchemaHelper.min(1),
  // cc: emailSchemaHelper,   //  Commented by punit
});

const useStyles = makeStyles(() => ({
  textEditor: {
    fontFamily: 'inherit',
    border: 'none'
  },
  box: {
    border: 1
  },
  root: {
    width: '80%'
  }
}));

export const CreateEmail = ({
  relatedTo,
  emailId,
  handleClose,
  isQuoteBuilder = false,
  options = [],
  fetchData = null,
  cc = [],
  id = null,
  versionNumber = null,
  qouteBuilderAttachments = [],
  subject = '',
  showESign = false,
  generatingFile = false,
  fromQuote = false,
  isMinimized,
  onMinimizeMaximize,
  showManimizeMaximize,
  referenceType = '',
  isAttachmentLoading = false,
  content = null
}) => {
  const walkmeInstance = useGetWalkmeInstance();
  const {
    state: { user }
  }: any = useData();

  const isESign = user?.user?.brandQuoteDigitalSignature;
  const toastConfig = useContext(CustomToastContext);
  const { instance, accounts } = useMsal();
  const azureAccount = useAccount(accounts[0] || {});
  const [initialValues, setInitialValues] = useState(null);
  const [, setUploading] = useState(false);
  const [fileImageAttachments, setFileImageAttachments] = useState([]);
  const [imageAttachments, setImageAttachments] = useState([]);
  const [otherAttachments, setOtherAttachments] = useState([]);
  const [open, setOpen] = useState(false);
  const [imageSource, setImageSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [toogle, setToogle] = useState({
    'e-Sign': isESign
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [quoteBuilderOtherAttachments, setQuoteBuilderOtherAttachments] = useState([]);
  const [stateQuoteBuilderAttachments, setStateQuoteBuilderAttachments] = useState([]);
  const [emailUsersOptions, setEmailUsersOptions] = useState([]);

  useEffect(() => {
    options.length ? setEmailUsersOptions(options) : fetchUsersEmails();
  }, []);

  useEffect(() => {
    if (fromQuote) {
      if (qouteBuilderAttachments.length > 0) {
        setStateQuoteBuilderAttachments(qouteBuilderAttachments);
      }
    } else {
      if (qouteBuilderAttachments && qouteBuilderAttachments.length > 0) {
        if (stateQuoteBuilderAttachments.length == 0) {
          setStateQuoteBuilderAttachments(qouteBuilderAttachments);
        }
      }
    }
  }, [qouteBuilderAttachments?.length]);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchEmailDetail(cancelTokenSource);
    return () => cancelTokenSource.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cratefieldSteps();
  }, []);

  const cratefieldSteps = () => {
    const data: StepDefination[] = [
      { target: '#send-email-dialog-subject-input', title: 'Write a subject', nextOnValueChange: true },
      { target: '#send-email-dialog-to-input', title: 'Select recipients', nextOnValueChange: true, fieldType: 'multiSelect' },
      {
        target: '#editor_ifr',
        title: 'Write your message',
        content: 'Press Ctrl+Enter to resume ride',
        nextOnFocusOut: true
      }
    ];
    if (walkmeInstance) {
      walkmeInstance.instance.insertAtCurrentIndex(data);
      walkmeInstance.handleNext();
    }
  };

  const checkImageUrl = (url) => {
    let extension = url.substring(url.lastIndexOf('.')).toLowerCase();
    let imageExtensions = ['.tif', '.tiff', '.bmp', '.jpg', '.jpeg', '.gif', '.png', '.eps', '.raw', '.cr2', '.nef', '.orf', '.sr2'];
    return imageExtensions.indexOf(extension) >= 0;
  };

  const fetchUsersEmails = async () => {
    axiosInstance()
      .get('/user')
      .then(({ data: { data, count } }) => {
        data = data.reduce((emails, obj) => {
          if (obj?.email && emailUsersOptions.indexOf(obj.email) < 0) emails.push(obj.email);
          return emails;
        }, []);
        setEmailUsersOptions((prevState) => {
          return [...prevState, ...data];
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchEmailDetail = async (cancelTokenSource?: CancelTokenSource) => {
    if (emailId) {
      setLoading(true);
      axiosInstance()
        .get(`/email/${emailId}`, { cancelToken: cancelTokenSource?.token })
        .then(({ data: { data } }) => {
          if (data.attachments && data.attachments.length) {
            let otherAttachments = [];
            let filteredAttachments = data.attachments.filter((url) => {
              let isImageUrl = checkImageUrl(url);
              if (!isImageUrl) {
                data.file = url;
                otherAttachments.push(url);
              }
              return isImageUrl;
            });
            setImageAttachments(filteredAttachments);
            setOtherAttachments([...otherAttachments]);
          }
          setLoading(false);
          setInitialValues(data);
        })
        .catch((err) => {
          setLoading(false);
        });
    } else {
      let initialData = {
        subject: subject ?? '',
        file: '',
        content: content ?? RichTextEditor.createEmptyValue(),
        to: isQuoteBuilder ? [...options] : [],
        cc: isQuoteBuilder ? [...cc] : []
      };
      setInitialValues(initialData);
    }
  };

  const handleSave = async (values) => {
    try {
      let payload = {
        relatedTo: relatedTo,
        message: values.content.toString('html'),
        to: values.to,
        cc: values.cc,
        subject: values.subject,
        attachment:
          otherAttachments.length || fileImageAttachments.length
            ? [...imageAttachments, ...otherAttachments, ...fileImageAttachments]
            : [...imageAttachments]
      };
      if (azureAccount && azureAccount?.username) {
        payload['graphToken'] = await getAzureAcessToken(instance);
        payload['mailbox'] = azureAccount.username;
      }

      if (emailId) {
        axiosInstance()
          .put(`/email/${emailId}`, values)
          .then(({ data }) => {
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: data.message
            });
            handleClose();
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
          });
      } else {
        setSending(true);
        axiosInstance()
          .post('/email', payload)
          .then(({ data }) => {
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: data.message
            });
            setInitialValues(null);
            setSending(false);
            if (fetchData) fetchData();
            handleClose();
          })
          .catch((err) => {
            setSending(false);
            toastConfig.setToastConfig(err);
          });
      }
    } catch (e) { }
  };

  const handleSendEmail = async (values) => {
    setSending(true);
    relatedTo = [
      {
        type: referenceType,
        referenceId: id,
        access: true
      }
    ];
    const body = {
      email: values.to,
      versionNumber: versionNumber,
      emailBody: values.content.toString('html'),
      emailSubject: values.subject,
      cc: values.cc,
      id: id,
      relatedTo: relatedTo,
      attachments: [...stateQuoteBuilderAttachments, ...quoteBuilderOtherAttachments],
      eSign: toogle['e-Sign']
    };
    if (azureAccount && azureAccount?.username) {
      body['graphToken'] = await getAzureAcessToken(instance);
      body['mailbox'] = azureAccount.username;
    }
    const api = referenceType === sidebarResource.quoteBuilder ? `/quote-builder/sendQuoteEmail` : '/send-email';
    axiosInstance()
      .post(api, body)
      .then(() => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Email Sent Successfully'
        });
        setSending(false);
        if (fetchData) fetchData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setSending(false);
      });
  };

  const onKeyPress = (event) => {
    if (event.which === 13) {
      event.preventDefault();
    }
  };

  const handleUploadImage = (event) => {
    if (event.target.files && event.target.files.length) {
      const file = event.target.files[0];
      if (file.size > imageUploadMaxSize.size) {
        toastConfig.setToastConfig({
          open: true,
          type: 'error',
          message: `Image must be less than ${imageUploadMaxSize.text} size`
        });
      } else {
        getImageUrl(file);
      }
    }
  };

  const getImageUrl = (file) => {
    let formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    axiosInstance()
      .post('/user/upload-public', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      .then(({ data }) => {
        setImageAttachments((prevState) => [...prevState, data.fileUrl]);
        setUploading(false);
      })
      .catch((err) => {
        setUploading(false);
        toastConfig.setToastConfig(err);
      });
  };
  const handleDeleteAttachment = (url) => {
    setOtherAttachments(otherAttachments.filter((currentUrl) => currentUrl !== url));
  };

  const handleDeleteImageAttachment = (url) => {
    setImageAttachments(imageAttachments.filter((currentUrl) => currentUrl !== url));
  };
  const handleDeleteFileImageAttachment = (url) => {
    setFileImageAttachments(fileImageAttachments.filter((currentUrl) => currentUrl !== url));
  };

  const handleDeleteQuoteBuilderAttachment = (data) => {
    let file1 = `${data?.name}-${data?.contentType}`;
    let result = stateQuoteBuilderAttachments.filter((o) => {
      let file2 = `${o?.name}-${o?.contentType}`;
      return file1 !== file2;
    });
    setStateQuoteBuilderAttachments(result);
  };

  const handleDeleteQuoteBuilderOtherAttachment = (name) => {
    setQuoteBuilderOtherAttachments(quoteBuilderOtherAttachments.filter((o) => o?.name !== (name?.name || name)));
  };

  const renderQuotesOtherFileThumbnails = (
    <>
      {quoteBuilderOtherAttachments && quoteBuilderOtherAttachments.length > 0 ? (
        <>
          <AttachmentThumbnail
            attachments={quoteBuilderOtherAttachments}
            handleDeleteAttachment={handleDeleteQuoteBuilderOtherAttachment}
            canEdit={true}
          />
        </>
      ) : null}
    </>
  );

  const renderQuotesFileThumbnails = isAttachmentLoading ? (
    <Typography>Loading...</Typography>
  ) : stateQuoteBuilderAttachments && stateQuoteBuilderAttachments.length > 0 ? (
    <AttachmentThumbnail attachments={stateQuoteBuilderAttachments} handleDeleteAttachment={handleDeleteQuoteBuilderAttachment} canEdit={true} />
  ) : null;

  const renderFileThumbnails = <AttachmentThumbnail attachments={otherAttachments} handleDeleteAttachment={handleDeleteAttachment} canEdit={true} />;

  const onUploadFile = (file) => {
    if (checkImageUrl(file)) {
      setFileImageAttachments((prevState) => [...prevState, file]);
    } else {
      setOtherAttachments((prevState) => [...prevState, file]);
    }
  };

  const handleChangePermissions = (e) => {
    setToogle((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.checked
    }));
  };

  const handleQuoteUpload = (attachment) => {
    setQuoteBuilderOtherAttachments((prevState) => [...prevState, attachment]);
  };

  return (
    <>
      {' '}
      {initialValues && !loading ? (
        <Formik
          initialValues={initialValues}
          validationSchema={EmailSchema}
          onSubmit={isQuoteBuilder ? handleSendEmail : handleSave}
          onKeyPress={onKeyPress}
        >
          {({ submitForm, touched, errors, setFieldValue, values }) => (
            <>
              <CustomDialogHeader
                title={`${emailId ? 'View' : 'New'} Email`}
                onClose={() => {
                  if (isEqual(initialValues, values)) handleClose();
                  else setShowConfirmDialog(true);
                }}
                isMinimized={isMinimized}
                onMinimizeMaximize={onMinimizeMaximize}
                showManimizeMaximize={showManimizeMaximize}
              ></CustomDialogHeader>
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <Box padding={1}>
                    {emailId ? (
                      <Fragment>
                        <Typography variant="subtitle1">Subject : {initialValues.name || initialValues.subject} </Typography>
                        <Box mt={1} mb={1}>
                          <Typography variant="subtitle1">To : {initialValues.to.join()} </Typography>
                        </Box>
                        {initialValues.to.length && (
                          <Box mt={1} mb={1}>
                            <Typography variant="subtitle1">Cc : {initialValues.cc.join() || '----'} </Typography>
                          </Box>
                        )}
                        <Divider />
                        <Box mt={2} paddingLeft={3}>
                          <div
                            dangerouslySetInnerHTML={{
                              __html: initialValues.content || initialValues.message
                            }}
                          />
                        </Box>
                        {renderFileThumbnails}
                        <ImageAttachments
                          imageAttachments={imageAttachments}
                          onImageClick={(attachment) => {
                            setImageSource(attachment);
                            setOpen(true);
                          }}
                          isCreateOnly={true}
                          onDelete={handleDeleteImageAttachment}
                          emailId={emailId}
                        />

                        {initialValues?.relatedTo && initialValues.relatedTo.length ? (
                          <Box mt={2}>
                            <RelatedToDispay relatedTo={initialValues.relatedTo} />
                          </Box>
                        ) : null}
                        <Box mt={1} color="text.secondary">
                          <Typography variant="body2">Sended {moment(initialValues.createdBy.date).format(dateTimeFormat)}</Typography>
                        </Box>
                      </Fragment>
                    ) : (
                      <Grid container spacing={3}>
                        {showESign && (
                          <Grid item className="pull-right p-0" xs={12}>
                            <FormControlLabel
                              disabled={!isESign}
                              key={1}
                              control={<Switch checked={toogle['e-Sign']} name="e-Sign" onChange={handleChangePermissions} />}
                              label="e-Sign"
                            />
                          </Grid>
                        )}
                        <Grid item xs={12}>
                          <TextField
                            autoComplete="off"
                            id={'send-email-dialog-subject-input'}
                            variant="outlined"
                            type="text"
                            label="Subject"
                            required={true}
                            name="subject"
                            fullWidth
                            margin="dense"
                            value={values['subject']}
                            error={touched['subject'] && Boolean(errors['subject'])}
                            helperText={touched['subject'] && errors['subject']}
                            onChange={(e) => {
                              setFieldValue('subject', e.target.value.trimStart());
                            }}
                          />
                          <Autocomplete
                            multiple
                            disableCloseOnSelect={true}
                            options={emailUsersOptions.filter((option) => values.cc.indexOf(option) < 0)}
                            freeSolo
                            id={'send-email-dialog-to-input'}
                            renderTags={(value, getTagProps) =>
                              value.map((option, index) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                variant="outlined"
                                label="To"
                                margin="dense"
                                required={true}
                                error={touched['to'] && Boolean(errors['to'])}
                                helperText={touched['to'] && errors['to']}
                                name="to"
                              />
                            )}
                            value={values['to']}
                            datatype="multiSelect"
                            onBlur={(e: any) => {
                              if (e.target.value && e.target.value.trim() != '' && validations.email.test(e.target.value)) {
                                setFieldValue('to', isQuoteBuilder ? [e.target.value] : [...values['to'], e.target.value]);
                              }
                            }}
                            onChange={(e, value) => {
                              // if (isQuoteBuilder) {
                              //   if (value && value.length) {
                              //     value = [value.slice(-1)[0]];
                              //   }
                              // }
                              let emails = [];
                              for (var email of value) {
                                if (validations.email.test(email)) {
                                  emails.push(email);
                                }
                              }
                              setFieldValue('to', emails);
                            }}
                          />
                          <Autocomplete
                            multiple
                            disableCloseOnSelect={true}
                            options={isQuoteBuilder ? cc : emailUsersOptions.filter((option) => values.to.indexOf(option) < 0)}
                            freeSolo
                            id={'send-email-dialog-cc-input'}
                            renderTags={(value, getTagProps) =>
                              value.map((option, index) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                variant="outlined"
                                label="Cc"
                                margin="dense"
                                error={touched['cc'] && Boolean(errors['cc'])}
                                helperText={touched['cc'] && errors['cc']}
                                name="cc"
                              />
                            )}
                            value={values['cc']}
                            onBlur={(e: any) => {
                              if (
                                e.target.value &&
                                e.target.value.trim() != '' &&
                                /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(e.target.value)
                              ) {
                                setFieldValue('cc', [...values['cc'], e.target.value]);
                              }
                            }}
                            onChange={(e, value) => {
                              let val = [];
                              for (var email of value) {
                                if (validations.email.test(email)) {
                                  val.push(email);
                                }
                              }
                              setFieldValue('cc', val);
                            }}
                          />

                          <Box>
                            {renderFileThumbnails}
                            {isQuoteBuilder ? renderQuotesFileThumbnails : null}
                            {isQuoteBuilder ? renderQuotesOtherFileThumbnails : null}
                            <ImageAttachments
                              imageAttachments={fileImageAttachments}
                              onImageClick={(attachment) => {
                                setImageSource(attachment);
                                setOpen(true);
                              }}
                              isCreateOnly={true}
                              onDelete={handleDeleteFileImageAttachment}
                              emailId={emailId}
                            />
                            <ImageAttachments
                              imageAttachments={imageAttachments}
                              onImageClick={(attachment) => {
                                setImageSource(attachment);
                                setOpen(true);
                              }}
                              isCreateOnly={true}
                              onDelete={handleDeleteImageAttachment}
                              emailId={emailId}
                            />
                            <TinyMce
                              onChange={(value) => {
                                setFieldValue('content', value);
                              }}
                              initialValue={initialValues?.content}
                              imageOrFileUploadCompletePercentage={(completePercentage) => {
                                setUploadingImageOrFileProgress(completePercentage);
                              }}
                              doNotShowUploadFile={false}
                              onUploadFile={onUploadFile}
                              onUploadImage={handleUploadImage}
                              usePublicUrlforFileUpload={true}
                              isSendToCustomer={isQuoteBuilder ? true : false}
                              onQuoteUpload={handleQuoteUpload}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    )}
                  </Box>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  color="primary"
                  size="small"
                  disabled={sending}
                  onClick={() => {
                    if (isEqual(initialValues, values)) handleClose();
                    else setShowConfirmDialog(true);
                  }}
                  id={'send-email-dialog-cancel-button'}
                >
                  Cancel
                </Button>
                {!emailId && (
                  <Button
                    type="button"
                    size="small"
                    color="primary"
                    variant="contained"
                    disabled={sending || uploadingImageOrFileProgress > 0 || generatingFile}
                    onClick={(e) => {
                      e.preventDefault();
                      submitForm();
                    }}
                    id={'send-email-dialog-send-button'}
                  >
                    {sending ? (
                      <>
                        <CircularProgress color="inherit" size={14} style={{ marginRight: '10px' }} />
                        Sending ...{' '}
                      </>
                    ) : (
                      'send'
                    )}
                  </Button>
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
            </>
          )}
        </Formik>
      ) : (
        <CustomDialogContent isFooterPresent={false}>
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        </CustomDialogContent>
      )}
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
  );
};

CreateEmail.propTypes = {
  relatedTo: PropTypes.any,
  taskId: PropTypes.any,
  handleClose: PropTypes.any,
  options: PropTypes.any
};
