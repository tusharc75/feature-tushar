import React, { useState, useEffect, useContext, Fragment, useReducer } from "react";
import { Grid, Box, Button, Paper, Typography, IconButton, Tab, Tabs, ButtonGroup, Container, InputAdornment, TextField, MenuItem, Menu } from "@material-ui/core";
import { Autocomplete, Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import axiosInstance from "../../../axios/axiosInstance";
import routes from "../../../components/Helpers/Routes";
import { useData } from "../../../StateProvider/Provider";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { purchaseOrder } from "../../../constants/helpers";
import EditIcon from "@material-ui/icons/Edit";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer } from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import AddProductDialog from "./AddProductDialog";
import GridDeleteIcon from "../../../components/Helpers/GridDeleteIcon";
import CreateProduct from "../../../components/Product/CreateProduct";
import CustomAgGridEditable from "../../../components/AgGridComponents/CustomAgGridEditable";
import PurchaseOrderQtyDialog from "./PurchaseOrderQtyDialog";
import { FaCartArrowDown, FaCartPlus } from "react-icons/fa";
import { isMobile } from "react-device-detect";
import CustomSwipableList from "../../../components/SwipableListComponents/CustomSwipableList";
import HtmlTooltip from "../../../components/CustomTooltipTitle";
import { CURReplaceByCurrencySingle } from "../../../constants/formulaUtility";
import { prepareDataForGrid } from "../../../constants/helpers";
import { getColumnData, getStaticFields, getFrameworkComponents, genrateColoum } from "../../../constants/columns"
import { ExpandMore } from "@material-ui/icons";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import CustomRenderCell from "../../../components/Helpers/CustomRenderCell";
import InfoIcon from "@material-ui/icons/Info";

