import React, { useState, useEffect, useContext, useReducer } from "react";
import Grid from '@material-ui/core/Grid';
import Layout from "../../components/Layout";
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Box from '@material-ui/core/Box';
import ExpandMore from "@material-ui/icons/ExpandMore";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import AddIcon from "@material-ui/icons/Add";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { Link } from 'react-router-dom'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import { GiAbstract055 } from 'react-icons/gi';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import CustomContainer from "../../components/CustomContainer";
import CreateNewDialog from "./CreateNewDialog";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import {
    CreatedByRenderer,
    UpdatedByRenderer,
    CommonRenderer
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import { isObjectEmpty, gridLoadingTimeout } from "../../constants/helpers";
import styles from "../../pages/Leads/Header.module.scss"

const KpiDashboard = () => {

    const toastConfig = useContext(CustomToastContext)
    const [isCreate, setIsCreate] = useState(false);
    const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const { dataRows, rowCount, page, loading, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    const columns = [
        { field: "name", headerName: "Name", show: true, disabled: true, cellRenderer: "nameRenderer" },
        { field: "description", headerName: "Description", show: true, cellRenderer: "commonRenderer" },
        { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
        { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
    ];

    useEffect(() => {
        fetchDashboards()
    }, [page, limit, filters, sorting]);

    const showConfirmBox = (row) => {
        if (row) {
            setIsConformDialogVisible(true);
            if (row && row.id) {
                setDeleteRecord(row);
            }
        } else {
            setIsConformDialogVisible(true);
        }
    };

    const NameRenderer = params => (
        <Link className="link" to={`/dashboard/detail/${params.data._id}`} >
            {params.data?.name}
        </Link>
    )

    const ActionsRenderer = params => <>
        <Tooltip title="Delete" >
            <IconButton aria-label="Delete"
                onClick={() => { setDeleteRecord(params.data); setIsConformDialogVisible(true) }}  >
                <DeleteIcon fontSize="small" color="error" />
            </IconButton>
        </Tooltip>
    </>

    const frameworkComponents = {
        nameRenderer: NameRenderer,
        commonRenderer: CommonRenderer,
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
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`
        }

        if (search) {
            deepFilter = `${deepFilter}&search=${search}`;
        }

        return deepFilter;
    };

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const fetchDashboards = () => {
        const queryString = getQueryString();
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
        }

        axiosInstance().get(`/dashboard${queryString}`).then(({ data: { data, count } }) => {
            data = data.map(u => {
                const { createdBy, updatedBy, ...rest } = u
                return {
                    ...rest,
                    id: u.id,
                    createdBy: u.createdBy?.user?.concatedName || "",
                    createdByDate: u.createdBy?.date || '',
                }
            })
            dispatch({ type: "initialize", data: data, count: count });
            setTimeout(() => {
                dispatch({ type: "loading", loading: false });
            }, gridLoadingTimeout);

        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };
    const handleDeleteDashboards = () => {
        setDeleteLoading(true);

        if (deleteRecord?._id || selectedRecords.length > 0) {

            axiosInstance()
                .put('dashboard/remove',
                    { _ids: deleteRecord?._id ? [deleteRecord._id] : selectedRecords.map(d => d._id) })
                .then(({ data }) => {
                    toastConfig.setToastConfig({
                        open: true,
                        type: "success",
                        message: data?.message || "Deleted Successfully",
                    });
                    setIsConformDialogVisible(false);
                    setDeleteLoading(false);
                    if (deleteRecord) setDeleteRecord({});
                    fetchDashboards()
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                    setIsConformDialogVisible(false);
                    setDeleteLoading(false);
                });
        }
    };

    return (<Layout>
        <Grid container className="headerbox">
            <Grid item md={12} sm={12} xs={12}>
                <CustomBreadCrumbs routes={[{ title: 'Dashboards' }]} />
            </Grid>
        </Grid>
        <CustomContainer>
            <div className="header-panel">
                <Grid container className={styles.filter_side_container}>
                    <Grid item xs={6} className="d-flex align-items-center gap-1">
                        <GiAbstract055 /> <span className="listingHeader">{'Dashboards'}</span>
                    </Grid>
                    <Grid item xs={6} container justify="flex-end">
                        <Box component="div" className={styles.filter_side_header} >
                            <Button onClick={() => setIsCreate(true)} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
                            <Button
                                className={styles.action_submit_btn}
                                variant="outlined"
                                color="default"
                                size="small"
                                onClick={openActions}
                                aria-controls="action-menu"
                                disabled={selectedRecords.length > 0 ? false : true}>
                                Actions <ExpandMore />
                            </Button>
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
                                onClose={closeActions}>
                                <MenuItem
                                    onClick={() => {
                                        showConfirmBox(null);
                                        closeActions();
                                    }}
                                >
                                    Delete
                                </MenuItem>
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
                actionWidth={100}
                loading={loading}
            />
            {isConfirmDialogVisible &&
                <ConfirmationDialog
                    open={isConfirmDialogVisible}
                    message={`Are you sure you want to delete ${deleteRecord?.name || 'dashboards'}?`}
                    onClose={() => {
                        setDeleteLoading(false);
                        setIsConformDialogVisible(false)
                    }}
                    onOk={handleDeleteDashboards}
                    okBtnLoading={deleteLoading}
                />
            }
            {isCreate && <CreateNewDialog handleClose={() => setIsCreate(false)} />}
        </CustomContainer>
    </Layout>
    );
}

export default KpiDashboard;
