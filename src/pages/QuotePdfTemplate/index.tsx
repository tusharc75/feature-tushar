import React, { useState, FC, useEffect, useContext, useReducer } from "react";
import {
    Box,
    Button,
    Grid,
    IconButton,
    Link as MuiLink,
    Menu,
    MenuItem,
    Tooltip,
} from "@material-ui/core";
import { Link, useHistory } from "react-router-dom";
import { quotePdfTemplate, gridPageSizes, isObjectEmpty, gridLoadingTimeout } from "../../constants/helpers";
import axiosInstance from "../../axios/axiosInstance";
import Layout from "../../components/Layout";
import routes from "./../../components/Helpers/Routes";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import styles from "../Leads/Header.module.scss";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import AddIcon from "@material-ui/icons/Add";
import { useData } from "../../StateProvider/Provider";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import {
    CommonRenderer,
    CreatedByRenderer,
    UpdatedByRenderer
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import CustomContainer from "../../components/CustomContainer";
import DeleteIcon from '@material-ui/icons/Delete';
import { GiAbstract055 } from 'react-icons/gi';
import SearchBox from '../../components/Helpers/SearchBox'
import { ExpandMore } from "@material-ui/icons";
import FileCopyIcon from '@material-ui/icons/FileCopy';

let quotePdfTemplateTimeout;

const QuotePdfTemplate: FC = () => {

    const history = useHistory();
    const toastConfig = useContext(CustomToastContext);

    const {
        state: { user, permissions },
    }: any = useData();
    const [renderCount, setRenderCount] = useState(0);

    const [anchorEl, setAnchorEl] = useState(null);
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)
    //  Grid Variables - Start
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    // const [showGridFilters, setShowGridFilters] = useState(true)
    const columns = [
        { field: "name", headerName: "Name", show: true, disabled: true, cellRenderer: "nameRenderer" },
        { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
        { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
    ];
    //  Grid Variables - End


    const { quotePdfTemplateApi } = quotePdfTemplate;

    useEffect(() => {
        let millisec = Object.keys(search).length > 0 ? 600 : 5;
        if (quotePdfTemplateTimeout) {
            clearTimeout(quotePdfTemplateTimeout);
        }
        quotePdfTemplateTimeout = setTimeout(() => {
            fetchQuotePdfTemplate();
        }, millisec);
    }, [search]);

    useEffect(() => {
        if (renderCount > 0) {
            fetchQuotePdfTemplate();
        } else setRenderCount((preCount) => preCount + 1);
    }, [page, limit, filters, sorting]);


    const NameRenderer = params => <Link className="link"
        to={`${routes.quotePdfTemplate.path}/${params.data._id}`} title={params.value}>
        {params.value}
    </Link>;

    const ActionsRenderer = params => <>
        {permissions.quotePdfTemplate.isCreate &&
            <Tooltip title="Clone">
                <IconButton size="small" aria-label="Clone" onClick={() => CreateNew(params.data.id, true)}>
                    <FileCopyIcon color="primary" />
                </IconButton>
            </Tooltip>
        }
        {permissions.quotePdfTemplate.isDelete ?
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

    </>

    const frameworkComponents = {
        nameRenderer: NameRenderer,
        commonRenderer: CommonRenderer,
        createdByRenderer: CreatedByRenderer,
        updatedByRenderer: UpdatedByRenderer,
        actionsRenderer: ActionsRenderer,
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

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const CreateNew = (id, isClone) => {
        if (isClone) {
            history.push(routes.quotePdfTemplate.path + "/" + id, { isClone: true })
        }
        else {
            history.push(routes.quotePdfTemplate.path + "/0", { isClone: false })
        }
    }

    const handleDelete = () => {
        let ids = []
        if (deleteRecord) {
            ids.push(deleteRecord._id)
        }
        else {
            ids = selectedRecords.map(d => d._id);
        }
        axiosInstance().put(`${routes.quotePdfTemplate.path}/remove`, { "ids": ids }).then(({ data }) => {
            fetchQuotePdfTemplate();
            setShowDeleteConfirmBox(false)
            setDeleteRecord(null)
            setAnchorEl(null)
            toastConfig.setToastConfig({
                open: true,
                type: "success",
                message: data.message,
            });
        }).catch((error) => {
            toastConfig.setToastConfig(error)
        });
    }

    const getQueryString = () => {
        let deepFilter = `?page=${page}&limit=${limit}`;

        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];

            Object.keys(filters).map(field => {
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

    const fetchQuotePdfTemplate = () => {
        const queryString = getQueryString();
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
        }

        axiosInstance()
            .get(`${quotePdfTemplateApi}${queryString}`)
            .then(({ data: { data, count } }) => {

                let rows = data.map((u) => {

                    const { createdBy, updatedBy, ...restProperties } = u;

                    let res = {
                        ...restProperties,
                        id: u._id,
                        createdBy: u.createdBy?.user?.concatedName,
                        createdByDate: u.createdBy?.date,
                        updatedBy: u.updatedBy?.user?.concatedName,
                        updatedByDate: u.updatedBy?.date,
                    };
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

    }

    const handleSearch = (e) => {
        dispatch({ type: "search", search: e.target.value });
    };




    return (
        <Layout>
            <Grid container className="headerbox">
                <Grid item md={4} sm={11} xs={10}>
                    <CustomBreadCrumbs routes={[routes.quotePdfTemplate]} />
                </Grid>
            </Grid>
            <CustomContainer>
                <div className="header-panel">
                    <Grid container className={styles.filter_side_container}>
                        <Grid item md={6} sm={6} xs={12} className="d-flex align-items-center gap-1">
                            <GiAbstract055 /> <span className="listingHeader">{routes.quotePdfTemplate.title}</span>
                        </Grid>
                        <Grid md={6} sm={6} xs={12} container className={styles.filter_side}>
                            <Box className={styles.filter_side_header} component="div" >
                                <SearchBox
                                    onSearch={handleSearch}
                                    searchbox={styles.search_box_input}
                                    width="242px"
                                    value={search}
                                />
                                {permissions.quotePdfTemplate.isCreate &&
                                    <Button className={styles.add_submit_btn} onClick={() => CreateNew("0", false)} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
                                }
                                {permissions.quotePdfTemplate.isDelete &&
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
                    dispatch={dispatch} rowCount={rowCount} limit={limit} pageSizes={pageSizes} page={page} actionWidth={150}
                    loading={loading} />

                {showDeleteConfirmBox &&
                    <ConfirmationDialog
                        open={showDeleteConfirmBox}
                        message={`Are you sure, you want to delete Quote Pdf template ${deleteRecord?._id ? deleteRecord?.name : ""} ?`}
                        onClose={() => setShowDeleteConfirmBox(false)}
                        onOk={handleDelete}
                    />
                }
            </CustomContainer >
        </Layout >
    );

};

export default QuotePdfTemplate;
