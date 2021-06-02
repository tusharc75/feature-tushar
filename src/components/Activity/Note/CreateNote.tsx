import React, { useState, useEffect, Fragment } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Formik, Form, Field } from "formik";
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import TextField from '@material-ui/core/TextField';
import * as Yup from "yup";
import { GetNote, CreateNewNote, UpdateNote, GetNoteDetail } from "../../../axios/activity";
import moment from "moment";
import RichTextEditor from 'react-rte';
import axiosInstance from '../../../axios/axiosInstance';
import { BsFillImageFill } from 'react-icons/bs'
import { makeStyles } from '@material-ui/core/styles';
import { RelatedToDispay } from '../Helpers/RelatedToDispay'
import PropTypes from 'prop-types'
import emailStyles from "../../../pages/Activity/Email/email.module.scss"
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import FormTypes from "../../Helpers/FormTypes";
import { fileURLToPath } from "url";
import { IconButton, Paper } from "@material-ui/core";
import { csvIcon, docIcon, textFile1Icon, textFileIcon, pdfFileIcon, pptIcon, excelSheetIcon } from "../../../assets/file_icons/index"
import { GoArrowDown } from "react-icons/go";
import DeleteIcon from "@material-ui/icons/Delete";
import ImageAttachments from "../Email/ImageAttachments";
import ImagePreview from "../Email/ImagePreview";


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

export const CreateNote = ({ relatedTo, noteId, handleClose }) => {

    const [initialValues, setInitialValues] = useState(null);
    const [fileImageAttachments, setFileImageAttachments] = useState([])
    const [imageAttachments, setImageAttachments] = useState([])
    const [otherAttachments, setOtherAttachments] = useState([])
    const [isUploading, setUploading] = useState(false);
    const [imageSource, setImageSource] = useState(null);
    const [open, setOpen] = useState(false)

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
                    data.description = RichTextEditor.createValueFromString(data.description, 'html')
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
            setInitialValues({ name: "", description: RichTextEditor.createEmptyValue(), fileUrl: '' })
        }
    };

    const handleSave = (values) => {
        const description = values.description.toString('html');
        values.relatedTo = relatedTo;
        values.description = description;
        values.fileUrl = values["fileUrl"] ? [...imageAttachments, ...otherAttachments, ...fileImageAttachments] : [...imageAttachments]
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
                                            <span style={{display:'flex'}}>
                                            <IconButton >
                                                {
                                                    <a href={`${attachment}`}
                                                    download={true}>
                                                    <GoArrowDown color="green" size={21} />
                                                </a>
                                                }
                                            </IconButton>
                                            <IconButton >
                                                {
                                                       <DeleteIcon className={emailStyles.deleteIcon} color='error'
                                                        onClick={() => handleDeleteAttachment(attachment)}
                                                    />
                                                }
                                            </IconButton>
                                            </span>
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
        {({ submitForm, touched, errors, setFieldValue, values }) => (
            <>
                <CustomDialogHeader onClose={handleClose} title={`${noteId ? "Edit" : "New"} Note`}></CustomDialogHeader>
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
                                        <Box margin={0.5} />
                                        <Grid item xs={10}>
                                            <FormTypes
                                                label="File"
                                                name="fileUrl"
                                                required={true}
                                                type="fileUpload"
                                                values={values}
                                                errors={errors}
                                                touched={touched}
                                                size="small"
                                                setFieldValue={(fname, file) => {
                                                    setFieldValue("fileUrl", file)
                                                    onUploadFile(file)
                                                }}
                                                usePublicUrlforFileUpload={true}
                                                doNotShowUploadedFile={true}
                                            />
                                        </Grid>
                                        {renderFileThumbnails}
                                        <ImageAttachments
                                            imageAttachments={fileImageAttachments}
                                            onImageClick={(attachment) => {
                                                setImageSource(attachment)
                                                setOpen(true)
                                            }}
                                            onDelete={handleDeleteFileImageAttachment}
                                            emailId={noteId}
                                        />
                                        <Box mt={2}>
                                            <RichTextEditor
                                                className={classes.textEditor}
                                                value={values["description"]}
                                                onChange={(value) => setFieldValue("description", value)}
                                                customControls={[
                                                    <button type="button"
                                                        className={emailStyles.emailRichTextEditorCustomControls}
                                                    >
                                                        <label htmlFor="avatar">
                                                            <IconButton
                                                                title="Add picture"
                                                                size="small"
                                                                aria-label="upload picture"
                                                                component="span">
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
                                                                        zIndex: -1
                                                                    }}
                                                                    onClick={(e: any) => (e.target.value = null)}
                                                                    type="file"
                                                                />
                                                            </IconButton>
                                                        </label>
                                                    </button>
                                                ]}
                                            />
                                            <ImageAttachments
                                                imageAttachments={imageAttachments}
                                                onImageClick={(attachment) => {
                                                    setImageSource(attachment)
                                                    setOpen(true)
                                                }}
                                                onDelete={handleDeleteImageAttachment}
                                                emailId={noteId}
                                            />
                                        </Box>

                                        {noteId && <Fragment>
                                            {/* {renderFileThumbnails}
                                            <ImageAttachments
                                                imageAttachments={imageAttachments}
                                                onImageClick={(attachment) => {
                                                    setImageSource(attachment)
                                                    setOpen(true)
                                                }}
                                                onDelete={handleDeleteImageAttachment}
                                                emailId={noteId}
                                                isRenderedFromNote={true}
                                            /> */}
                                            <Box mt={2}>
                                                <RelatedToDispay relatedTo={initialValues.relatedTo} />
                                            </Box>
                                            {initialValues.createdBy && initialValues.createdBy.date && <Box mt={1} color="text.secondary">
                                                <Typography variant="body2">Created {moment(initialValues.createdBy.date).format("MMM DD YYYY hh:mm A")}</Typography>
                                            </Box>}
                                            {initialValues.updatedBy && initialValues.updatedBy.date && <Box mt={1} color="text.secondary">
                                                <Typography variant="body2">Updated {moment(initialValues.updatedBy.date).format("MMM DD YYYY hh:mm A")}</Typography>
                                            </Box>}
                                        </Fragment>}
                                    </Grid>
                                </Grid>
                            </Box>
                        </MuiPickersUtilsProvider>
                    </Form>
                </CustomDialogContent>
                <CustomDialogFooter>
                    <Button size="small" color="primary" onClick={handleClose}>Cancel</Button>
                    <Button size="small" type="button" color="primary" variant="contained" onClick={submitForm}>Save </Button>
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
    handleClose: PropTypes.any
}