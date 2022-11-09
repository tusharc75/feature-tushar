import React, { useContext, useEffect, useState, FC, Fragment } from 'react';
import { Dialog, Button, Box, TextField, Grid, Chip, ButtonGroup, Container, InputAdornment, Paper, Typography, TableBody } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { Formik, Form, FieldArray, Field } from 'formik';
import { isMobile, isTablet } from "react-device-detect";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import { KeyboardDatePicker } from 'formik-material-ui-pickers';
import { dateFormat, purchaseOrder } from '../../../constants/helpers';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';

const Reject = ({ purchaseOrderID, onClose, onSuccess, productList, purchaseOrderData }) => {

    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toastConfig = useContext(CustomToastContext);

    const handleReject = (values, rejectDate) => {
        setIsSubmitting(true)
        const data = []
        values?.forEach(element => {
            if (parseInt(element?.rejectQuantity)) {
                data.push({
                    _id: element._id,
                    product: element.productId,
                    serializedProduct: element.serializedProduct,
                    qty: parseInt(element?.rejectQuantity),
                    comment: element?.comment === "" ? "Rejected" : element?.comment,
                    serialNumber: [],
                })
            }
        });
        if (data?.length) {
            axiosInstance().post(`${purchaseOrder.api}/reject-inventory/${purchaseOrderID}`, { products: data, rejectDate: rejectDate }).then(({ data }) => {
                setIsSubmitting(false);
                toastConfig.setToastConfig({
                    open: true,
                    type: 'success',
                    message: data.message
                });
                onSuccess()
            }).catch((error) => {
                toastConfig.setToastConfig(error)
                setIsSubmitting(false);
            });
        }
        else {
            onSuccess()
        }
    }

    const validate = (values) => {
        let errors: any = {};
        if (values.length > 0) {
            values.map(d => {
                let tempProduct = productList.find(u => u._id === d._id)
                if (tempProduct && d.rejectQuantity > (tempProduct.qty - (tempProduct.rejectQuantity || 0) - (tempProduct.assetQty || 0))) {
                    errors.rejectQuantity = "should be greater"
                }
            })
        }
        return errors;
    };

    return (
        <Dialog
            open
            fullScreen={fullScreen || (isMobile || isTablet)}
            maxWidth="md"
            fullWidth
            onClose={(e, reason) => {
                if (reason !== 'backdropClick') {
                    onClose();
                }
            }}
        >
            <CustomDialogHeader
                title={"Reject"}
                onClose={onClose}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                    setFullScreen(prevState => !prevState)
                }}
                showManimizeMaximize={true}
            ></CustomDialogHeader>
            <MuiPickersUtilsProvider utils={MomentUtils}>
                <Formik
                    initialValues={{
                        rejectDate: new Date(),
                        products: productList.map(d => ({
                            "_id": d._id,
                            "product": d.productName,
                            "productId": d.productId,
                            "rejectQuantity": 0,
                            "comment": "",
                            "row": d
                        }))
                    }}
                    enableReinitialize={true}
                    onSubmit={() => { }}>
                    {({ values, setFieldValue }) => (
                        <>
                            <CustomDialogContent>
                                {(values.products && values.products.length) ?
                                    <Box p={2}>
                                        <Form>
                                            <Grid
                                                direction="row"
                                                justify="space-evenly"
                                                alignItems="center"
                                            >
                                                <Grid item md={12}>
                                                    <Box>
                                                        <FieldArray
                                                            name="products"
                                                            render={arrayHelpers => (
                                                                <div>
                                                                    {(values.products.map((data, index) => (
                                                                        <Box key={index}
                                                                            border={'1px solid #dddddd'}
                                                                            borderRadius={4} mb={2} p={2} pt={2}>
                                                                            <Grid container spacing={2} alignItems='center'   >
                                                                                <Grid item xs={12} md={1} >
                                                                                    <Chip color="primary" label={index + 1} />
                                                                                </Grid>
                                                                                <Grid item xs={12} md={11}>
                                                                                    <Grid container spacing={2} alignItems='center'>
                                                                                        <Grid item xs={12} md={8}>
                                                                                            <Autocomplete
                                                                                                size="small"
                                                                                                value={data.product}
                                                                                                options={productList}
                                                                                                disabled
                                                                                                getOptionLabel={(option: any) => option ? option : ""}
                                                                                                onChange={(_, newValue) => {
                                                                                                    arrayHelpers.replace(index, {
                                                                                                        ...values.products[index],
                                                                                                        ["product"]: newValue,
                                                                                                    });
                                                                                                }}
                                                                                                renderInput={(params) => <TextField
                                                                                                    {...params}
                                                                                                    variant="outlined"
                                                                                                    name="product"
                                                                                                    label="Product"
                                                                                                />}
                                                                                            />
                                                                                        </Grid>
                                                                                        <Grid item xs={12} md={4}>
                                                                                            <span><b>Quantity: </b>{data?.row?.qty - (data?.row?.rejectQuantity || 0) - (data?.row?.assetQty || 0)}</span>
                                                                                        </Grid>
                                                                                    </Grid>
                                                                                    <Box mt={1}>
                                                                                        <Grid container spacing={2} alignItems='center'>
                                                                                            <Grid item xs={12} md={4}>
                                                                                                <Field
                                                                                                    fullWidth
                                                                                                    label="Reject Quantity"
                                                                                                    variant="outlined"
                                                                                                    type="number"
                                                                                                    size="small"
                                                                                                    component={TextField}
                                                                                                    name="rejectQuantity"
                                                                                                    placeholder="Reject Quantity"
                                                                                                    value={data.rejectQuantity}
                                                                                                    onChange={(e) => {
                                                                                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                                                                                        arrayHelpers.replace(index, {
                                                                                                            ...values.products[index],
                                                                                                            ["rejectQuantity"]: value,
                                                                                                        })
                                                                                                    }}
                                                                                                    error={validate([data])?.rejectQuantity}
                                                                                                    helperText={validate([data]).rejectQuantity ? "Reject quantity is more than quantity" : ""}
                                                                                                />
                                                                                            </Grid>
                                                                                            <Grid item xs={12} md={8}>
                                                                                                <Field
                                                                                                    fullWidth
                                                                                                    label="Comment"
                                                                                                    variant="outlined"
                                                                                                    type="text"
                                                                                                    size="small"
                                                                                                    component={TextField}
                                                                                                    name="comment"
                                                                                                    placeholder="Comment"
                                                                                                    value={data.comment}
                                                                                                    onChange={(e) => {
                                                                                                        arrayHelpers.replace(index, {
                                                                                                            ...values.products[index],
                                                                                                            ["comment"]: e.target.value,
                                                                                                        })
                                                                                                    }}
                                                                                                />
                                                                                            </Grid>
                                                                                        </Grid>
                                                                                    </Box>
                                                                                </Grid>
                                                                            </Grid>
                                                                        </Box>
                                                                    )))}
                                                                </div>
                                                            )}
                                                        />
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                            <Box pt={2}>
                                                <Grid container>
                                                    <Grid item xs={12} md={6}>
                                                        <Field
                                                            fullWidth
                                                            label='Reject Date'
                                                            variant="inline"
                                                            inputVariant="outlined"
                                                            autoOk
                                                            size="small"
                                                            margin="dense"
                                                            component={KeyboardDatePicker}
                                                            name="rejectDate"
                                                            placeholder="Reject Date"
                                                            value={values.rejectDate}
                                                            format={dateFormat}
                                                            minDate={purchaseOrderData?.purchaseOrderDate}
                                                            maxDate={new Date()}
                                                            onChange={(value) => {
                                                                setFieldValue('rejectDate', value);
                                                            }}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Box>
                                        </Form>
                                    </Box>
                                    :
                                    <Box p={2} height={300} bgcolor="white">
                                        <CommonSkeleton lenArray={[...Array(6).keys()]} />
                                    </Box>}
                            </CustomDialogContent>
                            <CustomDialogFooter>
                                <Button variant="outlined"
                                    disabled={isSubmitting}
                                    color="primary" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (!validate(values.products).rejectQuantity)
                                            handleReject(values.products, values.rejectDate)
                                    }}
                                    variant="contained"
                                    disabled={isSubmitting}
                                    color="primary"
                                >
                                    Save
                                </Button>
                            </CustomDialogFooter>
                        </>
                    )}
                </Formik>
            </MuiPickersUtilsProvider>
        </Dialog>
    );
};

export default Reject;
