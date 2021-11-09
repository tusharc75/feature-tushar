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
import CreateSeriaizedAsset from "./CreateSeriaizedAsset";
import GridDeleteIcon from "../../components/Helpers/GridDeleteIcon";
import CreateProduct from "../../components/Product/CreateProduct";
import CustomAgGridEditable from "../../components/AgGridComponents/CustomAgGridEditable";

const storedRoutes = localStorage.getItem("routes") ? JSON.parse(localStorage.getItem("routes")) : null;


const PurchaseOrderDetailsPage = () => {
    const toastConfig = useContext(CustomToastContext);

    const { id } = useParams();
    const history = useHistory();
    const {
        state: { user, permissions }
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
    const [showCreateAssetDIalog, setShowCreateAssetDIalog] = useState(false)
    const [updateLoading, setUpdateLoading] = useState(false)
    const [isAddNewProduct, setIsAddNewProduct] = useState(false)
    const [anchorEl, setAnchorEl] = useState(null);
    const [statusOptions, setStatusOptions] = useState([])
    const [purchaseOrderProduct, setPurchaseOrderProduct] = useState([])
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const ActionsRenderer = (params) => (
        <>
            <GridDeleteIcon
                hasDeletePermission={permissions?.rentalManagement?.isDelete}
                ownerId={user?.user?._id}
                userId={user?.user?._id}
                onDelete={() => {
                    deletePurchaseOrderProduct([{
                        id: params.data._id,
                    }])
                }
                }
                entity="rentalManagement"
            />
        </>
    );

    const frameworkComponents = {
        commonRenderer: CommonRenderer,
        actionsRenderer: ActionsRenderer,
        dateRenderer: DateRenderer,
    };
    const columns = [
        { field: "productName", headerName: "Product Description", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "productNumber", headerName: "Product Number", show: true, cellRenderer: "commonRenderer" },
        { field: "expectedDelivery", headerName: "Expected Delivery", show: true, disabled: true, cellRenderer: "dateRenderer", cellEditor: "dateEditor", editable: true },
        { field: "quantity", headerName: "Quantity", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
        { field: "uom", headerName: "Base UOM", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "agSelectCellEditor", cellEditorParams: { cellRenderer: "commonRenderer", values: ["Hour", "Day", "Week", "Month"] }, editable: true },
        { field: "price", headerName: "Price", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
        { field: "finalPrice", headerName: "Final Price", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: false },
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
            data = data?.map((u) => ({
                ...u,
                productName: u.productId?.productName,
                productNumber: u.productId?.productNumber,
                entity: u.productId?.entity,
                quantity: u.qty

            }));
            setPurchaseOrderProduct(data)
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
            setAdditionalCost(data.additionalCost ? data.additionalCost.map(u => ({ "type": u.type, "value": u.value })) : [{ "type": "", "value": 0 }]);
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
                if (data.data && data.data.length) {
                    data.data.some(o => {
                        if (o?.fieldData?.fieldName === "status") {
                            setStatusOptions([...o.fieldData.option])
                            return true
                        }
                    })
                }
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

    const addProductInBuilder = (productInventoryArray) => {

        setAddingProducts(true)
        let tempProductArray = productInventoryArray.map(d => ({
            "productId": d.productId,
            "qty": parseInt(d.quantity || d.qty) || 0,
            "value": parseInt(d.price || d.mrp) || 0,
        }))
        axiosInstance().post(`${purchaseOrder.api}/${id}/order-details/add`, { "orderDetails": tempProductArray }).then(() => {
            setAddProductDialog(false)
            fetchPurchaseOrderProduct()
            setAddingProducts(false)
        })
            .catch((error) => {
                setAddProductDialog(false)
                toastConfig.setToastConfig(error)
                setAddingProducts(false)
            });
    };

    const handleUpdateOrderProduct = (row) => {
        let tempProductArray = {
            "qty": parseInt(row.quantity || row.qty) || 0,
            "value": parseInt(row.price || row.value) || 0,
            "expectedDelivery": row.expectedDelivery || "",
            "uom": row.uom || "",
            "price": row.price || 0,
            "finalPrice": row.finalPrice || 0
        }

        axiosInstance().post(`${purchaseOrder.api}/${id}/order-details/update?orderId=${row._id}`, tempProductArray)
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

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };
    const handleStatusChange = o => {
        if (o.optionValue === "Received") {
            setShowCreateAssetDIalog(true)
        }
        else {
            handleUpdateData({ status: o.optionValue })
        }
    }

    const handleUpdateData = (obj) => {

        if (obj.status) {
            const fieldsDataForUpdate = purchaseOrderFields.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
            let values = getObjKeysWithValues(purchaseOrderData, fieldsDataForUpdate)
            values["status"] = obj.status
            if (obj.reason) values["scrapingReason"] = obj.reason
            values["_id"] = id
            axiosInstance().put(`${purchaseOrder.api}`, values).then(({ data: { data } }) => {
                getPurchaseOrderFields();
                fetchPurchaseOrderData();
                fetchPurchaseOrderProduct();
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
        }
    }

    const deletePurchaseOrderProduct = (products) => {
        axiosInstance().delete(`${purchaseOrder.api}/${id}/order-details/delete?orderId=${products.map(d => d.id)}`)
            .then(() => {
                fetchPurchaseOrderProduct()
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
                                    {(permissions?.purchaseOrder?.isUpdate &&
                                        <>
                                            <Button
                                                variant="outlined"
                                                color="default"
                                                size="small"
                                                onClick={openActions}
                                                disabled={updateLoading || purchaseOrderData?.status === "Received"}
                                                aria-controls="action-menu"
                                                endIcon={<ExpandMore />}
                                            >
                                                Change Status
                                            </Button>
                                            <Menu
                                                anchorEl={anchorEl}
                                                keepMounted
                                                getContentAnchorEl={null}
                                                anchorOrigin={{
                                                    vertical: 'bottom',
                                                    horizontal: 'left'
                                                }}
                                                id="action-menu"
                                                open={Boolean(anchorEl)}
                                                onClose={closeActions}>
                                                {
                                                    statusOptions.map(o => {
                                                        return <MenuItem
                                                            onClick={() => {
                                                                closeActions()
                                                                handleStatusChange(o)
                                                            }}
                                                            value={o}>{o?.optionLabel}</MenuItem>
                                                    })
                                                }
                                            </Menu>
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
                                                        setIsAddNewProduct(true);
                                                    }}
                                                >
                                                    {`Add New ${routes.product.title}`}
                                                </Button>
                                                <Box mx={1} />
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    size="small"
                                                    onClick={() => {
                                                        setAddProductDialog(true);
                                                    }}
                                                >
                                                    {`Add Existing ${routes.product.title}`}
                                                </Button>
                                            </Box>
                                        </Box>
                                        {columns ?
                                            <CustomAgGridEditable
                                                columns={columns}
                                                dataRows={dataRows}
                                                frameworkComponents={frameworkComponents}
                                                setGridApi={setGridApi}
                                                dispatch={dispatch}
                                                rowCount={rowCount}
                                                limit={limit}
                                                pageSizes={pageSizes}
                                                page={page}
                                                allowAction={true}
                                                actionWidth={150}
                                                allowSelection={true}
                                                isClientSideGrid={true}
                                                loading={loading}
                                                onCellValueChanged={(row) => {
                                                    handleUpdateOrderProduct(row.data)
                                                }}
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
                                                                                                    value={userVal.type}
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
                                                                                                        value={userVal.value}
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
            {showCreateAssetDIalog &&
                <CreateSeriaizedAsset
                    purchaseOrderID={id}
                    onClose={() => setShowCreateAssetDIalog(false)}
                    onSuccess={() => {
                        setShowCreateAssetDIalog(false)
                        handleUpdateData({ status: "Received" })
                    }}
                    title="Create Asset"
                    productList={purchaseOrderProduct}
                />
            }
            {isAddNewProduct && (
                <CreateProduct
                    isClone={false}
                    productId={null}
                    handleClose={() => setIsAddNewProduct(false)}
                    isAddInBuilder={true}
                    addProductInBuilder={addProductInBuilder}
                    openFrom="builder"
                    fromQuote={true}
                />
            )}
        </>
    );
};

export default PurchaseOrderDetailsPage;
