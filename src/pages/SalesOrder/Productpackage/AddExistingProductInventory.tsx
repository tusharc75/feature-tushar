import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../../axios/axiosInstance";
import { Box, CircularProgress, IconButton, TextField, Tooltip } from "@material-ui/core";
import SearchBox from '../../../components/Helpers/SearchBox'
import { reducer, intialState } from "../../../components/AgGridComponents/CustomAgGrid";
import { gridLoadingTimeout, CustomDialogTransition, product, packages, isObjectEmpty, prepareDataForGrid, getLocalStorageArrayData } from '../../../constants/helpers';
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import Dialog from "@material-ui/core/Dialog/Dialog";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";
import CustomAgGridEditable from "../../../components/AgGridComponents/CustomAgGridEditable";
import { startCase } from "lodash";
import useColumns, { getStaticFields, getFrameworkComponents } from "../../../constants/useColumns"
import routes from "../../../components/Helpers/Routes";
import { useData } from "../../../StateProvider/Provider";

const AddExistingProductInventory = ({ addProductInventory, handleProductInventoryClose, type, ignoreIds, isAddingProducts, salesOrderData, renderedFrom }) => {

    const toastConfig = useContext(CustomToastContext)
    const { state: { selectedEntity } }: any = useData();
    const [packageDialog, setPackageDialog] = useState(false);
    const [packageProductData, setPackageProductData] = useState([]);
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, showFilteredRecordsOnly } = state;
    const [columns, setColumns] = useState(null);
    const [frameWorkComponent, setFrameWorkComponent] = useState({})

    const { getColumnData } = useColumns();

    const localStorageSelectedRecords = `${renderedFrom}_selected`;

    const defaultColumns = type === "product" ?
        [
            { field: "qty", headerName: "Qty", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
            { field: "inventory", headerName: "Inventory", show: true, disabled: true, cellRenderer: "commonRenderer", editable: false }
        ]
        : [
            { field: "qty", headerName: "Qty", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
        ]

    useEffect(() => {
        fetchMaterial()
    }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);

    useEffect(() => {
        fetchGridColumns()
    }, [])

    const fetchMaterial = () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        const queryString = getQueryString();
        axiosInstance().get(`${type === "product" ? `/product-inventory` : packages.packageApi}${queryString}`).then(({ data: { data, count } }) => {
            const selectedProducts = getLocalStorageArrayData(localStorageSelectedRecords);
            let rows = data.map((u) => {
                const selectedData = selectedProducts.find((d: any) => d._id === u._id);
                let finalObject = prepareDataForGrid(u);
                finalObject["id"] = u._id;
                finalObject["type"] = type;
                finalObject["productCategory"] = u.productCategory?.optionLabel;
                finalObject["priceTemplate"] = u.priceTemplate?.optionLabel
                finalObject['inventory'] = u?.inventory ? (u?.inventory - (u?.softHold || 0)) : 0;
                finalObject['qty'] = selectedData ? selectedData.qty : finalObject['inventory'] ? 1 : 0;
                finalObject["unitMain"] = u.unit
                if (type === "product") {
                    finalObject['hideSelection'] = finalObject['inventory'] ? false : true;
                }
                return {
                    ...finalObject,
                };
            });
            dispatch({ type: "initialize", data: rows, count: count });
            setTimeout(() => { dispatch({ type: "loading", loading: false }); }, gridLoadingTimeout);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const getQueryString = () => {

        let deepFilter = type === "product" ? `?wareHouse=${salesOrderData?.warehouse?.optionValue ??
            salesOrderData?.plant?.optionValue}&page=${page}&limit=${limit}` : `?page=${page}&limit=${limit}`;

        if (type !== "product") {
            deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify([{ field: 'packageType', term: 'product' }]))}&filterType=and`
        }

        if (ignoreIds?.length) {
            deepFilter = deepFilter + `&ignoreIds=${JSON.stringify(ignoreIds)}`
        }

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

        if (showFilteredRecordsOnly) {
            deepFilter = `${deepFilter}&getById=${JSON.stringify(getLocalStorageArrayData(localStorageSelectedRecords)?.map((m) => m._id))}`;
        }

        if (search) {
            deepFilter = `${deepFilter}&search=${search}`;
        }
        return deepFilter;
    };

    const fetchGridColumns = () => {
        axiosInstance()
            .get(type === "product" ? "/field?resource=Product&view=true" : `/field?resource=Packages&entity=${selectedEntity}&view=true`)
            .then(({ data: { data } }) => {
                let columns = []
                let rendererNames = []
                data.forEach(o => {
                    let currentColumn = getColumnData(renderedFrom, o?.fieldData, type === "product" ? routes.productDetail.path : routes.packagesDetail.path)
                    if (currentColumn !== null) {
                        columns = [...columns, currentColumn?.columnData]
                        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                            rendererNames.push(currentColumn?.rendererName)
                        }
                    }

                })
                let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
                tempFrameworkComponent = {
                    ...tempFrameworkComponent,
                }
                setFrameWorkComponent({ ...tempFrameworkComponent })
                columns = [...columns, ...getStaticFields()]
                // setColumns([...columns])
                setColumns([...columns, ...defaultColumns])
            })
    }

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

    const handleSearch = (e) => {
        dispatch({ type: "search", search: e.target.value });
    };

    const onCellValueChanged = (row) => {
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
                                    onClick={() => addProductInventory(getLocalStorageArrayData(localStorageSelectedRecords))}
                                    variant="contained"
                                    disabled={!Boolean(getLocalStorageArrayData(localStorageSelectedRecords)?.length) || isAddingProducts}
                                    endIcon={isAddingProducts && <CircularProgress size={20} color='primary' />} >
                                    {getLocalStorageArrayData(localStorageSelectedRecords)?.length ? "(" + getLocalStorageArrayData(localStorageSelectedRecords)?.length + ")  " : ""}
                                    Add</Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
                {columns ?
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
                        allowAction={false}
                        loading={loading}
                        onCellValueChanged={onCellValueChanged}
                        showOnlyShowFilteredRecordSwitch={true}
                        renderedFrom={renderedFrom}
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