import { Fragment, useContext, useEffect, useReducer, useState } from "react";
import { Box, Button, Grid, IconButton, Menu, MenuItem, Tooltip } from "@material-ui/core";
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import routes from "src/components/Helpers/Routes";
import CustomAgGrid, { intialState, reducer } from "src/components/AgGridComponents/CustomAgGrid";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import { useData } from "src/StateProvider/Provider";
import axiosInstance from "src/axios/axiosInstance";
import { gridLoadingTimeout, prepareDataForGrid, removeLocalStorage, sidebarResource } from "src/constants/helpers";
import useColumns, { getFrameworkComponents, getStaticFields, gridFilterParser } from "src/constants/useColumns";
import { camelCase } from "lodash";
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import ManageIotDataPoints from "src/pages/IotDataPoints/ManageIotDataPoints";
import { ExpandMore } from "@material-ui/icons";

export default function IotDataPoints({ deviceTemplate }) {

    const renderedFrom = camelCase(routes?.iotDataPoints.title);
    const localStorageSelectedRecords = `${renderedFrom}_selected`;

    const toastConfig = useContext(CustomToastContext);
    const {
        state: { user, permissions, selectedEntity }
    }: any = useData();
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
        state;
    const [gridApi, setGridApi] = useState(null);
    const [columns, setColumns] = useState([]);
    const [frameWorkComponent, setFrameWorkComponent] = useState({});

    const { getColumnData } = useColumns();

    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
    const [deleteRecord, setDeleteRecord] = useState(null);
    const [open, setOpen] = useState({ open: false, isClone: false, id: null });
    const [anchorActionEl, setAnchorActionEl] = useState(null);

    useEffect(() => {
        fetchGridColumns();
    }, []);

    useEffect(() => {
        fetchData();
    }, [page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

    const fetchGridColumns = () => {
        axiosInstance()
            .get(`/field?resource=${sidebarResource?.iotDataPoints}`)
            .then(({ data: { data } }) => {
                let columns = [];
                let rendererNames = [];
                data.forEach((o) => {
                    let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.iotDataPointsDetail.path, false);
                    if (currentColumn !== null) {
                        columns = [...columns, currentColumn?.columnData];
                        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                            rendererNames.push(currentColumn?.rendererName);
                        }
                    }
                });
                let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
                tempFrameworkComponent = {
                    ...tempFrameworkComponent,
                    actionsRenderer: ActionsRenderer
                };
                setFrameWorkComponent({ ...tempFrameworkComponent });
                columns = [...columns, ...getStaticFields()];
                setColumns([...columns]);
            });
    };

    const fetchData = () => {
        dispatch({ type: 'loading', loading: true });
        const queryString = getQueryString();

        if (gridApi) {
            gridApi.setRowData([]);
        }
        axiosInstance()
            .get(`${routes?.iotDataPoints?.path}${queryString}`)
            .then(({ data: { data } }) => {
                let count = data?.count;
                let rows = data?.data?.map((u: any) => {
                    let finalObject: any = prepareDataForGrid(u);
                    finalObject['canDelete'] = permissions?.iotDataPoints?.isDelete;
                    finalObject['isChecked'] = selectedRecords?.some((s) => s?._id === u?._id);
                    finalObject['allowedToEdit'] = permissions?.iotDataPoints?.isUpdate;

                    return {
                        ...finalObject
                    };
                });
                if (appendRows) {
                    dispatch({
                        type: 'initialize',
                        data: [...dataRows, ...rows],
                        count: count,
                        selectedRecords: [...dataRows, ...rows].filter((f) => f.isChecked === true)
                    });
                } else {
                    dispatch({
                        type: 'initialize',
                        data: rows,
                        count: count,
                        selectedRecords: rows.filter((f) => f.isChecked === true)
                    });
                }
                dispatch({ type: 'initialize', data: rows, count: count });
                setTimeout(() => {
                    dispatch({ type: 'loading', loading: false });
                }, gridLoadingTimeout);
            });
    };

    const getQueryString = (isExport = false) => {
        let deepFilter = `?page=${page}&limit=${limit}`;

        if (isExport) {
            deepFilter = `?`;
        }

        if (selectedEntity) {
            deepFilter = `${deepFilter}&entity=${selectedEntity}`;
        }

        const { filterByIds, deepFilters } = gridFilterParser(filters);

        filterByIds.push({ field: 'deviceTemplate', term: deviceTemplate });

        if (filterByIds?.length) {
            deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
        }
        if (deepFilters?.length) {
            deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
        }
        if (filterByIds?.length || deepFilters?.length) {
            deepFilter = `${deepFilter}&filterType=and`;
        }

        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
        }

        if (showFilteredRecordsOnly) {
            const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
            deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
        }

        return deepFilter;
    };

    const ActionsRenderer = (params) => (
        <Fragment>
            {permissions?.iotDataPoints?.isCreate ? (
                <Tooltip title="Clone">
                    <IconButton
                        aria-label="Clone"
                        onClick={() => {
                            setOpen({ open: true, isClone: true, id: params.data.id });
                        }}
                    >
                        <FileCopyIcon fontSize="small" color="primary" />
                    </IconButton>
                </Tooltip>
            ) : (
                <Tooltip className="cursor-stop" title="You do not have permission to clone/create">
                    <IconButton aria-label="Clone" size="small">
                        <FileCopyIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}

            {params?.data?.canDelete ? (
                <Tooltip title="Delete">
                    <IconButton
                        aria-label="Delete"
                        onClick={() => {
                            setDeleteRecord(params.data);
                            setShowDeleteConfirmBox(true);
                        }}
                    >
                        <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                </Tooltip>
            ) : (
                <Tooltip className="cursor-stop" title="You do not have permission to delete">
                    <IconButton aria-label="Delete" size="small">
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
        </Fragment>
    );

    const handleDelete = () => {
        let ids = [];
        if (deleteRecord) {
            ids.push(deleteRecord._id);
        } else {
            ids = selectedRecords.map((m) => m._id);
        }
        axiosInstance()
            .put(`${routes?.iotDataPoints?.path}/remove`, { ids: ids })
            .then(({ data }) => {
                removeLocalStorage(localStorageSelectedRecords);
                fetchData();
                setShowDeleteConfirmBox(false);
                setDeleteRecord(null);
                toastConfig.setToastConfig({
                    open: true,
                    type: 'success',
                    message: data?.message
                });
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    };

    const openActions = (event) => {
        setAnchorActionEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorActionEl(null);
    };

    return (
        <Fragment>
            <Box p={1} pb={2}>
                <Grid container>
                    <Grid item xs={3} md={3} sm={3}>
                        <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => {
                                setOpen({ open: true, isClone: false, id: null });
                            }}
                        >
                            Add
                        </Button>
                    </Grid>
                    <Grid item xs={9} md={9} sm={9}>
                        <Box display={'flex'} justifyContent={'flex-end'} alignItems="center">
                            <Button
                                variant="outlined"
                                color="default"
                                size="small"
                                onClick={openActions}
                                aria-controls="action-menu"
                                disabled={selectedRecords.length === 0}
                                endIcon={<ExpandMore />}
                                className="new-dropdown-v1"
                            >
                                Actions
                            </Button>
                            <Menu
                                anchorEl={anchorActionEl}
                                keepMounted
                                getContentAnchorEl={null}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'left'
                                }}
                                id="action-menu"
                                open={Boolean(anchorActionEl)}
                                onClose={closeActions}
                            >
                                <MenuItem
                                    onClick={() => {
                                        closeActions();
                                        {
                                            selectedRecords.length === 1 && setDeleteRecord(selectedRecords[0]);
                                        }
                                        setShowDeleteConfirmBox(true);
                                    }}
                                >
                                    Delete
                                </MenuItem>
                            </Menu>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
            {columns && Object.keys(frameWorkComponent).length > 0 ? (
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
                    actionWidth={150}
                    loading={loading}
                    renderedFrom={renderedFrom}
                    refreshGrid={fetchData}
                    showOnlyShowFilteredRecordSwitch={true}
                />
            ) : (
                <Box p={2} height={500}>
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
            )}

            {open?.open && (
                <ManageIotDataPoints
                    id={open.id}
                    isClone={open?.isClone}
                    referenceData={{ deviceTemplate }}
                    onClose={() => setOpen({ open: false, isClone: false, id: null })}
                    onSuccess={() => {
                        setOpen({ open: false, isClone: false, id: null });
                        fetchData();
                    }}
                />
            )}

            {showDeleteConfirmBox && (
                <ConfirmationDialogRaw
                    open={showDeleteConfirmBox}
                    message={`Are you sure you want to delete the ${routes.iotDataPoints?.title?.toLowerCase()} ?`}
                    onClose={() => {
                        setDeleteRecord(null);
                        setShowDeleteConfirmBox(false);
                    }}
                    onOk={handleDelete}
                />
            )}
        </Fragment>
    );
}