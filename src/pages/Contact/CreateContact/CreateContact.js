import React, { useEffect, useState } from 'react';
import Layout from "../../../components/Layout";
import { CreateNewContact } from '../../../axios/index';
import { useData } from '../../../StateProvider/Provider';
import { Box, Button, IconButton, Typography } from '@material-ui/core';
import { makeStyles } from "@material-ui/core/styles";
import { Formik, Form } from "formik";
import { getObjKeys, removeEmptyKeys } from '../../../constants/helpers';
import InputField from '../../../components/Helpers/InputField';
import { useHistory } from "react-router-dom";
import CustomContainer from '../../../components/Container'
import { CloseIcon } from '@material-ui/data-grid';
import { createStyles, Theme, withStyles, WithStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import Loader from '../../../components/Loader'
import { commonStyle } from './../CommonStyles'
import { formValidation } from '../../../constants/helpers';
import axiosInstance from './../../../axios/axiosInstance'

// const useStyles = makeStyles((theme) => ({
//     ...commonStyle(theme)
// }));


const useStyles = makeStyles((theme) => ({
    root: {
        margin: 0,
        padding: theme.spacing(2),
    },
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
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

export default function CreateContact({ open, onClose, onSuccess }) {

    const classes = useStyles();
    const history = useHistory();
    const [entityData, setEntityData] = useState({
        fields: [],
        initialValues: {},
    });
    const [isFormSubmitted, setIsFormSubmitted] = useState(false)

    useEffect(() => {
        getContactFields();
        // eslint-disable-next-line
    }, []);

    const getContactFields = () => {
        axiosInstance().get('/field?resource=Contact').then(({ data }) => {

            const newFields = [];
            data.map((_f) => newFields.push(_f.fieldData));

            setEntityData({
                fields: newFields,
                initialValues: getObjKeys("", newFields),
            });
        });
    };

    const handleSave = (values) => {
        setIsFormSubmitted(true);
        removeEmptyKeys(values);

        CreateNewContact(values).then(() => {
            onSuccess();
            // history.push({
            //     pathname: "/contact"
            // });
        }, error => {
            setIsFormSubmitted(false);
        })
    }

    const cancel = () => {
        history.push({
            pathname: "/contact"
        })
    }

    return (
        <Dialog
            maxWidth="md"
            aria-labelledby="customized-dialog-title"
            onClose={onClose}
            open={open}
        >
            <MuiDialogTitle disableTypography className={classes.root}>
                <Typography variant="h6">Create Contact</Typography>
                {onClose ? (
                    <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                ) : null}
            </MuiDialogTitle>

            {
                entityData.fields.length == 0 && <DialogContent dividers style={{ minWidth: '943px', minHeight: '500px' }}>
                    <Loader text="Fetching Data" style={{ marginTop: 100 }} />
                </DialogContent>
            }
            {
                entityData.fields.length > 0 && <Formik
                    initialValues={entityData.initialValues}
                    validate={(values) => formValidation(values, entityData.fields)}
                >
                    {({
                        setFieldTouched,
                        values,
                        errors,
                        touched,
                        setFieldValue,
                        validateForm,
                    }) => (
                        <Form>
                            <>

                                <DialogContent dividers style={{ padding: '10px', marginLeft: "15px", marginRight: '15px', minWidth: '943px', minHeight: '500px' }}>

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

                                <DialogActions>
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        color="primary"
                                        onClick={onClose}
                                    >
                                        Cancel
                                        </Button>
                                    <Button
                                        disabled={isFormSubmitted}
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        onClick={() => { handleSave(values) }}
                                    >
                                        Create Contact
                                        </Button>
                                </DialogActions>
                            </>
                        </Form>
                    )}

                </Formik>
            }

        </Dialog>

    )
}
