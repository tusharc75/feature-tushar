import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import AddIcon from "@material-ui/icons/Add";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import { GiStockpiles } from 'react-icons/gi';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import { AddOutlined, ExpandMore } from "@material-ui/icons";
import { Box, Chip, Menu, MenuItem } from "@material-ui/core";
import SearchBox from '../../components/Helpers/SearchBox'
import styles from "../Leads/Header.module.scss";
import routes from "../../components/Helpers/Routes";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import { sublease, isObjectEmpty, gridLoadingTimeout, RESOURCE_LABEL, getLocalStorageArrayData, sidebarResource } from '../../constants/helpers';
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { useData } from "../../StateProvider/Provider";
import FileCopyIcon from '@material-ui/icons/FileCopy';
import HtmlTooltip from "../../components/CustomTooltipTitle";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import useColumns, { getStaticFields, getFrameworkComponents } from "../../constants/useColumns"
import { prepareDataForGrid } from "../../constants/helpers"
import ManageSublease from "./ManageSublease";
import { AiFillCrown, MdAdd, MdSort, MdFilterList } from "react-icons/all";
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory } from "react-router-dom";
import { FaSuitcase } from "react-icons/fa";
import MobileSortDialog from "../../components/MobileSortDialog";
import MobileFilterDialog from "../../components/MobileFilterDialog"
import queryString from 'query-string';
import HideWhenOffline from "src/components/HideWhenOffline";
import { ToggleButton, ToggleButtonGroup } from "@material-ui/lab";
import { camelCase } from "lodash";

