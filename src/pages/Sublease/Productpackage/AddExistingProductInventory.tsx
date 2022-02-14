import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../../axios/axiosInstance";
import { Box, CircularProgress, TextField } from "@material-ui/core";
import SearchBox from '../../../components/Helpers/SearchBox'
import { reducer, intialState } from "../../../components/AgGridComponents/CustomAgGrid";
import { gridLoadingTimeout, CustomDialogTransition, packages, product, isObjectEmpty, prepareDataForGrid } from '../../../constants/helpers';
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import Dialog from "@material-ui/core/Dialog/Dialog";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";
import CustomAgGridEditable from "../../../components/AgGridComponents/CustomAgGridEditable";
import { startCase } from "lodash";
import { getColumnData, getFrameworkComponents, getStaticFields } from "../../../constants/columns";
import routes from "../../../components/Helpers/Routes";
import { useData } from "../../../StateProvider/Provider";


const renderedFrom = "subleasingAddProducts";
const localStorageSelectedRecords = `${renderedFrom}_selected`

const AddExistingProductInventory = ({ addProductInventory, handleProductInventoryClose, type, isAddingProducts }) => {

    const toastConfig = useContext(CustomToastContext)
    const { state: { selectedEntity } }: any = useData();
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
    const [columns, setColumns] = useState(null);
    const [frameWorkComponent, setFrameWorkComponent] = useState({})
    const [materialList, setMaterialList] = useState([]);

    const defaultColumns = [{ field: "qty", headerName: "Qty", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true }]

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
        axiosInstance().get(type === "product" ? product.api + queryString : packages.packageApi + queryString).then(({ data: { data, count } }) => {
            setMaterialList(JSON.parse(JSON.stringify(data)));
            let rows = data.map((u) => {
                let finalObject = prepareDataForGrid(u);
                finalObject["isChecked"] = false;
                finalObject["id"] = u._id;
                finalObject["type"] = type;
                finalObject["qty"] = 0;
                finalObject["productCategory"] = u.productCategory?.optionLabel;
                finalObject["priceTemplate"] = u.priceTemplate?.optionLabel
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
        let deepFilter = '?';
        
        if (type !== "product") {
            deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify([{ field: 'packageType', term: 'product' }]))}&filterType=and`
        }

        if (showFilteredRecordsOnly) {
            const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
            deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map(m => m._id))}`;
        }

        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];
            Object.keys(filters).forEach(field => {
                updatedFilters.push({
                    field: field,
                    term: filters[field].filter
                })
            });
            if (type !== "product") {
                updatedFilters.push({ field: 'packageType', term: 'product' })
            }
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
                    let currentColumn = type === "product" ?
                        getColumnData(routes.product?.title, o?.fieldData, routes.productDetail.path)
                        : getColumnData(routes.packages?.title, o?.fieldData, routes.packagesDetail.path)
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
                setColumns([...columns, ...defaultColumns])
            })
    }

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
                                    onClick={() => {
                                        const data = []
                                        selectedRecords.forEach((element: any) => {
                                            const result: any = materialList.filter((rec) => rec._id === element.id);
                                            if (result.length) {
                                                data.push({ ...result[0], qty: element.qty })
                                            }
                                        });
                                        addProductInventory(data)
                                    }}
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
    </Fragment >
    );
}

export default AddExistingProductInventory;