const Product = ({ purchaseOrderData, currentStepDisable, setCurrentStepDisable, id, setPurchaseOrderProduct }) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();

    const [columns, setColumns] = useState([{ field: "productName", headerName: "Product Description", show: true, disabled: true, cellRenderer: "nameRenderer" },
    { field: "productNumber", headerName: "Product Number", show: true, cellRenderer: "commonRenderer" }])


    const [addProductDialog, setAddProductDialog] = useState(false);
    const [isAddingProducts, setAddingProducts] = useState(false);
    const [isAddNewProduct, setIsAddNewProduct] = useState(false)

    const [productList, setProductList] = useState([]);
    const [showProductDialog, setShowProductDialog] = useState(false)
    const [selectedProductData, setSelectedProductData] = useState(null)
    const [isBulkEdit, setIsBulkEdit] = useState(false)

    const [frameWorkComponent, setFrameWorkComponent] = useState(null)
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;
    const [anchorEl, setAnchorEl] = useState(null);
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deletePurchaseOrderProduct, setDeletePurchaseOrderProduct] = useState([]);

    useEffect(() => {
        fetchPurchaseOrderProduct();
    }, [id]);

    useEffect(() => {
        axiosInstance().get("/field/child?resource=Purchase Order Product").then(({ data: { data } }) => {
            const fields = CURReplaceByCurrencySingle(data, purchaseOrderData?.currency)
            let rendererNames = [];
            genrateColoum(fields, columns, rendererNames, false);
            let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
            tempFrameworkComponent = {
                nameRenderer: NameRenderer,
                commonRenderer: CommonRenderer,
                actionsRenderer: ActionsRenderer,
                ...tempFrameworkComponent,
            }
            setFrameWorkComponent({ ...tempFrameworkComponent })
            setColumns([...columns])
        })
    }, []);

    const fetchPurchaseOrderProduct = () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        setCurrentStepDisable(false)
        axiosInstance().get(`${purchaseOrder.api}/product/${id}`).then(({ data: { data } }) => {
            setPurchaseOrderProduct(JSON.parse(JSON.stringify(data)))
            let rows = data?.map((item, index) => {
                if ((!currentStepDisable) && (
                    item.qty === 0
                    || item["finalPrice_" + purchaseOrderData?.currency?.toLowerCase()] === 0
                    || item["finalPrice_" + purchaseOrderData?.currency?.toLowerCase()] === null)) {
                    setCurrentStepDisable(true)
                }
                let finalObject = prepareDataForGrid(item);
                finalObject["isChecked"] = selectedRecords.some(s => s._id === item._id);
                finalObject["allowedToEdit"] = true
                let res: any = {
                    ...finalObject,
                };
                res.productName = `${index + 1}- ${item.productDetail?.productName}`
                res.productNumber = item.productDetail?.productNumber
                res.productDetail = item.productDetail
                return res;
            });
            dispatch({ type: "initialize", data: rows, count: rows.length });
            dispatch({ type: "loading", loading: false });
        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const NameRenderer = params => <span className="d-flex gap-2 align-items-center">
        <span className="link" onClick={() => {
            setShowProductDialog(true)
            setSelectedProductData(params.data)
        }}>
            <CustomRenderCell value={params.value} />
        </span>
        <HtmlTooltip title="Details">
            <IconButton
                size="small"
                aria-label="Details"
                onClick={() => {
                    window.open(`${routes.productDetail.path}/${params.data.productId}`);
                }}
            >
                <InfoIcon fontSize="small" />
            </IconButton>
        </HtmlTooltip>
    </span >

    const ActionsRenderer = (params) => (
        <>
            <HtmlTooltip title="Edit">
                <IconButton
                    size="small"
                    aria-label="Clone"
                    onClick={() => {
                        setShowProductDialog(true)
                        setSelectedProductData(params.data)
                    }}
                >
                    <EditIcon color="primary" />
                </IconButton>
            </HtmlTooltip>
            {(params.data?.actualReceived === undefined || params.data?.actualReceived === 0) && <GridDeleteIcon
                hasDeletePermission={permissions?.purchaseOrder?.isUpdate}
                ownerId={user?.user?._id}
                userId={user?.user?._id}
                onDelete={() => {
                    setShowDeleteConfirmBox(true)
                    setDeletePurchaseOrderProduct([params.data._id])
                }
                }
                entity="rentalManagement"
            />
            }
        </>
    );


    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const handleAddProduct = (products) => {
        setAddingProducts(true)
        let tempProductArray = products.map(d => ({
            "productId": d.id || d.productId,
            "qty": parseInt(d.quantity) || 0,
            "expectedDelivery": purchaseOrderData?.deliveryDate
        }))
        axiosInstance().post(`${purchaseOrder.api}/product/${id}/add`, { "orderDetails": tempProductArray })
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

    const handleUpdateQty = (rows) => {
        axiosInstance().put(`${purchaseOrder.api}/product/${id}/update`, { products: rows })
            .then(() => {
                setAddProductDialog(false)
                fetchPurchaseOrderProduct()
                setSelectedProductData(null)
                setAddingProducts(false)
                setShowProductDialog(false)
                setIsBulkEdit(false)
            }).catch((error) => {
                setAddProductDialog(false)
                toastConfig.setToastConfig(error)
                setAddingProducts(false)
            });
    }

    const handleDelete = () => {
        axiosInstance().post(`${purchaseOrder.api}/product/${id}/delete`, { ids: deletePurchaseOrderProduct })
            .then(() => {
                fetchPurchaseOrderProduct()
                setShowDeleteConfirmBox(false)
                setDeletePurchaseOrderProduct([])
            }).catch((error) => {
                toastConfig.setToastConfig(error)
            });
    }

    return (
        <Fragment>
            <Box display="flex" justifyContent="space-between" m={1}>
                <Box display="flex" alignItems="center">
                    <Button
                        variant={isMobile ? "outlined" : "contained"}
                        color="primary"
                        size="small"
                        onClick={() => {
                            setIsAddNewProduct(true);
                        }}
                    >
                        {isMobile ? <FaCartPlus size={22} /> : `Add New ${routes.product.title}`}
                    </Button>
                    <Box mx={1} />
                    <Button
                        variant={isMobile ? "outlined" : "contained"}
                        color="primary"
                        size="small"
                        onClick={() => {
                            setAddProductDialog(true);
                        }}
                    >
                        {isMobile ? <FaCartArrowDown size={22} /> : `Add Existing ${routes.product.title}`}
                    </Button>
                </Box>
                <div className="d-flex gap-2">
                    <Box display="flex" justifyContent="flex-end">
                        <Box mx={1} />
                        <Button
                            variant={isMobile ? "outlined" : "contained"}
                            color="primary"
                            size="small"
                            disabled={selectedRecords.length === 0}
                            onClick={() => {
                                setIsBulkEdit(true)
                                setShowProductDialog(true)
                            }}
                        >
                            {isMobile ? <EditIcon color="primary" /> : `Bulk Edit`}
                        </Button>
                    </Box>
                    <HtmlTooltip title="Please select some product">
                        <Button
                            variant="outlined"
                            color="default"
                            size="small"
                            onClick={openActions}
                            disabled={selectedRecords.length ? false : true}
                            aria-controls="action-menu"
                        >Actions
                            <ExpandMore />
                        </Button>
                    </HtmlTooltip>
                    <Menu
                        anchorEl={anchorEl}
                        keepMounted
                        getContentAnchorEl={null}
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "left",
                        }}
                        id="action-menu"
                        open={Boolean(anchorEl)}
                        onClose={closeActions}
                    >
                        {permissions?.purchaseOrder?.isDelete && <MenuItem onClick={() => {
                            closeActions()
                            setShowDeleteConfirmBox(true)
                            setDeletePurchaseOrderProduct(selectedRecords.map(d => d._id))
                        }}>Delete</MenuItem>}
                    </Menu>
                </div>
            </Box>
            {columns && frameWorkComponent ? isMobile ?
                <CustomSwipableList
                    allowSelection={true}
                    allowSwipe={true}
                    permissions={permissions}
                    primaryField={columns?.find(d => d.field === "productName")}
                    onClick={(data) => {
                        setShowProductDialog(true)
                        setSelectedProductData(data)
                    }}
                    dataRows={dataRows}
                    selectedRecords={selectedRecords}
                    dispatch={dispatch}
                    onEdit={(data) => {
                        setShowProductDialog(true)
                        setSelectedProductData(data)
                    }}
                    extraParamsToCheckDelete={true}
                    onDelete={(data) => {
                        setShowDeleteConfirmBox(true)
                        setDeletePurchaseOrderProduct([data._id])
                    }}
                    rowCount={rowCount}
                    page={page}
                    loading={loading}
                    chips={
                        [{
                            label: `Quantity: `,
                            field: "qty",
                            forceShow: true
                        }]
                    }
                    onCreate={null}
                    showClone={false}
                    fullHeight={true}
                    renderedFrom={routes.purchaseOrderDetail.title}
                    onClone={() => { }}

                /> :
                <CustomAgGridEditable
                    columns={columns}
                    dataRows={dataRows}
                    frameworkComponents={frameWorkComponent}
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
                        //handleUpdateOrderProduct(row.data)
                    }}
                    renderedFrom="purchaseOrderDetailsPageInventory"
                    refreshGrid={fetchPurchaseOrderProduct}
                    fromPurchaseOrderGrid={true}
                    currency={purchaseOrderData?.currency?.toLowerCase()}
                />
                : <Box
                    p={2}
                    height={500}
                    bgcolor="white">
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
            }
            {addProductDialog &&
                <AddProductDialog
                    isAddingProducts={isAddingProducts}
                    addProductInPurchaseOrder={handleAddProduct}
                    handleProductInPurchaseOrderClose={() => { setAddProductDialog(false) }}
                    productInPurchaseOrder={productList}
                    type={"product"}
                />
            }
            {isAddNewProduct && (
                <CreateProduct
                    isClone={false}
                    productId={null}
                    handleClose={() => setIsAddNewProduct(false)}
                    isAddInBuilder={true}
                    addProductInBuilder={handleAddProduct}
                    openFrom="builder"
                    fromQuote={true}
                />
            )}
            {showProductDialog &&
                <PurchaseOrderQtyDialog
                    onClose={() => {
                        setShowProductDialog(false)
                        setIsBulkEdit(false)
                        setSelectedProductData(null)
                    }}
                    onSubmit={handleUpdateQty}
                    currency={purchaseOrderData?.currency}
                    productData={!isBulkEdit ? selectedProductData : selectedRecords}
                    bulkEdit={isBulkEdit}
                    purchaseOrderData={purchaseOrderData}
                />
            }
            {
                showDeleteConfirmBox &&
                <ConfirmationDialog
                    open={showDeleteConfirmBox}
                    message={`Are you sure you want to delete  ? `}
                    onClose={() => setShowDeleteConfirmBox(false)}
                    onOk={handleDelete}
                />
            }
        </Fragment>
    );
};

export default Product;