const Sublease = () => {

    const SubleaseType = [
        {
            key: `All ${routes.sublease.title}`,
            value: 1,
        },
        {
            key: `My ${routes.sublease.title}`,
            value: 2,
        },
    ];
    let renderedFrom = camelCase(routes.sublease?.title)
    const toastConfig = useContext(CustomToastContext)
    const history = useHistory();
    const { type }: any = queryString.parse(history.location.search);
    const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
    const [filter, setFilter] = useState(`All ${routes.sublease.title}`);
    const [showManageDialog, setShowManageDialog] = useState({ open: false, isClone: false, idToClone: null });
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [anchorEl, setAnchorEl] = useState(null);
    const [gridApi, setGridApi] = useState(null);
    const [sortOpen, setSortOpen] = useState(false);
    const [columns, setColumns] = useState([])
    const [frameWorkComponent, setFrameWorkComponent] = useState({})
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } = state;

    const [isOpenDialog, setisOpenDialog] = useState(false)
    const [fromRental, setFromRental] = useState(history.location?.state?.rental);
    const localStorageSelectedRecords = `${renderedFrom}_selected`

    const {
        state: { user, permissions, selectedEntity },
    }: any = useData();
    const { getColumnData } = useColumns();

    useEffect(() => {
        fetchGridColumns()
    }, [])

    useEffect(() => {
        fetchData()
    }, [page, limit, filters, sorting, search, selectedEntity, fromRental, selectedType, showFilteredRecordsOnly]);

    const fetchGridColumns = () => {
        axiosInstance()
            .get("/field?resource=Sublease")
            .then(({ data: { data } }) => {
                let columns = []
                let rendererNames = []
                data.forEach(o => {
                    let currentColumn = getColumnData(routes.sublease?.title, o?.fieldData, routes.subleaseDetail.path)
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
                    actionsRenderer: ActionsRenderer
                }
                setFrameWorkComponent({ ...tempFrameworkComponent })
                columns = [...columns, ...getStaticFields()]
                setColumns([...columns])
            })
    }

    const fetchData = () => {
        dispatch({ type: "loading", loading: true });
        if (gridApi) {
            gridApi.setRowData([]);
        }
        const queryString = getQueryString();
        axiosInstance().get(`${sublease.api}${queryString}`).then(({ data: { data, count } }) => {
            let rows = data?.map((u) => {
                let finalObject = prepareDataForGrid(u);
                finalObject["isChecked"] = selectedRecords.some(s => s._id === u._id);
                finalObject["canDelete"] = false;
                finalObject["allowedToEdit"] = (
                    [...(u.collaborator ?? []), u.owner].some(
                        (d) => d?.optionValue === user?.user?._id
                    )
                );
                let res = {
                    ...finalObject,
                };
                return res;
            });
            if (appendRows) {
                dispatch({
                    type: "initialize", data: [...dataRows, ...rows],
                    count: count, selectedRecords: [...dataRows, ...rows].filter(f => f.isChecked === true)
                });
            } else {
                dispatch({
                    type: "initialize", data: rows, count: count,
                    selectedRecords: rows.filter(f => f.isChecked === true)
                });
            }
            setTimeout(() => {
                dispatch({ type: "loading", loading: false });
            }, gridLoadingTimeout);

        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const getQueryString = (isExport = false) => {
        let deepFilter = `?page=${page}&limit=${limit}&filterSublease=${selectedType}`;
        let filterById = [];
        if (isExport) {
            deepFilter = `filterSublease=${selectedType}`;
        }
        if (fromRental) {
            filterById.push({ field: "rentalJob", term: fromRental?._id });
        }
        if (filterById.length > 0) {
            deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterById)}`
        }
        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];
            Object.keys(filters).forEach(field => {
                updatedFilters.push({
                    field: replaceFieldName(field),
                    term: filters[field].filter
                })
            });
            deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(updatedFilters))}&filterType=and`
        }
        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`
        }
        if (search) {
            deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
        }
        if (showFilteredRecordsOnly) {
            const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
            deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map(m => m._id))}`;
        }
        return deepFilter;
    };

    const handleDelete = () => {
        let ids = []
        if (deleteRecord) {
            ids.push(deleteRecord._id)
        }
        else {
            ids = selectedRecords.map(d => d._id);
        }
        axiosInstance().put(`${sublease.api}/remove`, { "ids": ids }).then(() => {
            fetchData();
            setShowDeleteConfirmBox(false)
            setDeleteRecord(null)
            setAnchorEl(null)
        }).catch((error) => {
            toastConfig.setToastConfig(error)
        });
    }
    const handleSubleaseTypeSel = (filterValues) => {
        setSelectedType(filterValues);
        history.push(`?type=${filterValues}`)
    }

    const handleFilter = (event, newFilter) => {
        if (newFilter != null) {
            setFilter(newFilter);
            handleSubleaseTypeSel(SubleaseType.find((d) => d.key === newFilter).value);

        }
    };

    const ActionsRenderer = params => (
        <>
            {
                permissions?.sublease?.isCreate &&
                <HtmlTooltip title="Clone">
                    <IconButton
                        size="small"
                        aria-label="Clone"
                        onClick={() => {
                            setShowManageDialog({ open: true, isClone: true, idToClone: params.data._id });
                        }}
                    >
                        <FileCopyIcon color="primary" />
                    </IconButton>
                </HtmlTooltip>
            }
            {/* {permissions?.sublease?.isDelete &&
                <HtmlTooltip title="Delete">
                    <IconButton size="small" aria-label="Delete" onClick={() => {
                        setDeleteRecord(params.data);
                        setShowDeleteConfirmBox(true)
                    }} >
                        <DeleteIcon color="error" />
                    </IconButton>
                </HtmlTooltip >
            } */}
        </>
    )

    const handleSearch = (e) => {
        dispatch({ type: "search", search: e.target.value });
    };

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const replaceFieldName = (field) => {
        switch (field) {
            case "createdBy":
                return "createdBy.user.concatedName";

            case "updatedBy":
                return "updatedBy.user.concatedName";

            default:
                return field;
        }
    };

    const handleOpen = () => {
        setisOpenDialog(true);
    };

    const handleClickOpen = () => {
        setSortOpen(true);
    };

    const handleClickClose = () => {
        setSortOpen(false);

    };

    const handleFilterClose = () => {
        setisOpenDialog(false);
    };


    return (<Fragment>
        <Grid container className="headerbox">
            <Grid item md={4} sm={11} xs={10}>
                <CustomBreadCrumbs routes={[routes.sublease]} />
            </Grid>
            <Grid item md={8} sm={1} xs={2}>
                <ImportExportLinks
                    permissions={permissions?.sublease}
                    module="purchase order"
                    api={sublease.api}
                    afterImportCompleted={() => {
                        fetchData();
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
                        if (gridApi) gridApi.deselectAll()
                        else fetchData()
                    }}
                    additionalParams={getQueryString(true)}
                />
            </Grid>
        </Grid>
        <div className="main-container">
            <div className="header-panel">
                <Grid container className={styles.filter_side_container}>
                    <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : "d-flex align-items-center gap-1"}>
                        <div className="d-flex align-items-center">
                            <GiStockpiles size={20} style={{ paddingBottom: "3px" }} className="headerLogo" />
                            <span className="listingHeader">{routes.sublease?.title} </span>
                        </div>
                        {isMobile ? (
                            <>
                                <Grid style={{ display: 'inline-flex' }}>
                                    <Button
                                        onClick={handleClickOpen}
                                        id="demo-customized-button"
                                        aria-controls="demo-customized-menu"
                                        aria-haspopup="true"
                                        aria-expanded={'true'}
                                        color="secondary"
                                        variant="text"
                                        disableElevation
                                        startIcon={<MdSort />}
                                        className={'sort-filter-tablet'}
                                        style={isTablet ? { marginLeft: '50px' } : {}}
                                    >
                                        Sort
                                    </Button>
                                    <MobileSortDialog
                                        isOpen={sortOpen}
                                        handleClose={handleClickClose}
                                        contentPart={null}
                                        secHeading={['Sort Purchase Order']}
                                        columns={columns}
                                        dispatch={dispatch}
                                    />

                                    <Button
                                        id="demo-customized-button"
                                        aria-controls="demo-customized-menu"
                                        aria-haspopup="true"
                                        aria-expanded={'true'}
                                        variant="text"
                                        color="secondary"
                                        disableElevation
                                        className={'sort-filter-tablet'}
                                        startIcon={<MdFilterList />}
                                        onClick={handleOpen}
                                    >
                                        Filter
                                    </Button>

                                    <MobileFilterDialog
                                        isOpen={isOpenDialog}
                                        handleClose={handleFilterClose}
                                        contentPart={null}
                                        columns={columns}
                                        dispatch={dispatch}
                                        title={routes?.sublease?.title}
                                        filters={filters}
                                    />
                                </Grid>
                            </>
                        ) :
                            <HideWhenOffline>
                                <div className={`align-items-center gap-1 layout-for-mobile `}>
                                    {SubleaseType && (
                                        <ToggleButtonGroup size="small" className="ml-2" value={SubleaseType[selectedType - 1].key} exclusive onChange={handleFilter}>
                                            {SubleaseType.map((k, index) => {
                                                return (
                                                    <ToggleButton value={k.key} key={index}>
                                                        {k.key}
                                                    </ToggleButton>
                                                );
                                            })}
                                        </ToggleButtonGroup>
                                    )}
                                </div>
                            </HideWhenOffline>
                        }
                        {fromRental && (
                            <Chip
                                className="ml-3"
                                color="primary"
                                label={`Rental Job : ${fromRental?.rentalJobName}`}
                                onDelete={() => {
                                    setFromRental(null);
                                }}
                            />
                        )}
                    </Grid>
                    <Grid xs={12} sm={12} md={6} container className={styles.filter_side} >
                        <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div" >
                            <Grid style={{ display: "flex", flex: 1, gap: "5px" }} className={styles.content_box}>
                                <SearchBox
                                    onSearch={handleSearch}
                                    searchbox={isMobile ? styles.search_box_input : ""}
                                    width="242px"
                                    size="small"
                                    value={search}
                                    style={isMobile ? { flex: 1 } : {}}
                                />
                            </Grid>
                            <Grid style={{ display: "flex", gap: "5px" }}>
                                {permissions?.sublease?.isCreate &&
                                    <Button onClick={() => {
                                        setShowManageDialog({ open: true, isClone: false, idToClone: null })
                                    }} variant={isMobile && !isTablet ? "text" : "contained"} size="small" color="primary" className={isMobile && !isTablet ? "mobile_button" : styles.add_submit_btn}
                                        startIcon={isMobile && !isTablet ? null : <AddOutlined />}> {isMobile && !isTablet ? <MdAdd size={23} /> : "Add"}</Button>
                                }
                                <Menu
                                    anchorEl={anchorEl}
                                    keepMounted
                                    getContentAnchorEl={null}
                                    anchorOrigin={{
                                        vertical: "bottom",
                                        horizontal: "left",
                                    }}
                                    id="action-menu"
                                    open={Boolean(anchorEl)}
                                    onClose={closeActions}
                                >
                                    {permissions?.sublease?.isDelete && <MenuItem onClick={() => {
                                        closeActions()
                                        setShowDeleteConfirmBox(true)
                                    }}>Delete</MenuItem>}
                                </Menu>
                            </Grid>
                        </Box>
                    </Grid>
                </Grid>
            </div>
            {columns ?
                Object.keys(frameWorkComponent).length > 0 ?
                    isMobile && !isTablet ?
                        <CustomSwipableList
                            allowSelection={true}
                            allowSwipe={true}
                            permissions={permissions.sublease}
                            primaryField={columns?.find(d => d.primaryField)}
                            onClick={(data) => {
                                history.push(`${routes.subleaseDetail.path}/${data._id}`)
                            }}
                            dataRows={dataRows}
                            selectedRecords={selectedRecords}
                            dispatch={dispatch}
                            onEdit={(data) => {
                                history.push(`${routes.subleaseDetail.path}/${data._id}?openEdit=true`)
                            }}
                            extraParamsToCheckDelete={true}
                            onDelete={(data) => {
                                setDeleteRecord(data);
                                setShowDeleteConfirmBox(true)
                            }}
                            rowCount={rowCount}
                            page={page}
                            loading={loading}
                            additionalDetails={[
                                {
                                    icon: <FaSuitcase size={18} />,
                                    field: 'supplierAccount'
                                }
                            ]}
                            chips={[
                                {
                                    label: "Status: ",
                                    field: "status",
                                },
                            ]}
                            onCreate={false}
                            showClone={true}
                            onClone={(data) => { setShowManageDialog({ open: true, isClone: true, idToClone: data._id }); }}
                            renderedFrom={renderedFrom}
                        /> :
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
                            showFilters={true}
                            resource={sidebarResource.sublease}
                        /> : null
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
        </div>
        {
            showManageDialog.open &&
            <ManageSublease
                isClone={showManageDialog.isClone}
                subleaseId={showManageDialog.idToClone}
                onClose={() => setShowManageDialog({ open: false, isClone: false, idToClone: null })}
                onSuccess={() => {
                    setShowManageDialog({ open: false, isClone: false, idToClone: null });
                    fetchData()
                }}
            />
        }
        {
            showDeleteConfirmBox &&
            <ConfirmationDialog
                open={showDeleteConfirmBox}
                message={`Are you sure you want to delete the ${routes.sublease?.title} ? `}
                onClose={() => {
                    setDeleteRecord(null);
                    setShowDeleteConfirmBox(false)
                }}
                onOk={handleDelete}
            />
        }
    </Fragment >
    );
}

export default Sublease;
