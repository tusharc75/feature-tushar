
import React, { useState, useContext, useEffect } from "react";
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
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';


const termsAndConditionSchema = Yup.object().shape({
    TACName: Yup.string()
        .required("please enter note title"),
});


const useStyles = makeStyles((theme) => ({
    textEditor: {
        fontFamily: "inherit",
        minHeight: 250
    }
}));

const TermsAndCondition = ({ handleClose, open, termsAndCondition, fetchData, editRecord }) => {

    const [initialValues, setInitialValues] = useState({ TACName: "", description: RichTextEditor.createEmptyValue() });
    const toastConfig = useContext(CustomToastContext);

    useEffect(() => {
        if (editRecord && editRecord?._id) {
            editRecord.description = RichTextEditor.createValueFromString(editRecord.description, 'html')
            setInitialValues(editRecord)
        }
    }, [])
    const handleSave = (values) => {
        const description = values.description.toString('html');
        values.description = description;

        if (editRecord?._id) {
            delete values["isChecked"]
            delete values["id"]
            axiosInstance()
                .put(termsAndCondition.Api, values)
                .then(({ data }) => {
                    // toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
                    handleClose()
                    fetchData()
                })
                .catch((error) => {
                    // toastConfig.setToastConfig(error);
                });
        }
        else {
            axiosInstance()
                .post(termsAndCondition.Api, values)
                .then(({ data }) => {
                    // toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
                    handleClose()
                    fetchData()
                })
                .catch((error) => {
                    // toastConfig.setToastConfig(error);
                });
        }
    };

    const classes = useStyles();
    return <Dialog
        open={open}
        aria-labelledby="customized-dialog-title"
        maxWidth="md"
        onClose={handleClose}
        fullWidth
    >
        {
            (initialValues && <Formik initialValues={initialValues} validationSchema={termsAndConditionSchema} onSubmit={handleSave}>
                {({ submitForm, touched, errors, setFieldValue, values }) => (
                    <Form>
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
                                            />
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

