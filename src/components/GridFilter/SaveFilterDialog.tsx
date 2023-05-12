import React, { useState, useEffect, useRef, useContext, Fragment } from 'react';
import { Button, Dialog, TextField } from '@material-ui/core';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from '../Helpers/CustomButton';
import { Form, Formik } from 'formik';
import { object, string } from 'yup';

const schema = object().shape({
    title: string().required('Please enter title'),
});

function SaveFilterDialog({ handleClose, handleSucess, resource, filterValue, filterData }) {

    const toastConfig = useContext(CustomToastContext);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (values) => {
        const data = {
            title: values?.title,
            resource: resource,
            filterValue: filterValue
        };
        setLoading(true)
        if (filterData) {
            axiosInstance().put(`/user-resource-filter`, { ...data, _id: filterData?._id })
                .then(({ data }) => {
                    toastConfig.setToastConfig({
                        open: true,
                        type: 'success',
                        message: data.message
                    });
                    handleSucess()
                    setLoading(false)
                })
                .catch((err) => {
                    toastConfig.setToastConfig(err);
                    setLoading(false)
                });
        }
        else {
            axiosInstance().post(`/user-resource-filter`, data)
                .then(({ data }) => {
                    toastConfig.setToastConfig({
                        open: true,
                        type: 'success',
                        message: data.message
                    });
                    handleSucess()
                    setLoading(false)
                })
                .catch((err) => {
                    toastConfig.setToastConfig(err);
                    setLoading(false)
                });
        }
    }

    return (<Dialog
        maxWidth={'sm'}
        open={true}
        fullWidth
        onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
                handleClose();
            }
        }}
        aria-describedby="Filter Dialog">
        <CustomDialogHeader
            title="Filter"
            onClose={handleClose}
            showRequiredLabel={true}
        />
        <Formik
            initialValues={{ title: filterData?.title || "" }}
            validateOnMount
            validationSchema={schema}
            onSubmit={handleSubmit}
        >
            {({ submitForm, setFieldValue, values }) => (
                <Fragment>
                    <CustomDialogContent>
                        <Form autoComplete="off" autoCorrect="off" noValidate>
                            <TextField
                                fullWidth
                                margin="dense"
                                type="text"
                                required
                                label="Title"
                                name="title"
                                variant="outlined"
                                value={values["title"]}
                                onChange={(e) => {
                                    setFieldValue('title', e.target.value);
                                }}
                            />
                        </Form>
                    </CustomDialogContent>
                    <CustomDialogFooter>
                        <Button
                            size="small"
                            color="primary"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                        <CustomButton
                            loading={loading}
                            variant="contained"
                            color="primary"
                            type="submit"
                            onClick={submitForm}
                            disabled={loading}
                        >
                            Save
                        </CustomButton>
                    </CustomDialogFooter>
                </Fragment>
            )}
        </Formik>
    </Dialog>
    );
}

export default SaveFilterDialog;
