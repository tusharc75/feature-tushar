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
import EditIcon from '@material-ui/icons/Edit';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import { ExpandMore } from "@material-ui/icons";
import ManageDeviceTemplateAlert from "src/pages/DeviceTemplatesAlert/ManageDeviceTemplateAlert";
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import ImportExportMenu from "src/components/Helpers/ImportExportMenu";

export default function Alerts({ deviceTemplate }) {

    const renderedFrom = camelCase(routes?.deviceTemplateAlert.title);
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
            .get(`/field?resource=${sidebarResource?.deviceTemplateAlert}`)
            .then(({ data: { data } }) => {
                let columns = [];
                let rendererNames = [];
                data.forEach((o) => {
                    if (['alertNumber'].indexOf(o?.fieldData?.fieldName) === 0) {
                        columns = [
                            ...columns,
                            {
                                pivotIndex: 0,
                                field: 'alertNumber',
                                headerName: 'Alert Number',
                                show: true,
                                disabled: true,
                                cellRenderer: 'alertNumberRenderer'
                            }
                        ];
                    } else {
                        let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.deviceTemplateAlertDetail.path, true);
                        if (currentColumn !== null) {
                            columns = [...columns, currentColumn?.columnData];
                            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                                rendererNames.push(currentColumn?.rendererName);
                            }
                        }
                    }
                });

                let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
                tempFrameworkComponent = {
                    ...tempFrameworkComponent,
                    alertNumberRenderer: AlertNumberRenderer,
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
            .get(`${routes?.deviceTemplateAlert?.path}${queryString}`)
            .then(({ data }) => {
                let count = data?.count;
                let rows = data?.data?.map((u: any) => {
                    let finalObject: any = prepareDataForGrid(u);
                    finalObject['canDelete'] = permissions?.deviceTemplateAlert?.isDelete;
                    finalObject['isChecked'] = selectedRecords?.some((s) => s?._id === u?._id);
                    finalObject['allowedToEdit'] = permissions?.deviceTemplateAlert?.isUpdate;

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

    const AlertNumberRenderer = (params) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <p className="link text-truncate" onClick={() => {
                setOpen({ open: true, isClone: false, id: params?.data?.id });
            }}>
                {params?.value}
            </p>
            <Box ml={1}>
                <IconButton
                    size="small"
                    onClick={() => {
                        window.open(`${routes.deviceTemplateAlertDetail.path}/${params.data.id}`);
                    }}
                >
                    <OpenInNewIcon fontSize="small" color="primary" />
                </IconButton>
            </Box>
        </div>
    );

    const ActionsRenderer = (params) => (
        <Fragment>
            {params?.data?.allowedToEdit ? (
                <Tooltip title="Edit">
                    <IconButton
                        size="small"
                        aria-label="Edit"
                        onClick={() => {
                            setOpen({ open: true, isClone: false, id: params?.data?.id });
                        }}
                    >
                        <EditIcon fontSize="small" color="primary" />
                    </IconButton>
                </Tooltip>
            ) : (
                <Tooltip className="cursor-stop" title="You do not have permission to edit">
                    <IconButton aria-label="Clone" size="small">
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}

            {permissions?.deviceTemplateAlert?.isCreate ? (
                <Tooltip title="Clone">
                    <IconButton
                        size="small"
                        aria-label="Clone"
                        onClick={() => {
                            setOpen({ open: true, isClone: true, id: params?.data?.id });
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
                        size="small"
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
            .put(`${routes?.deviceTemplateAlert?.path}/remove`, { ids: ids })
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
                            <Box ml={1} />
                            <ImportExportMenu
                                permissions={permissions?.deviceTemplateAlert}
                                module="Device Template Alert"
                                api={`${routes?.deviceTemplateAlert?.path}`}
                                afterImportCompleted={() => {
                                    fetchData();
                                }}
                                // isExportAllOrSomeFeature={true}
                                ids={[]}
                                additionalParams={`deviceTemplate=${deviceTemplate}`}
                            />
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
                <ManageDeviceTemplateAlert
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
                    message={`Are you sure you want to delete the ${routes.deviceTemplateAlert?.title?.toLowerCase()} ?`}
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