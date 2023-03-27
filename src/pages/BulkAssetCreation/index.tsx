import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from "src/components/CustomBreadCrumbs";
import AddIcon from "@material-ui/icons/Add";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "src/axios/axiosInstance";
import { GiStockpiles } from 'react-icons/gi';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog'
import { AddOutlined, ExpandMore } from "@material-ui/icons";
import { Box, Chip, Menu, MenuItem } from "@material-ui/core";
import SearchBox from 'src/components/Helpers/SearchBox'
import styles from "../Leads/Header.module.scss";
import routes from "src/components/Helpers/Routes";
import CustomAgGrid, { reducer, intialState } from "src/components/AgGridComponents/CustomAgGrid";
import { bulkAssetCreation, isObjectEmpty, gridLoadingTimeout, getLocalStorageArrayData, RESOURCE_LABEL } from 'src/constants/helpers';
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import { useData } from "src/StateProvider/Provider";
import FileCopyIcon from '@material-ui/icons/FileCopy';
import HtmlTooltip from "src/components/CustomTooltipTitle";
import ImportExportLinks from "src/components/Helpers/ImportExportLinks";
import useColumns, { getStaticFields, getFrameworkComponents } from "src/constants/useColumns"
import { prepareDataForGrid } from "src/constants/helpers"
import ManageBulkAssetCreation from "./ManageBulkAssetCreation";
import { AiFillCrown, MdAdd, MdSort, MdFilterList } from "react-icons/all";
import CustomSwipableList from "src/components/SwipableListComponents/CustomSwipableList";
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory } from "react-router-dom";
import { FaSuitcase } from "react-icons/fa";
import MobileSortDialog from "src/components/MobileSortDialog";
import MobileFilterDialog from "src/components/MobileFilterDialog"
import { camelCase } from "lodash";
import HideWhenOffline from "src/components/HideWhenOffline";
import { ToggleButton, ToggleButtonGroup } from "@material-ui/lab";
import queryString from 'query-string';

