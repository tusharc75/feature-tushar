
import React, { useState, useEffect, useContext } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { TextField as TextFieldFormik, Select } from "formik-material-ui";
import { Formik, Form, Field } from "formik";
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import * as Yup from "yup";
import { makeStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import axiosInstance from "../../axios/axiosInstance";
import FormTypes from '../../components/Helpers/FormTypes'
import CustomButton from "../../components/Helpers/CustomButton";
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import {
    EditorState,
    convertToRaw,
    convertFromRaw
} from 'draft-js'
import { RichTextEditor } from '../../components/RichEditor/RichEditor'

const termsAndConditionSchema = Yup.object().shape({
    TACName: Yup.string()
        .required("please enter terms and condition title"),
});


const useStyles = makeStyles((theme) => ({
    textEditor: {
        fontFamily: "inherit",
        minHeight: 250
    },
    termAndConditionDialog: {
        height: "100%"
    },
    fileUpload: {
        width: '50%'
    },
    link: {

    }
}));

const TermsAndCondition = ({ handleClose, open, termsAndCondition, fetchData, editRecord }) => {

    const [initialValues, setInitialValues] = useState({ TACName: "", file: "", editorState: EditorState.createEmpty() });
    const [loading, setLoading] = useState(false)
    const classes = useStyles();
    const toastConfig = useContext(CustomToastContext);

    useEffect(() => {
        if (editRecord && editRecord?._id) {
            let state = convertFromRaw(JSON.parse(editRecord.description))
            setInitialValues({
                editorState: EditorState.createWithContent(state),
                TACName: editRecord.TACName,
                file: editRecord?.file ?? ""
            })
        }
    }, [])

    const handleSubmit = (values) => {

        const description = convertToRaw(values.editorState.getCurrentContent())
        let request = {
            description: JSON.stringify(description),
            TACName: values.TACName,
            file: values?.file ?? ""
        }
        setLoading(true)
        if (editRecord?._id) {
            axiosInstance()
                .put(termsAndCondition.api, { ...request, _id: editRecord?._id })
                .then(({ data }) => {
                    toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
                    handleClose()
                    fetchData()
                    setLoading(false)
                }).catch(error => {
                    toastConfig.setToastConfig(error);
                    setLoading(false)
                })
        }
        else {
            axiosInstance()
                .post(termsAndCondition.api, request)
                .then(({ data }) => {
                    toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
                    handleClose()
                    fetchData()
                    setLoading(false)
                }).catch(error => {
                    toastConfig.setToastConfig(error);
                    setLoading(false)
                })
        }
    };


    return <Dialog
        disableBackdropClick={true}
        open={open}
        aria-labelledby="customized-dialog-title"
        maxWidth="lg"
        onClose={handleClose}
        fullWidth
        className={classes.termAndConditionDialog}
    >
        <CustomDialogHeader onClose={handleClose}
            title={`${editRecord?._id ? `Edit ${editRecord?.TACName ?? ''}` : "Create Terms and Condition"}`} ></CustomDialogHeader>
        {
            (initialValues && <Formik initialValues={initialValues}
                validationSchema={termsAndConditionSchema}
                onSubmit={handleSubmit}>
                {({ submitForm, touched, errors, setFieldValue, values
                    , handleBlur
                }) => (
                    <>
                        <CustomDialogContent>
                            <Form noValidate>
                                <MuiPickersUtilsProvider utils={MomentUtils}>
                                    <Box padding={1}>
                                        <Grid container spacing={3}>
                                            <Grid item xs={12}>
                                                <Field
                                                    component={TextFieldFormik}
                                                    fullWidth
                                                    margin="dense"
                                                    type="text"
                                                    label="Terms and Condition Name"
                                                    name="TACName"
                                                    variant="outlined"
                                                    required={true}
                                                    value={values["TACName"]}
                                                    onChange={(e) => setFieldValue("TACName", e.target.value.trimStart())}
                                                />
                                                <Box mt={2} className={classes.fileUpload}>
                                                    <FormTypes
                                                        label="File"
                                                        name="file"
                                                        isTooltip={true}
                                                        required={false}
                                                        type="fileUpload"
                                                        accept="application/pdf,application/msword,
                                                                application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                        values={values}
                                                        errors={errors}
                                                        touched={touched}
                                                        size="small"
                                                        setFieldValue={(name, file) => setFieldValue("file", file)}
                                                    />
                                                </Box>
                                                <Box mt={2} >
                                                    <RichTextEditor
                                                        style={{ minHeight: '350px' }}
                                                        editorState={values.editorState}
                                                        onChange={setFieldValue}
                                                        onBlur={handleBlur}
                                                        placeholder="Terms and Conditions"
                                                    />
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </MuiPickersUtilsProvider>
                            </Form>
                        </CustomDialogContent>
                        <CustomDialogFooter>
                            <Button color="primary" onClick={handleClose}>Cancel</Button>
                            <CustomButton
                                variant="contained"
                                color="primary"
                                loading={loading}
                                onClick={submitForm} >
                                Save
                            </CustomButton>
                        </CustomDialogFooter>
                    </>
                )}
            </Formik>
            )
        }
    </Dialog >
}

export default TermsAndCondition

