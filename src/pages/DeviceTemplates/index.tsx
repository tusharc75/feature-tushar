import { useContext, useEffect, useReducer, useState } from "react";
import { isMobile, isTablet } from "react-device-detect";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import { useData } from "src/StateProvider/Provider";
import CustomBreadCrumbs from "src/components/CustomBreadCrumbs";
import CustomContainer from "src/components/CustomContainer";
import { useHistory } from 'react-router-dom';
import ImportExportLinks from "src/components/Helpers/ImportExportLinks";
import routes from "src/components/Helpers/Routes";
import SearchBox from "src/components/Helpers/SearchBox";
import styles from '../Leads/Header.module.scss';
import { Button, IconButton, Menu, MenuItem, Tooltip } from "@material-ui/core";
import { AddOutlined, ExpandMore } from "@material-ui/icons";
import CustomSwipableList from "src/components/SwipableListComponents/CustomSwipableList";
import CustomAgGrid, { intialState, reducer } from "src/components/AgGridComponents/CustomAgGrid";
import axiosInstance from "src/axios/axiosInstance";
import useColumns, { getFrameworkComponents, getStaticFields, gridFilterParser } from 'src/constants/useColumns';
import { camelCase } from "lodash";
import { getLocalStorageArrayData, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from "src/constants/helpers";
import ManageDeviceTemplates from "./ManageDeviceTemplates";
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import EditIcon from '@material-ui/icons/Edit';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { TbArrowsSort } from "react-icons/tb";
import MobileSortDialog from "src/components/MobileSortDialog";
import { MdOutlineFilterAlt } from "react-icons/md";
import MobileFilterDialog from "src/components/MobileFilterDialog";

export default function DeviceTemplates() {

    const renderedFrom = camelCase(routes?.deviceTemplates.title);
    const localStorageSelectedRecords = `${renderedFrom}_selected`;
    const history = useHistory();
    const toastConfig = useContext(CustomToastContext);
    const {
        state: { permissions, user, selectedEntity }
    }: any = useData();
    const { getColumnData } = useColumns();

    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
        state;

    const [sortOpen, setSortOpen] = useState(false);
    const [isOpenDialog, setisOpenDialog] = useState(false);
    const [columns, setColumns] = useState([]);
    const [frameWorkComponent, setFrameWorkComponent] = useState({});
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
    const [deleteRecord, setDeleteRecord] = useState(null);
    const [open, setOpen] = useState({ open: false, isClone: false, id: null });
    const [anchorEl, setAnchorEl] = useState(null);

    useEffect(() => {
        fetchGridColumns();
    }, []);

    const fetchGridColumns = () => {
        axiosInstance()
            .get('/field?resource=Device Templates')
            .then(({ data: { data } }) => {
                let columns = [];
                let rendererNames = [];
                data.forEach((o) => {
                    let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.deviceTemplatesDetail.path, true);
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

    const getQueryString = (isExport = false) => {
        let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';

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

    const fetchDeviceTemplates = () => {
        dispatch({ type: 'loading', loading: true });
        const queryString = getQueryString();

        if (gridApi) {
            gridApi.setRowData([]);
        }

        axiosInstance()
            .get(`${routes.deviceTemplates.path}${queryString}`)
            .then(({ data: { data, count } }) => {
                let rows = data.map((u) => {
                    let finalObject = prepareDataForGrid(u, user);
                    finalObject['canDelete'] = permissions?.deviceTemplates?.isDelete;
                    finalObject['isChecked'] = getLocalStorageArrayData(localStorageSelectedRecords)?.some((s) => s._id === u._id);
                    finalObject['allowedToEdit'] = permissions?.deviceTemplates?.isUpdate;
                    return finalObject;
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
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
                dispatch({ type: 'loading', loading: false });
            });
    };

    useEffect(() => {
        fetchDeviceTemplates();
    }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);

    const handleSearch = (e) => {
        dispatch({ type: 'search', search: e.target.value });
    };

    const ActionsRenderer = (params) => (
        <>
            <Tooltip
                className={permissions?.deviceTemplates?.isUpdate ? '' : 'cursor-stop'}
                title={permissions?.deviceTemplates?.isUpdate ? 'Update' : 'You do not have permission to update'}
            >
                <span>
                    <IconButton
                        size="small"
                        aria-label="Clone"
                        disabled={!permissions?.deviceTemplates?.isUpdate}
                        onClick={() => {
                            setOpen({ open: true, isClone: false, id: params.data._id });
                        }}
                    >
                        <EditIcon fontSize="small" color={permissions?.deviceTemplates?.isUpdate ? 'primary' : 'inherit'} />
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip
                className={permissions?.deviceTemplates?.isCreate ? '' : 'cursor-stop'}
                title={permissions?.deviceTemplates?.isCreate ? 'Clone' : 'You do not have permission to clone/create'}
            >
                <span>
                    <IconButton
                        size="small"
                        aria-label="Clone"
                        disabled={!permissions?.deviceTemplates?.isCreate}
                        onClick={() => {
                            setOpen({ open: true, isClone: true, id: params.data._id });
                        }}
                    >
                        <FileCopyIcon fontSize="small" color={permissions?.deviceTemplates?.isCreate ? 'primary' : 'inherit'} />
                    </IconButton>
                </span>
            </Tooltip>
            {permissions?.deviceTemplates?.isDelete ? (
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
                <Tooltip className="cursor-stop" title={`You do not have permission to delete `}>
                    <IconButton aria-label="Delete">
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
        </>
    );

    const handleDelete = () => {
        let ids = [];
        if (deleteRecord) {
            ids.push(deleteRecord._id);
        } else {
            ids = getLocalStorageArrayData(localStorageSelectedRecords)?.map((m) => m._id);
        }
        axiosInstance()
            .put(`${routes.deviceTemplates.path}/remove`, { ids: ids })
            .then(() => {
                fetchDeviceTemplates();
                setShowDeleteConfirmBox(false);
                setDeleteRecord(null);
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    };

    const handleClickOpen = () => {
        setSortOpen(true);
    };

    const handleClickClose = () => {
        setSortOpen(false);
    };

    const handleOpen = () => {
        setisOpenDialog(true);
    };

    const handleClose = () => {
        setisOpenDialog(false);
    };

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    return (
        <section className="main-container-v1">
            <div className="headerbox-v1">
                <CustomBreadCrumbs routes={[{ title: routes.deviceTemplates.title }]} />
                <ImportExportLinks
                    permissions={permissions?.warehouse}
                    module="warehouse"
                    api={'warehouse'}
                    afterImportCompleted={() => {

                    }}
                    isExportAllOrSomeFeature={true}
                    total={10}
                    recordsToExport={4}
                    ids={[]}
                    onExportToExcelSuccess={() => {

                    }}
                    additionalParams={() => { }}
                    title={routes.deviceTemplates.title}
                />
            </div>
            <CustomContainer>
                <div className="header-panel">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className={'d-flex align-items-center gap-1'}>
                            {isMobile && !isTablet && (
                                <div className="d-flex flex-wrap items-center justify-between w-full">
                                    <div></div>
                                    <div className="flex flex-wrap items-center gap-1 ml-auto">
                                        <IconButton
                                            onClick={handleClickOpen}
                                            id="demo-customized-button"
                                            aria-controls="demo-customized-menu"
                                            aria-haspopup="true"
                                            className={'mobileIconButton secondary'}
                                            size="small"
                                        >
                                            <TbArrowsSort className="rotate-90" size={16} />
                                        </IconButton>
                                        <MobileSortDialog
                                            isOpen={sortOpen}
                                            handleClose={handleClickClose}
                                            contentPart={null}
                                            secHeading={['Sort Plants']}
                                            columns={columns}
                                            dispatch={dispatch}
                                        />
                                        <IconButton
                                            id="demo-customized-button"
                                            aria-controls="demo-customized-menu"
                                            aria-haspopup="true"
                                            // aria-expanded={open ? 'true' : undefined}
                                            className={'mobileIconButton secondary'}
                                            size="small"
                                            onClick={handleOpen}
                                        >
                                            <MdOutlineFilterAlt size={16} />
                                        </IconButton>
                                        <MobileFilterDialog
                                            isOpen={isOpenDialog}
                                            handleClose={handleClose}
                                            contentPart={null}
                                            columns={columns}
                                            dispatch={dispatch}
                                            title={routes?.warehouse?.title}
                                            filters={filters}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-[8px]  justify-end">
                            <SearchBox onChange={handleSearch} className={styles.search_box_input} size="small" value={search} />

                            <div className="flex gap-[8px] flex-wrap items-center">
                                {permissions?.warehouse?.isCreate && (
                                    <Button
                                        onClick={() => {
                                            setOpen({ open: true, isClone: false, id: null });
                                        }}
                                        variant={'contained'}
                                        className="no-shadow"
                                        color="primary"
                                        size="small"
                                        startIcon={<AddOutlined />}
                                    >
                                        Add
                                    </Button>
                                )}

                                <Button
                                    variant={'outlined'}
                                    color="default"
                                    size="small"
                                    onClick={openActions}
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
                                    <MenuItem disabled={!permissions?.deviceTemplates?.isDelete} onClick={() => {
                                        closeActions()
                                        setShowDeleteConfirmBox(true)
                                    }}>Delete</MenuItem>
                                </Menu>
                            </div>
                        </div>
                    </div>
                </div>

                {Object.keys(frameWorkComponent).length > 0 ? (
                    isMobile && !isTablet ? (
                        <CustomSwipableList
                            allowSelection={true}
                            allowSwipe={true}
                            permissions={permissions?.deviceTemplates}
                            primaryField={columns?.find((d) => d.field)}
                            onClick={(data) => {
                                history.push(`${routes.deviceTemplatesDetail.path}/${data._id}`);
                            }}
                            dataRows={dataRows}
                            selectedRecords={selectedRecords}
                            dispatch={dispatch}
                            onEdit={(data) => {
                                history.push(`${routes.deviceTemplatesDetail.path}/${data._id}`);
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
                            chips={[]}
                            owerCollaboratorInitialsOrImages=""
                            onCreate={false}
                            showClone={false}
                            onClone={() => { }}
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
                            actionWidth={150}
                            loading={loading}
                            renderedFrom={renderedFrom}
                            refreshGrid={fetchDeviceTemplates}
                            showOnlyShowFilteredRecordSwitch={true}
                            showFilters={true}
                            resource={sidebarResource.deviceTemplates}
                        />
                    )
                ) : null}
            </CustomContainer>

            {open?.open && (
                <ManageDeviceTemplates
                    deviceTemplatesId={open.id}
                    open={open?.open}
                    onClose={() => setOpen({ open: false, isClone: false, id: null })}
                    onSuccess={() => {
                        setOpen({ open: false, isClone: false, id: null });
                        fetchDeviceTemplates();
                    }}
                    isClone={open?.isClone}
                />
            )}

            {showDeleteConfirmBox && (
                <ConfirmationDialog
                    open={showDeleteConfirmBox}
                    message={`Are you sure you want to delete ${routes?.deviceTemplates?.title?.toLowerCase()} ${deleteRecord ? (deleteRecord?._id ? deleteRecord?.templateName : '') : ''}?`}
                    onClose={() => {
                        setDeleteRecord(null);
                        setShowDeleteConfirmBox(false);
                    }}
                    onOk={handleDelete}
                />
            )}
        </section>
    )
}