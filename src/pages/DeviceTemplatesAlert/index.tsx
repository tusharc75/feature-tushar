import { Fragment, useContext, useEffect, useReducer, useState } from "react";
import { camelCase } from "lodash";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import { useData } from "src/StateProvider/Provider";
import CustomAgGrid, { intialState, reducer } from "src/components/AgGridComponents/CustomAgGrid";
import CustomBreadCrumbs from "src/components/CustomBreadCrumbs";
import CustomContainer from "src/components/CustomContainer";
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import routes from "src/components/Helpers/Routes";
import SearchBox from "src/components/Helpers/SearchBox";
import styles from '../Leads/Header.module.scss';
import { Button, IconButton, Menu, MenuItem, Tooltip } from "@material-ui/core";
import { AddOutlined, ExpandMore } from "@material-ui/icons";
import { isMobile, isTablet } from "react-device-detect";
import CustomSwipableList from "src/components/SwipableListComponents/CustomSwipableList";
import { getLocalStorageArrayData, gridLoadingTimeout, prepareDataForGrid, removeLocalStorage, sidebarResource } from "src/constants/helpers";
import useColumns, { getFrameworkComponents, getStaticFields, gridFilterParser } from "src/constants/useColumns";
import axiosInstance from "src/axios/axiosInstance";
import ManageDeviceTemplateAlert from "./ManageDeviceTemplateAlert";
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import EditIcon from '@material-ui/icons/Edit';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';

