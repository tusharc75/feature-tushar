import React, { useState, useEffect, Fragment, useContext } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Formik, Form, Field } from "formik";
import Autocomplete from '@material-ui/lab/Autocomplete';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import TextField from '@material-ui/core/TextField';
import * as Yup from "yup";
import { GetEmailDetail, CreateNewEmail, UpdateEmail } from "../../../axios/activity";
import moment from "moment";
import { RelatedToDispay } from '../Helpers/RelatedToDispay'
import RichTextEditor from 'react-rte';
import { makeStyles } from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';
import Divider from '@material-ui/core/Divider';
import PropTypes from 'prop-types'
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { CircularProgress, IconButton } from "@material-ui/core";
import { UnauthenticatedTemplate, useAccount, useMsal } from "@azure/msal-react";
import { AzureLogin } from "../../Azure/Azure";
import getAzureAcessToken from "../../Azure/getAzureAccessToken";
import { validations } from "../../../constants/helpers";
import { BsFillImageFill } from 'react-icons/bs'
import DeleteIcon from "@material-ui/icons/Delete";
import { GoArrowDown } from "react-icons/go"
import FormTypes from '../../../components/Helpers/FormTypes'
import emailStyles from "../../../pages/Activity/Email/email.module.scss"
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import ImagePreview from "./ImagePreview"
import { AiOutlinePaperClip } from 'react-icons/ai'
import { Paper } from '@material-ui/core'
import Skeleton from '@material-ui/lab/Skeleton';

const emailSchemaHelper = Yup.array().transform(function (value, originalValue) {
    if (this.isType(value) && value !== null) {
        return value;
    }
    return originalValue ? originalValue.split(/[\s,]+/) : [];
}).of(Yup.string().email(({ value }) => `${value} is not a valid email`));

const EmailSchema = Yup.object().shape({
    name: Yup.string()
        .required("please enter subject"),
    to: Yup.array().min(1)
        .transform(function (value, originalValue) {
            if (this.isType(value) && value !== null) {
                return value;
            }
            return originalValue ? originalValue.split(/[\s,]+/) : [];
        })
        .of(Yup.string().email(({ value }) => `${value} is not a valid email`)),
    // to: emailSchemaHelper.min(1),
    // cc: emailSchemaHelper,   //  Commented by punit

});

const useStyles = makeStyles((theme) => ({
    textEditor: {
        fontFamily: "inherit",
        border: 'none',
    },
    box: {
        border: 1
    },
    root: {
        width: "80%",
    },
}));

