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

const AttachmentSchema = Yup.object().shape({
    name: Yup.string().required("please add attachment name"),
    fileUrl: Yup.string().required("please upload attachment"),
});

export default function ManageAttachment({ relatedTo, attachmentId, handleClose, attachmentData = null }) {

    const [initialValues, setInitialValues] = useState(null);
    const [loading, setLoading] = useState(false)
    const toastConfig = useContext(CustomToastContext);

    useEffect(() => {
        fetchNoteDetail();
    }, []);

    const fetchNoteDetail = async () => {
        if (attachmentId && attachmentData && attachmentData?._id) {
            setInitialValues({ name: attachmentData?.name ?? '', fileUrl: attachmentData?.fileUrl ?? '' })
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
        console.log("handleSave ~ values", values)
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
                })
                .catch((error) => {
                    setLoading(false);
                    toastConfig.setToastConfig(error);
                });
        }
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
                                <Grid item xs={12}>
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
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Form>
                </CustomDialogContent>
                <CustomDialogFooter>
                    <Button color="primary" onClick={handleClose}>Cancel</Button>
                    <CustomButton
                        type="button" color="primary"
                        disabled={loading}
                        loading={loading}
                        variant="contained" onClick={submitForm}>Save</CustomButton>
                    {/* <Button type="button" color="primary"
                        disabled={loading}
                        variant="contained" onClick={submitForm}>Save </Button> */}
                </CustomDialogFooter>
            </>
        )}
    </Formik>
    );
}

ManageAttachment.propTypes = {
    relatedTo: PropTypes.any,
    attachmentId: PropTypes.any,
    handleClose: PropTypes.any
}