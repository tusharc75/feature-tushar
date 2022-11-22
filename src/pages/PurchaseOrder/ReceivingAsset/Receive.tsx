import React, { useContext, useEffect, useState, FC, Fragment } from 'react';
import { Dialog, Button, Box, TextField, Grid, Chip, ButtonGroup, Container, InputAdornment, Paper, Typography, TableBody } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { dateFormat, purchaseOrder } from '../../../constants/helpers';
import { Formik, Form, FieldArray, Field } from 'formik';
import { useData } from '../../../StateProvider/Provider';
import { isMobile, isTablet } from "react-device-detect";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import { read, utils, writeFile } from 'xlsx';
import { KeyboardDatePicker } from 'formik-material-ui-pickers';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';


const Receive = ({ purchaseOrderID, onClose, onSuccess, productList, purchaseOrderData }) => {

    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const { state: { selectedEntity } }: any = useData();

    const [wareHouseList, setwareHouseList] = useState(null);
    const [defaultWareHouse, setDefaultWareHouse] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toastConfig = useContext(CustomToastContext);

    useEffect(() => {
        axiosInstance().get(`/warehouse`)
            .then(({ data: { data } }) => {
                setDefaultWareHouse(data.find(d => d?._id === purchaseOrderData?.warehouse?.optionValue))
                setwareHouseList(data)
            })
    }, []);

    const handleCreateSerializedAsset = (values) => {
        setIsSubmitting(true)
        let products = values?.seriaizedAsset?.map(u => ({
            _id: u._id,
            product: u.productId,
            serializedProduct: u.serializedProduct,
            warehouse: u.warehouse?._id,
            inventoryQuantity: parseInt(u?.inventoryQuantity),
            assetQuantity: parseInt(u?.assetQuantity),
            serialNumber: u?.serialNumber,
        }))
        axiosInstance().post(`${purchaseOrder.api}/receive-inventory/${purchaseOrderID}`,
            { products: products, receiveDate: values?.receiveDate }).then(({ data }) => {
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

    const validate = (values) => {
        let errors: any = {};
        if (values.length > 0) {
            values.map(d => {
                let tempProduct = productList.find(u => u._id === d._id)
                let qty = tempProduct.qty - (tempProduct.actualReceived || 0);
                if (tempProduct && d.inventoryQuantity > qty) {
                    errors.inventoryQuantity = "should be greater"
                }
                if (tempProduct && d.assetQuantity > qty) {
                    errors.assetQuantity = "should be greater"
                }
                if (tempProduct && (parseInt(d.inventoryQuantity) + parseInt(d.assetQuantity)) > qty) {
                    errors.inventoryQuantity = "should be greater"
                    errors.assetQuantity = "should be greater"
                }
                if (tempProduct && (parseInt(d.inventoryQuantity) < d.serialNumber?.length)) {
                    errors.serialNumber = "should be greater"
                }
                if (tempProduct && !d.warehouse) {
                    errors.warehouse = "Plant is required"
                }
            })
        }
        return errors;
    };

    const handleExportField = (data: any) => {
        const qty = parseInt(data?.inventoryQuantity) || 0
        let json_data = [...Array(qty).keys()].map((item) => ({
            'Product': data?.product || "",
            "Serial Number": ""
        }));
        const header = ['Product', 'Serial Number'];
        const ws = utils.json_to_sheet(json_data);
        if (header.length) {
            utils.sheet_add_aoa(ws, [header]);
        }
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, 'Sheet1');
        writeFile(wb, 'PO Serial Number.xlsx');
    }

    const handleImport = (arrayHelpers: any, index: number, values: any) => (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        const files = e.target.files, f = files[0];
        let reader = new FileReader();
        reader.onload = function (e) {
            const data = e.target.result;
            let readedData = read(data, { type: 'binary' });
            const wsname = readedData.SheetNames[0];
            const ws = readedData.Sheets[wsname];
            const parsedData = utils.sheet_to_json(ws, { header: 1 });
            if (parsedData.length > 1) {
                let tableContent = parsedData.slice(1, parsedData.length);
                const serialNumber = tableContent.map((item: any[]) => item[1]);
                var strSerialNumber = serialNumber?.map(String);
                arrayHelpers.replace(index, {
                    ...values.seriaizedAsset[index],
                    serialNumber: strSerialNumber
                })
            }
        };
        reader.readAsBinaryString(f);
        e.target.value = null;
    }

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
                title={"Receiving"}
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
                        receiveDate: new Date(),
                        seriaizedAsset: productList.map(d => ({
                            "_id": d._id,
                            "product": d.productName,
                            "productId": d.productId,
                            "warehouse": defaultWareHouse || "",
                            "inventoryQuantity": d.qty - (d.actualReceived || 0) - (d.rejectQuantity || 0),
                            "assetQuantity": 0,
                            "serializedProduct": d.serializedProduct || false,
                            "serialNumber": [],
                            "row": d
                        }))
                    }}
                    enableReinitialize={true}
                    onSubmit={() => { }}>
                    {({ values, setFieldValue }) => (
                        <>
                            <CustomDialogContent>
                                {(values.seriaizedAsset && values.seriaizedAsset.length && wareHouseList) ?
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
                                                            name="seriaizedAsset"
                                                            render={arrayHelpers => (
                                                                <div>
                                                                    {(values.seriaizedAsset.map((data, index) => (
                                                                        <Box key={index}
                                                                            border={'1px solid #dddddd'}
                                                                            borderRadius={4} mb={2} p={2} pt={2}>
                                                                            <Grid container spacing={2} alignItems='center'   >
                                                                                <Grid item xs={12} md={1} >
                                                                                    <Chip color="primary" label={index + 1} />
                                                                                </Grid>
                                                                                <Grid item xs={12} md={11}>
                                                                                    <Grid container spacing={2} alignItems='center'>
                                                                                        <Grid item xs={12} md={4}>
                                                                                            <Autocomplete
                                                                                                size="small"
                                                                                                value={data.product}
                                                                                                options={productList}
                                                                                                disabled
                                                                                                getOptionLabel={(option: any) => option ? option : ""}
                                                                                                onChange={(_, newValue) => {
                                                                                                    arrayHelpers.replace(index, {
                                                                                                        ...values.seriaizedAsset[index],
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
                                                                                            <Autocomplete
                                                                                                size="small"
                                                                                                value={data.warehouse}
                                                                                                options={wareHouseList}
                                                                                                getOptionLabel={(option: any) => option ? option?.warehouseName || option?.warehouseID || option?.address : ""}
                                                                                                onChange={(_, newValue) => {
                                                                                                    arrayHelpers.replace(index, {
                                                                                                        ...values.seriaizedAsset[index],
                                                                                                        ["warehouse"]: newValue,
                                                                                                    });
                                                                                                }}
                                                                                                renderInput={(params) => <TextField
                                                                                                    {...params}
                                                                                                    variant="outlined"
                                                                                                    name="plants"
                                                                                                    label="Plant"
                                                                                                    error={validate([data]).warehouse}
                                                                                                    helperText={validate([data]).warehouse ? "Plant is required" : ""}
                                                                                                    required
                                                                                                />}
                                                                                            />
                                                                                        </Grid>
                                                                                        <Grid item xs={12} md={4}>
                                                                                            <span><b>PO Quantity: </b>{data?.row?.qty}</span>
                                                                                            <br />
                                                                                            {/* <span><b>Quantity: </b>{data?.row?.qty - (data?.row?.actualReceived || 0)}</span> */}
                                                                                            <span><b>Recieved: </b>{data?.row?.actualReceived || 0}</span>
                                                                                            <br />
                                                                                            <span><b>Rejected: </b>{data?.row?.rejectQuantity || 0}</span>
                                                                                        </Grid>
                                                                                    </Grid>
                                                                                    <Box mt={1}>
                                                                                        <Grid container spacing={2} alignItems='center'>
                                                                                            <Grid item xs={12} md={4}>
                                                                                                <Field
                                                                                                    fullWidth
                                                                                                    label="Inventory Quantity"
                                                                                                    variant="outlined"
                                                                                                    type="number"
                                                                                                    size="small"
                                                                                                    component={TextField}
                                                                                                    name="inventoryQuantity"
                                                                                                    placeholder="Inventory Quantity"
                                                                                                    value={data.inventoryQuantity}
                                                                                                    onChange={(e) => {
                                                                                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                                                                                        arrayHelpers.replace(index, {
                                                                                                            ...values.seriaizedAsset[index],
                                                                                                            ["inventoryQuantity"]: value,
                                                                                                        })
                                                                                                    }}
                                                                                                    error={validate([data])?.inventoryQuantity}
                                                                                                    helperText={validate([data]).inventoryQuantity ? "Receiving quantity is more than actual quantity" : ""}
                                                                                                />
                                                                                            </Grid>
                                                                                            {/* {data?.serializedProduct &&
                                                                                                <Grid item xs={12} md={4}>
                                                                                                    <Field
                                                                                                        fullWidth
                                                                                                        label='Asset Creation Quantity'
                                                                                                        variant="outlined"
                                                                                                        type="number"
                                                                                                        size="small"
                                                                                                        component={TextField}
                                                                                                        name="assetQuantity"
                                                                                                        placeholder="Asset Creation Quantity"
                                                                                                        value={data.assetQuantity}
                                                                                                        onChange={(e) => {
                                                                                                            const value = e.target.value.replace(/[^0-9]/g, '');
                                                                                                            arrayHelpers.replace(index, {
                                                                                                                ...values.seriaizedAsset[index],
                                                                                                                ["assetQuantity"]: value,
                                                                                                            })
                                                                                                        }}
                                                                                                        error={validate([data])?.assetQuantity}
                                                                                                        helperText={validate([data]).assetQuantity ? "Receiving quantity is more than actual quantity" : ""}
                                                                                                    />
                                                                                                </Grid>
                                                                                            } */}
                                                                                        </Grid>
                                                                                    </Box>
                                                                                    {data?.serializedProduct &&
                                                                                        <Box mt={1}>
                                                                                            <Grid container spacing={2} alignItems='center'>
                                                                                                <Grid item xs={12} md={8}>
                                                                                                    <Autocomplete
                                                                                                        options={[]}
                                                                                                        size="small"
                                                                                                        freeSolo={true}
                                                                                                        multiple={true}
                                                                                                        disableCloseOnSelect
                                                                                                        value={data.serialNumber}
                                                                                                        onChange={(_, val) => {
                                                                                                            arrayHelpers.replace(index, {
                                                                                                                ...values.seriaizedAsset[index],
                                                                                                                ["serialNumber"]: val
                                                                                                            })
                                                                                                        }}
                                                                                                        getOptionSelected={(item, current) => item === current}
                                                                                                        getOptionLabel={(option) => option}
                                                                                                        renderInput={(props) => (
                                                                                                            <TextField
                                                                                                                {...props}
                                                                                                                placeholder={`Serial Number`}
                                                                                                                variant="outlined"
                                                                                                                name="serialNumber"
                                                                                                                label={'Serial Number'}
                                                                                                                error={validate([data])?.serialNumber}
                                                                                                                helperText={validate([data]).serialNumber ? "Serial numbers should be less then inventory quantity" : ""}
                                                                                                            />
                                                                                                        )}
                                                                                                    />
                                                                                                </Grid>
                                                                                                <Grid item xs={12} md={4}>
                                                                                                    <Box my={1} display="flex" justifyContent="flex-end">
                                                                                                        <Box mr={2}>
                                                                                                            <Typography className="link cursor-pointer" style={{ color: 'var(--primary)' }} onClick={() => handleExportField(data)}>
                                                                                                                Export
                                                                                                            </Typography>
                                                                                                        </Box>
                                                                                                        <Box mr={1}>
                                                                                                            <input
                                                                                                                accept="json"
                                                                                                                style={{ display: 'none' }}
                                                                                                                onChange={handleImport(arrayHelpers, index, values)}
                                                                                                                id={`import-file-${index}`}
                                                                                                                multiple={false}
                                                                                                                type="file" />
                                                                                                            <label htmlFor={`import-file-${index}`}>
                                                                                                                <Typography className="cursor-pointer" style={{ color: 'var(--primary)' }}>
                                                                                                                    Import
                                                                                                                </Typography>
                                                                                                            </label>
                                                                                                        </Box>
                                                                                                    </Box>
                                                                                                </Grid>
                                                                                            </Grid>
                                                                                        </Box>
                                                                                    }
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
                                                            label='Received Date'
                                                            variant="inline"
                                                            inputVariant="outlined"
                                                            autoOk
                                                            size="small"
                                                            margin="dense"
                                                            component={KeyboardDatePicker}
                                                            name="receiveDate"
                                                            placeholder="Receive Date"
                                                            value={values.receiveDate}
                                                            format={dateFormat}
                                                            minDate={purchaseOrderData?.purchaseOrderDate}
                                                            maxDate={new Date()}
                                                            onChange={(value) => {
                                                                setFieldValue('receiveDate', value);
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
                                        if (!validate(values.seriaizedAsset).inventoryQuantity
                                            && !validate(values.seriaizedAsset).warehouse
                                            && !validate(values.seriaizedAsset).assetQuantity
                                            && !validate(values.seriaizedAsset).serialNumber)
                                            handleCreateSerializedAsset(values)
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

export default Receive;
