
import React, { useState, useEffect } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { TextField as TextFieldFormik, Select } from "formik-material-ui";
import { Formik, Form, Field } from "formik";
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import * as Yup from "yup";
import RichTextEditor from 'react-rte';
import { makeStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import axiosInstance from "../../axios/axiosInstance";
import CustomButton from "../../components/Helpers/Button";
import FormTypes from '../../components/Helpers/FormTypes'


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
    }
}));

const TermsAndCondition = ({ handleClose, open, termsAndCondition, fetchData, editRecord }) => {

    const [initialValues, setInitialValues] = useState({ TACName: "", file: "", description: RichTextEditor.createEmptyValue() });

    useEffect(() => {
        if (editRecord && editRecord?._id) {
            editRecord.description = RichTextEditor.createValueFromString(editRecord.description, 'html')
            setInitialValues({
                description: editRecord.description,
                TACName: editRecord.TACName,
                file: ""
            })
        }
    }, [])
    const handleSave = (values) => {
        const description = values.description.toString('html');
        values.description = description;

        if (editRecord?._id) {
            axiosInstance()
                .put(termsAndCondition.api, { ...values, _id: editRecord?._id })
                .then(({ data }) => {
                    handleClose()
                    fetchData()
                })
        }
        else {
            axiosInstance()
                .post(termsAndCondition.api, values)
                .then(({ data }) => {
                    handleClose()
                    fetchData()
                })
        }
    };

    const classes = useStyles();
    return <Dialog
        disableBackdropClick={true}
        open={open}
        aria-labelledby="customized-dialog-title"
        maxWidth="lg"
        onClose={handleClose}
        fullWidth
        className={classes.termAndConditionDialog}
    >
        {
            (initialValues && <Formik initialValues={initialValues} validationSchema={termsAndConditionSchema} onSubmit={handleSave}>
                {({ submitForm, touched, errors, setFieldValue, values }) => (
                    <Form noValidate>
                        <CustomDialogHeader onClose={handleClose}
                            title={`${editRecord?._id ? "Edit" : "Create"} Terms and Condition`} ></CustomDialogHeader>
                        <CustomDialogContent>
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
                                                    values={values}
                                                    errors={errors}
                                                    size="small"

                                                />
                                            </Box>
                                            <Box mt={2}>
                                                <RichTextEditor
                                                    className={classes.textEditor}
                                                    value={values["description"]}
                                                    onChange={(value) => setFieldValue("description", value)}
                                                />
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </MuiPickersUtilsProvider>
                        </CustomDialogContent>
                        <CustomDialogFooter>
                            <Button color="primary" onClick={handleClose}>Cancel</Button>
                            <CustomButton
                                variant="contained"
                                color="primary"
                                type="submit" >
                                Save
                            </CustomButton>
                        </CustomDialogFooter>
                    </Form>)}
            </Formik>
            )
        }
    </Dialog >
}

export default TermsAndCondition

