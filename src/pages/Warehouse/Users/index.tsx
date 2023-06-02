import { Fragment, useState, useEffect, useReducer, useContext } from 'react';
import { Box, Grid, Button, Menu, MenuItem, IconButton } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import axiosInstance from 'src/axios/axiosInstance';
import { getLocalStorageArrayData, gridLoadingTimeout, isObjectEmpty, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import useColumns, { getFrameworkComponents, getStaticFields } from 'src/constants/useColumns';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import { camelCase } from 'lodash';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import AssignUserDialog from 'src/components/AssignRolesDialog/NewAssignUserDialog';

const Users = ({ warehouse }) => {
    let renderedFrom = camelCase(routes.user.title);
    const localStorageSelectedRecords = `${renderedFrom}_selected`;
    const toastConfig = useContext(CustomToastContext);
    const [openDialog, setOpenDialog] = useState(false);
    const [anchorActionEl, setAnchorActionEl] = useState(null);
    const [deleteRecord, setDeleteRecord] = useState(null);
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
    const {
        state: { user, permissions, selectedEntity }
    }: any = useData();
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } =
        state;
    const [gridApi, setGridApi] = useState(null);
    const [columns, setColumns] = useState([]);
    const [frameWorkComponent, setFrameWorkComponent] = useState({});
    const { getColumnData } = useColumns();

    useEffect(() => {
        localStorage.removeItem(localStorageSelectedRecords);
        fetchGridColumns();
    }, []);

    useEffect(() => {
        fetchData();
    }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);

    const fetchGridColumns = () => {
        axiosInstance()
            .get(`/field?resource=${sidebarResource.user}`)
            .then(({ data: { data } }) => {
                let columns = [];
                let rendererNames = [];
                data.forEach((o) => {
                    let currentColumn = getColumnData(routes.user?.title, o?.fieldData, routes.userDetail.path);
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
        if (gridApi) {
            gridApi.setRowData([]);
        }
        const queryString = getQueryString();
        axiosInstance()
            .get(`${routes.warehouse.path}/user/${warehouse}${queryString}`)
            .then(({ data: { data } }) => {
                let rows = data?.data?.map((u) => {
                    let finalObject = prepareDataForGrid(u);
                    finalObject['isChecked'] = getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.some((s) => s._id === u._id);
                    finalObject['allowedToEdit'] = permissions?.storageLocation?.isUpdate;
                    finalObject['canDelete'] = permissions?.storageLocation?.isDelete;
                    let res = {
                        ...finalObject
                    };
                    return res;
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
        let deepFilter = `?page=${page}&limit=${limit}`;

        const updatedFilters = [];
        if (!isObjectEmpty(filters)) {
            Object.keys(filters).forEach((field) => {
                updatedFilters.push({
                    field: replaceFieldName(field),
                    term: filters[field].filter
                });
            });
        }
        if (updatedFilters?.length) {
            deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(updatedFilters))}&filterType=and`;
        }
        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
        }
        if (search) {
            deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
        }
        if (showFilteredRecordsOnly) {
            const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
            deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
        }
        return deepFilter;
    };

    const handleDelete = () => {
        axiosInstance()
            .put(`${routes.warehouse.path}/user/remove`, { warehouse, user: deleteRecord })
            .then(() => {
                fetchData();
                setShowDeleteConfirmBox(false);
                setDeleteRecord(null);
                setAnchorActionEl(null);
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    };

    const ActionsRenderer = (params) => (
        <HtmlTooltip title="Delete">
            <IconButton
                size="small"
                aria-label="Delete"
                onClick={() => {
                    setDeleteRecord([params.data._id]);
                    setShowDeleteConfirmBox(true);
                }}
            >
                <DeleteIcon color="error" />
            </IconButton>
        </HtmlTooltip>
    );

    const openActions = (event) => {
        setAnchorActionEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorActionEl(null);
    };

    const replaceFieldName = (field) => {
        switch (field) {
            case 'createdBy':
                return 'createdBy.user.concatedName';
            case 'updatedBy':
                return 'updatedBy.user.concatedName';
            default:
                return field;
        }
    };

    const handleAssignUser = (data) => {

        const user = data?.map(_user => _user?._id)

        axiosInstance().post(`${routes.warehouse.path}/user/assign`, {
            warehouse: warehouse,
            user
        })
            .then((res) => {
                fetchData();
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
                fetchData();
            })
    }

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
                                setOpenDialog(true);
                            }}
                        >
                            Assign User
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
                                        setShowDeleteConfirmBox(true);
                                        setDeleteRecord(selectedRecords.map((d) => d._id));
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
            {openDialog && (
                <AssignUserDialog
                    handleClose={() => setOpenDialog(false)}
                    onSuccess={(data) => {
                        handleAssignUser(data)
                        setOpenDialog(false);
                    }}
                    reference={'warehouse'}
                    assignedUser={dataRows.map(data => data?._id)}
                />
            )}
            {showDeleteConfirmBox && (
                <ConfirmationDialogRaw
                    open={showDeleteConfirmBox}
                    message={`Are you sure you want to delete the ${routes.user?.title?.toLowerCase()} ?`}
                    onClose={() => {
                        setDeleteRecord(null);
                        setShowDeleteConfirmBox(false);
                    }}
                    onOk={handleDelete}
                />
            )}
        </Fragment>
    );
};

export default Users;
