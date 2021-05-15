import React, { useState, useContext } from "react";
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { TextField as TextFieldFormik } from "formik-material-ui";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import InputAdornment from '@material-ui/core/InputAdornment'
import Dialog from '@material-ui/core/Dialog';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import axiosInstance from "../../../axios/axiosInstance";
import CustomButton from "../../../components/Helpers/CustomButton";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { IconButton } from "@material-ui/core";
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

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

export default function ManageUpdateEmailAndPassword({
    open,
    onClose,
    isUpdatePassword = false,
    isUpdateEmail = false,
    userData = null,
    onFetchUserData,
    logoutUser
}) {
    const toastConfig = useContext(CustomToastContext);
    const [loading, setLoading] = useState(false)
    const [visibity, setVisibity] = useState({
        oldPassword: false,
        newPassword: false,
        confirmPassword: false
    });

    const toggleVisibility = (key) => {
        setVisibity({ ...visibity, [key]: !visibity[key] })
    }
    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };
    const handleSubmit = (values) => {
        if (isUpdatePassword) {
            // delete values["confirmPassword"]
            setLoading(true)
            axiosInstance()
                .put(`/user/me/password`, { oldPassword: values.oldPassword, newPassword: values.newPassword })
                .then(({ data }) => {
                    toastConfig.setToastConfig({
                        open: true,
                        type: "success",
                        message: data.message,
                    });
                    setLoading(false)
                    logoutUser()
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
                    logoutUser()
                    setLoading(false)
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                    setLoading(false);
                });
        }
    }

    const PasswordEndAdornment = ({ fieldName }) => (
        <InputAdornment position="end" >
            <IconButton
                aria-label="toggle password visibility"
                onClick={() => toggleVisibility(fieldName)}
                onMouseDown={handleMouseDownPassword}
                edge="end"
            >
                {visibity[fieldName] ? <Visibility /> : <VisibilityOff />}
            </IconButton>
        </InputAdornment>
    )
    return (
        <Dialog
            maxWidth="sm"
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
                // onSubmit={handleSubmit}
                onSubmit={() => { }}
                initialValues={isUpdateEmail ? { email: userData?.email ?? '' } :
                    { oldPassword: "", newPassword: "", confirmPassword: "" }}
                validationSchema={isUpdateEmail ? updateEmailSchema : updatePassWordSchema}
            >
                {({
                    values,
                    setFieldValue,
                    setFieldError,
                    setFieldTouched,
                    submitForm,
                    errors,
                    setErrors
                }) => (
                    <>
                        <CustomDialogContent>
                            <Form noValidate>
                                <div>
                                    <Box marginY={2}>
                                        <Grid spacing={3} container>
                                            {
                                                isUpdatePassword ?
                                                    <>
                                                        <Grid style={{ display: "flex" }} item sm={10}>

                                                            <Field
                                                                component={TextFieldFormik}
                                                                fullWidth
                                                                margin="dense"
                                                                type={visibity["oldPassword"] ? "string" : "password"}
                                                                label="Old Password"
                                                                name="oldPassword"
                                                                variant="outlined"
                                                                required={true}
                                                                value={values["oldPassword"]}
                                                                onChange={(e) => setFieldValue("oldPassword", e.target.value)}
                                                                InputProps={{
                                                                    endAdornment: (<PasswordEndAdornment fieldName="oldPassword" />)
                                                                }}
                                                            />
                                                        </Grid>

                                                        <Grid item sm={10}>
                                                            <Field
                                                                component={TextFieldFormik}
                                                                fullWidth
                                                                margin="dense"
                                                                type={visibity["newPassword"] ? "string" : "password"}
                                                                label="New Password"
                                                                name="newPassword"
                                                                variant="outlined"
                                                                required={true}
                                                                value={values["newPassword"]}
                                                                onChange={(e) => setFieldValue("newPassword", e.target.value)}
                                                                InputProps={{
                                                                    endAdornment: (<PasswordEndAdornment fieldName="newPassword" />)
                                                                }}
                                                            />
                                                        </Grid>
                                                        <Grid item sm={10}>
                                                            <Field
                                                                component={TextFieldFormik}
                                                                fullWidth
                                                                margin="dense"
                                                                type={visibity["confirmPassword"] ? "string" : "password"}
                                                                label="Confirm Password"
                                                                name="confirmPassword"
                                                                variant="outlined"
                                                                required={true}
                                                                value={values["confirmPassword"]}
                                                                onChange={(e) => {
                                                                    setFieldValue("confirmPassword", e.target.value)
                                                                }}
                                                                InputProps={{
                                                                    endAdornment: (<PasswordEndAdornment fieldName="confirmPassword" />)
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
                                disabled={loading ? true : (isUpdateEmail && values.email === userData.email || false)}
                                onClick={(e) => {
                                    if (Object.keys(errors).length) {
                                        Object.keys(errors).forEach(key => {
                                            setFieldTouched(key, true)
                                        })
                                        return
                                    }
                                    if (isUpdateEmail) {
                                        handleSubmit(values)
                                    }
                                    else {
                                        if (values.newPassword !== values.confirmPassword) {
                                            setFieldError("confirmPassword", "new and confirm password should be same")
                                            setFieldTouched("confirmPassword", true)
                                            return
                                        }
                                        else if (values.newPassword === values.oldPassword) {
                                            setFieldError("newPassword", "new and old password should be different")
                                            setFieldTouched("newPassword", true)
                                            return
                                        }
                                        else {
                                            handleSubmit(values)
                                        }
                                    }

                                }}
                            >
                                Update
                            </CustomButton>
                        </CustomDialogFooter>
                    </>
                )}
            </Formik>
        </Dialog >
    );
}

