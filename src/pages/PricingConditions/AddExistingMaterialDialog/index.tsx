import React, { useState, useEffect, useContext, Fragment, useReducer } from "react";
import { Grid, Box, Button, Paper, Typography, IconButton, Tab, Tabs, ButtonGroup, Container, InputAdornment, TextField } from "@material-ui/core";
import { Autocomplete, Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import axiosInstance from "../../../axios/axiosInstance";
import routes from "../../../components/Helpers/Routes";
import { useData } from "../../../StateProvider/Provider";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import EditIcon from "@material-ui/icons/Edit";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer } from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import GridDeleteIcon from "../../../components/Helpers/GridDeleteIcon";
import CustomAgGridEditable from "../../../components/AgGridComponents/CustomAgGridEditable";
import { FaCartArrowDown, FaCartPlus } from "react-icons/fa";
import { isMobile } from "react-device-detect";
import CustomSwipableList from "../../../components/SwipableListComponents/CustomSwipableList";
import HtmlTooltip from "../../../components/CustomTooltipTitle";
import { CURReplaceByCurrencySingle } from "../../../constants/formulaUtility";
import { prepareDataForGrid } from "../../../constants/helpers";
import { GrBusinessService } from "react-icons/all";
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import Dialog from '@material-ui/core/Dialog'
import { CustomDialogTransition } from "../../../constants/helpers";
import useColumns, { getStaticFields, getFrameworkComponents } from "../../../constants/useColumns"
import { getLocalStorageArrayData, gridLoadingTimeout, isObjectEmpty, product, packages } from '../../../constants/helpers';
import SearchBox from "../../../components/Helpers/SearchBox";

const AddExistingMaterialDialog = ({ type, handleAdd, handleClose }) => {

    const toastConfig = useContext(CustomToastContext);
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
    const [columns, setColumns] = useState(null);
    const [frameWorkComponent, setFrameWorkComponent] = useState(null)

    const [materialList, setMaterialList] = useState([]);
    const [resource, setResource] = useState(type === "product" ? "Product" : "Packages");

    const { getColumnData } = useColumns();

    useEffect(() => {
        fetchMaterial()
    }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);

    useEffect(() => {
        axiosInstance().get("/field?resource=" + resource).then(({ data: { data } }) => {
            let columns = []
            let rendererNames = []
            data.forEach(o => {
                let currentColumn = getColumnData(routes.product.title, o?.fieldData, routes.product.path, true)
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
                commonRenderer: CommonRenderer,
            }
            setFrameWorkComponent({ ...tempFrameworkComponent })
            columns = [...columns, ...getStaticFields()]
            setColumns([...columns])
        })
    }, [])

    const fetchMaterial = () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        const queryString = getQueryString();
        axiosInstance().get(`${type === "product" ? product.api : packages.packageApi}${queryString}`).then(({ data }) => {
            setMaterialList(JSON.parse(JSON.stringify(data.data)));
            let rows = data.data.map((item) => {
                let res = {
                    ...prepareDataForGrid(item),
                };
                return res;
            });
            dispatch({ type: "initialize", data: rows, count: data.count });
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

    const handleSearch = (e) => {
        dispatch({ type: "search", search: e.target.value });
    };

    return (<Dialog
        fullScreen={true}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
    >
        <CustomDialogHeader title={"Add Existing " + type} onClose={handleClose} ></CustomDialogHeader>
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
                        <Box ml={1} >
                            <Button
                                color="primary"
                                variant="contained"
                                disabled={selectedRecords.length ? false : true}
                                onClick={() => {
                                    handleAdd(selectedRecords)
                                }}
                            >
                                {selectedRecords.length ? `(${selectedRecords.length}) Add` : "Add"}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
            {columns && frameWorkComponent ?
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
                    refreshGrid={fetchMaterial}
                    renderedFrom={"AddExistingMaterialDialog"}
                    showOnlyShowFilteredRecordSwitch={true}
                />
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
        </div>
    </Dialog>
    );
};

export default AddExistingMaterialDialog;
