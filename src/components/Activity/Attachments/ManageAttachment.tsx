import React, { useState, useEffect, useContext } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { Formik, Form } from "formik";
import * as Yup from "yup";
import PropTypes from 'prop-types'
import CustomDialogHeader from '../../CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../CustomDialog/CustomDialogFooter';
import FormTypes from '../../Helpers/FormTypes'
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import CustomButton from '../../../components/Helpers/CustomButton'
import TextField from '@material-ui/core/TextField';
import { IconButton, CircularProgress, Typography } from '@material-ui/core'
import { GoArrowDown } from "react-icons/go"

const AttachmentSchema = Yup.object().shape({
    name: Yup.string().required("please add attachment name"),
    fileUrl: Yup.string().required("please upload attachment"),
});

export default function ManageAttachment({ relatedTo, attachmentId, handleClose, fetchData = null, attachmentData = null }) {

    const [initialValues, setInitialValues] = useState(null);
    const [loading, setLoading] = useState(false)
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const toastConfig = useContext(CustomToastContext);
    const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0)

    useEffect(() => {
        fetchNoteDetail();
    }, []);

    const fetchNoteDetail = async () => {
        if (attachmentId) {
            setLoading(true)
            axiosInstance()
                .get(`/attachment/${attachmentId}`)
                .then(({ data: { data } }) => {
                    setLoading(false);
                    setInitialValues({ name: data?.name ?? '', fileUrl: data?.fileUrl ?? '' })
                })
                .catch((error) => {
                    setLoading(false);
                    toastConfig.setToastConfig(error);
                });

        }
        else {
            setInitialValues({ name: "", fileUrl: "" })
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
            fileUrl: values.fileUrl,
            relatedTo: relatedTo
        }
        setLoading(true);
        if (attachmentId) {
            axiosInstance()
                .put(`/attachment/${attachmentId}`, request)
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

    const downloadFile = (fileName) => {
        setDownloadProgress(0);
        setIsDownloading(true);
        axiosInstance()
            .get(`user/download?fileName=${fileName}`, {
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
                link.setAttribute("download", fileName);
                document.body.appendChild(link);
                link.click();
                setTimeout(() => setIsDownloading(false), 2000);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
                setIsDownloading(false);
            });
    };

    return (initialValues && <Formik initialValues={initialValues}
        validationSchema={AttachmentSchema}
        onSubmit={handleSave}>
        {({ submitForm, touched, errors, setFieldValue, values }) => (
            <>
                <CustomDialogHeader onClose={handleClose}
                    title={`${attachmentId ? "Edit" : "New"} Attachment`}></CustomDialogHeader>
                <CustomDialogContent>
                    <Form autoComplete="off" autoCorrect="off" noValidate >
                        <Box padding={1}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField
                                        variant="outlined"
                                        type="text"
                                        label="Name"
                                        required={true}
                                        name="name"
                                        fullWidth
                                        margin="dense"
                                        value={values["name"]}
                                        error={touched["name"] && Boolean(errors["name"])}
                                        helperText={touched["name"] && errors["name"]}
                                        onChange={(e) => setFieldValue("name", e.target.value.trimStart())}
                                    />
                                </Grid>
                                <Grid container item xs={12}>
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
                                            setFieldValue={(fname, file) => setFieldValue("fileUrl", file)}
                                            imageOrFileUploadCompletePercentage={(completePercentage) => {
                                                setUploadingImageOrFileProgress(completePercentage);
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={2}>
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
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Box>
                    </Form>
                </CustomDialogContent>
                <CustomDialogFooter>
                    <Button color="primary" size="small" onClick={handleClose}>Cancel</Button>
                    <CustomButton
                        type="button" color="primary"
                        disabled={loading || uploadingImageOrFileProgress > 0}
                        loading={loading}
                        variant="contained" onClick={submitForm}>Save</CustomButton>
                </CustomDialogFooter>
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