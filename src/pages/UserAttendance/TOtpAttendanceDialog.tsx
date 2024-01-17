import { Button, CircularProgress, Dialog, Grid, TextField } from '@material-ui/core';
import React, { useState } from 'react'
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition } from 'src/constants/helpers';
import { Formik, Form } from "formik";
import { object, string } from 'yup';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';

function TOtpAttendanceDialog({ open, onClose }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gettingOutModal, setGettingOutModal] = useState({ open: false, text: "" });

    const TOtpSchema = object().shape({
        employeeId: string().required('please enter Employee ID'),
        totp: string().required('please enter totp'),
    });

    const handleSave = async (values) => {
        try {
            setIsSubmitting(true);
            const complete = await axiosInstance().post('/user-attendance/totp-validate', values);
            const data = complete.data.data;
            if (data && data.gettingOut) {
                setGettingOutModal({ open: true, text: "You are getting out!" });
            } else {
                setGettingOutModal({ open: true, text: "You are getting in!" });
            }
            setIsSubmitting(false);
        } catch (err) {
            setIsSubmitting(false);
            console.log(err)

        }
    }

    return (
        <Dialog
            maxWidth="sm"
            fullWidth
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="customized-dialog-title"
            onClose={onClose}
            open={open}
        >
            <CustomDialogHeader title="MFA/TOTP Verification" showRequiredLabel={false} onClose={onClose} />
            
                <Formik
                    initialValues={{
                        employeeId: "",
                        totp: "",
                    }}
                    validationSchema={TOtpSchema}
                    onSubmit={handleSave}
                >
                {({ submitForm, touched, errors, setFieldValue, values }) => (
                    <div>

                        <CustomDialogContent>
                            <Form autoComplete="off" autoCorrect="off" noValidate>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Employee ID"
                                            name="employeeId"
                                            variant="outlined"
                                            size='small'
                                            fullWidth
                                            required
                                            onChange={(e) => { 
                                                setFieldValue('employeeId', e.target.value)
                                            }}
                                            error={Boolean(touched.employeeId && errors.employeeId)}
                                            helperText={touched.employeeId && errors.employeeId}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="TOTP"
                                            name="totp"
                                            variant="outlined"
                                            size='small'
                                            required
                                            fullWidth
                                            onChange={(e) => { 
                                                setFieldValue('totp', e.target.value)
                                            }}
                                            error={Boolean(touched.totp && errors.totp)}
                                            helperText={touched.totp && errors.totp}
                                        />
                                    </Grid>
                                </Grid>
                            </Form>
                        </CustomDialogContent>
                        <CustomDialogFooter>
                            <Button
                                size="small"
                                onClick={onClose}
                                variant="contained"
                            >
                                Cancel
                            </Button>
                            <Button
                                disabled={isSubmitting}
                                type="submit"
                                color="primary"
                                variant="contained"
                                size="small"
                                onClick={submitForm}
                            >
                                {isSubmitting ? <CircularProgress size={22} /> : "Save"}
                            </Button>
                        </CustomDialogFooter>

                    </div>
                    )}</Formik>
            {
                gettingOutModal.open && (
                    <ConfirmationDialog
                        open={gettingOutModal.open}
                        message={gettingOutModal.text}
                        onClose={() => {
                            setGettingOutModal({ open: false, text: "" });
                            onClose();
                        }}
                        onOk={() => {
                            setGettingOutModal({ open: false, text: "" });
                            onClose();
                        }}
                    />
                )
            }
        </Dialog>
    )
}

export default TOtpAttendanceDialog