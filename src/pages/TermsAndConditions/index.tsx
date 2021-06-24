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
import { ExpandMore, AddOutlined } from "@material-ui/icons";
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import SearchBox from '../../components/Helpers/SearchBox'
import DeleteIcon from '@material-ui/icons/Delete';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import axiosInstance from '../../axios/axiosInstance'
import CustomContainer from "../../components/CustomContainer";
import styles from "../Leads/Header.module.scss";
import CustomRenderCell from '../../components/Helpers/CustomRenderCell'
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { termsAndCondition, isObjectEmpty } from '../../constants/helpers';
import ManageTermsAndCondition from './ManageTermsAndCondition'
import { cloneDeep } from 'lodash'
import { IoDocumentTextOutline } from 'react-icons/io5';
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";

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
        <span className={`${actionsPermissions.isUpdate ? "link" : ""} cursor-pointer`}
            onClick={() => {
                setShowCreateDialog(true);
                setEditRecord(cloneDeep(params.data))
            }}>
            <CustomRenderCell value={params?.value} />
        </span>
    )

    const ActionsRenderer = params => (
        <>
            <Tooltip title="Delete">
                <IconButton size="small" aria-label="Delete" onClick={() => {
                    setDeleteRec(params.data);
                    setShowDeleteConfirmBox(true)
                }}
                    disabled={actionsPermissions.isDelete ? false : true}
                >
                    <DeleteIcon color={actionsPermissions.isDelete ? "error" : "disabled"}
                    />
                </IconButton>
            </Tooltip >
        </>
    )

    const [columns] = useState([
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
        actionsRenderer: ActionsRenderer
    };

    const getQueryString = () => {
        let deepFilter = `?page=${page}&limit=${limit}`;

        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];

            Object.keys(filters).forEach(field => {
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

        <Layout>
            <Grid container className="headerbox">
                <Grid item xs={12}>
                    <CustomBreadCrumbs routes={[termsAndConditionBreadcrumb]} />
                </Grid>
            </Grid>
            <CustomContainer>
                <div className="header-panel">
                    <Grid container className={styles.filter_side_container}>
                        <Grid item xs={12} sm={6} md={6} className="d-flex align-items-center gap-1">
                            <IoDocumentTextOutline className="headerLogo" />{" "}
                            <span className="listingHeader">Terms and Conditions</span>
                        </Grid>

                        <Grid item xs={6} className={styles.filter_side}>
                            <Box className={styles.filter_side_header} component="div">
                                <SearchBox
                                    onSearch={handleSearch}
                                    searchbox={styles.search_box_input}
                                    width="300px"
                                    value={search}
                                />
                                {
                                    actionsPermissions.isCreate && <Button
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        className={styles.add_submit_btn}
                                        onClick={() => setShowCreateDialog(true)}
                                        startIcon={<AddOutlined />} >Add</Button>
                                }

                                <Button
                                    disabled={selectedRecords.length === 0}
                                    variant="outlined"
                                    color="default"
                                    size="small"
                                    className={styles.action_submit_btn}
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
                            </Box>

                        </Grid>
                    </Grid>
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
                            message={`Are you sure you want to delete the selected TermsAndCondition  ${deleteRec?._id ? deleteRec?.TACName : ""}?`}
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
        </Layout>


    )
}