export default function DeviceTemplatesAlerts() {
    const renderedFrom = camelCase(routes?.deviceTemplateAlert.title);
    const localStorageSelectedRecords = `${renderedFrom}_selected`;

    const toastConfig = useContext(CustomToastContext);
    const {
        state: { permissions, selectedEntity }
    }: any = useData();
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
        state;

    const [frameWorkComponent, setFrameWorkComponent] = useState({});
    const [columns, setColumns] = useState([]);
    const [gridApi, setGridApi] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [open, setOpen] = useState({ open: false, isClone: false, id: null })
    const [deleteRecord, setDeleteRecord] = useState(null);
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);

    const { getColumnData } = useColumns();

    const fetchGridColumns = () => {
        axiosInstance()
            .get(`/field?resource=${sidebarResource?.deviceTemplateAlert}`)
            .then(({ data: { data } }) => {
                let columns = [];
                let rendererNames = [];
                data.forEach((o) => {
                    let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.deviceTemplateAlertDetail.path, true);
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

    useEffect(() => {
        fetchGridColumns();
    }, []);

    useEffect(() => {
        fetchDeviceTemplateAlert();
    }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);

    const fetchDeviceTemplateAlert = () => {
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

        if (search) {
            deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
        }

        if (showFilteredRecordsOnly) {
            const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
            deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
        }

        return deepFilter;
    };

    const handleSearch = (e) => {
        dispatch({ type: 'search', search: e.target.value });
    };

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const ActionsRenderer = (params) => (
        <Fragment>
            {params?.data?.allowedToEdit ? (
                <Tooltip title="Edit">
                    <IconButton
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
                fetchDeviceTemplateAlert();
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

    return (
        <section className="main-container-v1">
            <div className="headerbox-v1">
                <CustomBreadCrumbs routes={[{ title: routes.deviceTemplateAlert.title }]} />
                <ImportExportLinks
                    permissions={permissions?.deviceTemplateAlert}
                    module="deviceTemplateAlert"
                    api={'device-template-alert'}
                    afterImportCompleted={() => {
                        fetchDeviceTemplateAlert();
                    }}
                    isExportAllOrSomeFeature={true}
                    total={rowCount}
                    recordsToExport={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length}
                    ids={
                        getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length
                            ? getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((obj) => obj._id)
                            : []
                    }
                    onExportToExcelSuccess={() => {
                        if (gridApi) gridApi.deselectAll();
                        else fetchDeviceTemplateAlert();
                    }}
                    additionalParams={getQueryString(true)}
                />
            </div>
            <CustomContainer>
                <div className="header-panel">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className={'d-flex align-items-center gap-1'}></div>
                        <div className="flex flex-wrap gap-[8px]  justify-end">
                            <SearchBox onChange={handleSearch} className={styles.search_box_input} size="small" value={search} />
                            <div className="flex gap-[8px] flex-wrap items-center">
                                {permissions?.iotDataPoints?.isCreate && (
                                    <Button
                                        className={`no-shadow`}
                                        onClick={() => {
                                            setOpen({ open: true, isClone: false, id: null });
                                        }}
                                        variant={'contained'}
                                        size="small"
                                        color="primary"
                                        startIcon={<AddOutlined />}
                                    >
                                        Add
                                    </Button>
                                )}
                                {permissions?.deviceTemplateAlert?.isDelete && (
                                    <>
                                        <Button
                                            variant={'outlined'}
                                            color="default"
                                            size="small"
                                            onClick={openActions}
                                            disabled={selectedRecords.length ? false : true}
                                            aria-controls="action-menu"
                                            className={`new-dropdown-v1`}
                                            endIcon={<ExpandMore />}
                                        >
                                            Actions
                                        </Button>
                                        <Menu
                                            anchorEl={anchorEl}
                                            keepMounted
                                            getContentAnchorEl={null}
                                            anchorOrigin={{
                                                vertical: 'bottom',
                                                horizontal: 'left'
                                            }}
                                            id="action-menu"
                                            open={Boolean(anchorEl)}
                                            onClose={closeActions}
                                        >
                                            <MenuItem
                                                disabled={
                                                    !(
                                                        (selectedRecords?.length > 0 && selectedRecords?.filter((e) => e?.canDelete === true)?.length) === selectedRecords?.length
                                                    )
                                                }
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
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {Object.keys(frameWorkComponent).length > 0 ? (
                    isMobile && !isTablet ? (
                        <CustomSwipableList
                            allowSelection={true}
                            allowSwipe={true}
                            permissions={permissions.deviceTemplateAlert}
                            primaryField={columns?.find((d) => d.primaryField)}
                            onClick={(data) => {
                                setOpen({ open: true, isClone: false, id: data?.id });
                            }}
                            dataRows={dataRows}
                            selectedRecords={selectedRecords}
                            dispatch={dispatch}
                            onEdit={(data) => {
                                setOpen({ open: true, isClone: false, id: data?.id });
                            }}
                            extraParamsToCheckDelete={true}
                            onDelete={(data) => {
                                setDeleteRecord(data);
                                setShowDeleteConfirmBox(true);
                            }}
                            rowCount={rowCount}
                            page={page}
                            loading={loading}
                            additionalDetails={[]}
                            owerCollaboratorInitialsOrImages=""
                            onCreate={false}
                            showClone={true}
                            onClone={(data) => {
                                setOpen({ open: true, isClone: true, id: data?.id });
                            }}
                            chips={[]}
                            renderedFrom={renderedFrom}
                        />
                    ) : (
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
                            allowAction={true}
                            loading={loading}
                            renderedFrom={renderedFrom}
                            refreshGrid={fetchDeviceTemplateAlert}
                            showOnlyShowFilteredRecordSwitch={true}
                            showFilters={true}
                            resource={sidebarResource.deviceTemplateAlert}
                        />
                    )
                ) : null}

                {open?.open && (
                    <ManageDeviceTemplateAlert
                        id={open?.id}
                        isClone={open?.isClone}
                        onClose={() => setOpen({ open: false, isClone: false, id: null })}
                        onSuccess={() => {
                            setOpen({ open: false, isClone: false, id: null });
                            fetchDeviceTemplateAlert();
                        }}
                    />
                )}

                {showDeleteConfirmBox && (
                    <ConfirmationDialog
                        open={showDeleteConfirmBox}
                        message={`Are you sure you want to delete ${routes?.deviceTemplateAlert?.title?.toLowerCase()}  ${deleteRecord?.alertNumber || ''} ?`}
                        onClose={() => {
                            setDeleteRecord(null);
                            setShowDeleteConfirmBox(false);
                        }}
                        onOk={handleDelete}
                    />
                )}
            </CustomContainer>
        </section>
    );
}