export const CreateEmail = ({ relatedTo, emailId, handleClose, options = [] }) => {

    const toastConfig = useContext(CustomToastContext);
    const { instance, accounts, inProgress } = useMsal();
    const azureAccount = useAccount(accounts[0] || {});
    const [initialValues, setInitialValues] = useState(null);
    const [isUploading, setUploading] = useState(false);
    const [imageAttachments, setImageAttachments] = useState([])
    const [otherAttachments, setOtherAttachments] = useState([])
    const [open, setOpen] = useState(false);
    const [imageSource, setImageSource] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false)

    const toolbarConfig = {
        display: ['INLINE_STYLE_BUTTONS', 'BLOCK_ALIGNMENT_BUTTONS', 'BLOCK_TYPE_BUTTONS', 'LINK_BUTTONS', 'BLOCK_TYPE_DROPDOWN', 'HISTORY_BUTTONS'],
        INLINE_STYLE_BUTTONS: [
            { label: 'Bold', style: 'BOLD' },
            { label: 'Italic', style: 'ITALIC' },
            { label: 'Underline', style: 'UNDERLINE' },
            { label: 'Strikethrough', style: 'STRIKETHROUGH' },
            { label: 'Monospace', style: 'CODE' },
        ],
        BLOCK_ALIGNMENT_BUTTONS: [
            { label: 'Align Left', style: 'ALIGN_LEFT' },
            { label: 'Align Center', style: 'ALIGN_CENTER' },
            { label: 'Align Right', style: 'ALIGN_RIGHT' },
            { label: 'Align Justify', style: 'ALIGN_JUSTIFY' },
        ],
        BLOCK_TYPE_DROPDOWN: [
            { label: 'Normal', style: 'unstyled' },
            { label: 'Heading Large', style: 'header-one' },
            { label: 'Heading Medium', style: 'header-two' },
            { label: 'Heading Small', style: 'header-three' },
            { label: 'Code Block', style: 'code-block' },
        ],
        BLOCK_TYPE_BUTTONS: [
            { label: 'UL', style: 'unordered-list-item' },
            { label: 'OL', style: 'ordered-list-item' },
            { label: 'Blockquote', style: 'blockquote' },
        ]
    };

    useEffect(() => {
        fetchEmailDetail();
    }, []);

    const checkImageUrl = (url) => {
        let extension = url.substring(url.lastIndexOf("."),).toLowerCase()
        let imageExtensions = [".tif", "tiff", ".bmp", ".jpg", "jpeg", ".gif", ".png", ".eps", ".raw", ".cr2", ".nef", ".orf", ".sr2"]
        return imageExtensions.indexOf(extension) >= 0
    }
    const fetchEmailDetail = async () => {
        if (emailId) {
            setLoading(true)
            await GetEmailDetail(emailId)
                .then(({ data }) => {
                    if (data.attachments && data.attachments.length) {
                        let otherAttachments = []
                        let filteredAttachments = data.attachments.filter(url => {
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
                    setLoading(false)
                    setInitialValues(data)
                })
                .catch((err) => {
                    setLoading(false)
                });
        }
        else {
            setInitialValues({ name: "", file: "", content: RichTextEditor.createEmptyValue(), to: [], cc: [] })
        }
    };

    const handleSave = async (values) => {

        try {
            let payload = {
                relatedTo: relatedTo,
                message: values.content.toString('html'),
                to: values.to,
                cc: values.cc,
                subject: values.name,
                attachment: values["file"] ? [...imageAttachments, ...otherAttachments] : [...imageAttachments]
            }
            if (azureAccount && azureAccount?.username) {
                payload["graphToken"] = await getAzureAcessToken(instance)
                payload["mailbox"] = azureAccount.username
            }

            if (emailId) {
                UpdateEmail(emailId, values)
                    .then(({ data }) => {
                        handleClose()
                    })
                    .catch((err) => {
                        toastConfig.setToastConfig(err);
                    });
            }
            else {
                setSending(true)
                CreateNewEmail(payload)
                    .then((data) => {
                        toastConfig.setToastConfig({
                            open: true,
                            type: "success",
                            message: data.message,
                        });
                        setInitialValues(null)
                        setSending(false)
                        handleClose()
                    })
                    .catch((err) => {
                        setSending(false)
                        console.log(err);
                        toastConfig.setToastConfig(err);
                    });
            }
        } catch (e) {

        }
    };

    const onKeyPress = (event) => {
        if (event.which === 13) {
            event.preventDefault();
        }
    }

    const handleToCcChange = (value) => {
        let val = []
        value.map(currentEmail => {
            let email = typeof currentEmail === 'object' ? currentEmail?.email : currentEmail
            if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(email)) {
                val.push(email)
            }
        })
        return val
    }

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
                toastConfig.setToastConfig(err);
            });
    };
    const handleDeleteAttachment = (url) => {
        setOtherAttachments(otherAttachments.filter(currentUrl => currentUrl !== url))
    }

    const handleDeleteImageAttachment = (url) => {
        setImageAttachments(imageAttachments.filter(currentUrl => currentUrl !== url))
    }

    const classes = useStyles();
    const renderImageAttachments = (
        <Grid container spacing={1} className={emailStyles.createEmailContainer}>
            {
                imageAttachments.length ?
                    <>
                        {imageAttachments.map((attachment, i) => {
                            return <>
                                <Grid item sm={8} xs={12} md={6} xl={6}>
                                    <Paper className={emailStyles.container}>
                                        <img src={attachment} alt="Avatar"
                                            onClick={() => {
                                                setImageSource(attachment)
                                                setOpen(true)
                                            }}
                                            className={emailStyles.image} />
                                        <div className={emailStyles.overlay}>
                                            <IconButton>
                                                {
                                                    emailId ? <a href={`${attachment}`} download={true} >
                                                        <GoArrowDown color="white" size={25} />
                                                    </a> : <DeleteIcon className={emailStyles.deleteIcon}
                                                        onClick={() => handleDeleteImageAttachment(attachment)}
                                                    />
                                                }
                                            </IconButton>
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

    const renderOtherAttachements = (
        <Box mt={2} alignItems="center">
            {
                otherAttachments && otherAttachments.length > 0 ?
                    otherAttachments.map((attachment, i) => (
                        <Fragment key={`attachment${i}`}>
                            <Box alignItems="center" style={{
                                display: 'flex', justifyContent: 'space-between'
                            }}>
                                < AiOutlinePaperClip size={20} />
                                <Box marginX={1} />
                                <Box flex="1" >
                                    <Typography
                                        variant="body2"
                                        style={{ overflowWrap: 'break-word', width: "100%" }}
                                        color="textPrimary">
                                        {
                                            emailId ? <a href={`${attachment}`}
                                                className={emailStyles.emailAttachments} download={emailId ? true : false}>
                                                {attachment}
                                            </a> : attachment
                                        }

                                    </Typography>
                                </Box>
                                {
                                    emailId ? null :
                                        <IconButton
                                            title="Remove File"
                                            color="secondary"
                                            size="small"
                                            aria-label="delete picture"
                                            component="span"
                                            onClick={() => handleDeleteAttachment(attachment)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                }
                            </Box>
                        </Fragment>
                    )) : null
            }
        </Box >
    )

    return <>
        <CustomDialogHeader title={`${emailId ? "View" : "New"} Email`} onClose={handleClose}></CustomDialogHeader>
        {loading ?
            <div className={classes.root}>
                {[...Array(10).keys()].map(i => (
                    <Typography style={{ marginLeft: '20px' }} key={`skeleton${i}`} variant="h5">
                        <Skeleton animation="wave" />
                    </Typography>)
                )}
            </div>
            : initialValues && <Formik initialValues={initialValues} validationSchema={EmailSchema} onSubmit={handleSave} onKeyPress={onKeyPress}>
                {
                    ({ submitForm, touched, errors, setFieldValue, values }) => (
                        <>
                            <CustomDialogContent>
                                <Form autoComplete="off" autoCorrect="off" noValidate >
                                    <MuiPickersUtilsProvider utils={MomentUtils}>

                                        <Box padding={1} >
                                            {emailId ?
                                                <Fragment>
                                                    <Typography variant="subtitle1">Subject : {initialValues.name || initialValues.subject} </Typography>
                                                    <Box mt={1} mb={1}>
                                                        <Typography variant="subtitle1">To : {initialValues.to.join()} </Typography>
                                                    </Box>
                                                    {initialValues.to.length && <Box mt={1} mb={1}>
                                                        <Typography variant="subtitle1">Cc : {initialValues.cc.join() || '----'} </Typography>
                                                    </Box>}
                                                    <Divider />
                                                    <Box mt={2}>
                                                        <div dangerouslySetInnerHTML={{ __html: initialValues.content || initialValues.message }} />
                                                    </Box>
                                                    {renderOtherAttachements}
                                                    {renderImageAttachments}
                                                    <Box mt={2}>
                                                        <RelatedToDispay relatedTo={initialValues.relatedTo} />
                                                    </Box>
                                                    <Box mt={1} color="text.secondary">
                                                        <Typography variant="body2">Sended {moment(initialValues.createdBy.date).format("MMM DD YYYY hh:mm A")}</Typography>
                                                    </Box>
                                                </Fragment> :
                                                <Grid container spacing={3}>
                                                    <Grid item xs={12}>
                                                        <TextField
                                                            variant="outlined"
                                                            type="text"
                                                            label="Subject"
                                                            required={true}
                                                            name="name"
                                                            fullWidth
                                                            margin="dense"
                                                            value={values["name"]}
                                                            error={touched["name"] && Boolean(errors["name"])}
                                                            helperText={touched["name"] && errors["name"]}
                                                            onChange={(e) => setFieldValue("name", e.target.value.trimStart())}
                                                        />
                                                        <Autocomplete
                                                            multiple
                                                            options={options}
                                                            freeSolo
                                                            renderTags={(value, getTagProps) =>
                                                                value.map((option, index) => (
                                                                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                                                                ))
                                                            }
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    variant="outlined"
                                                                    label="To"
                                                                    margin="dense"
                                                                    required={true}
                                                                    error={touched["to"] && Boolean(errors["to"])}
                                                                    helperText={touched["to"] && errors["to"]}
                                                                    placeholder="Email" />
                                                            )}
                                                            value={values["to"]}
                                                            onBlur={(e: any) => {
                                                                if (e.target.value && e.target.value.trim() != "" && validations.email.test(e.target.value)) {
                                                                    setFieldValue("to", [...values["to"], e.target.value])
                                                                }
                                                            }}
                                                            onChange={(e, value) => {
                                                                let val = []
                                                                for (var email of value) {
                                                                    if (validations.email.test(email)) {
                                                                        val.push(email)
                                                                    }
                                                                }
                                                                setFieldValue("to", val)
                                                            }}
                                                        />
                                                        <Autocomplete
                                                            multiple
                                                            options={options}
                                                            freeSolo
                                                            renderTags={(value, getTagProps) =>
                                                                value.map((option, index) => (
                                                                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                                                                ))
                                                            }
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    variant="outlined"
                                                                    label="Cc"
                                                                    margin="dense"
                                                                    error={touched["cc"] && Boolean(errors["cc"])}
                                                                    helperText={touched["cc"] && errors["cc"]}
                                                                    placeholder="Email" />
                                                            )}
                                                            value={values["cc"]}
                                                            onBlur={(e: any) => {
                                                                if (e.target.value && e.target.value.trim() != "" && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(e.target.value)) {
                                                                    setFieldValue("cc", [...values["cc"], e.target.value])
                                                                }
                                                            }}
                                                            onChange={(e, value) => {
                                                                let val = []
                                                                for (var email of value) {
                                                                    if (validations.email.test(email)) {
                                                                        val.push(email)
                                                                    }
                                                                }
                                                                setFieldValue("cc", val)
                                                            }}
                                                        />
                                                        <Box mt={2}>
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
                                                                setFieldValue={(name, file) => {
                                                                    setFieldValue("file", file);
                                                                    setOtherAttachments((prevState) => ([...prevState, file]))
                                                                }}
                                                                usePublicUrlforFileUpload={true}
                                                                doNotShowUploadedFile={true}
                                                            />
                                                        </Box>
                                                        {renderOtherAttachements}

                                                        <Box mt={2} style={{ border: '1px solid #999', minHeight: '220px' }}>
                                                            <RichTextEditor
                                                                style={{ border: "none" }}
                                                                className={classes.textEditor}
                                                                value={values["content"]}
                                                                onChange={(value) => setFieldValue("content", value)}
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
                                                                toolbarConfig={toolbarConfig}
                                                            />
                                                            {renderImageAttachments}
                                                        </Box>
                                                    </Grid>
                                                </Grid>}
                                        </Box>
                                    </MuiPickersUtilsProvider>
                                </Form>
                            </CustomDialogContent>
                            <CustomDialogFooter>
                                {/* <Typography color="textSecondary"> {!emailId && <> Mail will sent from {azureAccount?.username} </>}</Typography> */}
                                <Button color="primary" size="small" onClick={handleClose}>Cancel</Button>
                                {!emailId &&
                                    <Button type="button" size="small" color="primary" variant="contained" disabled={sending}
                                        onClick={(e) => {

                                            e.preventDefault()
                                            submitForm()
                                        }}>
                                        {sending ? (<><CircularProgress color="inherit" size={14} style={{ marginRight: "10px" }} />
                                Sending ... </>) : "send"}
                                    </Button>}
                            </CustomDialogFooter>
                        </>
                    )}
            </Formik>
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

}

CreateEmail.propTypes = {
    relatedTo: PropTypes.any,
    taskId: PropTypes.any,
    handleClose: PropTypes.any,
    options: PropTypes.any,
}