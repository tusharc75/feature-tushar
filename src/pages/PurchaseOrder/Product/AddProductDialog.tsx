import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../../axios/axiosInstance";
import { Box, CircularProgress, IconButton, TextField, Tooltip } from "@material-ui/core";
import SearchBox from '../../../components/Helpers/SearchBox'
import { reducer, intialState } from "../../../components/AgGridComponents/CustomAgGrid";
import { gridLoadingTimeout, CustomDialogTransition, product, packages, isObjectEmpty } from '../../../constants/helpers';
import {
    CommonRenderer,
    CreatedByRenderer,
    UpdatedByRenderer
} from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import { useData } from "../../../StateProvider/Provider";
import Dialog from "@material-ui/core/Dialog/Dialog";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";
import CustomAgGridEditable from "../../../components/AgGridComponents/CustomAgGridEditable";
import { camelCase } from "lodash";

const AddProductDialog = ({ addProductInPurchaseOrder, handleProductInPurchaseOrderClose, type, productInPurchaseOrder, isAddingProducts }) => {
    const toastConfig = useContext(CustomToastContext)
    const [quantityDialog, setQuantityDialog] = useState(false);
    const [packageDialog, setPackageDialog] = useState(false);
    const [productData, setProductData] = useState([]);
    const [packageProductData, setPackageProductData] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState({ name: "", id: "", quantity: 0 });
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
    const [disableSaveButton, setDisableSaveButton] = useState(false);
    const localStorageSelectedRecords = "purchaseOrderProductPage_selected";

    useEffect(() => {
        if (type === "product") fetchProductInPurchaseOrder();
    }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);

    const columns = type === "product" ? [
        { field: "productName", headerName: "Product Type", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "productNumber", headerName: "Product Number", show: true, cellRenderer: "commonRenderer" },
        // { field: "entity", headerName: "Entity", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "productCategory", headerName: "Product Category", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "quantity", headerName: "Quantity", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
    ] : [
        { field: "packageName", headerName: "Package Name", show: true, cellRenderer: "nameRenderer" },
        { field: "packageDescription", headerName: "Package Description", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "quantity", headerName: "Quantity", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
    ];

    const fetchPackageProduct = (packageId) => {
        if (type === "package") {
            setLoadingProducts(true);
            axiosInstance()
                .get(`${packages.packageApi}/get-products/${packageId}`)
                .then(({ data: { data } }) => {
                    const newArr = data.length > 0 ? data.map((product: any) => ({ product: product.productName, qty: product.qty })) : [];
                    setPackageProductData(newArr);
                    setLoadingProducts(false);
                })
                .catch((err) => {
                    toastConfig.setToastConfig(err);
                    setLoadingProducts(false);
                });
        }
    };


    const fetchProductInPurchaseOrder = () => {
        dispatch({ type: "loading", loading: true });
        dispatch({ type: "initialize", data: [], count: 0 });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        const queryString = getQueryString();
        axiosInstance().get(`${product.api}${queryString}`).then(({ data }) => {
            data.data = data.data?.map((u) => ({
                ...u,
                id: u._id,
                productCategory: u.productCategory?.optionLabel,
                priceTemplate: u.priceTemplate?.optionLabel,
                type: type,
                quantity: 0,
            }));
            setProductData(data.data)
            dispatch({ type: "initialize", data: data.data, count: data.count });
            setTimeout(() => {
                dispatch({ type: "loading", loading: false });
            }, gridLoadingTimeout);

        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const getQueryString = () => {
        let deepFilter = `?page=${page}&limit=${limit}`;
        const updatedFilters = [{ "field": "serializedProduct", "term": "yes" }];
        if (!isObjectEmpty(filters)) {
            Object.keys(filters).forEach(field => {
                updatedFilters.push({
                    field: replaceFieldName(field),
                    term: filters[field].filter
                })
            });
        }
        deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`
        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`
        }
        if (search) {
            deepFilter = `${deepFilter}&search=${search}`;
        }
        if (showFilteredRecordsOnly) {
            const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
            deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map(m => m._id))}`;
        }
        const filterById = []
        if (filterById.length) {
            deepFilter = deepFilter + '&filterById=' + JSON.stringify(filterById) + "&filterType=and"
        }
        return deepFilter;
    };

    const replaceFieldName = (field) => {
        switch (field) {
            case "createdBy":
                return "createdBy.user.concatedName";

            case "updatedBy":
                return "updatedBy.user.concatedName";

            default:
                return field;
        }
    };

    const NameRenderer = (params) => (
        <span
            className="cursor-pointer link ml-1"
            onClick={() => {
                setPackageDialog(true)
                fetchPackageProduct(params.data.id)
                setSelectedProduct({ name: params.data.packageName, id: params.data.id, quantity: params.data.quantity })

            }}>{params.value}</span>
    );

    const handleSearch = (e) => {
        dispatch({ type: "search", search: e.target.value });
    };

    const frameworkComponents = {
        createdByRenderer: CreatedByRenderer,
        updatedByRenderer: UpdatedByRenderer,
        nameRenderer: NameRenderer,
        commonRenderer: CommonRenderer,
    };

    const handleSubmit = () => {
        dispatch({ type: "loading", loading: true });
        let tempProduct = productData
        tempProduct.find(d => d.id === selectedProduct.id).quantity = selectedProduct.quantity
        setProductData(tempProduct)
        setQuantityDialog(false)
        setPackageDialog(false)
        if (gridApi) {
            gridApi.setRowData(productData);
        }
        // dispatch({ type: "update", data: productData, count: productData.length });
        setTimeout(() => {
            dispatch({ type: "loading", loading: false });
        }, gridLoadingTimeout);
    }

    const onCellValueChanged = (row) => {
        setDisableSaveButton(selectedRecords.some(d => d.quantity === 0))
    }
    useEffect(() => {
        setDisableSaveButton(selectedRecords.some(d => d.quantity === 0))
    }, [selectedRecords])

    return (<Fragment>
        <>
            {(<Dialog
                fullScreen={true}
                TransitionComponent={CustomDialogTransition}
                aria-labelledby="customized-dialog-title"
                open={true}
            >
                <CustomDialogHeader title={`Add Product`} onClose={handleProductInPurchaseOrderClose} ></CustomDialogHeader>
                <CustomDialogContent>
                    <div className="listing-grid p-3">
                        <Box mb={2}>
                            <Grid container >
                                <Grid item xs={12} sm={6}>

                                </Grid>
                                <Grid item xs={12} sm={6} container justify="flex-end">
                                    <SearchBox
                                        onSearch={handleSearch}
                                        searchbox="terms_header_search_bar"
                                        width="300px"
                                        value={search}
                                    />
                                    <Box ml={1} mt={1} >
                                        <Button
                                            size="small"
                                            color="primary"
                                            onClick={() => addProductInPurchaseOrder(selectedRecords)}
                                            variant="contained"
                                            disabled={!Boolean(selectedRecords.length) || isAddingProducts}
                                            endIcon={isAddingProducts && <CircularProgress size={20} color='primary' />} >
                                            {selectedRecords.length ? "(" + selectedRecords.length + ")  " : ""}
                                            Add</Button>
                                    </Box>
                                </Grid>
                            </Grid>
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
                                allowAction={false}
                                loading={loading}
                                isClientSideGrid={false}
                                onCellValueChanged={onCellValueChanged}
                                showOnlyShowFilteredRecordSwitch={true}
                                renderedFrom={"purchaseOrderProductPage"}
                            />
                            : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
                    </div>
                </CustomDialogContent>
            </Dialog>
            )}
            {packageDialog && <Dialog open fullWidth maxWidth="md" onClose={() => setPackageDialog(false)}>
                <CustomDialogHeader title={"Package Details"} onClose={() => setPackageDialog(false)} />
                <CustomDialogContent>
                    <Box p={2}>
                        <div className="detail-box">
                            <h3 className="form-label-style" title={"Package Details"}>
                                {"Product List"}
                            </h3>
                        </div>
                        <Grid container spacing={2}>
                            {packageProductData?.length > 0 && packageProductData?.map((obj, indx) => (
                                <Fragment key={obj.id}>
                                    <Grid item xs={5} sm={5}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            value={obj?.product}
                                            type="text"
                                            disabled
                                            variant="outlined"
                                            label="Product"
                                        />
                                    </Grid>
                                    <Grid item xs={5} sm={5}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            value={obj?.qty}
                                            disabled
                                            type="number"
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                            }}
                                            variant="outlined"
                                            required
                                            label="Quantity"
                                        />
                                    </Grid>
                                </Fragment>
                            ))}
                        </Grid>
                    </Box>
                </CustomDialogContent>
                <CustomDialogFooter>
                    <Button variant="outlined" color="primary" onClick={() => setPackageDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                    >
                        Save
                    </Button>
                </CustomDialogFooter>
            </Dialog>}
        </>
    </Fragment>
    );
}

export default AddProductDialog;