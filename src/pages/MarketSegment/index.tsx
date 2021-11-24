import { useState, useEffect, Fragment, useContext, useReducer } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import AddIcon from "@material-ui/icons/Add";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import { GiAbstract055 } from 'react-icons/gi';
import styles from "../Leads/Header.module.scss";
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import CustomContainer from "../../components/CustomContainer";
import CreateMarketSegment from "./ManageMarketSegmentDialog";
import routes from "../../components/Helpers/Routes";
import { ExpandMore } from "@material-ui/icons";
import { Box, Menu, MenuItem } from "@material-ui/core";
import SearchBox from '../../components/Helpers/SearchBox'
import {
    gridLoadingTimeout,
    isObjectEmpty,
    marketSegment
} from "../../constants/helpers";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import CustomRenderCell from "../../components/Helpers/CustomRenderCell";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import { useData } from "../../StateProvider/Provider";
import FileCopyIcon from '@material-ui/icons/FileCopy';
import queryString from "query-string";
import useColumns, {getStaticFields, getFrameworkComponents } from "../../constants/useColumns"
import { prepareDataForGrid } from "../../constants/helpers"
import { useLocation, useHistory } from "react-router-dom";
import { isMobile } from 'react-device-detect';
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";

const MarketSegment = () => {

    const location = useLocation()
    const history = useHistory()
    const toastConfig = useContext(CustomToastContext)
    const {
        state: { permissions },
    }: any = useData();
    const {getColumnData} = useColumns();

    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [open, setOpen] = useState({ open: false, isClone: false, idToClone: null });
    const [anchorEl, setAnchorEl] = useState(null);
    const [columns, setColumns] = useState([])
    const [frameWorkComponent, setFrameWorkComponent] = useState({})

    // const [selectedCategory, setSelectedCategory] = useState([]);

    //  Grid Variables - Start
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    // const [showGridFilters, setShowGridFilters] = useState(true)
    const columnState = JSON.parse(localStorage.getItem(routes.marketSegment.title));

    useEffect(() => {
        const parsedParams = queryString.parse(location?.search);
        if (parsedParams?.id) {
            setOpen({ open: true, isClone: false, idToClone: parsedParams?.id });
        }
    }, [location])
    //  Grid Variables - End

    useEffect(() => {
        fetchMarketSegment()
    }, [page, limit, filters, sorting, search])

    useEffect(() => {
        fetchGridColumns()
    }, [])

    const fetchGridColumns = () => {
        axiosInstance()
            .get(`/field?resource=Market Segment`)
            .then(({ data: { data } }) => {
                let columns = []
                let rendererNames = []
                data.forEach(o => {
                    if (o?.fieldData?.primaryField === true) {
                        columns = [...columns,
                        { field: o?.fieldData?.fieldName, headerName: o?.fieldData?.fieldLabel, show: true, disabled: true, cellRenderer: "nameRenderer" },]
                    }
                    else {
                        let currentColumn = getColumnData(routes.marketSegment.title, o?.fieldData, routes.marketSegment.path)

                        if (currentColumn !== null) {
                            columns = [...columns, currentColumn?.columnData]
                            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                                rendererNames.push(currentColumn?.rendererName)
                            }
                        }
                    }
                })
                let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
                tempFrameworkComponent = {
                    ...tempFrameworkComponent,
                    nameRenderer: NameRenderer,
                    actionsRenderer: ActionsRenderer
                }
                setFrameWorkComponent({ ...tempFrameworkComponent })
                columns = [...columns, ...getStaticFields()]

                if (columnState) {
                    columns.map((item) => {
                        columnState.map((d) => {
                            if (d.colId == item.field) {
                                item.show = !d.hide;
                            }
                        });
                    });
                }

                setColumns([...columns])
            })
    }


    const NameRenderer = params => <span className="d-flex gap-2 align-items-center">
        <span className="link" onClick={() => {
            setOpen({ open: true, isClone: false, idToClone: params.data.id });
        }}>
            <CustomRenderCell value={params.value} />
        </span>

    </span >

    const ActionsRenderer = params => <Fragment>
        <Tooltip
            className={permissions.marketSegment.isCreate ? "" : "cursor-stop"}
            title={permissions.marketSegment.isCreate ? "Clone" : "You do not have permission to clone/create"} >
            <IconButton
                size="small"
                aria-label="Clone"
                onClick={() => {
                    setOpen({ open: true, idToClone: params.data._id, isClone: true })
                }}>
                <FileCopyIcon fontSize="small" color="primary" />
            </IconButton>
        </Tooltip>
        {permissions.marketSegment.isDelete ?
            <Tooltip title="Delete" >
                <IconButton aria-label="Delete" onClick={() => {
                    setDeleteRecord(params.data);
                    setShowDeleteConfirmBox(true)
                }}>
                    <DeleteIcon
                        fontSize="small" color="error" />
                </IconButton>
            </Tooltip> :
            <Tooltip className="cursor-stop" title={`You do not have permission to delete `}>
                <IconButton aria-label="Delete">
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        }
    </Fragment>

    const replaceFieldName = (field) => {
        switch (field) {
            case "createdBy":
                return "createdBy.user.concatedName";

            case "updatedBy":
                return "updatedBy.user.concatedName";

            case "parentMarketSegmentName":
                return "parentMarketSegment.optionLabel";

            default:
                return field;
        }
    }

    const getQueryString = () => {
        let deepFilter = `?page=${page}&limit=${limit}`;

        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];

            Object.keys(filters).forEach(field => {
                updatedFilters.push({
                    field: replaceFieldName(field),
                    term: filters[field].filter
                })
            });
            deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`
        }

        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${replaceFieldName(sorting[0].colId)}&orderBy=${sorting[0].sort}`
        }

        if (search) {
            deepFilter = `${deepFilter}&search=${search}`;
        }

        return deepFilter;
    };


    const fetchMarketSegment = () => {
        dispatch({ type: "loading", loading: true });
        const queryString = getQueryString();

        if (gridApi) {
            gridApi.setRowData([]);
        }

        axiosInstance().get(`${marketSegment.marketSegmentApi}${queryString}`).then(({ data: { data, count } }) => {

            let rows = data.map((u) => {
                return prepareDataForGrid(u);
            });

            dispatch({ type: "initialize", data: rows, count: count });
            setTimeout(() => {
                dispatch({ type: "loading", loading: false });
            }, gridLoadingTimeout);

        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };




    const handleDelete = () => {
        let ids = []
        if (deleteRecord) {
            ids.push(deleteRecord._id)
        }
        else {
            ids = selectedRecords.map(m => m._id);
        }
        axiosInstance().put(`${marketSegment.marketSegmentApi}/remove`, { "ids": ids }).then(() => {
            fetchMarketSegment();
            setShowDeleteConfirmBox(false)
            setDeleteRecord(null)
            // setSelectedCategory([])
            setAnchorEl(null)
        }).catch((error) => {
            toastConfig.setToastConfig(error)
        });
    }

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const handleSearch = (e) => {
        dispatch({ type: "search", search: e.target.value });
    };

    return (<Fragment>
        <Grid container className="headerbox">
            <Grid item md={4} sm={11} xs={10}>
                <CustomBreadCrumbs routes={[{ title: routes.marketSegment.title }]} />
            </Grid>
            <Grid item md={8} sm={1} xs={2}>
                <ImportExportLinks
                    permissions={permissions.marketSegment}
                    module="market segment"
                    api={"market-segment"}
                    afterImportCompleted={() => {
                        fetchMarketSegment();
                    }}
                />
            </Grid>
        </Grid>
        <CustomContainer>
            <div className="header-panel">
                <Grid container className={styles.filter_side_container}>
                    <Grid item md={6} sm={6} xs={12} className="d-flex align-items-center gap-1">
                        <GiAbstract055 /> <span className="listingHeader">{routes.marketSegment.title}</span>
                    </Grid>
                    <Grid md={6} sm={6} xs={12} container className={styles.filter_side}>
                        <Box className={styles.filter_side_header} component="div" >
                            <SearchBox
                                onSearch={handleSearch}
                                searchbox={styles.search_box_input}
                                width="242px"
                                size="small"
                                value={search}
                            />
                            {permissions.marketSegment.isCreate &&
                                <Button className={styles.add_submit_btn} onClick={() => {
                                    setOpen({ open: true, isClone: false, idToClone: null });
                                }} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
                            }
                            {permissions.marketSegment.isDelete &&
                                <Button
                                    className={styles.action_submit_btn}
                                    variant="outlined"
                                    color="default"
                                    size="small"
                                    onClick={openActions}
                                    disabled={selectedRecords.length ? false : true}
                                    aria-controls="action-menu"
                                >Actions <ExpandMore />
                                </Button>
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
                                <MenuItem onClick={() => setShowDeleteConfirmBox(true)}>Delete</MenuItem>
                            </Menu>
                        </Box>
                    </Grid>
                </Grid>
            </div>

            {isMobile ?
                <CustomSwipableList
                    allowSelection={true}
                    allowSwipe={true}
                    permissions={permissions.marketSegment}
                    primaryField={columns?.find(d => d.field === "name")}
                    onClick={(d) => {
                        setOpen({ open: true, isClone: false, idToClone: d.id });
                    }}
                    dataRows={dataRows}
                    selectedRecords={selectedRecords}
                    dispatch={dispatch}
                    onEdit={(d) => {

                    }}
                    extraParamsToCheckDelete={true}
                    onDelete={(d) => {
                        setDeleteRecord(d)
                        setShowDeleteConfirmBox(true)
                    }}
                    rowCount={rowCount}
                    page={page}
                    loading={loading}
                    additionalDetails={[]}
                    chips={[]}
                    owerCollaboratorInitialsOrImages=""
                    onCreate={() => setOpen({ open: true, idToClone: null, isClone: null })}
                    showClone={false}
                    onClone={() => { }}
                    renderedFrom={marketSegment.marketSegmentResource}

                />
                :
                Object.keys(frameWorkComponent).length > 0 ?
                    <CustomAgGrid columns={columns} dataRows={dataRows} frameworkComponents={frameWorkComponent} setGridApi={setGridApi}
                        dispatch={dispatch} rowCount={rowCount} limit={limit} pageSizes={pageSizes} page={page} actionWidth={100}
                        loading={loading} renderedFrom={routes.marketSegment.title}
                        refreshGrid={fetchMarketSegment}
                    /> : null
            }

            {showDeleteConfirmBox &&
                <ConfirmationDialog
                    open={showDeleteConfirmBox}
                    message={`Are you sure you want to delete market segment  ${deleteRecord?._id ? deleteRecord?.name : ""}?`}
                    onClose={() => setShowDeleteConfirmBox(false)}
                    onOk={handleDelete}
                />
            }
            {open?.open &&
                <CreateMarketSegment
                    marketSegmentId={open?.idToClone}
                    onClose={() => setOpen({ open: false, isClone: false, idToClone: null })}
                    onSuccess={() => {
                        setOpen({ open: false, isClone: false, idToClone: null });
                        fetchMarketSegment()
                    }}
                    isClone={open.isClone}
                />}
        </CustomContainer>
    </Fragment>
    );
}

export default MarketSegment;
