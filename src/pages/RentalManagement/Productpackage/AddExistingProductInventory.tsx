import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../../axios/axiosInstance";
import { Box, CircularProgress, IconButton, TextField, Tooltip } from "@material-ui/core";
import SearchBox from '../../../components/Helpers/SearchBox'
import { reducer, intialState } from "../../../components/AgGridComponents/CustomAgGrid";
import { gridLoadingTimeout, CustomDialogTransition, product, packages, isObjectEmpty, prepareDataForGrid } from '../../../constants/helpers';
import {
    CommonRenderer,
    CreatedByRenderer,
    UpdatedByRenderer
} from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import Dialog from "@material-ui/core/Dialog/Dialog";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";
import CustomAgGridEditable from "../../../components/AgGridComponents/CustomAgGridEditable";
import { startCase } from "lodash";

const AddExistingProductInventory = ({ addProductInventory, handleProductInventoryClose, type, productInventory, isAddingProducts }) => {

    const toastConfig = useContext(CustomToastContext)
    const [packageDialog, setPackageDialog] = useState(false);
    const [productData, setProductData] = useState([]);
    const [packageProductData, setPackageProductData] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState({ name: "", id: "", quantity: 0 });
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

    const [materialList, setMaterialList] = useState([]);

    useEffect(() => {
        fetchMaterial()
    }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);

    const fetchMaterial = () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        const queryString = getQueryString();
        axiosInstance().get(`${type === "product" ? product.api : packages.packageApi}${queryString}`).then(({ data: { data, count } }) => {
            setMaterialList(JSON.parse(JSON.stringify(data)));
            data = data?.map((u) => ({
                ...u,
                id: u._id,
                type: type,
                qty: 0,
                productCategory: u.productCategory?.optionLabel,
                priceTemplate: u.priceTemplate?.optionLabel,
            }));
            dispatch({ type: "initialize", data: data, count: count });
            setTimeout(() => { dispatch({ type: "loading", loading: false }); }, gridLoadingTimeout);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const getQueryString = () => {
        let deepFilter = `?page=${page}&limit=${limit}`;
        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];
            Object.keys(filters).forEach(field => {
                updatedFilters.push({
                    field: field,
                    term: filters[field].filter
                })
            });
            deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`
        }
        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`
        }
        if (search) {
            deepFilter = `${deepFilter}&search=${search}`;
        }
        return deepFilter;
    };

    const columns = type === "product" ?
        [
            { field: "productName", headerName: "Product Description", show: true, disabled: true, cellRenderer: "commonRenderer" },
            { field: "productNumber", headerName: "Product Number", show: true, cellRenderer: "commonRenderer" },
            { field: "productCategory", headerName: "Product Category", show: true, disabled: true, cellRenderer: "commonRenderer" },
            { field: "qty", headerName: "Qty", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
        ] : [
            { field: "packageName", headerName: "Package Name", show: true, cellRenderer: "nameRenderer" },
            { field: "packageDescription", headerName: "Package Description", show: true, disabled: true, cellRenderer: "commonRenderer" },
            { field: "qty", headerName: "Qty", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
        ];

    const fetchPackageProduct = (packageId) => {
        if (type === "package") {
            axiosInstance().get(`${packages.packageApi}/get-products/${packageId}`).then(({ data: { data } }) => {
                const newArr = data.length > 0 ? data.map((product: any) => ({ product: product.productName, qty: product.qty })) : [];
                setPackageProductData(newArr);
            })
                .catch((err) => {
                    toastConfig.setToastConfig(err);
                });
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

    const onCellValueChanged = (row) => {
    }

    const handleSubmit = () => {
        dispatch({ type: "loading", loading: true });
        let tempProduct = productData
        tempProduct.find(d => d.id === selectedProduct.id).quantity = selectedProduct.quantity
        setProductData(tempProduct)
        setPackageDialog(false)
        if (gridApi) {
            gridApi.setRowData(productData);
        }
        // dispatch({ type: "update", data: productData, count: productData.length });
        setTimeout(() => {
            dispatch({ type: "loading", loading: false });
        }, gridLoadingTimeout);
    }

    return (<Fragment>
        <Dialog
            fullScreen={true}
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="customized-dialog-title"
            open={true}
        >
            <CustomDialogHeader title={`Add ${startCase(type)}`} onClose={handleProductInventoryClose} ></CustomDialogHeader>
            <div className="listing-grid p-3">
                <Box mb={2}>
                    <Grid container >
                        <Grid item xs={12} sm={12} container justify="flex-end">
                            <SearchBox
                                onSearch={handleSearch}
                                searchbox="terms_header_search_bar"
                                width="300px"
                                value={search}
                            />
                            <Box ml={1}>
                                <Button
                                    size="small"
                                    color="primary"
                                    onClick={() => addProductInventory(selectedRecords)}
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
                        onCellValueChanged={onCellValueChanged}
                        showOnlyShowFilteredRecordSwitch={true}
                    />
                    : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
            </div>
        </Dialog>
        {packageDialog &&
            <Dialog open fullWidth maxWidth="md" onClose={() => setPackageDialog(false)}>
                <CustomDialogHeader title={"Package Details"} onClose={() => setPackageDialog(false)} />
                <CustomDialogContent>
                    <Box p={2}>
                        <Grid container spacing={2}>
                            {packageProductData?.length > 0 && packageProductData?.map((obj) => (
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
                    {/* <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                    >
                        Save
                    </Button> */}
                </CustomDialogFooter>
            </Dialog>}
    </Fragment>
    );
}

export default AddExistingProductInventory;