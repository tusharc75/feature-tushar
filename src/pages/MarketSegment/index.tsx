import React, { useState, useEffect, Fragment, useContext, useReducer } from "react";
import Grid from '@material-ui/core/Grid';
import Layout from "../../components/Layout";
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
    gridPageSizes,
    isObjectEmpty,
    marketSegment
} from "../../constants/helpers";
import {
    CreatedByRenderer,
    UpdatedByRenderer
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import CustomRenderCell from "../../components/Helpers/CustomRenderCell";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import { useData } from "../../StateProvider/Provider";


const MarketSegment = () => {

    const toastConfig = useContext(CustomToastContext)
    const {
        state: { permissions },
    }: any = useData();

    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [open, setOpen] = useState(false);
    const [marketSegmentId, setMarketSegmentId] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    // const [selectedCategory, setSelectedCategory] = useState([]);

    //  Grid Variables - Start
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    // const [showGridFilters, setShowGridFilters] = useState(true)
    const columns = [
        { field: "name", headerName: "Market Segment", show: true, disabled: true, cellRenderer: "nameRenderer" },
        { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
        { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
    ];
    //  Grid Variables - End

    useEffect(() => {
        fetchMarketSegment()
    }, [page, limit, filters, sorting, search])

    const NameRenderer = params => <span className="d-flex gap-2 align-items-center">
        <span className="link" onClick={() => {
            setMarketSegmentId(params.data.id);
            setOpen(true);
        }}>
            <CustomRenderCell value={params.value} />
        </span>
    </span>

    const ActionsRenderer = params => <Fragment>
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

    const frameworkComponents = {
        nameRenderer: NameRenderer,
        createdByRenderer: CreatedByRenderer,
        updatedByRenderer: UpdatedByRenderer,
        actionsRenderer: ActionsRenderer
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
            deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(updatedFilters)}&filterType=and`
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
                const { createdBy, updatedBy, ...restProperties } = u;

                let res = {
                    ...restProperties,
                    id: u._id,

                    createdBy: u.createdBy?.user?.concatedName,
                    createdByDate: u.createdBy?.date,
                    updatedBy: u.updatedBy?.user?.concatedName,
                    updatedByDate: u.updatedBy?.date,
                }

                return res;
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

    return (<Layout>
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
                                <Button className={styles.add_submit_btn} onClick={() => { setMarketSegmentId(null); setOpen(true); }} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
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

            <CustomAgGrid columns={columns} dataRows={dataRows} frameworkComponents={frameworkComponents} setGridApi={setGridApi}
                dispatch={dispatch} rowCount={rowCount} limit={limit} pageSizes={pageSizes} page={page} actionWidth={100}
                loading={loading} />

            {showDeleteConfirmBox &&
                <ConfirmationDialog
                    open={showDeleteConfirmBox}
                    message={`Are you sure you want to delete market segment  ${deleteRecord?._id ? deleteRecord?.name : ""}?`}
                    onClose={() => setShowDeleteConfirmBox(false)}
                    onOk={handleDelete}
                />
            }
            {open && <CreateMarketSegment marketSegmentId={marketSegmentId} handleClose={() => { setOpen(false); fetchMarketSegment() }} />}
        </CustomContainer>
    </Layout>
    );
}

export default MarketSegment;
