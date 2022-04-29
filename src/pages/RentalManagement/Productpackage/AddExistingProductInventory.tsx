import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../../axios/axiosInstance";
import { Box, CircularProgress, TextField } from "@material-ui/core";
import SearchBox from '../../../components/Helpers/SearchBox'
import { gridLoadingTimeout, CustomDialogTransition, packages, isObjectEmpty, prepareDataForGrid, getLocalStorageArrayData } from '../../../constants/helpers';
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
import { reducer, intialState, } from "../../../components/AgGridComponents/CustomAgGrid";



let searchTimeout;
const AddExistingProductInventory = ({ addProductInventory, handleProductInventoryClose, type, productInventory, isAddingProducts, rentalManagementData, renderedFrom }) => {

    const localStorageSelectedRecords = `${renderedFrom}_selected`
    const toastConfig = useContext(CustomToastContext)

    const { state: { user, permissions, selectedEntity } }: any = useData();
    const [packageDialog, setPackageDialog] = useState(false);
    const [productData, setProductData] = useState([]);
    const [packageProductData, setPackageProductData] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState({ name: "", id: "", quantity: 0 });
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
    const [columns, setColumns] = useState(null);
    const [frameWorkComponent, setFrameWorkComponent] = useState({})
    const [materialList, setMaterialList] = useState([]);
    const { getColumnData } = useColumns();

    const defaultColumns = type === "product" ?
        [
            { field: "qty", headerName: "Qty", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
            { field: "inventoryInWarehouseCount", headerName: "Available Asset", show: true, disabled: true, cellRenderer: "commonRenderer", editable: false }
        ]
        : [
            { field: "qty", headerName: "Qty", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
        ]

    useEffect(() => {
        localStorage.removeItem(localStorageSelectedRecords)
        fetchGridColumns()
    }, [])

    useEffect(() => {
        let millisec = Object.keys(search).length > 0 ? 600 : 5;
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        searchTimeout = setTimeout(() => {
            fetchMaterial()
        }, millisec);
    }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);


    const fetchMaterial = () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        const queryString = getQueryString();
        axiosInstance().get(`${type === "product" ? `/rental-management/product-with-inventory` : packages.packageApi}${queryString}`).then(({ data: { data, count } }) => {
            setMaterialList(JSON.parse(JSON.stringify(data)));
            let rows = data.map((u) => {
                let finalObject = prepareDataForGrid(u);
                finalObject["isChecked"] = false;
                finalObject["id"] = u._id;
                finalObject["type"] = type;
                finalObject["qty"] = 0;
                const qtyAdded = [...getLocalStorageArrayData(localStorageSelectedRecords)]?.filter((e) => e._id === u._id)
                if (qtyAdded.length) {
                    finalObject["qty"] = qtyAdded[0].qty;
                }
                finalObject["productCategory"] = u.productCategory?.optionLabel;
                finalObject["priceTemplate"] = u.priceTemplate?.optionLabel
                finalObject["unitMain"] = u.unit
                finalObject["pricingMethodMain"] = u.pricingMethod
                return {
                    ...finalObject
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
        let deepFilter = `?warehouse=${rentalManagementData?.warehouse?.optionValue}&page=${page}&limit=${limit}`;
        if (showFilteredRecordsOnly) {
            const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
            deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map(m => m._id))}`;
        }
        const updatedFilters = [];
        if (type === "package") {
            updatedFilters.push({ field: 'packageType', term: 'product' })
        }
        // if (type === "product") {
        //     updatedFilters.push({ field: 'serializedProduct', term: 'yes' })
        // }
        if (!isObjectEmpty(filters)) {
            Object.keys(filters).forEach(field => {
                updatedFilters.push({
                    field: field,
                    term: filters[field].filter
                })
            });
        }
        if (updatedFilters.length) {
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
                setFrameWorkComponent({ ...tempFrameworkComponent })
                columns = [...columns, ...getStaticFields()]
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

    const onCellValueChanged = ({ data }: any) => {
        const selectedFromStorage = [...getLocalStorageArrayData(localStorageSelectedRecords)]
        if (!selectedFromStorage || selectedFromStorage.length === 0) return
        const updatedRecords = selectedFromStorage.map(d => {
            if (data._id === d._id) {
                d.qty = data.qty
            }
            return d
        })
        localStorage.setItem(localStorageSelectedRecords, JSON.stringify(updatedRecords))
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
                        <Grid item xs={10} sm={10} md={11} container justify="flex-end">
                            <SearchBox
                                onSearch={handleSearch}
                                searchbox="terms_header_search_bar"
                                width="300px"
                                value={search}
                            />
                        </Grid>
                        <Grid item xs={2} sm={2} md={1} container justify="flex-end">
                            <Box ml={1}>
                                <Button
                                    size="small"
                                    color="primary"
                                    onClick={() => {
                                        addProductInventory(getLocalStorageArrayData(`${localStorageSelectedRecords}`))
                                    }}
                                    variant="contained"
                                    disabled={!getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length || isAddingProducts}
                                    endIcon={isAddingProducts && <CircularProgress size={20} color='primary' />} >
                                    Add{getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length ? " (" + getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length + ")" : ""}
                                </Button>
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
                        allowSelection={true}
                        onCellValueChanged={onCellValueChanged}
                        showOnlyShowFilteredRecordSwitch={true}
                        refreshGrid={fetchMaterial}
                        renderedFrom={renderedFrom}
                    />
                    : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
            </div>
        </Dialog>
        {
            packageDialog &&
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
            </Dialog>
        }
    </Fragment >
    );
}

export default AddExistingProductInventory;