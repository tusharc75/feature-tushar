import { useState, useEffect, useContext, Fragment, useReducer } from "react";
import { Grid, Box, Button, Paper, Typography, IconButton, Tab, Tabs, ButtonGroup, Container, InputAdornment, TextField } from "@material-ui/core";
import { Autocomplete, Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import axiosInstance from "../../axios/axiosInstance";
import routes from "../../components/Helpers/Routes";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import DetailsPage from "../../components/Shared/DetailsPage";
import { useData } from "../../StateProvider/Provider";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { purchaseOrder, getObjKeysWithValues, gridLoadingTimeout, product, RESOURCE_LABEL } from "../../constants/helpers";
import ManagePurchaseOrder from "./ManagePurchaseOrder";
import ExpandMore from '@material-ui/icons/ExpandMore';
import MenuItem from "@material-ui/core/MenuItem"
import Menu from "@material-ui/core/Menu"
import CustomAgGrid, { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import ManageRepairJob from '../RepairJob/ManageRepairJob'
import { Link } from 'react-router-dom'
import NoDataCell from "../../components/Helpers/NoDataCell";
import BoxWithBorder from "../../components/BoxWithBorder";
import ProductHierarchy from "../Product/ProductHierarchy";
import AddProductDialog from "./AddProductDialog";
import Add from "@material-ui/icons/Add";
import { Delete } from "@material-ui/icons";
import { Formik, Form, FieldArray, Field } from "formik";

const storedRoutes = localStorage.getItem("routes") ? JSON.parse(localStorage.getItem("routes")) : null;


const PurchaseOrderDetailsPage = () => {
    const toastConfig = useContext(CustomToastContext);

    const { id } = useParams();
    const history = useHistory();
    const {
        state: { permissions }
    }: any = useData();
    const [headingLbl, setHeadingLbl] = useState("");
    const [loadingPurchaseOrder, setLoadingPurchaseOrder] = useState(false);
    const [showRepairJobDialog, setShowRepairJobDialog] = useState(false);
    const [purchaseOrderData, setPurchaseOrderData] = useState(null);
    const [showConfirmBox, setShowConfirmBox] = useState(false);
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [purchaseOrderFields, setPurchaseOrderFields] = useState([]);
    const [mainPoints, setMainPoints] = useState(null);
    const [customizedRoutes, setCustomizedRoutes] = useState([]);
    const [currentTabIndex, setCurrentTabIndex] = useState(0);
    const [addProductDialog, setAddProductDialog] = useState(false);
    const [isAddingProducts, setAddingProducts] = useState(false);
    const [product, setProduct] = useState<any[]>([]);
    const [additionalCost, setAdditionalCost] = useState<any[]>([]);
    const [currencySymbol, setCurrencySymbol] = useState(null);

    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const NameRenderer = (params) => (
        <>{
            params.value ? (
                params.data.type === "Receiving Ticket" ?
                    <Link className="link" title={params.value} to={`${routes.receivingTicketDetail.path}/${params.data.referenceId}`}>
                        {params.value}
                    </Link> : params.data.type.toLowerCase() === "repair" ?
                        <Link className="link" title={params.value} to={`${routes.repairJobDetail.path}/${params.data.referenceId}`}>
                            {params.value}
                        </Link>
                        : params.data.type.toLowerCase() === "rental" ?
                            <Link className="link" title={params.value} to={`${routes.rentalManagementDetail.path}/${params.data.referenceId}`}>
                                {params.value}
                            </Link> : params.value
            ) : (
                <NoDataCell />
            )
        }

        </>
    );
    const frameworkComponents = {
        nameRenderer: NameRenderer,
        commonRenderer: CommonRenderer,
        dateRenderer: DateRenderer,
    };
    const columns = [
        { field: "productName", headerName: "Product Description", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "productNumber", headerName: "Product Number", show: true, cellRenderer: "commonRenderer" },
        { field: "entity", headerName: "Entity", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "quantity", headerName: "Quantity", show: true, disabled: true, cellRenderer: "commonRenderer" },
    ];

    useEffect(() => {
        if (id) {
            getPurchaseOrderFields();
            fetchPurchaseOrderData();
            fetchPurchaseOrderProduct();
        }

    }, [id]);


    const handleMainPoints = (data) => {
        let mainPoint = {};
        // mainPoint['Account Name'] = data?.accountName?.optionLabel || '';
        setMainPoints(mainPoint);
    };

    const fetchPurchaseOrderProduct = () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        axiosInstance().get(`${purchaseOrder.api}/${id}/order-details`).then(({ data: { data } }) => {
            data = data?.map((u) => u.productId);
            dispatch({ type: "initialize", data: data, count: data.length });
            dispatch({ type: "loading", loading: false });
        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const fetchPurchaseOrderData = async () => {
        setLoadingPurchaseOrder(true);
        try {
            const {
                data: { data },
            } = await axiosInstance().get(`${purchaseOrder.api}/${id}`);

            handleMainPoints(data);
            setHeadingLbl(`${data?.purchaseOrderNumber ?? ''} ${data?.product?.optionLabel ? '-' + data?.product?.optionLabel : ""}`);
            setCustomizedRoutes([routes.purchaseOrder,
            { title: `${data?.purchaseOrderNumber ?? ''} ${data?.product?.optionLabel ? '-' + data?.product?.optionLabel : ""}` }]);
            setPurchaseOrderData(data);
            setAdditionalCost(data.additionalCost ? data.additionalCost : [{ "type": "", "value": 0 }]);
            setLoadingPurchaseOrder(false);
        } catch (error) {
            toastConfig.setToastConfig(error);
        }
    };

    const getPurchaseOrderFields = () => {
        axiosInstance()
            .get("/field?resource=Purchase Order")
            .then(({ data }) => {
                setPurchaseOrderFields(data.data);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };


    const handleOpenUpdateDialog = () => {
        setOpenUpdateDialog(true);
    };

    const handleDelete = () => {

        axiosInstance().put(`${purchaseOrder.api}/remove`, { "ids": [] }).then(() => {
            setShowConfirmBox(false);
            history.goBack();
        }).catch((error) => {
            toastConfig.setToastConfig(error)
            setShowConfirmBox(false);
        });
    }


    const handleAddProduct = (productInventoryArray) => {
        // let tempProductArray = productInventoryArray.map(d => { return { "inventory": d._id, "costing": { "costPerDay": 0, "totalCost": 0, "startDate": rentalManagementData.rentalStartDate, "dueDate": rentalManagementData.rentalEndDate } } })
        setAddingProducts(true)
        let tempProductArray = productInventoryArray.map(d => ({
            "productId": d.id,
            "qty": parseInt(d.quantity || d.qty) || 0,
            "value": parseInt(d.price) || 0,
        }))

        axiosInstance().post(`${purchaseOrder.api}/${id}/order-details/add`, { "orderDetails": tempProductArray })
            .then(() => {
                setAddProductDialog(false)
                fetchPurchaseOrderProduct()
                setAddingProducts(false)
            }).catch((error) => {
                setAddProductDialog(false)
                toastConfig.setToastConfig(error)
                setAddingProducts(false)
            });
    }

    const handleSaveAdditionalCost = (additionalCostTemp) => {

        let tempProductArray = additionalCostTemp.map(d => ({
            "type": d.type,
            "value": parseInt(d.value),
        }))

        axiosInstance().post(`${purchaseOrder.api}/${id}/additonal-cost`, { "additionalCost": tempProductArray })
            .then(() => {
                fetchPurchaseOrderData()
            }).catch((error) => {
                toastConfig.setToastConfig(error)
            });
    }

    return (
        <>
            <Fragment>

                <Grid container className="headerbox">
                    <CustomBreadCrumbs routes={customizedRoutes} />
                </Grid>
                <Grid container spacing={1} className="detail-container">
                    <Grid item xs={12} sm={12} md={8} lg={8} spacing={2}>
                        <Paper>
                            {!purchaseOrderData ? (
                                <div>
                                    <Skeleton variant="text" width="150px" height="40px" />
                                    <Box display="flex">
                                        <Skeleton
                                            style={{ borderRadius: 6 }}
                                            width="120px"
                                            height="80px"
                                        />
                                        <Box marginX={1} />
                                        <Skeleton
                                            style={{ borderRadius: 6 }}
                                            width="120px"
                                            height="80px"
                                        />
                                    </Box>
                                </div>
                            ) : (

                                <DetailsPageHeader
                                    heading={headingLbl}
                                    mainPoints={mainPoints}
                                    showHeading={true}
                                >
                                    {permissions?.purchaseOrder?.isRead && (
                                        <>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                onClick={() => { }}
                                            >
                                                view
                                            </Button>
                                        </>
                                    )}
                                    {permissions?.purchaseOrder?.isRead && (
                                        <>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                onClick={() => { }}
                                            >
                                                Download
                                            </Button>
                                        </>
                                    )}
                                    {permissions?.purchaseOrder?.isUpdate && (
                                        <>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                onClick={handleOpenUpdateDialog}
                                            >
                                                Edit
                                            </Button>
                                        </>
                                    )}

                                </DetailsPageHeader>
                            )}


                            <Box>
                                {loadingPurchaseOrder || !purchaseOrderFields.length ? (
                                    <Grid container spacing={2} style={{ padding: "8px" }}>
                                        <CommonSkeleton lenArray={[...Array(7).keys()]} />
                                    </Grid>
                                ) : (
                                    <>
                                        <DetailsPage data={purchaseOrderData}
                                            fields={purchaseOrderFields} />
                                    </>
                                )}
                            </Box>
                            <Grid container spacing={2}>
                            </Grid>
                        </Paper>
                    </Grid>
                    <Box my={1} />
                    <Grid item xs={12} sm={12} md={12} lg={12} spacing={2}>
                        <Grid item xs={12} sm={12} md={12} lg={12}>
                            <>
                                <Tabs
                                    className="oms-tab"
                                    value={currentTabIndex}
                                    onChange={(index, newValue) => {
                                        setCurrentTabIndex(newValue);
                                    }}
                                    indicatorColor="primary"
                                    textColor="primary"
                                    aria-label="icon tabs example"
                                >
                                    <Tab
                                        label="Product"
                                        aria-controls="a11y-tabpanel-0"
                                        id="a11y-tab-0"
                                    />
                                    <Tab
                                        label="Additional Cost"
                                        aria-controls="a11y-tabpanel-1"
                                        id="a11y-tab-1"
                                    />
                                </Tabs>
                                {currentTabIndex === 0 &&
                                    <>
                                        <Box display="flex" justifyContent="space-between" m={1}>
                                            <Box display="flex">
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    size="small"
                                                    onClick={() => {
                                                        setAddProductDialog(true);
                                                    }}
                                                >
                                                    {`Add ${routes.product.title}`}
                                                </Button>
                                                <Box mx={1} />
                                            </Box>
                                        </Box>
                                        {columns ?
                                            <CustomAgGrid
                                                columns={columns}
                                                dataRows={dataRows}
                                                frameworkComponents={frameworkComponents}
                                                setGridApi={setGridApi}
                                                dispatch={dispatch}
                                                rowCount={rowCount}
                                                limit={limit}
                                                pageSizes={pageSizes}
                                                page={page}
                                                allowAction={false}
                                                allowSelection={false}
                                                isClientSideGrid={true}
                                                loading={loading}
                                                renderedFrom="purchaseOrderDetailsPageInventory"
                                                refreshGrid={fetchPurchaseOrderProduct}
                                            />
                                            : <Box
                                                p={2}
                                                height={500}
                                                bgcolor="white">
                                                <CommonSkeleton lenArray={[...Array(10).keys()]} />
                                            </Box>
                                        }
                                    </>
                                }
                                {(currentTabIndex === 1) && (
                                    <Formik
                                        initialValues={{ additionalCost: additionalCost || [{ "type": "", "value": 0 }] }}
                                        enableReinitialize={true}
                                        onSubmit={() => { }}>
                                        {({ values }) => (
                                            <>
                                                <Form>
                                                    <Container className="p-0">
                                                        <Grid
                                                            container
                                                            direction="row"
                                                            justify="space-evenly"
                                                            alignItems="center"
                                                        >
                                                            <Grid item md={12}>
                                                                {values.additionalCost && values.additionalCost.length > 0 && (

                                                                    <Box className={""}>
                                                                        <Grid
                                                                            container
                                                                            spacing={2}
                                                                            direction="row"
                                                                            justify="flex-start"
                                                                            alignItems="center"
                                                                        >
                                                                            <Grid item md={1}> # </Grid>
                                                                            <Grid item md={2}> Type </Grid>
                                                                            <Grid item md={2}> Value </Grid>
                                                                            <Grid item md={1}></Grid>

                                                                        </Grid>
                                                                    </Box>
                                                                )}
                                                                <Box className="p-1">
                                                                    <FieldArray
                                                                        name="additionalCost"
                                                                        render={arrayHelpers => (
                                                                            <div>
                                                                                {values.additionalCost && values.additionalCost.length > 0 ? (
                                                                                    values.additionalCost.map((userVal, index) => (
                                                                                        <Grid
                                                                                            container
                                                                                            spacing={2}
                                                                                            direction="row"
                                                                                            justify="flex-start"
                                                                                            alignItems="center"
                                                                                            key={index}
                                                                                        >
                                                                                            <Grid item md={1}>{index + 1}</Grid>

                                                                                            <Grid item md={2}>
                                                                                                <Field
                                                                                                    fullWidth
                                                                                                    variant="outlined"
                                                                                                    type="text"
                                                                                                    size="small"
                                                                                                    component={TextField}
                                                                                                    name="type"
                                                                                                    placeholder="Type"
                                                                                                    value={userVal.description}
                                                                                                    onChange={(e) => {
                                                                                                        arrayHelpers.replace(index, {
                                                                                                            ...values.additionalCost[index],
                                                                                                            ["type"]: e.target.value
                                                                                                        })
                                                                                                    }}
                                                                                                />
                                                                                            </Grid>
                                                                                            {
                                                                                                <Grid item md={2}>
                                                                                                    <Field
                                                                                                        fullWidth
                                                                                                        InputProps={{
                                                                                                            startAdornment: (
                                                                                                                <InputAdornment position="start">
                                                                                                                    {currencySymbol ? currencySymbol : ""}
                                                                                                                </InputAdornment>
                                                                                                            ),
                                                                                                        }}
                                                                                                        startAdornment={currencySymbol ? <InputAdornment position="start">{currencySymbol}</InputAdornment> : ""}
                                                                                                        variant="outlined"
                                                                                                        type="text"
                                                                                                        size="small"
                                                                                                        component={TextField}
                                                                                                        name="value"
                                                                                                        placeholder="Enter Value"
                                                                                                        value={userVal.amount}
                                                                                                        onChange={(e) => {
                                                                                                            arrayHelpers.replace(index, {
                                                                                                                ...values.additionalCost[index],
                                                                                                                ["value"]: e.target.value.replace(/[^0-9]/g, '')
                                                                                                            })
                                                                                                        }}
                                                                                                    />
                                                                                                </Grid>
                                                                                            }
                                                                                            <Grid item md={1}>
                                                                                                <ButtonGroup size="small" aria-label="small outlined button group">
                                                                                                    <IconButton
                                                                                                        size="small"
                                                                                                        aria-label="add"
                                                                                                        onClick={() => {
                                                                                                            arrayHelpers.push({
                                                                                                                "type": "", "value": 0
                                                                                                            })
                                                                                                        }
                                                                                                        } >
                                                                                                        <Add />
                                                                                                    </IconButton>
                                                                                                    <IconButton size="small" aria-label="delete" style={{ color: "#f44336" }} onClick={() => arrayHelpers.remove(index)} >
                                                                                                        <Delete />
                                                                                                    </IconButton>
                                                                                                </ButtonGroup>
                                                                                            </Grid>
                                                                                        </Grid>
                                                                                    ))
                                                                                ) : (
                                                                                    <Grid item md={12} className="d-flex  align-items-center justify-content-center">
                                                                                        <Button
                                                                                            variant="contained"
                                                                                            color="primary"
                                                                                            size="large"
                                                                                            onClick={() => {
                                                                                                arrayHelpers.push({ "type": "", "value": 0 })
                                                                                            }}
                                                                                        >
                                                                                            Add Cost Type
                                                                                        </Button>
                                                                                    </Grid>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    />
                                                                </Box>
                                                                <Box display="flex" justifyContent="space-between" m={1}>
                                                                    <Box display="flex-end">
                                                                        <Button
                                                                            variant="contained"
                                                                            color="primary"
                                                                            size="small"
                                                                            onClick={() => handleSaveAdditionalCost(values.additionalCost)}
                                                                        >
                                                                            Save
                                                                        </Button>
                                                                        <Box mx={1} />
                                                                    </Box>
                                                                </Box>
                                                            </Grid>
                                                        </Grid>
                                                    </Container>
                                                </Form>
                                            </>
                                        )}
                                    </Formik>

                                )}

                            </>
                        </Grid>
                    </Grid>
                </Grid>

            </Fragment>
            {showConfirmBox && (
                <ConfirmationDialog
                    open={showConfirmBox}
                    message={`Are you sure you want to delete this ${storedRoutes ? storedRoutes.purchaseOrder?.title : RESOURCE_LABEL.purchaseOrder} ?`
                    }
                    onClose={() => {
                        setShowConfirmBox(false);
                    }}
                    onOk={handleDelete}
                />
            )}

            {openUpdateDialog &&
                <ManagePurchaseOrder
                    isClone={false}
                    purchaseOrderId={id}
                    onClose={() => setOpenUpdateDialog(false)}
                    onSuccess={() => {
                        setOpenUpdateDialog(false);
                        fetchPurchaseOrderData()
                    }}
                />
            }
            {addProductDialog &&
                <AddProductDialog
                    isAddingProducts={isAddingProducts}
                    addProductInventory={handleAddProduct}
                    handleProductInventoryClose={() => { setAddProductDialog(false) }}
                    productInventory={product}
                    type={"product"}
                />
            }
        </>
    );
};

export default PurchaseOrderDetailsPage;
