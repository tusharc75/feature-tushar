import React from 'react';
import Layout from "../../../components/Layout";
import { Box, Button, CircularProgress } from '@material-ui/core';
import { makeStyles } from "@material-ui/core/styles";
import { Formik, Form } from "formik";
import { formValidation } from '../../../constants/helpers';
import InputField from '../../../components/Helpers/InputField';
import CustomButton from '../../../components/Helpers/Button'
import { commonStyle } from '../../Contact/CommonStyles'
import CustomToast from '../../../components/Helpers/CustomToast'
import { withStyles } from '@material-ui/core/styles';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import Loader from '../../../components/Loader'
import "../account.css"

const useStyles = makeStyles((theme) => ({
    ...commonStyle(theme)
}));

const DialogContent = withStyles((theme) => ({
    root: {
        padding: theme.spacing(2),
    },
}))(MuiDialogContent);

const DialogActions = withStyles((theme) => ({
    root: {
        margin: 0,
        padding: theme.spacing(1),
    },
}))(MuiDialogActions);


export default function CreateAccount(props) {

    const classes = useStyles();
    const { entityData, alertData, handleSnackbar, handleSubmit, loading, isEdit, onClose } = props

    return (<>
        {
            alertData ? <CustomToast
                open={alertData.open || false}
                close={() => handleSnackbar('', '', false)}
                errorMsg={alertData.errorMsg || ''}
                type={alertData.type || ''}
            /> : null
        }
        {
            entityData.fields.length > 0 ?
                <>
                    <Formik
                        initialValues={entityData.initialValues}
                        validate={(values) => formValidation(values, entityData.fields)}
                    >
                        {({
                            setValues,
                            setErrors,
                            values,
                            errors,
                            touched,
                            setFieldValue,
                            setFieldTouched,
                            validateForm,
                            resetForm
                        }) => (
                            <Form>
                                <>
                                    <DialogContent dividers style={{ padding: '10px', marginLeft: "15px", marginRight: '15px' }}>
                                        <InputField
                                            errors={errors}
                                            values={values}
                                            setFieldValue={setFieldValue}
                                            touched={touched}
                                            fieldsData={entityData.fields}
                                            size="small"
                                            fullWidth
                                        />
                                    </DialogContent>
                                </>
                                <DialogActions>
                                    <Button onClick={onClose} variant="outlined" color="primary" >
                                        Cancel
                                             </Button>

                                    <CustomButton
                                        loading={loading}
                                        disabled={loading}
                                        style={{ float: "right" }}
                                        variant="contained"
                                        color="primary"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleSubmit(setFieldTouched, values, setValues, setErrors, false, resetForm)
                                        }}
                                    >
                                        {isEdit ? "Update" : "Save"}
                                    </CustomButton>
                                </DialogActions>
                            </Form>
                        )}
                    </Formik>
                </>
                : <DialogContent dividers style={{ minWidth: '943px', minHeight: '500px' }}>
                    <Loader text="Fetching Data" style={{ marginTop: 100 }} />
                </DialogContent>
        }
    </ >
    )
}
