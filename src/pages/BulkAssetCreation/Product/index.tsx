import React, { useState, useEffect, useContext, Fragment, useReducer } from "react";
import { Grid, Box, Button, Paper, Typography, IconButton, Tab, Tabs, ButtonGroup, Container, InputAdornment, TextField, MenuItem, Menu } from "@material-ui/core";
import { Autocomplete, Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import axiosInstance from "src/axios/axiosInstance";
import routes from "src/components/Helpers/Routes";
import { useData } from "src/StateProvider/Provider";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import { bulkAssetCreation } from "src/constants/helpers";
import EditIcon from "@material-ui/icons/Edit";
import CustomAgGrid, { intialState, reducer } from "src/components/AgGridComponents/CustomAgGrid";
import { CommonRenderer } from "src/components/AgGridComponents/CustomAgGridCellRenderers";
import AddExistingProductInventory from "../../Sublease/Productpackage/AddExistingProductInventory";
import GridDeleteIcon from "src/components/Helpers/GridDeleteIcon";
import CreateProduct from "src/components/Product/CreateProduct";
import CustomAgGridEditable from "src/components/AgGridComponents/CustomAgGridEditable";
import { isMobile, isTablet } from "react-device-detect";
import CustomSwipableList from "src/components/SwipableListComponents/CustomSwipableList";
import HtmlTooltip from "src/components/CustomTooltipTitle";
import { prepareDataForGrid } from "src/constants/helpers";
import { getFrameworkComponents, genrateColoum } from "src/constants/columns"
import { ExpandMore } from "@material-ui/icons";
import ConfirmationDialog from "src/components/Helpers/ConfirmationDialog";
import CustomRenderCell from "src/components/Helpers/CustomRenderCell";
import InfoIcon from "@material-ui/icons/Info";
import { RiEditCircleLine } from "react-icons/ri";
import { fetch_po_product_fields } from '../../../components/PurchaseOrder/helper';
import BulkAssetCreationQtyDialog from "./BulkAssetCreationQtyDialog";

const Product = ({ bulkAssetCreationData, setNextStep, setBulkAssetCreationProduct, renderedFrom, handleUpdateData }) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();

    const [columns, setColumns] = useState([{ field: "productName", headerName: "Product Type", show: true, disabled: true, cellRenderer: "nameRenderer" },
    { field: "productNumber", headerName: "Product Number", show: true, cellRenderer: "commonRenderer" }])


    const [addProductDialog, setAddProductDialog] = useState(false);
    const [isAddingProducts, setAddingProducts] = useState(false);

    const [showProductDialog, setShowProductDialog] = useState(false)
    const [selectedProductData, setSelectedProductData] = useState(null)
    const [isBulkEdit, setIsBulkEdit] = useState(false)

    const [frameWorkComponent, setFrameWorkComponent] = useState(null)
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;
    const [anchorEl, setAnchorEl] = useState(null);
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteBulkAssetCreationProduct, setDeleteBulkAssetCreationProduct] = useState([]);

    const [isRateRequired, setIsRateRequired] = useState(false);

    useEffect(() => {
        fetchFields()
    }, []);

    useEffect(() => {
        fetchBulkAssetCreationProduct();
    }, [columns]);

    const fetchFields = async () => {
        const fields = await fetch_po_product_fields(bulkAssetCreationData?.currency);
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
            actionsRenderer: ActionsRenderer,
            ...tempFrameworkComponent,
        }
        setFrameWorkComponent({ ...tempFrameworkComponent })
        setColumns([...columns])
    }

    const fetchBulkAssetCreationProduct = () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        setNextStep(false)
        axiosInstance().get(`${bulkAssetCreation.api}/product/${bulkAssetCreationData._id}`).then(({ data: { data } }) => {
            setBulkAssetCreationProduct(JSON.parse(JSON.stringify(data)))
            let rows = data?.map((item, index) => {
                let finalObject = prepareDataForGrid(item);
                finalObject["isChecked"] = selectedRecords.some(s => s._id === item._id);
                finalObject["allowedToEdit"] = true
                finalObject["hideSelection"] = !Boolean(item.createdQty === 0 || item.createdQty === undefined)

                let res: any = {
                    ...finalObject,
                };
                res.productName = item.productDetail?.productName
                res.productNumber = item.productDetail?.productNumber
                res.productDetail = item.productDetail
                res.actualReceived = item.createdQty || 0
                if (item?.qty === 0) {
                    res.isValid = false;
                }
                else if (isRateRequired) {
                    if (item["finalPrice_" + bulkAssetCreationData?.currency?.toLowerCase()]) {
                        res.isValid = true;
                    }
                    else {
                        res.isValid = false;
                    }
                }
                else {
                    res.isValid = true
                }
                return res;
            });
            if (rows.filter(_rows => _rows.isValid === false).length > 0) {
                setNextStep(false)
            } else {
                setNextStep(true)
            }
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

    const NameRenderer = params => <span className="d-flex gap-2 align-items-center">
        <span className="link" onClick={() => {
            setShowProductDialog(true)
            setSelectedProductData(params.data)
        }}>
            <CustomRenderCell value={params.value} />
        </span>
        {params.data.productId && <HtmlTooltip title="Details">
            <IconButton
                size="small"
                aria-label="Details"
                onClick={() => {
                    window.open(`${routes.productDetail.path}/${params.data.productId}`);
                }}
            >
                <InfoIcon fontSize="small" />
            </IconButton>
        </HtmlTooltip>}
    </span >

    const ActionsRenderer = (params) => (
        <>
            {(params.data?.actualReceived === undefined || params.data?.actualReceived === 0) && <HtmlTooltip title="Edit">
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
            }
            {(params.data?.actualReceived === undefined || params.data?.actualReceived === 0) && <GridDeleteIcon
                hasDeletePermission={permissions?.bulkAssetCreation?.isUpdate}
                ownerId={user?.user?._id}
                userId={user?.user?._id}
                onDelete={() => {
                    setShowDeleteConfirmBox(true)
                    setDeleteBulkAssetCreationProduct([params.data._id])
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
        let tempProductArray = rows.map(d => ({
            "productId": d._id ?? d.productId,
            "qty": d.qty ? parseInt(d.qty) : 1,
        }))
        axiosInstance().post(`${bulkAssetCreation.api}/product/${bulkAssetCreationData._id}/add`, { "orderDetails": tempProductArray })
            .then(() => {
                setAddProductDialog(false)
                fetchBulkAssetCreationProduct()
                setAddingProducts(false)
            }).catch((error) => {
                setAddProductDialog(false)
                toastConfig.setToastConfig(error)
                setAddingProducts(false)
            });
    }

    const handleUpdateQty = (rows) => {
        axiosInstance().put(`${bulkAssetCreation.api}/product/${bulkAssetCreationData._id}/update`, { products: rows })
            .then(() => {
                setAddProductDialog(false)
                fetchBulkAssetCreationProduct()
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
        axiosInstance().post(`${bulkAssetCreation.api}/product/${bulkAssetCreationData._id}/delete`, { ids: deleteBulkAssetCreationProduct })
            .then(() => {
                fetchBulkAssetCreationProduct()
                setShowDeleteConfirmBox(false)
                setDeleteBulkAssetCreationProduct([])
            }).catch((error) => {
                toastConfig.setToastConfig(error)
            });
    }

    const createAsset = () => {

        let tempProducts = selectedRecords.map(d => {
            return {
                "bulkAssetCreationId": bulkAssetCreationData?._id,
                "productMaster": d?.productId,
                "qty": d?.qty,
                "wareHouse": bulkAssetCreationData?.warehouse?.optionValue
            }
        })
        axiosInstance().post(`${bulkAssetCreation.api}/create-assets`, { bulkAssetCreation: tempProducts })
            .then(({ data }) => {
                fetchBulkAssetCreationProduct()
                handleUpdateData({ status: "Issued" })
                toastConfig.setToastConfig({
                    open: true,
                    type: "success",
                    message: data.message,
                });
            }).catch((error) => {
                toastConfig.setToastConfig(error)
            });
    }

    return (
        <Fragment>
            <Box display="flex" justifyContent="space-between" m={1}>
                <Box display="flex" alignItems="center">
                    <Button
                        variant={"contained"}
                        color="primary"
                        size="small"
                        // style={isMobile && !isTablet ? { color: "var(--warning-darken)" } : {}}
                        onClick={() => {
                            setAddProductDialog(true);
                        }}
                    >
                        {isMobile && !isTablet ? "Add" : `Add  ${routes.product.title}`}
                    </Button>
                </Box>
                <div className="d-flex gap-2">

                    <Box display={isMobile ? "none" : "flex"} justifyContent="flex-end">
                        <Button
                            variant={isMobile && !isTablet ? "text" : "contained"}
                            color="primary"
                            size="small"
                            style={isMobile && !isTablet ? { color: "var(--info-dark)" } : {}}
                            disabled={selectedRecords.length === 0}
                            onClick={() => {
                                setIsBulkEdit(true)
                                setShowProductDialog(true)
                            }}

                        >
                            {isMobile && !isTablet ? <RiEditCircleLine size={20} /> : `Bulk Edit`}
                        </Button>
                        <Box mx={1} />
                        {permissions?.bulkAssetCreation?.isUpdate && !isMobile && <Button
                            variant={isMobile && !isTablet ? "text" : "contained"}
                            color="primary"
                            size="small"
                            style={isMobile && !isTablet ? { color: "var(--info-dark)" } : {}}
                            disabled={selectedRecords.length === 0}
                            onClick={() => {
                                closeActions()
                                createAsset()
                            }}>
                            Create Asset
                        </Button>}
                        <Box mx={1} />
                        {permissions?.bulkAssetCreation?.isDelete && !isMobile && <Button
                            variant={isMobile && !isTablet ? "text" : "contained"}
                            color="primary"
                            size="small"
                            style={isMobile && !isTablet ? { color: "var(--info-dark)" } : {}}
                            disabled={selectedRecords.length === 0}
                            onClick={() => {
                                closeActions()
                                setShowDeleteConfirmBox(true)
                                setDeleteBulkAssetCreationProduct(selectedRecords.map(d => d._id))
                            }}>
                            Delete
                        </Button>}
                    </Box>

                    {isMobile && <>
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
                                    setIsBulkEdit(true)
                                    setShowProductDialog(true)
                                }}>
                                Bulk Edit
                            </MenuItem>
                            {permissions?.bulkAssetCreation?.isDelete && <MenuItem onClick={() => {
                                closeActions()
                                setShowDeleteConfirmBox(true)
                                setDeleteBulkAssetCreationProduct(selectedRecords.map(d => d._id))
                            }}>Delete</MenuItem>}
                            {permissions?.bulkAssetCreation?.isUpdate && <MenuItem onClick={() => {
                                closeActions()
                                createAsset()
                            }}>Create Asset</MenuItem>}
                        </Menu>
                    </>
                    }
                </div>
            </Box>
            {columns && frameWorkComponent ? isMobile && !isTablet ?
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
                        setDeleteBulkAssetCreationProduct([data._id])
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
                    allowAction={true}
                    actionWidth={150}
                    allowSelection={true}
                    isClientSideGrid={true}
                    loading={loading}
                    onCellValueChanged={(row) => {
                        //handleUpdateOrderProduct(row.data)
                    }}
                    renderedFrom={renderedFrom}
                    refreshGrid={fetchBulkAssetCreationProduct}
                    currency={bulkAssetCreationData?.currency?.toLowerCase()}
                    fromPurchaseOrderGrid={true}
                    rowClassRules={{
                        "red-data-row":
                            function (params) {
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
                    renderedFrom={renderedFrom}
                />
            }
            {showProductDialog &&
                <BulkAssetCreationQtyDialog
                    onClose={() => {
                        setShowProductDialog(false)
                        setIsBulkEdit(false)
                        setSelectedProductData(null)
                    }}
                    onSubmit={handleUpdateQty}
                    currency={bulkAssetCreationData?.currency}
                    productData={!isBulkEdit ? selectedProductData : selectedRecords}
                    bulkEdit={isBulkEdit}
                    bulkAssetCreationData={bulkAssetCreationData}
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
