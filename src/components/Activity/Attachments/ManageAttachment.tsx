import React, { useState, useEffect, useContext } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { Formik, Form } from "formik";
import { object, string } from "yup";
import PropTypes from 'prop-types'
import CustomDialogHeader from '../../CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../CustomDialog/CustomDialogFooter';
import FormTypes from '../../Helpers/FormTypes'
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import CustomButton from '../../../components/Helpers/CustomButton'
import TextField from '@material-ui/core/TextField';
import { IconButton, Typography, Paper, Tooltip } from '@material-ui/core'
import DeleteIcon from "@material-ui/icons/Delete";
import GetAppIcon from '@material-ui/icons/GetApp';
import { csvIcon, docIcon, excelSheetIcon, pdfFileIcon, pptIcon, textFileIcon, imageIcon } from "../../../assets/file_icons";
import emailStyles from "../../../pages/Activity/Email/email.module.scss"
import ImagePreview from "../Email/ImagePreview";
import ConfirmationDialog from "../../Helpers/ConfirmationDialog";
import ConfirmCancelDialog from "../../../components/ConfirmCancelDialog"

const AttachmentSchema = object().shape({
    name: string().required("please add attachment name"),
    fileUrl: string().required("please upload attachment"),
});

const fileIcons = [
    {
        extensions: [".txt", ".rtf"],
        source: textFileIcon
    },
    {
        extensions: [".doc", ".docx", ".docs"],
        source: docIcon
    },
    {
        extensions: [".pdf"],
        source: pdfFileIcon
    },
    {
        extensions: [".xlsx", ".xml", ".xls", ".xlsm", ".xlt", ".xltm", ".xltx", ".xlw"],
        source: excelSheetIcon
    },
    {
        extensions: [".csv"],
        source: csvIcon
    },
    {
        extensions: [".pot", ".potm", ".potx", ".ppa", ".ppam", ".pptx", ".pptm", ".ppt", ".ppsx"],
        source: pptIcon
    },
    {
        extensions: [".tif", "tiff", ".bmp", ".jpg", ".jpeg", ".gif", ".png", ".eps", ".raw", ".cr2", ".nef", ".orf", ".sr2"],
        source: imageIcon
    }
]

