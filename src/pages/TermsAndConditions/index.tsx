import React, { useContext, useEffect, useState, useReducer } from 'react';
import Layout from "../../components/Layout";
import { useData } from '../../StateProvider/Provider';
import {
    Box,
    Button,
    Menu,
    MenuItem,
    Tooltip,
    IconButton,
    Grid,
} from "@material-ui/core";
import { Link } from 'react-router-dom'
import { ExpandMore, AddOutlined } from "@material-ui/icons";
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import SearchBox from '../../components/Helpers/SearchBox'
import DeleteIcon from '@material-ui/icons/Delete';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import axiosInstance from '../../axios/axiosInstance'
import CustomContainer from "../../components/CustomContainer";
import styles from "./terms.module.scss"
import CustomHeader from '../../components/Helpers/CustomHeader'
import CustomRenderCell from '../../components/Helpers/CustomRenderCell'
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { termsAndCondition, gridPageSizes, isObjectEmpty } from '../../constants/helpers';
import ManageTermsAndCondition from './ManageTermsAndCondition'
import _ from 'lodash'
import { IoDocumentTextOutline } from 'react-icons/io5';
import { AgGridColumn } from 'ag-grid-react';
import CustomFloatingFilter from '../../components/AgGridComponents/CustomAgGridFilter'
import {
    CustomLoadingOverlay
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CustomAgGrid from "../../components/AgGridComponents/CustomAgGrid";

function reducer(state, action) {
    switch (action.type) {
        case "loading":
            return {
                ...state,
                loading: action.loading
            }

        case "initialize":
            return {
                ...state,
                dataRows: action.data,
                rowCount: action.count,
                loading: false
            }

        case "selection":
            return {
                ...state,
                selectedRecords: action.selectedRecords,
            }

        case "update":
            return {
                ...state,
                dataRows: action.data,
                loading: false
            }

        case "filter":
            return {
                ...state,
                loading: true,
                filters: action.filters,
                page: 0
            }

        case "sort":
            return {
                ...state,
                sorting: action.sorting,
                loading: true
            }

        case "search":
            return {
                ...state,
                search: action.search,
                loading: true
            }

        case "pageChange":
            return {
                ...state,
                page: action.page
            }

        case "pageSizeChange":
            return {
                ...state,
                limit: action.limit,
                page: 0,
                loading: true
            }

        case "complete":
            return {
                ...state,
                loading: false
            }

        default:
            break;
    }

    return state;
}

const intialState = {
    dataRows: [],
    rowCount: 0,
    loading: false,
    page: 0,
    limit: 25,
    pageSizes: gridPageSizes,
    search: "",
    filters: {},
    sorting: [],
    selectedRecords: []
}
let termsTimeout
export default function TermsAndCondition(props) {

    const { termsAndConditionBreadcrumb } = props
    const toastConfig = useContext(CustomToastContext);
    const { state: { permissions } }: any = useData();
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [actionsPermissions, setActionsPermissions] = useState({ isCreate: false, isRead: false, isUpdate: false, isDelete: false, approveAccount: false });
    const [deleteRec, setDeleteRec] = useState<any>({})
    const [editRecord, setEditRecord] = useState<any>({})

    const [gridApi, setGridApi] = useState(null);
    const [columnApi, setColumnApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    useEffect(() => {
        if (permissions) {
            setActionsPermissions(permissions[termsAndCondition.permission]);
        }
    }, [permissions]);

    useEffect(() => {
        fetchTermsAndConditions()
    }, [page, limit, filters, sorting, search]);

    const TermsConditionNameRenderer = params => (
        <Link className={`${styles.terms_name_link}`}
            style={{ pointerEvents: actionsPermissions.isUpdate ? "" : "none" }}
            onClick={() => {
                setShowCreateDialog(true);
                setEditRecord(_.cloneDeep(params.data))
            }}>
            <CustomRenderCell value={params?.value} />
        </Link>
    )

    const ActionsRenderer = params => (
        <>
            <Tooltip title="Delete">
                <IconButton aria-label="Delete" onClick={() => {
                    setDeleteRec(params.data);
                    setShowDeleteConfirmBox(true)
                }}
                    disabled={actionsPermissions.isDelete ? false : true}
                >
                    <DeleteIcon fontSize="small"
                        color={actionsPermissions.isDelete ? "error" : "disabled"}
                    />
                </IconButton>
            </Tooltip >
        </>
    )

    const [columns, setColumns] = useState([
        { field: "TACName", headerName: "Name", show: true, disabled: true, cellRenderer: "termsConditionNameRenderer" },
    ]);

    const handleSearch = (e) => {
        dispatch({ type: "search", search: e.target.value });
    };

    const fetchTermsAndConditions = () => {
        if (termsTimeout) {
            clearTimeout(termsTimeout);
        }

        termsTimeout = setTimeout(() => {

            if (gridApi) {
                gridApi.setRowData([]);
                gridApi.showLoadingOverlay();
            }
            const queryString = getQueryString();
            dispatch({ type: "loading", loading: true });
            axiosInstance()
                .get(`${termsAndCondition.api}${queryString}`)
                .then(({ data }) => {
                    let rows = data?.data?.map((u) => ({
                        ...u,
                        id: u._id,
                    }));
                    dispatch({ type: "initialize", data: rows, count: data.count });
                })
                .catch((err) => {
                    toastConfig.setToastConfig(err);
                    dispatch({ type: "loading", loading: false });
                });
        }, 600);
    }


    // ****** ACTIONS BUTTON STUFF *********
    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const handleDeleteTermsAndConditions = async () => {
        if (deleteRec?._id || selectedRecords.length > 0) {
            axiosInstance().put(`${termsAndCondition.api}/remove`,
                { ids: deleteRec.id ? [deleteRec.id] : selectedRecords.map(d => d._id) })
                .then(({ data }) => {
                    toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
                    setShowDeleteConfirmBox(false)
                    if (deleteRec) setDeleteRec({})
                    fetchTermsAndConditions()
                }).catch((error) => {
                    toastConfig.setToastConfig(error);
                    setShowDeleteConfirmBox(false)
                })
        }
    }

    const handleCloseCreateDialog = (params) => {
        setShowCreateDialog(false)
        setEditRecord({})
        if (params?.fetchData) fetchTermsAndConditions()
    }

    const frameworkComponents = {
        termsConditionNameRenderer: TermsConditionNameRenderer,
        actionsRenderer: ActionsRenderer,
        customLoadingOverlay: CustomLoadingOverlay,
        customFloatingFilter: CustomFloatingFilter,
        // customLoadingCellRenderer: CustomLoadingCellRenderer,
        // customNoRowsOverlay: CustomNoRowsOverlay
    };

    const getQueryString = () => {
        let deepFilter = `?page=${page}&limit=${limit}`;

        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];

            Object.keys(filters).map(field => {
                updatedFilters.push({
                    field: field,
                    term: filters[field].filter
                })
            });
            deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(updatedFilters)}&filterType=and`
        }

        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`
        }

        if (search) {
            deepFilter = `${deepFilter}&search=${search}`;
        }

        return deepFilter;
    };

    return (
        <>
            <Layout>
                <Grid container className="headerbox">
                    <CustomBreadCrumbs routes={[termsAndConditionBreadcrumb]} />
                </Grid>
                <Box component="div">
                    <CustomContainer>
                        <div className={`${styles["terms_header_inner_container"]}`} >
                            <CustomHeader
                                total={rowCount}
                                heading="Terms and Conditions"
                                secondHeading="Terms and Conditions"
                                icon={<IoDocumentTextOutline className="headerLogo" />}
                            >
                                <div className={`${styles.terms_header} ${styles["terms_header-mobile"]}`} >
                                    <SearchBox
                                        onSearch={handleSearch}
                                        searchbox="terms_header_search_bar"
                                        width="300px"
                                        value={search}
                                    />
                                    <div className={`${styles.terms_header_add_btn_action_btn_group}`}>
                                        {
                                            actionsPermissions.isCreate && <Button
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                className={`${styles.terms_header_add_btn}`}
                                                onClick={() => setShowCreateDialog(true)}
                                                startIcon={<AddOutlined />} >Add</Button>
                                        }

                                        <Button
                                            disabled={selectedRecords.length === 0}
                                            variant="outlined"
                                            color="default"
                                            size="small"
                                            className={`${styles.terms_header_action_btn}`}
                                            onClick={openActions}
                                            aria-controls="action-menu"
                                        >
                                            Actions <ExpandMore />
                                        </Button>
                                        <Menu
                                            anchorEl={anchorEl}
                                            keepMounted
                                            getContentAnchorEl={null}
                                            anchorOrigin={{
                                                vertical: "bottom",
                                                horizontal: "left"
                                            }}
                                            id="action-menu"
                                            open={Boolean(anchorEl)}
                                            onClose={closeActions}>
                                            {
                                                actionsPermissions.isDelete &&
                                                <MenuItem
                                                    onClick={() => {
                                                        closeActions();
                                                        setShowDeleteConfirmBox(true);
                                                    }}>Delete</MenuItem>
                                            }

                                        </Menu>

                                    </div>
                                </div>
                            </CustomHeader>
                        </div>
                        <CustomAgGrid
                            columns={columns}
                            dataRows={dataRows}
                            frameworkComponents={frameworkComponents}
                            setGridApi={setGridApi}
                            dispatch={dispatch}
                            rowCount={rowCount}
                            limit={limit}
                            pageSizes={pageSizes}
                            page={page}
                            actionWidth={150} />

                        {
                            showDeleteConfirmBox ?
                                <ConfirmationDialog
                                    open={showDeleteConfirmBox}
                                    message={`Are you sure, you want to delete selected TermsAndCondition  ${deleteRec?._id ? deleteRec?.TACName : ""} ?`}
                                    onClose={() => setShowDeleteConfirmBox(false)}
                                    onOk={handleDeleteTermsAndConditions}
                                /> : null
                        }
                        {showCreateDialog ? (
                            <ManageTermsAndCondition
                                termsAndCondition={termsAndCondition}
                                open={showCreateDialog}
                                handleClose={handleCloseCreateDialog}
                                fetchData={fetchTermsAndConditions}
                                editRecord={editRecord}
                            />
                        ) : null}
                    </CustomContainer>
                </Box>
            </Layout>

        </>
    )
}
