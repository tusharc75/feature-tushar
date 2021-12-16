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
import { useData } from '../../../StateProvider/Provider';

const CreateSerializedAsset = (props) => {
    const { purchaseOrderID, onClose, onSuccess, title, productList, handleUpdateData, purchaseOrderData } = props;
    const [constProductList, setConstProductList] = useState(productList);
    const [wareHouseList, setwareHouseList] = useState([]);
    const [defaultWareHouse, setDefaultWareHouse] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toastConfig = useContext(CustomToastContext);
    const {
        state: { selectedEntity },
    }: any = useData();
    useEffect(() => {
        axiosInstance()
            .get(`/warehouse?filterById=[{"field": "entity", "term": "${selectedEntity}"}]`)
            .then(({ data: { data, count } }) => {
                setwareHouseList(data)
                setDefaultWareHouse(data.find(d => d?._id === purchaseOrderData?.warehouse?.optionValue))
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

            let tempProductArray = values.map(d => {
                let res;
                res = d.row
                res["actualReceived"] = parseInt(d.quantity || 0) + parseInt(constProductList.find(u => u?._id === d?.row?._id)?.actualReceived || 0)
                return res
            })

            axiosInstance().put(`${purchaseOrder.api}/product/${purchaseOrderID}/update`, { products: tempProductArray })
                .then(() => {
                    handleUpdateData({ "status": "Received" })
                    onSuccess()
                }).catch((error) => {
                    toastConfig.setToastConfig(error)
                });
        }).catch((error) => {
            toastConfig.setToastConfig(error)
            setIsSubmitting(false);

        });
    }

    const validate = (values) => {
        let errors = { quantity: null, warehouse: null };

        if (values.length > 0) {
            values.map(d => {
                let tempProduct = productList.find(u => u.productId === d.productId)
                if (tempProduct && d.quantity > (tempProduct.qty - tempProduct.actualReceived)) {
                    errors.quantity = "should be greater"
                }
                if (tempProduct && !d.warehouse) {
                    errors.warehouse = "Plant is required"
                }
            })
        }

        return errors;
    };

    return (
        <Dialog open fullWidth maxWidth="md" onClose={onClose}>
            <CustomDialogHeader title={title} onClose={onClose} />
            <Formik
                initialValues={{ seriaizedAsset: productList.map(d => ({ "product": d.description, "productId": d.productId, "warehouse": defaultWareHouse || "", "quantity": d.qty - (d.actualReceived || 0), "row": d })) }}
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
                                                                <Grid item md={3}> Quantity </Grid>

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
                                                                                                error={validate([userVal]).warehouse}
                                                                                                helperText={validate([userVal]).warehouse ? "Plant is required" : ""}
                                                                                                required
                                                                                            />}
                                                                                        />
                                                                                    </Grid>

                                                                                }
                                                                                <Grid item md={3}>
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
                                                                                        error={validate([userVal])?.quantity}
                                                                                        helperText={validate([userVal]).quantity ? "Receiving qunatity is more than actual quantity" : ""}
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
                                onClick={() => { if (!validate(values.seriaizedAsset).quantity && !validate(values.seriaizedAsset).warehouse) handleCreateSerializedAsset(values.seriaizedAsset) }}
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
