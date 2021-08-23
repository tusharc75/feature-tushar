import React, { useState, useEffect, Fragment } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Formik, Form } from "formik";
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import TextField from '@material-ui/core/TextField';
import * as Yup from "yup";
import { CreateNewNote, UpdateNote, GetNoteDetail } from "../../../axios/activity";
import RichTextEditor from 'react-rte';
import axiosInstance from '../../../axios/axiosInstance';
import { makeStyles } from '@material-ui/core/styles';
import { RelatedToDispay } from '../Helpers/RelatedToDispay'
import PropTypes from 'prop-types'
import emailStyles from "../../../pages/Activity/Email/email.module.scss"
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import FormTypes from "../../Helpers/FormTypes";
import { IconButton, Paper } from "@material-ui/core";
import { csvIcon, docIcon, textFileIcon, pdfFileIcon, pptIcon, excelSheetIcon } from "../../../assets/file_icons/index"
import DeleteIcon from "@material-ui/icons/Delete";
import GetAppIcon from '@material-ui/icons/GetApp';
import ImageAttachments from "../Email/ImageAttachments";
import ImagePreview from "../Email/ImagePreview";
import { displayDate } from "../../../constants/helpers"
import TinyMce from "../../../components/TinyMCE"

const NoteSchema = Yup.object().shape({
    name: Yup.string()
        .required("please enter note title"),
});

const useStyles = makeStyles((theme) => ({
    textEditor: {
        fontFamily: "inherit",
        minHeight: 250
    }
}));
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
    }
]

