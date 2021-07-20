import React, { useState, useContext } from 'react'
import { Box, Button, Dialog, Grid } from '@material-ui/core'
import { isMobile, isTablet } from 'react-device-detect'
import { CustomDialogTransition, getObjKeys, setFieldsInAscendingOrder, simplifyValues, yupSchema } from '../../constants/helpers'
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader'
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import { Form, Formik } from 'formik'
import FormTypes from '../../components/Helpers/FormTypes'
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter'
import CustomButton from '../../components/Helpers/CustomButton'
import axiosInstance from '../../axios/axiosInstance'

const CodeValidation = ({ open, title, close, email, quoteId, versionNumber, handleSave }) => {
    const toastConfig = useContext(CustomToastContext);
    const [showPasswordField, setShowPasswordField] = useState(false);
    const [disableResendCode , setDisableResendCode] = useState(false);
    const [buttonLabel, setButtonLabel] = useState("Get Code");
    

    const handleSendCodeToEmail = () => {
        axiosInstance()
            .get(`/quote-builder/send-otp/${quoteId}/${versionNumber}`)
            .then(({ data: { data } }) => {
                setShowPasswordField(true)
                setButtonLabel("Resend Code")
                handleDisableButton()
                toastConfig.setToastConfig({
                    open: true,
                    type: "success",
                    message: data,
                })

            }).catch((err) => { toastConfig.setToastConfig(err); })
    }

    const handleDisableButton = () => {
        setDisableResendCode(true)
        setTimeout(() => {
            setDisableResendCode(false)
        }, 60000);

    }

    const onSubmit = ((values) => {
        handleSave(values)
    })

    return (
        <>
            <Dialog
                maxWidth="md"
                fullWidth
                fullScreen={isMobile || isTablet}
                TransitionComponent={CustomDialogTransition}
                aria-labelledby="customized-dialog-title"
                onClose={close}
                open={open}
                disableBackdropClick={true}
            >
                <CustomDialogHeader
                    title={title}
                    onClose={close}
                />
                <Formik
                    initialValues={{
                        email,
                        code: "",
                    }}
                    // validationSchema={yupSchema(entityData.fields)}
                    validateOnMount
                    onSubmit={onSubmit}
                >
                    {({
                        submitForm,
                        values,
                        errors,
                        touched,
                        setFieldValue,
                        setFieldTouched,
                        setErrors,
                        setValues,
                    }) => (
                        <>
                            <CustomDialogContent>
                                <Form noValidate>
                                    <Box marginY={2}>
                                        <Grid spacing={3} container>
                                            <Grid key={1} item xs={12} sm={8} md={10}>
                                                <FormTypes
                                                    values={values}
                                                    errors={errors}
                                                    touched={touched}
                                                    label="Email"
                                                    name="email"
                                                    type="email"
                                                    disabled={true}
                                                    setFieldValue={setFieldValue}
                                                    fullWidth
                                                    size="small"
                                                />
                                            </Grid>
                                            <Grid key={1} item xs={12} sm={4} md={2} >
                                                <Button
                                                    className="ml-1"
                                                    color="primary"
                                                    variant="outlined"
                                                    disabled={disableResendCode}
                                                    onClick={
                                                        handleSendCodeToEmail
                                                    }
                                                    fullWidth
                                                >
                                                    {buttonLabel}
                                                </Button>

                                            </Grid>

                                        </Grid>
                                        {showPasswordField &&
                                            <Grid spacing={3} container>
                                                <Grid key={1} item xs={12} sm={12} md={12}>
                                                    <FormTypes
                                                        values={values}
                                                        errors={errors}
                                                        touched={touched}
                                                        label="Enter the Received Code"
                                                        name="code"
                                                        type="password"
                                                        setFieldValue={setFieldValue}
                                                        fullWidth
                                                        size="small"
                                                    />

                                                </Grid>

                                            </Grid>}
                                    </Box>




                                </Form>
                            </CustomDialogContent>
                            <CustomDialogFooter>
                                <Button
                                    type="button"
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                    onClick={close}
                                >
                                    Cancel
                                </Button>

                                <CustomButton
                                    // loading={loading}
                                    variant="contained"
                                    color="primary"
                                    disabled={
                                        Object.keys(errors).length > 0 ? true : false
                                    }
                                    onClick={(e) => {
                                        e.preventDefault();
                                        submitForm();
                                    }}
                                >
                                    Save
                                </CustomButton>
                            </CustomDialogFooter>
                        </>
                    )}
                </Formik>
            </Dialog>
        </>

    )
}

export default CodeValidation
