import React, { useState, useEffect, useContext, Fragment, useReducer } from "react";
import { Grid, Box, Button, Paper, Typography, IconButton, Tab, Tabs, ButtonGroup, Container, InputAdornment, TextField, MenuItem, Menu } from "@material-ui/core";
import axiosInstance from "src/axios/axiosInstance";
import routes from "src/components/Helpers/Routes";
import { useData } from "src/StateProvider/Provider";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import { purchaseOrder, PURCHASE_ORDER_STATUS } from "src/constants/helpers";
import EditIcon from "@material-ui/icons/Edit";
import CustomAgGrid, { intialState, reducer } from "src/components/AgGridComponents/CustomAgGrid";
import { CommonRenderer } from "src/components/AgGridComponents/CustomAgGridCellRenderers";
import AddExistingProductInventory from "../../Sublease/Productpackage/AddExistingProductInventory";
import GridDeleteIcon from "src/components/Helpers/GridDeleteIcon";
import CreateProduct from "src/components/Product/CreateProduct";
import CustomAgGridEditable from "src/components/AgGridComponents/CustomAgGridEditable";
import PurchaseOrderQtyDialog from "./PurchaseOrderQtyDialog";
import { isMobile, isTablet } from "react-device-detect";
import CustomSwipableList from "src/components/SwipableListComponents/CustomSwipableList";
import HtmlTooltip from "src/components/CustomTooltipTitle";
import { prepareDataForGrid } from "src/constants/helpers";
import { getFrameworkComponents, genrateColoum } from "src/constants/columns"
import { ExpandMore } from "@material-ui/icons";
import ConfirmationDialog from "src/components/Helpers/ConfirmationDialog";
import { RiEditCircleLine } from "react-icons/ri";
import { fetch_po_product_fields } from '../../../components/PurchaseOrder/helper';
import { CheckboxRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import { Link } from 'react-router-dom'
import SendEmail from './../SendEmail';

const Product = ({ purchaseOrderData, setNextStep, setPurchaseOrderProduct, renderedFrom, allowedToEdit: hasPermission, seIsShowIssue, updateStatus, checkReceivedProduct }) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();
    const allowedToEdit = hasPermission && permissions?.purchaseOrder.isUpdate

    const [columns, setColumns] = useState([])

    const [addProductDialog, setAddProductDialog] = useState(false);
    const [isAddingProducts, setAddingProducts] = useState(false);
    const [isAddNewProduct, setIsAddNewProduct] = useState(false)

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

    const [isRateRequired, setIsRateRequired] = useState(false);

    useEffect(() => {
        fetchFields()
    }, []);

    useEffect(() => {
        fetchPurchaseOrderProduct();
    }, [columns]);

    const fetchFields = async () => {
        const productResult = await axiosInstance().get('/field?resource=Product&view=true')
        const productFields = productResult?.data?.data?.filter((e) => ["productName", "productNumber", "serializedProduct"].includes(e?.fieldData?.fieldName));
        productFields?.forEach((e) => {
            if (e?.fieldData?.fieldName === "productName") {
                columns.push({ field: "productName", headerName: e?.fieldData?.fieldLabel, show: true, disabled: true, cellRenderer: "nameRenderer" })
            }
            if (e?.fieldData?.fieldName === "productNumber") {
                columns.push({ field: "productNumber", headerName: e?.fieldData?.fieldLabel, show: true, cellRenderer: "commonRenderer" })
            }
            if (e?.fieldData?.fieldName === "serializedProduct") {
                columns.push({ field: "serializedProductView", headerName: e?.fieldData?.fieldLabel, show: true, cellRenderer: "commonRenderer" })
            }
        })
        const fields = await fetch_po_product_fields(purchaseOrderData?.currency);
        fields.forEach(element => {
            if (element.fieldName === "price" && element.required) {
                setIsRateRequired(true);
            }
        });
        let rendererNames = [];
        genrateColoum(fields, columns, rendererNames, false, renderedFrom);
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
        tempFrameworkComponent = {
            nameRenderer: NameRenderer,
            commonRenderer: CommonRenderer,
            checkboxRenderer: CheckboxRenderer,
            actionsRenderer: ActionsRenderer,
            ...tempFrameworkComponent,
        }
        setFrameWorkComponent({ ...tempFrameworkComponent })
        setColumns([...columns])
    }

    const fetchPurchaseOrderProduct = () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        setNextStep(false)
        axiosInstance().get(`${purchaseOrder.api}/product/${purchaseOrderData._id}`).then(({ data: { data } }) => {
            setPurchaseOrderProduct(JSON.parse(JSON.stringify(data)))
            let rows = data?.map((item, index) => {
                let finalObject = prepareDataForGrid(item);
                finalObject["isChecked"] = selectedRecords.some(s => s._id === item._id);
                finalObject["allowedToEdit"] = allowedToEdit
                let res: any = {
                    ...finalObject,
                };
                res.productName = item.productDetail?.productName
                res.productNumber = item.productDetail?.productNumber
                res.serializedProduct = item.productDetail?.serializedProduct
                res.serializedProductView = item.productDetail?.serializedProduct ? "Yes" : "No"
                res.productDetail = item.productDetail
                if (item?.qty === 0) {
                    res.isValid = false;
                }
                else if (isRateRequired) {
                    if (item["finalPrice_" + purchaseOrderData?.currency?.toLowerCase()]) {
                        res.isValid = true;
                    }
                    else {
                        res.isValid = false;
                    }
                }
                else {
                    res.isValid = true
                }
                res.hideSelection = item.actualReceived ? true : false
                return res;
            });
            if (rows.length === 0) {
                setNextStep(false)
                seIsShowIssue(false)
            }
            else if (rows.filter(_rows => _rows.isValid === false).length > 0) {
                setNextStep(false)
                seIsShowIssue(false)
            }
            else {
                setNextStep(true)
                seIsShowIssue(true)
            }
            checkReceivedProduct(data)
            dispatch({ type: "initialize", data: rows, count: rows.length });
            dispatch({ type: "loading", loading: false });
        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const columnState = JSON.parse(localStorage.getItem(renderedFrom));
    if (columnState) {
        columns.forEach((item) => {
            columnState.forEach((d) => {
                if (d.colId === item.field) {
                    item.show = !d.hide;
                }
            });
        });
    }

    const NameRenderer = params => (<Link className="link text-truncate" title={params.value} to={`${routes.productDetail.path}/${params.data.productId}`}>
        {params.value}
    </Link>)

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

    const handleAddProduct = (rows) => {
        setAddingProducts(true)
        let tempProductArray = rows?.map(d => ({
            "productId": d.productId || d._id,
            "qty": d.qty ? parseInt(d.qty) : 1,
            "expectedDelivery": purchaseOrderData?.deliveryDate,
            "unit": d?.unitMain?.length ? d?.unitMain[0] : "",
        }))
        axiosInstance().post(`${purchaseOrder.api}/product/${purchaseOrderData._id}/add`, { "orderDetails": tempProductArray })
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
        axiosInstance().put(`${purchaseOrder.api}/product/${purchaseOrderData._id}/update`, { products: rows })
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
        axiosInstance().post(`${purchaseOrder.api}/product/${purchaseOrderData._id}/delete`, { ids: deletePurchaseOrderProduct })
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
            {allowedToEdit && <Box display="flex" justifyContent="space-between" m={1}>
                <Box display="flex" alignItems="center">
                    {permissions?.product?.isCreate ?
                        <>
                            <Button
                                variant={"contained"}
                                color="primary"
                                size="small"
                                // style={isMobile && !isTablet ? { color: "var(--secondary)" } : {}}
                                onClick={() => {
                                    setIsAddNewProduct(true);
                                }}
                            >
                                {isMobile && !isTablet ? "Add" : `Add New ${routes.product.title}`}
                            </Button>
                            <Box mx={isMobile ? 0.5 : 1} />
                        </> : null}
                    <Button
                        variant={"contained"}
                        color="primary"
                        size="small"
                        onClick={() => {
                            setAddProductDialog(true);
                        }}
                    >
                        {isMobile && !isTablet ? "Existing" : `Add Existing ${routes.product.title}`}
                    </Button>
                </Box>
                <div className="d-flex gap-2">
                    <SendEmail
                        purchaseOrderData={purchaseOrderData}
                    />
                    <HtmlTooltip title="Please select some product">
                        <Button
                            variant={"outlined"}
                            color="default"
                            size="small"
                            onClick={openActions}
                            disabled={selectedRecords.length ? false : true}
                            aria-controls="action-menu"
                        >
                            {"Actions"}
                            <ExpandMore fontSize="small" />
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
                        <MenuItem disabled={selectedRecords.length === 0}
                            onClick={() => {
                                closeActions()
                                setIsBulkEdit(true)
                                setShowProductDialog(true)
                            }}>
                            Bulk Edit
                        </MenuItem>
                        {permissions?.purchaseOrder?.isDelete && <MenuItem onClick={() => {
                            closeActions()
                            setShowDeleteConfirmBox(true)
                            setDeletePurchaseOrderProduct(selectedRecords.map(d => d._id))
                        }}>Delete</MenuItem>}
                    </Menu>
                </div>
            </Box>}
            {columns && frameWorkComponent ? isMobile && !isTablet ?
                <CustomSwipableList
                    allowSelection={allowedToEdit}
                    allowSwipe={allowedToEdit}
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
                    renderedFrom={renderedFrom}
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
                    allowAction={allowedToEdit}
                    actionWidth={150}
                    allowSelection={allowedToEdit}
                    isClientSideGrid={true}
                    loading={loading}
                    onCellValueChanged={(row) => {
                        //handleUpdateOrderProduct(row.data)
                    }}
                    renderedFrom={renderedFrom}
                    refreshGrid={fetchPurchaseOrderProduct}
                    currency={purchaseOrderData?.currency?.toLowerCase()}
                    fromPurchaseOrderGrid={true}
                    rowClassRules={{
                        "scrap-data-row": function (params) {
                            if (params?.node?.rowPinned) {
                                return true
                            }
                            return false
                        },
                        "red-data-row":
                            function (params) {
                                if (params?.node?.rowPinned) {
                                    return false
                                }
                                return !params?.data?.isValid
                            },
                    }}
                />
                : <Box
                    p={2}
                    height={500}
                    bgcolor="white">
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
            }
            {addProductDialog &&
                <AddExistingProductInventory
                    isAddingProducts={isAddingProducts}
                    addProductInventory={handleAddProduct}
                    handleProductInventoryClose={() => { setAddProductDialog(false) }}
                    type={"product"}
                    refrenceType="purchaseOrder"
                    renderedFrom={renderedFrom}
                    ignoreIds={dataRows?.map((e) => e?.productId)}
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