export default function ManageAttachment({ relatedTo, attachmentId, handleClose, fetchData = null, attachmentData = null, isMinimized, onMinimizeMaximize, showManimizeMaximize }) {

    const [initialValues, setInitialValues] = useState(null);
    const [loading, setLoading] = useState(false)
    const [, setDownloadProgress] = useState(0);
    const [, setIsDownloading] = useState(false);
    const toastConfig = useContext(CustomToastContext);
    const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0)
    const [imageSource, setImageSource] = useState(null);
    const [open, setOpen] = useState(false)
    const [imageAttachments,] = useState([])
    const [otherAttachments, setOtherAttachments] = useState([])
    const [fileImageAttachments,] = useState([])
    const [canEdit, setCanEdit] = useState(true);
    const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
    const [attachmentToDelete, setAttachemnetToDelete] = useState("");
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [formValues, setFormValues] = useState({})

    useEffect(() => {
        fetchAttachmentDetail();
    }, []);
    const checkImageUrl = (url) => {
        let extension = url.substring(url.lastIndexOf("."),).toLowerCase()
        let imageExtensions = [".tif", "tiff", ".bmp", ".jpg", "jpeg", ".gif", ".png", ".eps", ".raw", ".cr2", ".nef", ".orf", ".sr2"]
        return imageExtensions.indexOf(extension) >= 0
    }

    const fetchAttachmentDetail = async () => {
        if (attachmentId) {
            setLoading(true)
            axiosInstance()
                .get(`/attachment/${attachmentId}`)
                .then(({ data: { data } }) => {
                    setCanEdit(data?.canEdit);
                    if (data.file && data.file.length) {
                        let otherAttachments = []
                        let filteredAttachments = []
                        data.file.map(file => {
                            let isImageUrl = checkImageUrl(file.url)
                            if (!isImageUrl) {
                                // data.fileUrl = url
                                otherAttachments.push({ name: file.name, url: file.url })
                            }
                            else {
                                filteredAttachments.push({ name: file.name, url: file.url })
                            }
                        })
                        // setImageAttachments(filteredAttachments)
                        setOtherAttachments([...otherAttachments, ...filteredAttachments])
                    }
                    setInitialValues(data)
                    setFormValues(data)
                    setLoading(false);
                    // setInitialValues({ name: data?.name ?? '', fileUrl: data?.fileUrl ?? '' })
                })
                .catch((error) => {
                    setLoading(false);
                    toastConfig.setToastConfig(error);
                });

        }
        else {
            setInitialValues({ name: "", fileUrl: "" })
            setFormValues({ name: "", fileUrl: "" })
        }
    };

    const showSuccessMessage = (message) => {
        toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: message,
        });
    }

    const handleSave = (values) => {
        let request = {
            name: values.name,
            file: values["fileUrl"] ? [...imageAttachments, ...otherAttachments, ...fileImageAttachments] : [...imageAttachments],
            relatedTo: relatedTo
        }
        setLoading(true);
        if (attachmentId) {
            axiosInstance()
                .put(`/attachment/${attachmentId}`, request)
                .then(({ data }) => {
                    showSuccessMessage(data.message)
                    setLoading(false);
                    // setInitialValues(null)
                    handleClose()
                    if (fetchData) fetchData()
                })
                .catch((error) => {
                    setLoading(false);
                    toastConfig.setToastConfig(error);
                });
        }
        else {
            axiosInstance()
                .post(`/attachment`, request)
                .then(({ data }) => {
                    showSuccessMessage(data.message)
                    setLoading(false);
                    handleClose()
                    if (fetchData) fetchData()
                })
                .catch((error) => {
                    setLoading(false);
                    toastConfig.setToastConfig(error);
                });
        }
    };

    const downloadFile = (event, file) => {
        if (event) {
            toastConfig.setToastConfig({
                open: true,
                type: "info",
                message: `Downloading, Please wait...`,
            });
        }
        setDownloadProgress(0);
        setIsDownloading(true);
        axiosInstance()
            .get(`user/download?fileName=${file.url}`, {
                responseType: "blob",
                onDownloadProgress: (progressEvent) => {
                    let percentCompleted = Math.floor(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setDownloadProgress(percentCompleted);

                    if (percentCompleted === 100) {
                        toastConfig.setToastConfig({
                            message: "File Downloaded Successfully",
                            open: true,
                            type: "success",
                        });
                        setTimeout(() => {
                            setDownloadProgress(0);
                            setIsDownloading(false);
                        }, 2000);
                    }
                },
            })
            .then(({ data }) => {
                const url = window.URL.createObjectURL(new Blob([data]));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", file.url);
                document.body.appendChild(link);
                link.click();
                setTimeout(() => setIsDownloading(false), 2000);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
                setIsDownloading(false);
            });
    };
    const onUploadFile = file => {
        setOtherAttachments((prevState) => ([...prevState, { name: file.split("_")[3] || file, url: file }]))
    }
    const handleDeleteAttachment = (file) => {
        setOtherAttachments(otherAttachments.filter(current => current?.url !== file.url))
        setAttachemnetToDelete("");
        setShowConfirmationDialog(false)
    }
    const getFileIconSrc = file => {
        if (file) {
            let extension = file.substring(file.lastIndexOf("."),).toLowerCase()
            let data = fileIcons.find(o => (o.extensions.indexOf(extension) >= 0))
            if (data && data?.source) return data.source
        }
    }
    const renderFileThumbnails = (
        <Grid container spacing={1} className={emailStyles.createEmailContainer}>
            {
                otherAttachments && otherAttachments.length > 0 ?
                    <>
                        {otherAttachments.map((attachment, i) => {
                            return <>
                                <Grid item key={i} sm={3} xs={3} md={3} xl={3}>
                                    <Paper className={emailStyles.fileContainer}>
                                        <img src={getFileIconSrc(attachment.url)}
                                            className={emailStyles.file}
                                            alt="attchment" />
                                        <Typography noWrap variant="body2" >
                                            {attachment ? attachment?.name ? attachment?.name : attachment.url.substring(attachment.url.lastIndexOf("/") + 1,) : "attachment"}
                                        </Typography>
                                        < div className={emailStyles.fileOverlay}>
                                            <Typography variant="subtitle2" >
                                                {attachment ? attachment?.name ? attachment?.name : attachment.url.substring(attachment.url.lastIndexOf("/") + 1,) : "attachment"}
                                            </Typography>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '50%', float: 'right', bottom: '0' }}>
                                                {attachmentId ? <>
                                                    <IconButton
                                                        onClick={(event) => downloadFile(event, attachment)}
                                                        style={{ paddingBottom: '1px' }}>
                                                        {
                                                            // <a href={`${attachment}`}
                                                            //     download={true}>
                                                            //     <GetAppIcon />
                                                            // </a>
                                                            <GetAppIcon />
                                                        }
                                                    </IconButton>
                                                    {canEdit ? <IconButton >
                                                        {
                                                            <DeleteIcon color='error'
                                                                onClick={() => {
                                                                    setShowConfirmationDialog(true)
                                                                    // handleDeleteAttachment(attachment)
                                                                    setAttachemnetToDelete(attachment)
                                                                }}
                                                            />
                                                        }
                                                    </IconButton> :
                                                        <Tooltip
                                                            className='cursor-stop'
                                                            title="Signed quote attachments can not be deleted"
                                                        >
                                                            <IconButton>
                                                                <DeleteIcon color='disabled' />
                                                            </IconButton>
                                                        </Tooltip>
                                                    }
                                                </> :
                                                    <IconButton >
                                                        {
                                                            <DeleteIcon color='error'
                                                                onClick={() => handleDeleteAttachment(attachment)}
                                                            />
                                                        }
                                                    </IconButton>}

                                            </div>
                                        </div>
                                    </Paper>
                                </Grid>
                            </>
                        })
                        }
                    </>
                    : null
            }
        </Grid >
    )
    const isFieldNotTouched = (initialValues, values) => {
        return (Object.values(initialValues).toString() === Object.values(values).toString())

    }
    const handleValuesChange = (data) => {
        setFormValues((prevState) => ({
            ...prevState,
            ...data
        }))
    }

    return (initialValues && <Formik initialValues={initialValues}
        validationSchema={AttachmentSchema}
        onSubmit={handleSave}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
            <>
                <CustomDialogHeader
                    onClose={() => {
                        if (isFieldNotTouched(initialValues, formValues)) handleClose()
                        else setShowConfirmDialog(true)
                    }}
                    title={`${attachmentId ? "Edit" : "New"} Attachment`}
                    isMinimized={isMinimized}
                    onMinimizeMaximize={onMinimizeMaximize}
                    showManimizeMaximize={showManimizeMaximize}
                ></CustomDialogHeader>
                <CustomDialogContent>
                    <Form autoComplete="off" autoCorrect="off" noValidate>
                        {/*<h2 className="form-label-style" style={{ borderBottom: "none" }}>* Required Fields</h2>*/}
                        <Box padding={1}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField
                                        variant="outlined"
                                        type="text"
                                        label="Name"
                                        required={true}
                                        disabled={!canEdit}
                                        name="name"
                                        fullWidth
                                        margin="dense"
                                        value={values["name"]}
                                        error={touched["name"] && Boolean(errors["name"])}
                                        helperText={touched["name"] && errors["name"]}
                                        onChange={(e) => {
                                            setFieldValue("name", e.target.value.trimStart())
                                            handleValuesChange({ name: e.target.value.trimStart() })
                                        }}
                                    />
                                </Grid>
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
                                                setFieldValue("fileUrl", file)
                                                handleValuesChange({ fileUrl: file })
                                                onUploadFile(file)
                                            }}
                                            doNotShowUploadedFile={true}
                                            imageOrFileUploadCompletePercentage={(completePercentage) => {
                                                setUploadingImageOrFileProgress(completePercentage);
                                            }}
                                        />

                                    </Grid>
                                    {renderFileThumbnails}


                                    {/* {attachments.length > 0 && 
                                    <Grid item xs={10} sm={11} md={11}>
                                        <ul>
                                        {attachments.map((attachment, index)=>(
                                            
                                                <li>{attachment}
                                                {attachment && <span>
                                                    <IconButton onClick={() => delete attachments[index] }>
                                                        {
                                                            <DeleteIcon color='error' />

                                                        }
                                                    </IconButton>
                                                </span>}
                                                </li>
                                        ))}
                                        </ul>
                                    </Grid>
                                    }
                                     */}
                                    {/* <Grid item xs={2} sm={1} md={1}>
                                        {
                                            attachmentId && values?.fileUrl ?
                                                (isDownloading ? (
                                                    <Box display="flex" alignItems="center">
                                                        {downloadProgress === 100
                                                            ? "Downloaded"
                                                            : "Downloading"}

                                                        <Box
                                                            marginLeft={1}
                                                            position="relative"
                                                            display="inline-flex"
                                                        >
                                                            <CircularProgress
                                                                size={37}
                                                                variant="determinate"
                                                                value={downloadProgress}
                                                            />
                                                            <Box
                                                                top={0}
                                                                left={0}
                                                                bottom={0}
                                                                right={0}
                                                                position="absolute"
                                                                display="flex"
                                                                alignItems="center"
                                                                justifyContent="center"
                                                            >
                                                                <Typography
                                                                    variant="caption"
                                                                    component="div"
                                                                    color="textSecondary"
                                                                >{`${downloadProgress}%`}</Typography>
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                ) : <IconButton
                                                    title="Download"
                                                    size="small"
                                                    color="primary" 
                                                    aria-label="download picture"
                                                    component="span"
                                                    onClick={() => downloadFile(initialValues.fileUrl)}>
                                                    <GoArrowDown size={26}/>
                                                </IconButton>) : null
                                        }
                                    </Grid> */}
                                </Grid>
                            </Grid>
                        </Box>
                    </Form>
                </CustomDialogContent>
                <CustomDialogFooter>
                    <Button color="primary" size="small"
                        onClick={() => {
                            if (isFieldNotTouched(initialValues, values)) handleClose()
                            else setShowConfirmDialog(true)
                        }}>Cancel</Button>
                    {
                        canEdit &&
                        <CustomButton
                            type="button"

                            color="primary"
                            disabled={loading || uploadingImageOrFileProgress > 0 || otherAttachments.length === 0}
                            loading={loading}
                            variant="contained" onClick={submitForm}>
                            Save
                        </CustomButton>}
                </CustomDialogFooter>
                {
                    showConfirmDialog ?
                        <ConfirmCancelDialog
                            close={() => setShowConfirmDialog(false)}
                            open={showConfirmDialog}
                            onSave={() => {
                                setShowConfirmDialog(false)
                                submitForm()
                            }}
                            onClose={() => {
                                setShowConfirmDialog(false)
                                handleClose()
                            }}
                        /> : null
                }
                {
                    open ?
                        <ImagePreview
                            open={open}
                            aria-labelledby="customized-dialog-title"
                            // heading="image preview"
                            heading={imageSource ? imageSource.substring(imageSource.lastIndexOf("/") + 1,) : "image preview"}
                            close={() => {
                                setImageSource(null)
                                setOpen(false)
                            }}
                            image={imageSource}
                        /> : null
                }
                {
                    showConfirmationDialog &&
                    <ConfirmationDialog
                        open={showConfirmationDialog}
                        message="Are you sure you want to delete this attachment?"
                        onClose={() => {
                            setShowConfirmationDialog(false);
                        }}
                        onOk={() => handleDeleteAttachment(attachmentToDelete)}
                    />
                }

            </>
        )
        }
    </Formik >
    );
}

ManageAttachment.propTypes = {
    relatedTo: PropTypes.any,
    attachmentId: PropTypes.any,
    handleClose: PropTypes.any
}