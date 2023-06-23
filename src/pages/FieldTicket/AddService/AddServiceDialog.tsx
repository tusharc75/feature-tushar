import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import { Box, CircularProgress, Dialog } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, getLocalStorageArrayData, gridLoadingTimeout, isObjectEmpty, prepareDataForGrid } from 'src/constants/helpers';
import SearchBox from 'src/components/Helpers/SearchBox';
import CustomAgGridEditable from 'src/components/AgGridComponents/CustomAgGridEditable';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import useColumns, { getStaticFields, getFrameworkComponents } from 'src/constants/useColumns';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

let searchTimeout;
const AddServiceDialog = ({
    renderedFrom,
    handleAddServiceDialog,
    isAddingService,
    addService,
    ids
}) => {
    const localStorageSelectedRecords = `${renderedFrom}_selected`;
    const toastConfig = useContext(CustomToastContext);
    const { getColumnData } = useColumns();


    const {
        state: { user, permissions, selectedEntity }
    }: any = useData();

    const [columns, setColumns] = useState(null);
    const [frameWorkComponent, setFrameWorkComponent] = useState({});
    const [gridApi, setGridApi] = useState(null);

    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;



    const fetchGridColumns = () => {
        axiosInstance()
            .get('/field?resource=Service Master&view=true')
            .then(({ data: { data } }) => {
                let columns = [];
                let rendererNames = [];
                data.forEach((o) => {
                    let currentColumn = getColumnData(
                        renderedFrom,
                        o?.fieldData,
                        routes.serviceMasterDetail.path,
                        true
                    );
                    if (currentColumn !== null) {
                        columns = [...columns, currentColumn?.columnData];
                        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                            rendererNames.push(currentColumn?.rendererName);
                        }
                    }
                });
                let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
                setFrameWorkComponent({ ...tempFrameworkComponent });
                columns = [...columns, ...getStaticFields()];
                setColumns([...columns]);
            });
    };

    useEffect(() => {
        localStorage.removeItem(localStorageSelectedRecords);
        fetchGridColumns();
    }, []);

    const fetchService = () => {
        dispatch({ type: 'loading', loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        const queryString = getQueryString();
        axiosInstance()
            .get(`/field-ticket/service${queryString}`)
            .then(({ data: { data, count } }) => {
                let rows = data?.data.map((u) => {
                    let finalObject = prepareDataForGrid(u);
                    finalObject['isChecked'] = false;
                    finalObject['id'] = u._id;
                    finalObject['type'] = 'service';
                    finalObject['qty'] = 0;
                    const qtyAdded = [...getLocalStorageArrayData(localStorageSelectedRecords)]?.filter((e) => e._id === u._id);
                    if (qtyAdded.length) {
                        finalObject['qty'] = qtyAdded[0].qty;
                    }
                    finalObject['unitMain'] = u.unit;
                    finalObject['pricingMethodMain'] = u.pricingMethod;
                    return {
                        ...finalObject
                    };
                });
                dispatch({ type: 'initialize', data: rows, count: data?.count });
                setTimeout(() => {
                    dispatch({ type: 'loading', loading: false });
                }, gridLoadingTimeout);
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
                dispatch({ type: 'loading', loading: false });
            });
    };

    const getQueryString = () => {
        const ignoreIds = ids && ids?.length > 0 ? ids : [];
        let deepFilter = `?page=${page}&limit=${limit}&ignoreIds=${JSON.stringify(ignoreIds)}`;
        if (showFilteredRecordsOnly) {
            const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
            deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
        }
        const updatedFilters = [];
        if (!isObjectEmpty(filters)) {
            Object.keys(filters).forEach((field) => {
                updatedFilters.push({
                    field: field,
                    term: filters[field].filter
                });
            });
        }
        if (updatedFilters.length) {
            deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
        }
        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
        }
        if (search) {
            deepFilter = `${deepFilter}&search=${search}`;
        }
        return deepFilter;
    };

    useEffect(() => {
        let millisec = Object.keys(search).length > 0 ? 600 : 5;
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        searchTimeout = setTimeout(() => {
            fetchService();
        }, millisec);
    }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);

    const onCellValueChanged = ({ data }: any) => {
        const selectedFromStorage = [...getLocalStorageArrayData(localStorageSelectedRecords)];
        if (!selectedFromStorage || selectedFromStorage.length === 0) return;
        const updatedRecords = selectedFromStorage.map((d) => {
            if (data._id === d._id) {
                d.qty = data.qty;
            }
            return d;
        });
        localStorage.setItem(localStorageSelectedRecords, JSON.stringify(updatedRecords));
    };

    const handleSearch = (e) => {
        dispatch({ type: 'search', search: e.target.value });
    };

    return (
        <Fragment>
            <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
                <CustomDialogHeader title={`Add Service`} onClose={handleAddServiceDialog}></CustomDialogHeader>
                <div className="listing-grid p-3">
                    <Box mb={2}>
                        <Grid container>
                            <Grid item xs={10} sm={10} md={11} container justify="flex-end">
                                <SearchBox onChange={handleSearch} className="terms_header_search_bar" width="300px" value={search} />
                            </Grid>
                            <Grid item xs={2} sm={2} md={1} container justify="flex-end">
                                <Box ml={1}>
                                    <Button
                                        size="small"
                                        color="primary"
                                        onClick={() => {
                                            addService(getLocalStorageArrayData(`${localStorageSelectedRecords}`));
                                        }}
                                        variant="contained"
                                        disabled={!getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length || isAddingService}
                                        endIcon={isAddingService && <CircularProgress size={20} color="primary" />}
                                    >
                                        Add
                                        {getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length
                                            ? ' (' + getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length + ')'
                                            : ''}
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                    {columns ? (
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
                            refreshGrid={() => { }}
                            renderedFrom={renderedFrom}
                        />
                    ) : (
                        <Box p={2} height={500}>
                            <CommonSkeleton lenArray={[...Array(10).keys()]} />
                        </Box>
                    )}
                </div>
            </Dialog>
        </Fragment>
    );
};

export default AddServiceDialog;