export const CreateNote = ({ relatedTo, noteId, handleClose, handleDialogClose }) => {

    const [initialValues, setInitialValues] = useState(null);
    const [fileImageAttachments, setFileImageAttachments] = useState([])
    const [imageAttachments, setImageAttachments] = useState([])
    const [otherAttachments, setOtherAttachments] = useState([])
    const [isUploading, setUploading] = useState(false);
    const [imageSource, setImageSource] = useState(null);
    const [open, setOpen] = useState(false)
    const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0)

    useEffect(() => {
        fetchNoteDetail();
    }, []);
    const checkImageUrl = (url) => {
        let extension = url.substring(url.lastIndexOf("."),).toLowerCase()
        let imageExtensions = [".tif", "tiff", ".bmp", ".jpg", "jpeg", ".gif", ".png", ".eps", ".raw", ".cr2", ".nef", ".orf", ".sr2"]
        return imageExtensions.indexOf(extension) >= 0
    }
    const fetchNoteDetail = async () => {
        if (noteId) {
            await GetNoteDetail(noteId)
                .then(({ data }) => {
                    if (data.fileUrl && data.fileUrl.length) {
                        let otherAttachments = []
                        let filteredAttachments = data.fileUrl.filter(url => {
                            let isImageUrl = checkImageUrl(url)
                            if (!isImageUrl) {
                                data.file = url
                                otherAttachments.push(url)
                            }
                            return isImageUrl
                        })
                        setImageAttachments(filteredAttachments)
                        setOtherAttachments([...otherAttachments])
                    }
                    setInitialValues(data)
                })
                .catch((err) => {
                });
        }
        else {
            setInitialValues({ name: "", description: "", fileUrl: '' })
        }
    };

    const handleSave = (values) => {
        const description = values.description.toString('html');
        values.relatedTo = relatedTo;
        values.description = description;
        values.fileUrl = (otherAttachments.length || fileImageAttachments.length) ?
            [...imageAttachments, ...otherAttachments, ...fileImageAttachments] : [...imageAttachments]
        if (noteId) {
            UpdateNote(noteId, values)
                .then(({ data }) => {
                    setInitialValues(null)
                    handleClose()
                })
                .catch((err) => {
                });
        }
        else {
            CreateNewNote(values)
                .then(({ data }) => {
                    handleClose()
                })
                .catch((err) => {
                });
        }
    };
    const handleUploadImage = (event) => {
        if (event.target.files && event.target.files.length) {
            const file = event.target.files[0];
            getImageUrl(file);
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
                setImageAttachments((prevState) => ([...prevState, data.fileUrl]));
                setUploading(false);
            })
            .catch((err) => {
                setUploading(false);
                // toastConfig.setToastConfig(err);
            });
    };
    const onUploadFile = file => {
        if (checkImageUrl(file)) {
            setFileImageAttachments((prevState) => ([...prevState, file]));
        }
        else {
            setOtherAttachments((prevState) => ([...prevState, file]))
        }
    }

    const handleDeleteAttachment = (url) => {
        setOtherAttachments(otherAttachments.filter(currentUrl => currentUrl !== url))
    }

    const handleDeleteImageAttachment = (url) => {
        setImageAttachments(imageAttachments.filter(currentUrl => currentUrl !== url))
    }
    const handleDeleteFileImageAttachment = url => {
        setFileImageAttachments(fileImageAttachments.filter(currentUrl => currentUrl !== url))
    }

    const getFileIconSrc = file => {
        let extension = file.substring(file.lastIndexOf("."),).toLowerCase()
        let data = fileIcons.find(o => (o.extensions.indexOf(extension) >= 0))
        if (data && data?.source) return data.source
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
                                        <img src={getFileIconSrc(attachment)}
                                            className={emailStyles.file}
                                            alt="attchment" />
                                        <Typography noWrap variant="body2" >
                                            {attachment ? attachment.substring(attachment.lastIndexOf("/") + 1,) : "attachment"}
                                        </Typography>
                                        < div className={emailStyles.fileOverlay}>
                                            <Typography variant="subtitle2" >
                                                {attachment ? attachment.substring(attachment.lastIndexOf("/") + 1,) : "attachment"}
                                            </Typography>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '50%', float: 'right', bottom: '0' }}>
                                                {noteId ? <>
                                                    <IconButton style={{ paddingBottom: '1px' }}>
                                                        {
                                                            <a href={`${attachment}`}
                                                                download={true}>
                                                                <GetAppIcon />
                                                            </a>
                                                        }
                                                    </IconButton>
                                                    <IconButton >
                                                        {
                                                            <DeleteIcon color='error'
                                                                onClick={() => handleDeleteAttachment(attachment)}
                                                            />
                                                        }
                                                    </IconButton>
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

    const classes = useStyles();
    return (initialValues && <Formik initialValues={initialValues} validationSchema={NoteSchema} onSubmit={handleSave}>
        {({ submitForm, touched, errors, setFieldValue, values, setFieldTouched, setFieldError }) => (
            <>
                <CustomDialogHeader onClose={handleDialogClose} title={`${noteId ? "Edit" : "New"} Note`}></CustomDialogHeader>
                <CustomDialogContent>
                    <Form autoComplete="off" autoCorrect="off" noValidate >
                        <MuiPickersUtilsProvider utils={MomentUtils}>
                            <Box padding={1}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <TextField
                                            variant="outlined"
                                            type="text"
                                            label="Note Title"
                                            required={true}
                                            name="name"
                                            fullWidth
                                            margin="dense"
                                            value={values["name"]}
                                            error={touched["name"] && Boolean(errors["name"])}
                                            helperText={touched["name"] && errors["name"]}
                                            onChange={(e) => setFieldValue("name", e.target.value.trimStart())}
                                        />
                                        {renderFileThumbnails}
                                        <ImageAttachments
                                            imageAttachments={fileImageAttachments}
                                            onImageClick={(attachment) => {
                                                setImageSource(attachment)
                                                setOpen(true)
                                            }}
                                            onDelete={handleDeleteFileImageAttachment}
                                            emailId={noteId}
                                            isRenderedFrom={true}
                                        />
                                        <ImageAttachments
                                            imageAttachments={imageAttachments}
                                            onImageClick={(attachment) => {
                                                setImageSource(attachment)
                                                setOpen(true)
                                            }}
                                            onDelete={handleDeleteImageAttachment}
                                            emailId={noteId}
                                            isRenderedFrom={true}
                                        />
                                        <Box >
                                            <TinyMce
                                                onChange={(value) => {
                                                    setFieldValue("description", value)
                                                }}
                                                initialValue={initialValues?.description}
                                                imageOrFileUploadCompletePercentage={(
                                                    completePercentage
                                                ) => {
                                                    setUploadingImageOrFileProgress(
                                                        completePercentage
                                                    );
                                                }}
                                                // doNotShowUploadFile={true : false}
                                                onUploadFile={onUploadFile}
                                                onUploadImage={handleUploadImage}
                                                usePublicUrlforFileUpload={true}
                                            />
                                        </Box>

                                        {noteId && <Fragment>

                                            {
                                                initialValues.relatedTo && initialValues.relatedTo.length ?
                                                    <Box mt={2}>
                                                        <RelatedToDispay relatedTo={initialValues.relatedTo} />
                                                    </Box> : null
                                            }
                                            {initialValues.createdBy && initialValues.createdBy.date && <Box mt={1} color="text.secondary">
                                                <Typography variant="body2">Created {displayDate(initialValues.createdBy.date)}</Typography>
                                            </Box>}
                                            {initialValues.updatedBy && initialValues.updatedBy.date && <Box mt={1} color="text.secondary">
                                                <Typography variant="body2">Updated {displayDate(initialValues.updatedBy.date)}</Typography>
                                            </Box>}
                                        </Fragment>}
                                    </Grid>
                                </Grid>
                            </Box>
                        </MuiPickersUtilsProvider>
                    </Form>
                </CustomDialogContent>
                <CustomDialogFooter>
                    <Button size="small" type="button" color="primary" onClick={handleDialogClose}>Cancel</Button>
                    <Button size="small" type="button" color="primary" variant="contained"
                        onClick={() => {

                            if (Object.keys(errors).length) {
                                Object.keys(errors).map(k => {
                                    setFieldTouched(k, true)
                                })
                            }
                            else submitForm()
                        }}
                        disabled={uploadingImageOrFileProgress > 0}>Save</Button>
                </CustomDialogFooter>
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
            </>

        )}
    </Formik>


    );

}

CreateNote.propTypes = {
    relatedTo: PropTypes.any,
    taskId: PropTypes.any,
    handleClose: PropTypes.any,
    handleDialogClose: PropTypes.any
}