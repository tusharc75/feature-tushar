import { useState, useEffect, Fragment, useContext } from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Formik, Form } from 'formik';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateUtils from '@date-io/date-fns';
import { object, string, array } from 'yup';
import { GetEmailDetail } from '../../../axios/activity';
import moment from 'moment';
import { RelatedToDispay } from '../Helpers/RelatedToDispay';
import { makeStyles } from '@material-ui/core/styles';
import Divider from '@material-ui/core/Divider';
import PropTypes from 'prop-types';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { CircularProgress, Tooltip, IconButton } from '@material-ui/core';
import { useAccount, useMsal } from '@azure/msal-react';
import getAzureAcessToken from '../../Azure/getAzureAccessToken';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import ImagePreview from './ImagePreview';
import ImageAttachments from './ImageAttachments';
import { imageUploadMaxSize, dateTimeFormat } from '../../../constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import TinyMce from '../../../components/TinyMCE';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import AttachmentThumbnail from 'src/components/AttachmentThumbnail';
import { AiOutlineSend } from 'react-icons/ai';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import RefreshIcon from '@material-ui/icons/Refresh';

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
  },
  inboundEmail: {
    '& > div': {
      borderBottom: '1px solid #E7E7E7',
      marginTop: '14px',
      paddingBottom: '24px'
    }
  },
  profile: {
    width: '48px',
    height: '48px',
    borderRadius: '100vmax',
    background: '#b8e986',
    color: '#169286',
    display: 'grid',
    placeItems: 'center',
    flexBasis: '48px',
    fontWeight: 600
  },
  myProfile: {
    background: '#cef2ef'
  },
  mailText: {
    marginLeft: '14px'
  },
  mailtextHead: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: '15px',
    marginBlock: '15px',
    alignItems: 'center'
  },
  mailFrom: {
    fontSize: '14px',
    lineHeight: '119%',
    color: '#5B5B5B',
    fontWeight: 600
  },
  mailTimeStamp: { fontWeight: 400, fontSize: '11px', lineHeight: '151%', color: '#717171' },
  inputBox: {
    background: '#FFFFFF',
    border: '0.945308px solid #EBEBEB',
    boxShadow: '0px 3.78123px 37.8123px rgba(0, 0, 0, 0.08)',
    borderRadius: '5px'
  },
  footer: {
    padding: '15px'
  }
}));

