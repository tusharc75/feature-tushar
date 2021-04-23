import React, { useState, useEffect, useContext } from "react";
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { TextField as TextFieldFormik } from "formik-material-ui";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import Dialog from '@material-ui/core/Dialog';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import axiosInstance from "../../../axios/axiosInstance";
import CustomButton from "../../../components/Helpers/CustomButton";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";

const updatePassWordSchema = Yup.object().shape({
    oldPassword: Yup.string()
        .required("please enter Old Password"),
    newPassword: Yup.string()
        .required("please enter New Password"),
    confirmPassword: Yup.string()
        .required("please enter Confirm Password"),

});

const updateEmailSchema = Yup.object().shape({
    email: Yup.string()
        .required("please enter valid email"),

});

export default function ManageUpdatePassword({
    open,
    onClose,
    isUpdatePassword = false,
    isUpdateEmail = false,
    userData = null,
    onFetchUserData
}) {
    const toastConfig = useContext(CustomToastContext);
    const [loading, setLoading] = useState(false)

    const handleSubmit = (values, setFieldError, setFieldTouched) => {

        if (values.newPassword !== values.confirmPassword) {
            setFieldError("confirmPassword", "new and confirm password should be same")
            setFieldTouched("confirmPassword", true)
        }

        if (isUpdatePassword) {
            delete values["confirmPassword"]
            setLoading(true)
            axiosInstance()
                .put(`/user/me/password`, { ...values })
                .then(({ data }) => {
                    toastConfig.setToastConfig({
                        open: true,
                        type: "success",
                        message: data.message,
                    });
                    setLoading(false)
                    onClose()
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                    setLoading(false)
                });
        }
        else if (isUpdateEmail) {
            setLoading(true)
            axiosInstance()
                .put(`/user/me/email`, { email: values.email })
                .then(({ data }) => {
                    toastConfig.setToastConfig({
                        open: true,
                        type: "success",
                        message: data.message,
                    });
                    setLoading(false)
                    onClose()
                    onFetchUserData()
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                    setLoading(false);
                });
        }
    }
    return (
        <Dialog
            maxWidth="md"
            aria-labelledby="customized-dialog-title"
            onClose={onClose}
            open={open}
            disableBackdropClick={true}
        >
            <CustomDialogHeader
                title={isUpdateEmail ? "Update Email" : "Update Password"}
                onClose={onClose}
            />
            <Formik
                validateOnMount
                onSubmit={() => { }}
                initialValues={isUpdateEmail ? { email: userData?.email ?? '' } :
                    { oldPassword: "", newPassword: "", confirmPassword: "" }}
                validationSchema={isUpdateEmail ? updateEmailSchema : updatePassWordSchema}
            >
                {({
                    values,
                    errors,
                    touched,
                    setFieldValue,
                    setFieldError,
                    setFieldTouched,
                    setErrors,
                    setValues,
                }) => (
                    <>
                        <CustomDialogContent>
                            <Form>
                                <div>
                                    <Box marginY={2}>
                                        <Grid spacing={3} container>
                                            {
                                                isUpdatePassword ?
                                                    <>
                                                        <Grid item sm={8}>
                                                            <Field
                                                                component={TextFieldFormik}
                                                                fullWidth
                                                                margin="dense"
                                                                type="text"
                                                                label="Old Password"
                                                                name="oldPassword"
                                                                variant="outlined"
                                                                required={true}
                                                                value={values["oldPassword"]}
                                                                onChange={(e) => setFieldValue("oldPassword", e.target.value.trimStart())}
                                                            />
                                                        </Grid>
                                                        <Grid item sm={8}>
                                                            <Field
                                                                component={TextFieldFormik}
                                                                fullWidth
                                                                margin="dense"
                                                                type="password"
                                                                label="New Password"
                                                                name="newPassword"
                                                                variant="outlined"
                                                                required={true}
                                                                value={values["newPassword"]}
                                                                onChange={(e) => setFieldValue("newPassword", e.target.value.trimStart())}
                                                            />
                                                        </Grid>
                                                        <Grid item sm={8}>
                                                            <Field
                                                                component={TextFieldFormik}
                                                                fullWidth
                                                                margin="dense"
                                                                type="password"
                                                                label="Confirm Password"
                                                                name="confirmPassword"
                                                                variant="outlined"
                                                                required={true}
                                                                value={values["confirmPassword"]}
                                                                onChange={(e) => {
                                                                    setFieldValue("confirmPassword", e.target.value.trimStart())
                                                                }}
                                                            />
                                                        </Grid>
                                                    </>
                                                    : null}
                                            {
                                                isUpdateEmail ? <Grid item sm={12}>
                                                    <Field
                                                        component={TextFieldFormik}
                                                        style={{ width: '400px' }}
                                                        fullWidth
                                                        margin="dense"
                                                        type="email"
                                                        label="Email"
                                                        name="email"
                                                        variant="outlined"
                                                        required={true}
                                                        value={values["email"]}
                                                        onChange={(e) => setFieldValue("email", e.target.value.trimStart())}
                                                    />
                                                </Grid> : null
                                            }
                                        </Grid>
                                    </Box>
                                </div>
                            </Form>
                        </CustomDialogContent>
                        <CustomDialogFooter>
                            <Button
                                type="button"
                                variant="outlined"
                                color="primary"
                                onClick={onClose}>Cancel</Button>

                            <CustomButton
                                loading={loading}
                                variant="contained"
                                color="primary"
                                type="submit"
                                disabled={isUpdateEmail && values.email === userData.email || false}
                                onClick={() => handleSubmit(values, setFieldError, setFieldTouched)}>
                                Update
                            </CustomButton>
                        </CustomDialogFooter>
                    </>
                )}
            </Formik>
        </Dialog >
    );
}

