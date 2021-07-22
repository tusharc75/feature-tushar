import React, {
  useRef,
  useState,
  useEffect,
  Fragment,
  useContext,
} from "react";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import { Formik, Form, Field } from "formik";
import CustomDialogHeader from "../../../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../../../components/CustomDialog/CustomDialogFooter";
import Dialog from "@material-ui/core/Dialog";
import axiosInstance from "../../../../axios/axiosInstance";
import { CustomToastContext } from "../../../../StateProvider/CustomToastContext/CustomToastContext";
import CustomButton from "../../../../components/Helpers/CustomButton";
import TextField from "@material-ui/core/TextField";
import * as Yup from "yup";
import { useHistory } from "react-router-dom";
import AxiosInstance from "../../../../axios/axiosInstance";
import Autocomplete from "@material-ui/lab/Autocomplete";
import routes from "../../../../components/Helpers/Routes";
import { stubTrue } from "lodash";
import { isMobile, isTablet } from "react-device-detect";
import {
  CustomDialogTransition,
  imageUploadMaxSize,
} from "../../../../constants/helpers";
import RichTextEditor from "react-rte";
import FormTypes from "../../../../components/Helpers/FormTypes";
import emailStyles from "../../../../pages/Activity/Email/email.module.scss";
import ImageAttachments from "../../../../components/Activity/Email/ImageAttachments";
import { BsFillImageFill } from "react-icons/bs";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import DeleteIcon from "@material-ui/icons/Delete";
import { GoArrowDown } from "react-icons/go";
import { Paper } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import { makeStyles } from "@material-ui/core/styles";
import { fileIcons } from "../../../../components/Activity/Email/FileIcons";
import { toolbarConfig } from "../../../../components/Activity/Email/TextEditorToolbar";
import ImagePreview from "../../../../components/Activity/Email/ImagePreview";

const ProductBuilderSchema = Yup.object().shape({
  subject: Yup.string().required("please enter email subject"),
  contact: Yup.object().required("please select Contact"),
});

const useStyles = makeStyles((theme) => ({
  textEditor: {
    fontFamily: "inherit",
    border: "none",
  },
}));