export const ViewEmail = ({
  relatedTo,
  emailId,
  handleClose,
  isQuoteBuilder = false,
  fetchData = null,
  id = null,
  version = null,
  qouteBuilderAttachments = [],
  generatingFile = false,
  fromQuote = false,
  isMinimized = false,
  onMinimizeMaximize,
  showManimizeMaximize,
  referenceType = ''
}) => {
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
  const [newImageAttachments, setNewImageAttachments] = useState([]);
  const [newOtherAttachments, setNewOtherAttachments] = useState([]);
  const [open, setOpen] = useState(false);
  const [imageSource, setImageSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [quoteBuilderOtherAttachments, setQuoteBuilderOtherAttachments] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [stateQuoteBuilderAttachments, setStateQuoteBuilderAttachments] = useState([]);

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
  }, [qouteBuilderAttachments]);

  useEffect(() => {
    fetchEmailDetail();
  }, []);

  const checkImageUrl = (url) => {
    let extension = url.substring(url.lastIndexOf('.')).toLowerCase();
    let imageExtensions = ['.tif', '.tiff', '.bmp', '.jpg', '.jpeg', '.gif', '.png', '.eps', '.raw', '.cr2', '.nef', '.orf', '.sr2'];
    return imageExtensions.indexOf(extension) >= 0;
  };

  const fetchEmailDetail = async () => {
    if (emailId) {
      setLoading(true);
      await GetEmailDetail(emailId)
        .then(({ data }) => {
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
          setFormValues(data);
        })
        .catch((err) => {
          setLoading(false);
        });
    }
  };

  const emailReply = async (values) => {
    let payload = {
      relatedTo: relatedTo,
      message: values.content.toString('html'),
      to: values.to,
      cc: values.cc,
      subject: values.subject,
      attachment: newOtherAttachments.length || newImageAttachments.length ? [...newOtherAttachments, ...newImageAttachments] : []
    };
    setSending(true);
    axiosInstance()
      .post(`/email/reply-to/${values._id}`, payload)
      .then(() => {
        setSending(false);
        fetchEmailDetail();
        setNewImageAttachments([]);
        setNewOtherAttachments([]);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setSending(false);
        fetchEmailDetail();
      });
  };

  const handleSendQuoteEmail = async (values) => {
    setSending(true);
    const body = {
      email: [values.to.slice(-1)[0]],
      version: version,
      emailBody: values.content.toString('html'),
      emailSubject: values.subject,
      cc: values.cc,
      id: id,
      attachments: [...stateQuoteBuilderAttachments, ...quoteBuilderOtherAttachments],
      eSign: isESign
    };
    if (azureAccount && azureAccount?.username) {
      body['graphToken'] = await getAzureAcessToken(instance);
      body['mailbox'] = azureAccount.username;
    }
    const api = referenceType === 'quote' ? `/quote-builder/sendQuoteEmail` : '/send-email';
    axiosInstance()
      .post(api, body)
      .then(() => {
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
    setNewOtherAttachments(otherAttachments.filter((currentUrl) => currentUrl !== url));
  };

  const handleDeleteImageAttachment = (url) => {
    setNewImageAttachments(imageAttachments.filter((currentUrl) => currentUrl !== url));
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
    setQuoteBuilderOtherAttachments(quoteBuilderOtherAttachments.filter((o) => o?.name !== name));
  };

  const classes = useStyles();

  const onUploadFile = (file) => {
    if (checkImageUrl(file)) {
      setNewImageAttachments((prevState) => [...prevState, file]);
    } else {
      setNewOtherAttachments((prevState) => [...prevState, file]);
    }
  };

  const handleQuoteUpload = (attachment) => {
    setQuoteBuilderOtherAttachments((prevState) => [...prevState, attachment]);
  };

  const isFieldNotTouched = (initialValues, values) => {
    let initialData = { ...initialValues, content: initialValues?.content?.toString('html') ?? '' };
    let dataValues = { ...values, content: values?.content?.toString('html') ?? '' };
    return Object.values(initialData).toString() === Object.values(dataValues).toString();
  };
  const handleValuesChange = (data) => {
    setFormValues((prevState) => ({
      ...prevState,
      ...data
    }));
  };

  return (
    <>
      <CustomDialogHeader
        title={'Email Thread'}
        onClose={() => {
          if (isFieldNotTouched(initialValues, formValues)) handleClose();
          else setShowConfirmDialog(true);
        }}
        isMinimized={isMinimized}
        onMinimizeMaximize={onMinimizeMaximize}
        showManimizeMaximize={showManimizeMaximize}
      ></CustomDialogHeader>
      {loading ? (
        <div className={classes.root}>
          <Box p={3}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        </div>
      ) : (
        initialValues && (
          <Formik
            initialValues={initialValues}
            validationSchema={EmailSchema}
            onSubmit={isQuoteBuilder ? handleSendQuoteEmail : emailId && emailReply}
            onKeyPress={onKeyPress}
          >
            {({ submitForm, touched, errors, setFieldValue, values }) => (
              <>
                <CustomDialogContent>
                  <Form autoComplete="off" autoCorrect="off" noValidate>
                    <MuiPickersUtilsProvider utils={DateUtils}>
                      <Box padding={1}>
                        {emailId ? (
                          <Box style={{ position: 'relative' }}>
                            <Box
                              style={{
                                position: 'sticky',
                                top: '23px',
                                left: 0,
                                right: 0,
                                zIndex: '3',
                                marginLeft: 'auto',
                                maxWidth: 'max-content'
                              }}
                            >
                              <Tooltip title="Refresh" placement="top">
                                <IconButton
                                  onClick={() => fetchEmailDetail()}
                                  style={{
                                    width: '46px',
                                    height: '32px',
                                    background: 'white',
                                    padding: '11px',
                                    border: '1px solid rgb(229, 229, 229)',
                                    color: 'rgb(115, 115, 115)'
                                  }}
                                  size="small"
                                >
                                  <RefreshIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                            <Box mb={1} style={{ marginTop: '-31px', paddingRight: '52px' }}>
                              <Grid container spacing={1} justifyContent="space-between">
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="subtitle1">
                                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Subject</span> :{' '}
                                    {initialValues.name || initialValues.subject}{' '}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="subtitle1">
                                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>To</span> : {initialValues.to.join()}{' '}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  {initialValues.to.length && (
                                    <Typography variant="subtitle1">
                                      <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Cc</span> : {initialValues.cc.join() || '----'}{' '}
                                    </Typography>
                                  )}
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  {initialValues?.relatedTo && initialValues.relatedTo.length ? (
                                    <RelatedToDispay relatedTo={initialValues.relatedTo} inline />
                                  ) : null}
                                </Grid>
                              </Grid>
                            </Box>
                            <Divider />
                            <Box className={classes.inboundEmail}>
                              <Box>
                                <Grid container>
                                  <Grid item style={{ flexBasis: '48px' }}>
                                    <Box className={`${classes.profile} ${classes.myProfile}`}>{'You'}</Box>
                                  </Grid>
                                  <Grid item style={{ flexBasis: 'calc(100% - 48px)' }}>
                                    <Box className={classes.mailText}>
                                      <Box className={classes.mailtextHead}>
                                        <Typography className={classes.mailFrom}>{values.mailbox}</Typography>
                                        <Typography className={classes.mailTimeStamp}>
                                          {moment(values?.createdBy.date).format(dateTimeFormat)}
                                        </Typography>
                                      </Box>
                                      <div
                                        dangerouslySetInnerHTML={{
                                          __html: initialValues.content || initialValues.message
                                        }}
                                      />
                                      {
                                        <AttachmentThumbnail
                                          attachments={otherAttachments}
                                          canEdit={false}
                                          handleDeleteAttachment={(attachment) => {}}
                                        />
                                      }
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
                                    </Box>
                                  </Grid>
                                </Grid>
                              </Box>
                              {values?.inboundEmails?.map((incomingMail) => {
                                const nameWords = incomingMail.from.trim().split(' ');
                                const initials = incomingMail.type === 'sender' ? 'You' : `${nameWords[0][0]}${nameWords[1][0]}`;
                                return (
                                  <Box>
                                    <Grid container>
                                      <Grid item style={{ flexBasis: '48px' }}>
                                        <Box className={`${classes.profile} ${incomingMail.type === 'sender' ? classes.myProfile : ''}`}>
                                          {initials}
                                        </Box>
                                      </Grid>
                                      <Grid item style={{ flexBasis: 'calc(100% - 48px)' }}>
                                        <Box className={classes.mailText}>
                                          <Box className={classes.mailtextHead}>
                                            <Typography className={classes.mailFrom}>{incomingMail.from}</Typography>
                                            <Typography className={classes.mailTimeStamp}>
                                              {moment(incomingMail.date).format(dateTimeFormat)}
                                            </Typography>
                                          </Box>
                                          <div
                                            dangerouslySetInnerHTML={{
                                              __html: incomingMail.message
                                            }}
                                          />

                                          <Grid container>
                                            <Grid item xs={6} sm={4} md={3}>
                                              <AttachmentThumbnail
                                                attachments={incomingMail.attachments}
                                                handleDeleteAttachment={null}
                                                canEdit={false}
                                              />
                                            </Grid>
                                          </Grid>
                                        </Box>
                                      </Grid>
                                    </Grid>
                                  </Box>
                                );
                              })}
                            </Box>

                            <Box className={classes.inboundEmail}>
                              <Box>
                                <Grid container>
                                  <Grid item style={{ flexBasis: '48px' }}>
                                    <Box className={`${classes.profile} ${classes.myProfile}`}>{'You'}</Box>
                                  </Grid>
                                  <Grid item style={{ flexBasis: 'calc(100% - 48px)' }}>
                                    <Box className={`${classes.mailText} ${classes.inputBox}`}>
                                      {newOtherAttachments.length > 0 && (
                                        <AttachmentThumbnail
                                          attachments={otherAttachments}
                                          handleDeleteAttachment={handleDeleteAttachment}
                                          canEdit={true}
                                        />
                                      )}
                                      {isQuoteBuilder ? (
                                        <AttachmentThumbnail
                                          attachments={stateQuoteBuilderAttachments}
                                          handleDeleteAttachment={handleDeleteQuoteBuilderAttachment}
                                          canEdit={true}
                                        />
                                      ) : null}
                                      {isQuoteBuilder ? (
                                        <AttachmentThumbnail
                                          attachments={quoteBuilderOtherAttachments}
                                          handleDeleteAttachment={handleDeleteQuoteBuilderOtherAttachment}
                                          canEdit={true}
                                        />
                                      ) : null}
                                      {fileImageAttachments?.length > 0 && (
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
                                      )}
                                      {newImageAttachments?.length > 0 && (
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
                                      )}
                                      <TinyMce
                                        onChange={(value) => {
                                          setFieldValue('content', value);
                                          handleValuesChange({ content: value });
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
                                      <Box className={classes.footer}>
                                        <Button
                                          type="button"
                                          size="small"
                                          color="primary"
                                          variant="contained"
                                          endIcon={sending ? <CircularProgress color="inherit" size={14} /> : <AiOutlineSend size={14} />}
                                          disabled={sending || uploadingImageOrFileProgress > 0 || generatingFile}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            submitForm();
                                          }}
                                        >
                                          {sending ? <>Sending ... </> : 'send'}
                                        </Button>
                                      </Box>
                                    </Box>
                                  </Grid>
                                </Grid>
                              </Box>
                            </Box>
                          </Box>
                        ) : null}
                      </Box>
                    </MuiPickersUtilsProvider>
                  </Form>
                </CustomDialogContent>
                <CustomDialogFooter>
                  {/* <Typography color="textSecondary"> {!emailId && <> Mail will sent from {azureAccount?.username} </>}</Typography> */}
                  <Button
                    color="primary"
                    size="small"
                    disabled={sending}
                    onClick={() => {
                      if (isFieldNotTouched(initialValues, values)) handleClose();
                      else setShowConfirmDialog(true);
                    }}
                  >
                    Cancel
                  </Button>
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
        )
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

ViewEmail.propTypes = {
  relatedTo: PropTypes.any,
  taskId: PropTypes.any,
  handleClose: PropTypes.any,
  options: PropTypes.any
};
