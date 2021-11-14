import React, { useState, useEffect, useContext, Fragment, useReducer } from "react";
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
import { purchaseOrder, getObjKeysWithValues, gridLoadingTimeout, product, RESOURCE_LABEL, getUniqueCurrencies } from "../../constants/helpers";
import ManagePurchaseOrder from "./ManagePurchaseOrder";
import ExpandMore from '@material-ui/icons/ExpandMore';
import MenuItem from "@material-ui/core/MenuItem"
import Menu from "@material-ui/core/Menu"
import EditIcon from "@material-ui/icons/Edit";
import CustomAgGrid, { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import AddProductDialog from "./AddProductDialog";
import CreateSeriaizedAsset from "./CreateSerializedAsset";
import GridDeleteIcon from "../../components/Helpers/GridDeleteIcon";
import CreateProduct from "../../components/Product/CreateProduct";
import CustomAgGridEditable from "../../components/AgGridComponents/CustomAgGridEditable";
import Steps from "./Steps";
import Service from "./Service";
import BulkEditDialog from "./BulkEditDialog";
import HtmlTooltip from "../../components/CustomTooltipTitle";
import IssuPO from "./IssuPO";
import { FaWpforms } from "react-icons/fa";
import { BiFoodMenu } from "react-icons/bi";
import TabPanel from "../../components/TabPanel";

const storedRoutes = localStorage.getItem("routes") ? JSON.parse(localStorage.getItem("routes")) : null;

const purchaseOrderSteps = ["Add Product", "Add Services", "Issue PO", "Receiving Asset"]

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
    const [addProductDialog, setAddProductDialog] = useState(false);
    const [isAddingProducts, setAddingProducts] = useState(false);
    const [product, setProduct] = useState<any[]>([]);
    const [currencySymbol, setCurrencySymbol] = useState(null);
    const [showCreateAssetDialog, setShowCreateAssetDialog] = useState(false)
    const [updateLoading, setUpdateLoading] = useState(false)
    const [isAddNewProduct, setIsAddNewProduct] = useState(false)
    const [anchorEl, setAnchorEl] = useState(null);
    const [statusOptions, setStatusOptions] = useState([])
    const [purchaseOrderProduct, setPurchaseOrderProduct] = useState([])
    const [showAddServiceDialog, setShowAddServiceDialog] = useState(false)
    const [isSavingBulkEditDialog, setIsSavingBulkEditDialog] = useState(false)
    const [currentStep, setCurrentStep] = useState(0);
    const [downlodingFile, setDownlodingFile] = useState(false)
    const [selectedProductData, setSelectedProductData] = useState(null)

    const [tabValue, setTabValue] = useState(0);

    function a11yProps(index: any) {
        return {
            id: `main-tab-${index}`,
            'aria-controls': `main-tabpanel-${index}`
        };
    }

    const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setTabValue(newValue);
    };



    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const ActionsRenderer = (params) => (
        <>
            <GridDeleteIcon
                hasDeletePermission={permissions?.purchaseOrder?.isUpdate}
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
            {
                <HtmlTooltip title="Edit">
                    <IconButton
                        size="small"
                        aria-label="Clone"
                        onClick={() => {
                            setShowAddServiceDialog(true)
                            setSelectedProductData(params.data)
                        }}
                    >
                        <EditIcon color="primary" />
                    </IconButton>
                </HtmlTooltip>
            }
        </>
    );

    const frameworkComponents = {
        commonRenderer: CommonRenderer,
        actionsRenderer: ActionsRenderer,
        dateRenderer: DateRenderer,
    };

    const [columns, setColumns] = useState([
        { field: "productName", headerName: "Product Description", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "productNumber", headerName: "Product Number", show: true, cellRenderer: "commonRenderer" },
        { field: "expectedDelivery", headerName: "Expected Delivery", show: true, disabled: true, cellRenderer: "dateRenderer", cellEditor: "dateEditor", editable: true },
        { field: "quantity", headerName: "Quantity", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
        { field: "uom", headerName: "Base UOM", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "agSelectCellEditor", cellEditorParams: { cellRenderer: "commonRenderer", values: ["Hour", "Day", "Week", "Month"] }, editable: true },
        { field: "price", headerName: "Price", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
        { field: "tax", headerName: "Tax Percent", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
        { field: "taxPerUnit", headerName: "Tax Per Unit", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
        { field: "totalTax", headerName: "Total Tax", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
        { field: "finalPrice", headerName: "Final Price", show: true, disabled: true, cellRenderer: "commonRenderer" },
    ])

    useEffect(() => {
        if (id) {
            getPurchaseOrderFields();
            fetchPurchaseOrderData();
            fetchPurchaseOrderProduct();
        }

    }, [id]);

    useEffect(() => {
        if (currentStep > -1) {
            axiosInstance().put(`${purchaseOrder.api}/${id}/process-status`, { "processStatus": purchaseOrderSteps[currentStep] }).then(({ data }) => {
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
        }
        // eslint-disable-next-line
    }, [currentStep]);

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
            setCurrentStep(purchaseOrderSteps.indexOf(data?.processStatus) !== -1 ? purchaseOrderSteps.indexOf(data?.processStatus) : 0)
            setCurrencySymbol(
                getUniqueCurrencies().find(
                    (d) => d.currencyCode === data["currency"]
                )?.symbolNative
            );
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
                        if (o?.fieldData?.fieldName === "taxSchedule" && !columns.some(d => d.field === "taxSchedule")) {
                            setColumns([...columns, { field: "taxSchedule", headerName: "Tax Schedule", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "agSelectCellEditor", cellEditorParams: { cellRenderer: "commonRenderer", values: o.fieldData?.option?.map(d => d?.optionLabel) }, editable: true }])

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
            "expectedDelivery": purchaseOrderData?.deliveryDate
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

    const addProductInPurchaseOrder = (productInventoryArray) => {

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
            "finalPrice": row.finalPrice || 0,
            "actualReceived": row.actualReceived || 0,
            "billed": row.billed || 0,
            "taxSchedule": row.taxSchedule || "",
            "tax": row.tax || 0,
            "taxPerUnit": row.taxPerUnit || 0,
            "totalTax": row.totalTax || 0
        }

        axiosInstance().post(`${purchaseOrder.api}/${id}/order-details/update?orderId=${row._id}`, tempProductArray)
            .then(() => {
                setAddProductDialog(false)
                fetchPurchaseOrderProduct()
                setAddingProducts(false)
                setShowAddServiceDialog(false)
            }).catch((error) => {
                setAddProductDialog(false)
                toastConfig.setToastConfig(error)
                setAddingProducts(false)
            });
    }

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };
    const handleStatusChange = o => {
        handleUpdateData({ status: o.optionValue })
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

    const handleViewPdf = (download) => {
        axiosInstance().get(`/${purchaseOrder.api}/${id}/pdf`)
            .then(({ data }) => {
                axiosInstance()
                    .get(`user/download?fileName=${data.data.fileName}`, {
                        responseType: "blob",
                    })
                    .then(({ data }) => {
                        if (download) {
                            const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `PurchaseOrder.pdf`);
                            document.body.appendChild(link);
                            link.click();
                        }
                        else {
                            const file = new Blob([data], { type: "application/pdf" });
                            const fileURL = URL.createObjectURL(file);
                            const pdfWindow = window.open();
                            pdfWindow.location.href = fileURL;
                            toastConfig.setToastConfig({ open: true, type: "success", message: "Preview file downloaded successfully." })

                        }
                        setDownlodingFile(false);
                    })
                    .catch((err) => {
                        toastConfig.setToastConfig(err);
                        setDownlodingFile(false);
                    });
            }).catch((err) => {
                toastConfig.setToastConfig(err);
                setDownlodingFile(false);
            })
    }


    return (
        <>
            <Fragment>

                <Grid container className="headerbox">
                    <CustomBreadCrumbs routes={customizedRoutes} />
                </Grid>
                <Grid container spacing={1} className="detail-container">

                    <Grid item xs={12} sm={12} spacing={2}>

                        <Paper style={{ height: "650px" }}>
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
                                                            value={o}
                                                            disabled={o.optionValue === "Received"}
                                                        >{o?.optionLabel}</MenuItem>
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




                            <Tabs
                                className="quote-tab"
                                value={tabValue}
                                onChange={handleMainTabChange}
                                textColor="primary"
                                TabIndicatorProps={{
                                    style: {
                                        display: 'none'
                                    }
                                }}
                            >
                                {/* <Tab
                        className={"tabLayout"}
                      style={{
                        background: tabValue === 0 ? "white" : "",
                        color: tabValue === 0 ? "blue" : "#163340",
                      }}
                      label={
                        <div className="d-flex align-items-center tab-font ">
                          <InfoIcon className="mr-1" fontSize="inherit" /> All
                          Version Status
                        </div>
                      }
                      {...a11yProps(0)}
                    /> */}
                                <Tab
                                    className={'tabLayout'}
                                    style={{
                                        background: tabValue === 1 ? 'white' : '',
                                        color: tabValue === 1 ? '#163340' : '#163340'
                                    }}
                                    label={
                                        <div className="d-flex align-items-center tab-font">
                                            <FaWpforms className="mr-1" fontSize="inherit" /> Header
                                        </div>
                                    }
                                    {...a11yProps(0)}
                                />
                                <Tab
                                    className={'tabLayout'}
                                    style={{
                                        background: tabValue === 2 ? 'white' : '',
                                        color: tabValue === 2 ? 'blue' : '#163340'
                                    }}
                                    label={
                                        <div className="d-flex align-items-center tab-font">
                                            <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
                                        </div>
                                    }
                                    {...a11yProps(1)}
                                />
                                <div className={'uio'}> </div>
                            </Tabs>

                            <TabPanel value={tabValue} index={0}>
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
                            </TabPanel>

                            <TabPanel value={tabValue} index={1}>
                                <Grid item xs={12} sm={12} md={12} lg={12} >
                                    <Grid item xs={12} sm={12} md={12} lg={12}>
                                        <>

                                            <Paper>
                                                <Steps
                                                    // className={styles.steps_box}
                                                    isNextStep={!Boolean(purchaseOrderProduct.length)}
                                                    steps={purchaseOrderSteps.slice(0, 5)}
                                                    currentStep={currentStep}
                                                    setCurrentStep={setCurrentStep}
                                                />
                                                {currentStep === 0 &&
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
                                                {(currentStep === 1) && (
                                                    <Service
                                                        currencySymbol={currencySymbol}
                                                        purchaseOrderData={purchaseOrderData} />
                                                )}
                                                {currentStep === 2 &&
                                                    <IssuPO
                                                        combinedPurchaseOrderList={purchaseOrderProduct}
                                                        handleViewPdf={handleViewPdf}
                                                        downlodingFile={downlodingFile}
                                                        setCurrentStep={setCurrentStep}
                                                        currentStep={currentStep}
                                                    />
                                                }
                                                {currentStep === 3 &&
                                                    <>
                                                        <Box display="flex" justifyContent="space-between" m={1}>
                                                            <Box display="flex">
                                                                <Box mx={1} />
                                                                <Button
                                                                    variant="contained"
                                                                    color="primary"
                                                                    size="small"
                                                                    disabled={selectedRecords.length === 0}
                                                                    onClick={() => { setShowCreateAssetDialog(true) }}
                                                                >
                                                                    {`Create Asset`}
                                                                </Button>
                                                            </Box>
                                                        </Box>
                                                        {columns ?
                                                            <CustomAgGrid
                                                                columns={
                                                                    [...columns.map(d => ({
                                                                        field: d.field, headerName: d.headerName, show: d.show, disabled: d.disabled, cellRenderer: d.cellRenderer
                                                                    })),
                                                                    { field: "actualReceived", headerName: "Actual Received", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true }
                                                                    ]
                                                                }
                                                                dataRows={dataRows}
                                                                frameworkComponents={frameworkComponents}
                                                                setGridApi={setGridApi}
                                                                dispatch={dispatch}
                                                                rowCount={rowCount}
                                                                limit={limit}
                                                                pageSizes={pageSizes}
                                                                page={page}
                                                                allowAction={false}
                                                                allowSelection={true}
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
                                            </Paper>
                                        </>
                                    </Grid>
                                </Grid>

                            </TabPanel>







                        </Paper>











                    </Grid>
                    <Box my={1} />
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
                    addProductInPurchaseOrder={handleAddProduct}
                    handleProductInPurchaseOrderClose={() => { setAddProductDialog(false) }}
                    productInPurchaseOrder={product}
                    type={"product"}
                />
            }
            {showCreateAssetDialog &&
                <CreateSeriaizedAsset
                    purchaseOrderID={id}
                    onClose={() => setShowCreateAssetDialog(false)}
                    onSuccess={() => {
                        setShowCreateAssetDialog(false)
                        handleUpdateData({ status: "Received" })
                    }}
                    title="Create Asset"
                    productList={selectedRecords}
                />
            }
            {isAddNewProduct && (
                <CreateProduct
                    isClone={false}
                    productId={null}
                    handleClose={() => setIsAddNewProduct(false)}
                    isAddInBuilder={true}
                    addProductInBuilder={addProductInPurchaseOrder}
                    openFrom="builder"
                    fromQuote={true}
                />
            )}
            {showAddServiceDialog &&
                <BulkEditDialog
                    isSaving={isSavingBulkEditDialog}
                    onClose={() => {
                        setShowAddServiceDialog(false)
                        setSelectedProductData(null)
                    }}
                    submitBulkEdit={selectedProductData ? handleUpdateOrderProduct : handleUpdateOrderProduct}
                    currencySymbol={currencySymbol}
                    data={selectedProductData}
                    type={"product"}
                />
            }
        </>
    );
};

export default PurchaseOrderDetailsPage;
