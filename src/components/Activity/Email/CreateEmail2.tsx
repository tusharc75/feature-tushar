import { useState, useEffect, Fragment, useContext } from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Formik, Form } from 'formik';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateUtils from '@date-io/date-fns';
import TextField from '@material-ui/core/TextField';
import { object, string, array } from 'yup';
import { GetEmailDetail, CreateNewEmail, UpdateEmail } from '../../../axios/activity';
import moment from 'moment';
import { RelatedToDispay } from '../Helpers/RelatedToDispay';
import RichTextEditor from 'react-rte';
import { makeStyles } from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';
import Divider from '@material-ui/core/Divider';
import PropTypes from 'prop-types';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { CircularProgress, Tooltip, IconButton } from '@material-ui/core';
import { useAccount, useMsal } from '@azure/msal-react';
import getAzureAcessToken from '../../Azure/getAzureAccessToken';
import { validations } from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import ImagePreview from './ImagePreview';
import { Paper, FormControlLabel, Switch } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
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

export const CreateEmail2 = ({
  relatedTo,
  emailId,
  handleClose,
  isQuoteBuilder = false,
  options = [],
  fetchData = null,
  cc = [],
  id = null,
  version = null,
  qouteBuilderAttachments = [],
  subject = '',
  showESign = false,
  generatingFile = false,
  fromQuote = false,
  isMinimized,
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
    } else {
      let initialData = {
        subject: subject ?? '',
        file: '',
        content: RichTextEditor.createEmptyValue(),
        to: isQuoteBuilder && options.length ? [options[0]] : [],
        cc: isQuoteBuilder ? [...cc] : []
      };
      setInitialValues(initialData);
      setFormValues(initialData);
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
        UpdateEmail(emailId, values)
          .then(() => {
            handleClose();
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
          });
      } else {
        setSending(true);
        CreateNewEmail(payload)
          .then((data) => {
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
    } catch (e) {}
  };

  const emailReply = async (values) => {
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
    setSending(true);
    axiosInstance()
      .post(`/email/reply-to/${values._id}`, payload)
      .then(() => {
        setSending(false);
        fetchEmailDetail();
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
      eSign: toogle['e-Sign']
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
    setQuoteBuilderOtherAttachments(quoteBuilderOtherAttachments.filter((o) => o?.name !== name));
  };

  const classes = useStyles();

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
        title={`${emailId ? 'Email Thread' : 'New Email'}`}
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
          {/* {[...Array(10).keys()].map((i) => (
            <Typography style={{ marginLeft: '20px' }} key={`skeleton${i} `} variant="subtitle1">
              <Skeleton animation="wave" />
            </Typography>
          ))} */}
          <Box p={3}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        </div>
      ) : (
        initialValues && (
          <Formik
            initialValues={initialValues}
            validationSchema={EmailSchema}
            onSubmit={isQuoteBuilder ? handleSendQuoteEmail : emailId ? emailReply : handleSave}
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
                            {<AttachmentThumbnail attachments={otherAttachments} handleDeleteAttachment={handleDeleteAttachment} canEdit={true} />}
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

                            <Box className={classes.inboundEmail}>
                              <Box>
                                <Grid container>
                                  <Grid item style={{ flexBasis: '48px' }}>
                                    <Box className={`${classes.profile} ${classes.myProfile}`}>{'You'}</Box>
                                  </Grid>
                                  <Grid item style={{ flexBasis: 'calc(100% - 48px)' }}>
                                    <Box className={`${classes.mailText} ${classes.inputBox}`}>
                                      {otherAttachments.length > 0 && (
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
                                      {imageAttachments?.length > 0 && (
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
                                  handleValuesChange({ subject: e.target.value.trimStart() });
                                }}
                              />
                              <Autocomplete
                                multiple
                                disableCloseOnSelect={true}
                                options={options.filter((option) => values.cc.indexOf(option) < 0)}
                                freeSolo
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
                                onBlur={(e: any) => {
                                  if (e.target.value && e.target.value.trim() != '' && validations.email.test(e.target.value)) {
                                    setFieldValue('to', isQuoteBuilder ? [e.target.value] : [...values['to'], e.target.value]);
                                    handleValuesChange({
                                      to: isQuoteBuilder ? [e.target.value] : [...values['to'], e.target.value]
                                    });
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
                                  handleValuesChange({ to: emails });
                                }}
                              />
                              <Autocomplete
                                multiple
                                disableCloseOnSelect={true}
                                options={isQuoteBuilder ? cc : options.filter((option) => values.to.indexOf(option) < 0)}
                                freeSolo
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
                                    handleValuesChange({ cc: e.target.value });
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
                                  handleValuesChange({ cc: val });
                                }}
                              />

                              <Box>
                                {
                                  <AttachmentThumbnail
                                    attachments={otherAttachments}
                                    handleDeleteAttachment={handleDeleteAttachment}
                                    canEdit={true}
                                  />
                                }
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
                              </Box>
                            </Grid>
                          </Grid>
                        )}
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

      {/* {
            (!azureAccount?.username && !emailId) ? <UnauthenticatedTemplate>
                <Box position="absolute" bgcolor="rgba(0,0,0,0.6)" style={{
                    backdropFilter: "blur(2px)",
                    color: "#F9FAFB",
                }} zIndex={10} top={0} left={0} height="100%" width="100%" display="flex" justifyContent="center" alignItems="center">
                    <Box width="100%" textAlign="center">
                        <AzureLogin></AzureLogin>
                        <Box width="50%" marginX="auto" marginY={2} bgcolor="#F9FAFB" height="1px"></Box>
                        <Typography >To able to send Mail you need to Log  Into azure Account</Typography>
                    </Box>
                </Box>
            </UnauthenticatedTemplate> : null
        } */}
    </>
  );
};

CreateEmail2.propTypes = {
  relatedTo: PropTypes.any,
  taskId: PropTypes.any,
  handleClose: PropTypes.any,
  options: PropTypes.any
};
