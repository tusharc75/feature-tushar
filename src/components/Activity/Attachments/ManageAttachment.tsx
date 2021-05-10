import React, { useState, useEffect } from "react";
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

const attachmentSchema = Yup.object().shape({
    name: Yup.string()
        .required("please upload file"),
});

export default function ManageAttachment({ relatedTo, attachmentId, handleClose }) {

    const [initialValues, setInitialValues] = useState(null);

    useEffect(() => {
        fetchNoteDetail();
    }, []);

    const fetchNoteDetail = async () => {
        if (attachmentId) {
        }
        else {
            setInitialValues({ file: "" })
        }
    };

    const handleSave = (values) => {
        console.log("handleSave ~ values", values)
    };

    return (initialValues && <Formik initialValues={initialValues}
        validationSchema={attachmentSchema}
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
                                    <FormTypes
                                        label="File"
                                        name="file"
                                        isTooltip={true}
                                        required={false}
                                        type="fileUpload"
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        size="small"
                                        setFieldValue={(name, file) => setFieldValue("file", file)}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Form>
                </CustomDialogContent>
                <CustomDialogFooter>
                    <Button color="primary" onClick={handleClose}>Cancel</Button>
                    <Button type="button" color="primary"
                        variant="contained"
                        onClick={submitForm} >Save </Button>
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