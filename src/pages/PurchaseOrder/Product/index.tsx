import React, { useState, useEffect, useContext, Fragment, useReducer } from "react";
import { Grid, Box, Button, Paper, Typography, IconButton, Tab, Tabs, ButtonGroup, Container, InputAdornment, TextField } from "@material-ui/core";
import { Autocomplete, Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import axiosInstance from "../../../axios/axiosInstance";
import routes from "../../../components/Helpers/Routes";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import CustomBreadCrumbs from "../../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../../components/DetailsPageHeader";
import DetailsPage from "../../../components/Shared/DetailsPage";
import { useData } from "../../../StateProvider/Provider";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { purchaseOrder } from "../../../constants/helpers";
import ExpandMore from '@material-ui/icons/ExpandMore';
import MenuItem from "@material-ui/core/MenuItem"
import Menu from "@material-ui/core/Menu"
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
import { getColumnData, getStaticFields, getFrameworkComponents, getSortedColumns } from "../../../constants/columns"


const Product = ({ purchaseOrderData, currentStepDisable, setCurrentStepDisable, id, setPurchaseOrderProduct }) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();

    const [columns, setColumns] = useState([{ field: "productName", headerName: "Product Description", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "productNumber", headerName: "Product Number", show: true, cellRenderer: "commonRenderer" }])

    const [frameWorkComponent, setFrameWorkComponent] = useState(null)

    const [addProductDialog, setAddProductDialog] = useState(false);
    const [isAddingProducts, setAddingProducts] = useState(false);
    const [isAddNewProduct, setIsAddNewProduct] = useState(false)

    const [productList, setProductList] = useState([]);
    const [showProductDialog, setShowProductDialog] = useState(false)
    const [selectedProductData, setSelectedProductData] = useState(null)

    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;


    useEffect(() => {
        fetchPurchaseOrderProduct();
    }, [id]);

    const GenrateColoum = (fields, column, rendererNames, editable) => {
        let _fields = fields;
        _fields.forEach((ele) => {
            if (ele.type === "converter" || ele.type === "currencyAmount" || ele.isConverter === true) {
                if (ele.type !== "currencyAmount" && (ele.type === "converter" || ele.isConverter === true)) {
                    ele.displayUnits.forEach((_unit) => {
                        let fieldName = ele.fieldName + "_" + _unit.toLowerCase()
                        let fieldLabel = ele.fieldLabel + " " + _unit
                        if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                            let col: any = {}
                            col.field = fieldName
                            col.headerName = fieldLabel
                            col.width = 180
                            col.show = true
                            col.leval = ele.leval
                            if (!ele.isFormula && !ele.isUneditable && editable) {
                                col.cellRenderer = "commonRenderer";
                                col.cellEditor = "numericCellEditor";
                                col.editable = true;
                            } else {
                                col.cellRenderer = "commonRenderer";
                            }
                            column.push(col)
                        }
                    })
                }
                else if (ele.type === "currencyAmount" && (ele.type === "converter" || ele.isConverter === true)) {
                    ele.displayUnits.forEach((_unit) => {
                        ele.displayCurrency.forEach((_currency) => {
                            let fieldName = ele.fieldName + "_" + _currency.toLowerCase() + "_" + _unit.toLowerCase()
                            let fieldLabel = ele.fieldLabel + " " + _unit + "/" + _currency
                            if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                                let col: any = {}
                                col.field = fieldName
                                col.headerName = fieldLabel
                                col.width = 180
                                col.show = true
                                col.leval = ele.leval
                                if (!ele.isFormula && !ele.isUneditable && editable) {
                                    col.cellRenderer = "commonRenderer";
                                    col.cellEditor = "numericCellEditor";
                                    col.editable = true;
                                } else {
                                    col.cellRenderer = "commonRenderer";
                                }
                                column.push(col)
                            }
                        })
                    })
                }
                else if (ele.type === "currencyAmount") {
                    ele.displayCurrency.forEach((_currency) => {
                        let fieldName = ele.fieldName + "_" + _currency.toLowerCase()
                        let fieldLabel = ele.fieldLabel + " " + _currency
                        if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                            let col: any = {}
                            col.field = fieldName
                            col.headerName = fieldLabel
                            col.width = 180
                            col.show = true
                            col.leval = ele.leval
                            if (!ele.isFormula && !ele.isUneditable && editable) {
                                col.cellRenderer = "commonRenderer";
                                col.cellEditor = "numericCellEditor";
                                col.editable = true;
                            } else {
                                col.cellRenderer = "commonRenderer";
                            }
                            column.push(col)
                        }
                    })
                }
            }
            else {
                if (column.filter((_c) => _c.field === ele.fieldName && _c.headerName === ele.fieldLabel).length === 0) {
                    let currentColumn: any = getColumnData(routes.productBuilder.title, ele, routes.productBuilder.path, true)
                    if (ele.type === "decimal" || ele.type === "percent" || ele.type === "singleLine" || ele.type === "multiLine") {
                        if (!ele.isFormula && !ele.isUneditable && editable) {
                            if (ele.type === "decimal" || ele.type === "percent") {
                                currentColumn.columnData.cellEditor = "numericCellEditor";
                            }
                            currentColumn.columnData.editable = true;
                        }
                    }
                    column.push({ ...currentColumn.columnData, leval: ele.leval });
                    if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                        rendererNames.push(currentColumn?.rendererName)
                    }
                }
            }
        })
    }

    useEffect(() => {
        axiosInstance().get("/field/child?resource=Purchase Order Product").then(({ data: { data } }) => {
            const fields = CURReplaceByCurrencySingle(data, purchaseOrderData.currency)
            let rendererNames = [];
            GenrateColoum(fields, columns, rendererNames, false);
            let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
            tempFrameworkComponent = {
                commonRenderer: CommonRenderer,
                actionsRenderer: ActionsRenderer,
                ...tempFrameworkComponent,
            }
            setFrameWorkComponent({ ...tempFrameworkComponent })
            setColumns([...columns])
        })
    }, []);

    // [
    //     { field: "productName", headerName: "Product Description", show: true, disabled: true, cellRenderer: "commonRenderer" },
    //     { field: "productNumber", headerName: "Product Number", show: true, cellRenderer: "commonRenderer" },
    //     { field: "expectedDelivery", headerName: "Expected Delivery", show: true, disabled: true, cellRenderer: "dateRenderer", cellEditor: "dateEditor", editable: true },
    //     { field: "quantity", headerName: "Quantity", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
    //     { field: "baseUOM", headerName: "Base UOM", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "agSelectCellEditor", cellEditorParams: { cellRenderer: "commonRenderer", values: ["Hour", "Day", "Week", "Month"] }, editable: true },
    //     { field: "price", headerName: "Price", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
    //     { field: "tax", headerName: "Tax Percent", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
    //     { field: "taxPerUnit", headerName: "Tax Per Unit", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
    //     { field: "totalTax", headerName: "Total Tax", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
    //     { field: "finalPrice", headerName: "Final Price", show: true, disabled: true, cellRenderer: "commonRenderer" },
    // ]

    const fetchPurchaseOrderProduct = () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        setCurrentStepDisable(false)
        axiosInstance().get(`${purchaseOrder.api}/product/${id}`).then(({ data: { data } }) => {
            setPurchaseOrderProduct(JSON.parse(JSON.stringify(data)))
            let rows = data?.map((item) => {
                if ((!currentStepDisable) && (
                    item.qty === 0
                    || item["finalPrice_" + purchaseOrderData?.currency?.toLowerCase()] === 0
                    || item["finalPrice_" + purchaseOrderData?.currency?.toLowerCase()] === null)) {
                    setCurrentStepDisable(true)
                }
                let res: any = {
                    ...prepareDataForGrid(item),
                };
                res.productName = item.productDetail?.productName
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
        </>
    );

    const handleAddProduct = (products) => {
        setAddingProducts(true)
        let tempProductArray = products.map(d => ({
            "productId": d.id || d.productId,
            "qty": parseInt(d.quantity || d.qty) || 0,
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
        axiosInstance().post(`${purchaseOrder.api}/product/${id}/update`, { products: rows })
            .then(() => {
                setAddProductDialog(false)
                fetchPurchaseOrderProduct()
                setAddingProducts(false)
                setShowProductDialog(false)
            }).catch((error) => {
                setAddProductDialog(false)
                toastConfig.setToastConfig(error)
                setAddingProducts(false)
            });
    }

    const deletePurchaseOrderProduct = (products) => {
        axiosInstance().delete(`${purchaseOrder.api}/product/${id}/delete?orderId=${products.map(d => d.id)}`)
            .then(() => {
                fetchPurchaseOrderProduct()
            }).catch((error) => {
                toastConfig.setToastConfig(error)
            });
    }

    return (
        <Fragment>
            <Box display="flex" justifyContent="space-between" m={1}>
                <Box display="flex">
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
                        deletePurchaseOrderProduct([{
                            id: data._id,
                        }])
                    }}
                    rowCount={rowCount}
                    page={page}
                    loading={loading}
                    chips={
                        [{
                            label: `Product Description: `,
                            field: "productName",
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
                        setSelectedProductData(null)
                    }}
                    onSubmit={handleUpdateQty}
                    currency={purchaseOrderData?.currency}
                    productData={selectedProductData}
                />
            }
        </Fragment>
    );
};

export default Product;