const BulkAssetCreation = () => {
    const BulkAssetCreationType = [
        {
            key: `All ${routes.bulkAssetCreation.title}`,
            value: 1,
        },
        {
            key: `My ${routes.bulkAssetCreation.title}`,
            value: 2,
        },
    ];
    let renderedFrom = camelCase(routes.bulkAssetCreation?.title)
    const toastConfig = useContext(CustomToastContext)
    const history = useHistory();
    const [showManageBulkAssetCreationDialog, setShowManageBulkAssetCreationDialog] = useState({ open: false, isClone: false, idToClone: null });
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [anchorEl, setAnchorEl] = useState(null);
    const [gridApi, setGridApi] = useState(null);
    const [sortOpen, setSortOpen] = useState(false);
    const [columns, setColumns] = useState([])
    const [frameWorkComponent, setFrameWorkComponent] = useState({})
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } = state;
    const localStorageSelectedRecords = `${renderedFrom}_selected`;
    const [isOpenDialog, setisOpenDialog] = useState(false)
    const { type }: any = queryString.parse(history.location.search);
    const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);

    const [fromRental, setFromRental] = useState(history.location?.state?.rental);

    const {
        state: { user, permissions, selectedEntity },
    }: any = useData();
    const { getColumnData } = useColumns();

    useEffect(() => {
        fetchGridColumns()
    }, [])

    useEffect(() => {
        fetchBulkAssetCreation()
    }, [page, limit, filters, sorting, search, selectedEntity, fromRental, selectedType, showFilteredRecordsOnly]);

    const fetchGridColumns = () => {
        axiosInstance()
            .get("/field?resource=Bulk Asset Creation")
            .then(({ data: { data } }) => {
                let columns = []
                let rendererNames = []
                data.forEach(o => {
                    let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.bulkAssetCreationDetail.path)

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

    const fetchBulkAssetCreation = () => {
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
        }

        const queryString = getQueryString();
        axiosInstance().get(`${bulkAssetCreation.api}${queryString}`).then(({ data: { data, count } }) => {
            let rows = data?.map((u) => {
                let finalObject = prepareDataForGrid(u);
                finalObject["isChecked"] = selectedRecords.some(s => s._id === u._id);
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
            dispatch({ type: "initialize", data: rows, count: count });
            setTimeout(() => {
                dispatch({ type: "loading", loading: false });
            }, gridLoadingTimeout);

        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const getQueryString = (isExport = false) => {
        let deepFilter = `?page=${page}&limit=${limit}&filterBulkAssetCreation=${selectedType}`;
        let filterById = [];
        if (isExport) {
            deepFilter = `filterBulkAssetCreation=${selectedType}`;
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

    const columnState = JSON.parse(localStorage.getItem(renderedFrom));


    if (columnState) {
        columns.map((item) => {
            columnState.map((d) => {
                if (d.colId == item.field) {
                    item.show = !d.hide;
                }
            });
        });
    }



    const handleDelete = () => {
        let ids = []
        if (deleteRecord) {
            ids.push(deleteRecord._id)
        }
        else {
            ids = selectedRecords.map(d => d._id);
        }
        axiosInstance().put(`${bulkAssetCreation.api}/remove`, { "ids": ids }).then(() => {
            fetchBulkAssetCreation();
            setShowDeleteConfirmBox(false)
            setDeleteRecord(null)
            setAnchorEl(null)
        }).catch((error) => {
            toastConfig.setToastConfig(error)
        });
    }

    const ActionsRenderer = params => (
        <>
            {
                permissions?.bulkAssetCreation?.isCreate &&
                <HtmlTooltip title="Clone">
                    <IconButton
                        size="small"
                        aria-label="Clone"
                        onClick={() => {
                            setShowManageBulkAssetCreationDialog({ open: true, isClone: true, idToClone: params.data._id });
                        }}
                    >
                        <FileCopyIcon color="primary" />
                    </IconButton>
                </HtmlTooltip>
            }
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

    const handleBulkAssetCreationType = (filterValues) => {
        setSelectedType(filterValues);
        history.push(`?type=${filterValues}`)
    }

    const handleFilter = (event, newFilter) => {
        if (newFilter != null) {
            handleBulkAssetCreationType(BulkAssetCreationType.find((d) => d.key === newFilter).value);

        }
    };

    return (<Fragment>
        <Grid container className="headerbox">
            <Grid item md={4} sm={11} xs={10}>
                <CustomBreadCrumbs routes={[routes.bulkAssetCreation]} />
            </Grid>
            <Grid item md={8} sm={1} xs={2}>
                <ImportExportLinks
                    permissions={permissions?.bulkAssetCreation}
                    module="bulk assets creation "
                    api={bulkAssetCreation.api}
                    afterImportCompleted={() => {
                        fetchBulkAssetCreation();
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
                        else fetchBulkAssetCreation()
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
                            <span className="listingHeader">{routes.bulkAssetCreation?.title} </span>
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
                                        title={routes?.bulkAssetCreation?.title}
                                        filters={filters}
                                    />
                                </Grid>
                            </>
                        ) :
                            <HideWhenOffline>
                                <div className={`align-items-center gap-1 layout-for-mobile `}>
                                    {BulkAssetCreationType && (
                                        <ToggleButtonGroup size="small" className="ml-2" value={BulkAssetCreationType[selectedType - 1].key} exclusive onChange={handleFilter}>
                                            {BulkAssetCreationType.map((k, index) => {
                                                return (
                                                    <ToggleButton value={k.key} key={index}>
                                                        {k.key}
                                                    </ToggleButton>
                                                );
                                            })}
                                        </ToggleButtonGroup>
                                    )}
                                </div>
                            </HideWhenOffline>}
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
                                {permissions?.bulkAssetCreation?.isCreate &&
                                    <Button onClick={() => {
                                        setShowManageBulkAssetCreationDialog({ open: true, isClone: false, idToClone: null })
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
                                    {permissions?.bulkAssetCreation?.isDelete && <MenuItem onClick={() => {
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
                            permissions={permissions.bulkAssetCreation}
                            primaryField={columns?.find(d => d.primaryField)}
                            onClick={(data) => {
                                history.push(`${routes.bulkAssetCreationDetail.path}/${data._id}`)
                            }}
                            dataRows={dataRows}
                            selectedRecords={selectedRecords}
                            dispatch={dispatch}
                            onEdit={(data) => {
                                history.push(`${routes.bulkAssetCreationDetail.path}/${data._id}?openEdit=true`)
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
                            onClone={(data) => { setShowManageBulkAssetCreationDialog({ open: true, isClone: true, idToClone: data._id }); }}
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
                            refreshGrid={fetchBulkAssetCreation}
                            showOnlyShowFilteredRecordSwitch={true}
                            showFilters={true}
                            resource={RESOURCE_LABEL.bulkAssetCreation}
                        /> : null
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
        </div>
        {
            showManageBulkAssetCreationDialog.open &&
            <ManageBulkAssetCreation
                isClone={showManageBulkAssetCreationDialog.isClone}
                bulkAssetCreationId={showManageBulkAssetCreationDialog.idToClone}
                onClose={() => setShowManageBulkAssetCreationDialog({ open: false, isClone: false, idToClone: null })}
                onSuccess={() => {
                    setShowManageBulkAssetCreationDialog({ open: false, isClone: false, idToClone: null });
                    fetchBulkAssetCreation()
                }}
            />
        }
        {
            showDeleteConfirmBox &&
            <ConfirmationDialog
                open={showDeleteConfirmBox}
                message={`Are you sure you want to delete the ${routes?.bulkAssetCreation?.title?.toLowerCase()} ${deleteRecord?._id ? deleteRecord?.assetNumber : ""} ? `}
                onClose={() => {
                    setDeleteRecord(null)
                    setShowDeleteConfirmBox(false)
                }}
                onOk={handleDelete}
            />
        }
    </Fragment >
    );
}

export default BulkAssetCreation;
