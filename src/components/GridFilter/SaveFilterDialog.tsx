import React, { useState, useEffect, useRef, useContext, Fragment } from 'react';
import { Button, Dialog, TextField, Checkbox, FormControlLabel, Grid } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
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

const SORTING_OPTIONS = [
    {
        optionLabel:'Asc',
        optionValue: 'asc',
    },
    {
        optionLabel: 'Desc',
        optionValue: 'desc'
    }
]

function SaveFilterDialog({ handleClose, handleSucess, resource, filterValue, filterData, fieldsData }) {
    const toastConfig = useContext(CustomToastContext);
    const [loading, setLoading] = useState(false);
    const [allFields,setAllFields] = useState([]);

    useEffect(()=>{
       const updatedFields = fieldsData?.map((field)=>{
        return {
            optionLabel: field?.fieldLabel,
            optionValue: field?.fieldName,
            order: field?.order,
            id: field?._id
        }
       })
       setAllFields(updatedFields);
    },[])

    const handleSubmit = (values) => {
        const data = {
            title: values?.title,
            default: values?.default ?? false,
            sorting: values?.sorting ?? false,
            sortBy: values?.sortBy ?? '',
            orderBy: values?.orderBy ?? '',
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
            initialValues={filterData}
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
                            <FormControlLabel
                                control={
                                   <Checkbox
                                     name="default"
                                     checked={values['default']}
                                     onChange={(e) => {
                                    setFieldValue('default', e.target.checked);
                                    }}
                                    color="primary"
                                    />
                                    }
                                label="Default"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                      name="sorting"
                                      checked={values['sorting']}
                                      onChange={(e) => {
                                        setFieldValue('sorting', e.target.checked);
                                      }}
                                     color="primary"
                                    />
                                }
                                label="Sorting"
                            />
                            
                            {allFields && values['sorting'] && (
                             <Grid container spacing={2}>
                                <Grid item xs={6} >
                               <Autocomplete
                                   id="sort-by"
                                   options={allFields}
                                   renderInput={(params) => <TextField {...params} required variant="outlined" label="Sort By" margin="dense" />}
                                   getOptionLabel={(option) => option?.optionLabel}
                                   onChange={(e, val) => {
                                   setFieldValue('sortBy', val);
                                   }}
                                   value={values["sortBy"]}
                                />
                                </Grid>
                                <Grid item xs={6} >
                                <Autocomplete
                                   id="order-by"
                                   options={SORTING_OPTIONS}
                                   renderInput={(params) => <TextField {...params} required variant="outlined" label="Order By" margin="dense" />}
                                   getOptionLabel={(option) => option?.optionLabel}
                                   onChange={(e, val) => {
                                      setFieldValue('orderBy', val);
                                   }}
                                   value={values["orderBy"]}
                                 />
                                 </Grid>
                                </Grid>
                                )}
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
