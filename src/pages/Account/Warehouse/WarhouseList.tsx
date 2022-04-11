import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../../axios/axiosInstance";
import { Box, CircularProgress, TextField } from "@material-ui/core";
import SearchBox from '../../../components/Helpers/SearchBox'
import CustomAgGrid, { reducer, intialState } from "../../../components/AgGridComponents/CustomAgGrid";
import { gridLoadingTimeout, CustomDialogTransition, packages, product, isObjectEmpty, prepareDataForGrid, getLocalStorageArrayData } from '../../../constants/helpers';
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

let searchTimeout;

const WarhouseList = ({api, isCustomer=false, addWarehouse, onClose, isAddingWarehouse, renderedFrom, assignedWarehouse }) => {

    const localStorageSelectedRecords = `${renderedFrom}_selected`
    const toastConfig = useContext(CustomToastContext)
    const { state: { selectedEntity } }: any = useData();
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { getColumnData } = useColumns();

    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, showFilteredRecordsOnly } = state;

    const [columns, setColumns] = useState(null);
    const [frameWorkComponent, setFrameWorkComponent] = useState({})

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
        axiosInstance().get(`${api}${queryString}`).then(({ data: { data, count } }) => {
            console.log(data)
            let rows = data.map((u) => {
                let finalObject = prepareDataForGrid(isCustomer ? u?.warehouseDetail : u);
                finalObject["isChecked"] = false;
                return {
                    ...u,
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
        const ignoreIds = assignedWarehouse && assignedWarehouse?.length > 0 ? assignedWarehouse : []
        let deepFilter = `?page=${page}&limit=${limit}&ignoreIds=${JSON.stringify(ignoreIds)}`;
        if (showFilteredRecordsOnly) {
            const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
            deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map(m => m._id))}`;
        }
        const updatedFilters = [];

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
            .get("/field?resource=Warehouse")
            .then(({ data: { data } }) => {
                let columns = []
                let rendererNames = []
                data.forEach(o => {
                    let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.warehouse.path)
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
                setColumns([...columns])
            })
    }

    const handleSearch = (e) => {
        dispatch({ type: "search", search: e.target.value });
    };


    return (<Fragment>
        <Dialog
            fullScreen={true}
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="customized-dialog-title"
            open={true}
        >
            <CustomDialogHeader title={`Add ${routes.warehouse.title}`} onClose={onClose} ></CustomDialogHeader>
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
                                        addWarehouse(getLocalStorageArrayData(`${localStorageSelectedRecords}`))
                                    }}
                                    variant="contained"
                                    disabled={!getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length || isAddingWarehouse}
                                    endIcon={isAddingWarehouse && <CircularProgress size={20} color='primary' />} >
                                    Add{getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length ? " (" + getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length + ")" : ""}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
                {columns ?
                    <CustomAgGrid
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

export default WarhouseList;