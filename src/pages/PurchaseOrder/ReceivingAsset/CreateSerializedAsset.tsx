import { useContext, useEffect, useState, FC, Fragment } from 'react';
import { Dialog, Button, Box, TextField, Grid, IconButton, ButtonGroup, Container, InputAdornment } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { Add, Delete } from '@material-ui/icons';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { generateUniqueId, packages, product, purchaseOrder } from '../../../constants/helpers';
import { Formik, Form, FieldArray, Field } from 'formik';

const CreateSerializedAsset = (props) => {
    const { purchaseOrderID, onClose, onSuccess, title, productList } = props;
    const [currencySymbol, setCurrencySymbol] = useState(null);
    const [wareHouseList, setwareHouseList] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toastConfig = useContext(CustomToastContext);

    useEffect(() => {
        axiosInstance()
            .get(`/warehouse?limit=0`)
            .then(({ data: { data, count } }) => {
                setwareHouseList(data)
            })
    }, []);

    const handleCreateSerializedAsset = (values) => {
        let tempArray = values.map(u => ({
            PurchaseOrderId: purchaseOrderID,
            productMaster: u.productId,
            wareHouse: u.warehouse?._id,
            quantity: parseInt(u?.quantity)
        }))
        setIsSubmitting(true)
        axiosInstance().post(`${purchaseOrder.api}/asset-po`, { "purchaseOrder": tempArray }).then(({ data }) => {
            setIsSubmitting(false);
            toastConfig.setToastConfig({
                open: true,
                type: 'success',
                message: data.message
            });

            values.map(d => {
                let tempProductArray = {
                    "qty": parseInt(d.row?.quantity || d.row?.qty) || 0,
                    "value": parseInt(d.row?.price || d.row?.value) || 0,
                    "expectedDelivery": d.row?.expectedDelivery || "",
                    "uom": d.row?.uom || "",
                    "price": d.row?.price || 0,
                    "finalPrice": d.row?.finalPrice || 0,
                    "actualReceived": d.quantity || 0,
                    "billed": d.row?.billed || 0,
                    "taxSchedule": d.row?.taxSchedule || "",
                    "tax": d.row?.tax || 0,
                    "taxPerUnit": d.row?.taxPerUnit || 0,
                    "totalTax": d.row?.totalTax || 0
                }

                axiosInstance().post(`${purchaseOrder.api}/${purchaseOrderID}/order-details/update?orderId=${d.row?._id}`, tempProductArray)
                    .then(() => {

                    }).catch((error) => {
                        toastConfig.setToastConfig(error)
                    });

            })

            onSuccess()
        }).catch((error) => {
            toastConfig.setToastConfig(error)
            setIsSubmitting(false);

        });
    }

    return (
        <Dialog open fullWidth maxWidth="md" onClose={onClose}>
            <CustomDialogHeader title={title} onClose={onClose} />
            <Formik
                initialValues={{ seriaizedAsset: productList.map(d => ({ "product": d.description, "productId": d.productId, "warehouse": "", "quantity": d.qty - d.actualReceived, "row": d })) }}
                enableReinitialize={true}
                onSubmit={() => { }}>
                {({ values }) => (
                    <>
                        <CustomDialogContent>
                            <Box p={2}>
                                <Grid container spacing={2}>

                                    <Form>
                                        <Container className="p-0">
                                            <Grid
                                                container
                                                direction="row"
                                                justify="space-evenly"
                                                alignItems="center"
                                            >
                                                <Grid item md={12}>
                                                    {values.seriaizedAsset && values.seriaizedAsset.length > 0 && (

                                                        <Box className={""}>
                                                            <Grid
                                                                container
                                                                spacing={2}
                                                                direction="row"
                                                                justify="flex-start"
                                                                alignItems="center"
                                                            >
                                                                <Grid item md={1}> # </Grid>
                                                                <Grid item md={4}> Product </Grid>
                                                                <Grid item md={4}> Plants </Grid>
                                                                <Grid item md={2}> Quantity </Grid>
                                                                <Grid item md={1}></Grid>

                                                            </Grid>
                                                        </Box>
                                                    )}
                                                    <Box className="p-1">
                                                        <FieldArray
                                                            name="seriaizedAsset"
                                                            render={arrayHelpers => (
                                                                <div>
                                                                    {values.seriaizedAsset && values.seriaizedAsset.length > 0 && (
                                                                        values.seriaizedAsset.map((userVal, index) => (
                                                                            <Grid
                                                                                container
                                                                                spacing={2}
                                                                                direction="row"
                                                                                justify="flex-start"
                                                                                alignItems="center"
                                                                                key={index}
                                                                            >
                                                                                <Grid item md={1}>{index + 1}</Grid>

                                                                                <Grid item md={4}>
                                                                                    <Autocomplete
                                                                                        size="small"
                                                                                        style={{ minWidth: 200 }}
                                                                                        value={userVal.product}
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
                                                                                {
                                                                                    <Grid item md={4}>
                                                                                        <Autocomplete
                                                                                            size="small"
                                                                                            style={{ minWidth: 200 }}
                                                                                            value={userVal.warehouse}
                                                                                            options={wareHouseList}
                                                                                            getOptionLabel={(option: any) => option ? option?.warehouseID || option?.warehouseName || option?.address : ""}
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
                                                                                                label="Plants"
                                                                                                required
                                                                                            />}
                                                                                        />
                                                                                    </Grid>

                                                                                }
                                                                                <Grid item md={2}>
                                                                                    <Field
                                                                                        fullWidth
                                                                                        variant="outlined"
                                                                                        type="number"
                                                                                        size="small"
                                                                                        component={TextField}
                                                                                        name="quantity"
                                                                                        placeholder="Enter Quantity"
                                                                                        value={userVal.quantity}
                                                                                        onChange={(e) => {
                                                                                            arrayHelpers.replace(index, {
                                                                                                ...values.seriaizedAsset[index],
                                                                                                ["quantity"]: e.target.value.replace(/[^0-9]/g, '')
                                                                                            })
                                                                                        }}
                                                                                    />
                                                                                </Grid>
                                                                            </Grid>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            )}
                                                        />
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </Container>
                                    </Form>


                                </Grid>
                            </Box>
                        </CustomDialogContent>
                        <CustomDialogFooter>
                            <Button variant="outlined"
                                disabled={isSubmitting}
                                color="primary" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() => { handleCreateSerializedAsset(values.seriaizedAsset) }}
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
        </Dialog>
    );
};

export default CreateSerializedAsset;