const EmailDialog = (props) => {
  const toastConfig = useContext(CustomToastContext);
  const { handleClose, success, id, version, account, emailId, users } = props;
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({
    subject: "",
    body: RichTextEditor.createEmptyValue(),
    cc: "",
    to: "",
    account: "",
    contact: "",
  });
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [validEmail, setValidEmail] = useState(true);
  const [email, setEmail] = useState("");
  const [isUploading, setUploading] = useState(false);
  const [fileImageAttachments, setFileImageAttachments] = useState([]);
  const [imageAttachments, setImageAttachments] = useState([]);
  const [otherAttachments, setOtherAttachments] = useState([]);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] =
    useState(0);
  const [open, setOpen] = useState(false);
  const [imageSource, setImageSource] = useState(null);
  const history = useHistory();
  const classes = useStyles();

  useEffect(() => {
    fetchContacts(account.optionValue);
  }, []);

  const handleSubmit = (values) => {
    setLoading(true);
    const body = {
      email: email,
      version: version,
      emailBody: values.body.toString("html"),
      emailSubject: values.subject,
      cc: values.cc,
      to: values.to,
      id: id,
      attachment: values["file"]
        ? [...imageAttachments, ...otherAttachments, ...fileImageAttachments]
        : [...imageAttachments],
    };
    axiosInstance()
      .post(`/quote-builder/sendQuoteEmail`, body)
      .then(({ data: { data } }) => {
        setLoading(false);
        success();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoading(false);
        handleClose();
      });
  };

  const fetchAccounts = () => {
    setLoading(true);
    axiosInstance()
      .get(`/customer-account`)
      .then(({ data: { data } }) => {
        setAccounts(data);
        setLoading(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoading(false);
      });
  };

  const fetchContacts = (account_id) => {
    setLoading(true);
    axiosInstance()
      .get(`/customer-contact`)
      .then(({ data: { data } }) => {
        setContacts(data);
        setLoading(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoading(false);
      });
  };

  const fetchemailAddress = (event, value) => {
    if (value !== null) {
      if (!value.email && value.email === "") {
        setValidEmail(false);
      } else {
        setEmail(value.email);
      }
    }
  };
  const handleUploadImage = (event) => {
    if (event.target.files && event.target.files.length) {
      const file = event.target.files[0];
      if (file.size > imageUploadMaxSize.size) {
        toastConfig.setToastConfig({
          open: true,
          type: "error",
          message: `Image must be less than ${imageUploadMaxSize.text} size`,
        });
      } else {
        getImageUrl(file);
      }
    }
  };

  const getImageUrl = (file) => {
    let formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    axiosInstance()
      .post("/user/upload-public", formData, {
        headers: { "Content-Type": "multipart/form-data" },
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
    setOtherAttachments(
      otherAttachments.filter((currentUrl) => currentUrl !== url)
    );
  };

  const handleDeleteImageAttachment = (url) => {
    setImageAttachments(
      imageAttachments.filter((currentUrl) => currentUrl !== url)
    );
  };
  const handleDeleteFileImageAttachment = (url) => {
    setFileImageAttachments(
      fileImageAttachments.filter((currentUrl) => currentUrl !== url)
    );
  };

  const checkImageUrl = (url) => {
    let extension = url.substring(url.lastIndexOf(".")).toLowerCase();
    let imageExtensions = [
      ".tif",
      ".tiff",
      ".bmp",
      ".jpg",
      ".jpeg",
      ".gif",
      ".png",
      ".eps",
      ".raw",
      ".cr2",
      ".nef",
      ".orf",
      ".sr2",
    ];
    return imageExtensions.indexOf(extension) >= 0;
  };

  const onUploadFile = (file) => {
    if (checkImageUrl(file)) {
      setFileImageAttachments((prevState) => [...prevState, file]);
    } else {
      setOtherAttachments((prevState) => [...prevState, file]);
    }
  };
  const getFileIconSrc = (file) => {
    let extension = file.substring(file.lastIndexOf(".")).toLowerCase();
    let data = fileIcons.find((o) => o.extensions.indexOf(extension) >= 0);
    if (data && data?.source) return data.source;
  };

  const renderFileThumbnails = (
    <Grid container spacing={1} className={emailStyles.createEmailContainer}>
      {otherAttachments && otherAttachments.length > 0 ? (
        <>
          {otherAttachments.map((attachment, i) => {
            return (
              <>
                <Grid item key={i} sm={3} xs={3} md={3} xl={3}>
                  <Paper className={emailStyles.fileContainer}>
                    <img
                      src={getFileIconSrc(attachment)}
                      className={emailStyles.file}
                      alt="attchment"
                    />
                    <Typography noWrap variant="body2">
                      {attachment
                        ? attachment.substring(attachment.lastIndexOf("/") + 1)
                        : "attachment"}
                    </Typography>
                    <div className={emailStyles.fileOverlay}>
                      <Typography variant="subtitle2">
                        {attachment
                          ? attachment.substring(
                              attachment.lastIndexOf("/") + 1
                            )
                          : "attachment"}
                      </Typography>
                      <IconButton className={emailStyles.text}>
                        {emailId ? (
                          <a href={`${attachment}`} download={true}>
                            <GoArrowDown color="white" size={21} />
                          </a>
                        ) : (
                          <DeleteIcon
                            className={emailStyles.deleteIcon}
                            onClick={() => handleDeleteAttachment(attachment)}
                          />
                        )}
                      </IconButton>
                    </div>
                  </Paper>
                </Grid>
              </>
            );
          })}
        </>
      ) : null}
    </Grid>
  );

  return (
    <>
      <Dialog
        maxWidth="sm"
        fullScreen={isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
        fullWidth
      >
        <Formik
          enableReinitialize={true}
          initialValues={initialData}
          validationSchema={ProductBuilderSchema}
          validateOnMount
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={"Choose contact to email"}
                onClose={handleClose}
              ></CustomDialogHeader>
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <Box p={1}>
                    <TextField
                      label="Account"
                      variant="outlined"
                      name="account"
                      fullWidth
                      value={account.optionLabel}
                      margin="dense"
                    />
                  </Box>
                  <Box p={1}>
                    <Autocomplete
                      id="contacts"
                      options={contacts}
                      getOptionLabel={(option) => option.firstName}
                      style={{ width: 300 }}
                      onChange={(e, value) => {
                        fetchemailAddress(e, value);
                        setFieldValue("contact", value);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Contact"
                          variant="outlined"
                          name="contact"
                          fullWidth
                          required
                          margin="dense"
                          value={values["contact"]}
                          error={
                            touched["contact"] && Boolean(errors["contact"])
                          }
                          helperText={touched["contact"] && errors["contact"]}
                        />
                      )}
                    />
                  </Box>
                  <Box p={1}>
                    <TextField
                      variant="outlined"
                      type="text"
                      label="CC"
                      name="cc"
                      fullWidth
                      margin="dense"
                      value={values["cc"]}
                      error={touched["cc"] && Boolean(errors["cc"])}
                      helperText={touched["cc"] && errors["cc"]}
                      onChange={(e) =>
                        setFieldValue("cc", e.target.value.trimStart())
                      }
                    />
                  </Box>
                  <Box p={1}>
                    <TextField
                      variant="outlined"
                      type="text"
                      label="To"
                      name="to"
                      fullWidth
                      margin="dense"
                      value={values["to"]}
                      error={touched["to"] && Boolean(errors["to"])}
                      helperText={touched["to"] && errors["to"]}
                      onChange={(e) =>
                        setFieldValue("to", e.target.value.trimStart())
                      }
                    />
                  </Box>

                  <Box p={1}>
                    <TextField
                      variant="outlined"
                      type="text"
                      label="Email Subject"
                      required={true}
                      name="subject"
                      fullWidth
                      margin="dense"
                      value={values["subject"]}
                      error={touched["subject"] && Boolean(errors["subject"])}
                      helperText={touched["subject"] && errors["subject"]}
                      onChange={(e) =>
                        setFieldValue("subject", e.target.value.trimStart())
                      }
                    />
                  </Box>

                  <Box p={1}>
                    <FormTypes
                      label="File"
                      name="file"
                      isTooltip={true}
                      required={false}
                      type="fileUpload"
                      values={values}
                      errors={errors}
                      touched={touched}
                      size="small"
                      isMultipleUpload={true}
                      setFieldValue={(name, file) => {
                        setFieldValue("file", file);
                        onUploadFile(file);
                      }}
                      usePublicUrlforFileUpload={true}
                      doNotShowUploadedFile={true}
                      imageOrFileUploadCompletePercentage={(
                        completePercentage
                      ) => {
                        setUploadingImageOrFileProgress(completePercentage);
                      }}
                    />
                  </Box>
                  {renderFileThumbnails}
                  <ImageAttachments
                    imageAttachments={fileImageAttachments}
                    onImageClick={(attachment) => {
                      setImageSource(attachment);
                      setOpen(true);
                    }}
                    onDelete={handleDeleteFileImageAttachment}
                    emailId={null}
                  />
                  <Box p={1}>
                    <Box
                      style={{ border: "1px solid #999", minHeight: "220px" }}
                    >
                      <RichTextEditor
                        style={{ border: "none" }}
                        className={classes.textEditor}
                        value={values["body"]}
                        onChange={(value) => setFieldValue("body", value)}
                        customControls={[
                          <button
                            type="button"
                            className={
                              emailStyles.emailRichTextEditorCustomControls
                            }
                          >
                            <label htmlFor="avatar">
                              <IconButton
                                title="Add picture"
                                size="small"
                                aria-label="upload picture"
                                component="span"
                              >
                                <BsFillImageFill size={18} color="black" />
                                <input
                                  disabled={isUploading}
                                  id="avatar"
                                  name="avatar"
                                  onChange={handleUploadImage}
                                  accept="image/x-png,image/gif,image/jpeg"
                                  style={{
                                    opacity: "0",
                                    position: "absolute",
                                    zIndex: -1,
                                  }}
                                  onClick={(e: any) => (e.target.value = null)}
                                  type="file"
                                />
                              </IconButton>
                            </label>
                          </button>,
                        ]}
                        toolbarConfig={toolbarConfig}
                      />
                      <ImageAttachments
                        imageAttachments={imageAttachments}
                        onImageClick={(attachment) => {
                          setImageSource(attachment);
                          setOpen(true);
                        }}
                        onDelete={handleDeleteImageAttachment}
                        emailId={null}
                      />
                    </Box>
                  </Box>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button size="small" color="primary" onClick={handleClose}>
                  Cancel
                </Button>
                <CustomButton
                  loading={loading}
                  disabled={uploadingImageOrFileProgress > 0}
                  variant="contained"
                  color="primary"
                  type="submit"
                  onClick={submitForm}
                >
                  Send
                </CustomButton>
              </CustomDialogFooter>
            </Fragment>
          )}
        </Formik>
      </Dialog>
      {open ? (
        <ImagePreview
          open={open}
          aria-labelledby="customized-dialog-title"
          // heading="image preview"
          heading={
            imageSource
              ? imageSource.substring(imageSource.lastIndexOf("/") + 1)
              : "image preview"
          }
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

export default EmailDialog;
