import { Box, Button, CircularProgress, Dialog, Grid } from '@material-ui/core';
import { useState, useEffect, useContext, useReducer } from 'react';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import routes from '../Helpers/Routes';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import styles from 'src/pages/Leads/Header.module.scss';
import { getLocalStorageArrayData, gridLoadingTimeout, isObjectEmpty, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import useColumns, { getStaticFields, getFrameworkComponents } from 'src/constants/useColumns';
import SearchBox from '../Helpers/SearchBox';
import CustomAgGrid, { intialState, reducer } from '../AgGridComponents/CustomAgGrid';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

let searchTimeout;

export default function AssignUserDialog({ reference, handleClose, onSuccess, assignedUser = [] }) {
    const renderedFrom = `${routes.user.title}_${reference}_selected`;
    const localStorageSelectedRecords = `${renderedFrom}_selected`;

    const {
        state: { permissions, selectedEntity }
    }: any = useData();

    const toastConfig = useContext(CustomToastContext);

    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
    const [columns, setColumns] = useState([]);
    const [frameWorkComponent, setFrameWorkComponent] = useState(null);
    const [gridApi, setGridApi] = useState(null);
    const [isAssigning, setIsAssigning] = useState(false);
    const [renderCount, setRenderCount] = useState(0)
    const [disableSaveButton, setDisableSaveButton] = useState(true)

    const { getColumnData } = useColumns();

    useEffect(() => {
        localStorage.removeItem(localStorageSelectedRecords);
        fetchGridColumns();
    }, []);

    const fetchGridColumns = () => {
        axiosInstance()
            .get(`/field?resource=${sidebarResource?.user}&view=true`)
            .then(({ data: { data } }) => {
                let columns = [];
                let rendererNames = [];
                data.forEach((o) => {
                    let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.userDetail.path);
                    if (currentColumn !== null) {
                        columns = [...columns, currentColumn?.columnData];
                        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                            rendererNames.push(currentColumn?.rendererName);
                        }
                    }
                });
                let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
                tempFrameworkComponent = {
                    ...tempFrameworkComponent
                };
                setFrameWorkComponent({ ...tempFrameworkComponent });
                columns = [...columns, ...getStaticFields()];
                setColumns(columns);
            });
    };

    useEffect(() => {
        selectedRecords.forEach(rec => {
            if (assignedUser.includes(rec._id)) {
                setDisableSaveButton(true)
            } else {
                setDisableSaveButton(false)
            }
        })
    }, [selectedRecords]);

    const fetchData = () => {
        dispatch({ type: 'loading', loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        const queryString = getQueryString();
        axiosInstance()
            .get(`/user${queryString}`)
            .then(({ data }) => {
                let rows = data.data.map((u) => {
                    let finalObject = prepareDataForGrid(u);
                    finalObject['isChecked'] = false;
                    finalObject['id'] = u._id;
                    return {
                        ...finalObject
                    };
                });
                const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
                if (renderCount === 0) {
                    const selectedRecords = rows.filter((_row: any) => assignedUser.includes(_row.id))
                    localStorage.setItem(localStorageSelectedRecords, JSON.stringify(selectedRecords))
                    setRenderCount(renderCount + 1)
                }

                dispatch({
                    type: 'selection',
                    selectedRecords: savedRecords
                });
                dispatch({ type: 'initialize', data: rows, count: data.count });
                setTimeout(() => {
                    dispatch({ type: 'loading', loading: false });
                }, gridLoadingTimeout);
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    };

    useEffect(() => {

    }, [])

    const getQueryString = () => {
        let deepFilter = `?page=${page}&limit=${limit}`;
        if (selectedEntity) {
            deepFilter = `${deepFilter}&entity=${selectedEntity}`;
        }
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
            deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=or`;
        } else {
            deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=or`;
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
            fetchData();
        }, millisec);
    }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);


    const handleSearch = (e) => {
        dispatch({ type: 'search', search: e.target.value });
    };

    const handleSubmit = async () => {
        onSuccess([...getLocalStorageArrayData(localStorageSelectedRecords)]);
    };

    return (
        <Dialog fullWidth maxWidth="md" fullScreen={true} open={true} onClose={handleClose} aria-labelledby="assign-roles-dialog">
            <CustomDialogHeader
                title={`Assign ${routes.user.title}`}
                showManimizeMaximize={false}
                showRequiredLabel={false}
                onClose={handleClose}
            />
            <CustomDialogContent>
                {columns && frameWorkComponent && Object.keys(frameWorkComponent).length > 0 ? (
                    <>
                        <div className="header-panel">
                            <Grid container className={styles.filter_side_container}>
                                <Grid item xs={6} className="d-flex align-items-center gap-1">

                                </Grid>
                                <Grid item xs={6} className={styles.filter_side}>
                                    <Box className={styles.filter_side_header} component="div">
                                        <SearchBox onSearch={handleSearch} searchbox={styles.search_box_input} width="242px" size="small" value={search} />
                                        <Button
                                            disabled={disableSaveButton || [...getLocalStorageArrayData(localStorageSelectedRecords)].length === 0}
                                            onClick={handleSubmit}
                                            color="primary"
                                            size="small"
                                            variant="contained"
                                            endIcon={isAssigning && <CircularProgress color="inherit" size={18} />}
                                        >
                                            Add{' '}
                                            {[...getLocalStorageArrayData(localStorageSelectedRecords)].length > 0
                                                ? '(' + [...getLocalStorageArrayData(localStorageSelectedRecords)].length + ')'
                                                : ''}
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </div>
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
                            renderedFrom={renderedFrom}
                            refreshGrid={fetchData}
                            showOnlyShowFilteredRecordSwitch={true}
                        />
                    </>
                ) : (
                    <Box p={2} height={500}>
                        <CommonSkeleton lenArray={[...Array(10).keys()]} />
                    </Box>
                )}
            </CustomDialogContent>
        </Dialog>
    );
}