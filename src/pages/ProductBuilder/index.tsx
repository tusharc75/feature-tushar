import React, { useState, useEffect, Fragment, useContext, useReducer } from "react";
import Grid from '@material-ui/core/Grid';
import Layout from "../../components/Layout";
import Button from '@material-ui/core/Button';
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
import routes from "../../components/Helpers/Routes";
import CreateNewDialog from "./CreateNewDialog";
import {
    CreatedByRenderer,
    UpdatedByRenderer
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CustomAgGrid, { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
import { Menu, MenuItem } from "@material-ui/core";
import { ExpandMore } from "@material-ui/icons";

const ProductBuilder = () => {

    const toastConfig = useContext(CustomToastContext)
    const [isCreate, setIsCreate] = useState(false);
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)
    // const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [okButtonLoading] = useState(false);

    //  Grid Variables - Start
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, page, limit, pageSizes, selectedRecords } = state;

    // const [showGridFilters, setShowGridFilters] = useState(true)
    const columns = [
        { field: "name", headerName: "Name", show: true, disabled: true, cellRenderer: "nameRenderer" },
        { field: "createdBy", headerName: "Created By", show: true, sortable: false, cellRenderer: "createdByRenderer" },
    ];
    //  Grid Variables - End

    useEffect(() => {
        fetchProductBuilder();
    }, []);

    const NameRenderer = params => <Link className="link" to={`${routes.productBuilder.path}/${params.data.id}`} >
        {params.data.name}
    </Link>

    const ActionsRenderer = params => <Fragment>
        <Tooltip title="Delete" >
            <IconButton size="small" aria-label="Delete" onClick={() => { setDeleteRecord(params.data); setShowDeleteConfirmBox(true) }}  >
                <DeleteIcon color="error" />
            </IconButton>
        </Tooltip >
    </Fragment>

    const fetchProductBuilder = () => {

        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
            gridApi.showLoadingOverlay();
        }

        axiosInstance().get(`/productbuilder`).then(({ data: { data } }) => {

            let rows = data.map((u) => {
                const { createdBy, ...restProperties } = u;

                let res = {
                    ...restProperties,
                    id: u._id,

                    name: u.name,
                    createdBy: u.createdBy?.user?.concatedCreatedByName,
                    createdByDate: u.createdBy?.date,
                    
                }

                return res;
            });

            dispatch({ type: "initialize", data: rows, count: data.length });

        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const handleDelete = () => {
        if (deleteRecord) {
            axiosInstance().delete(`/productbuilder/` + deleteRecord._id).then(() => {
                fetchProductBuilder();
                setShowDeleteConfirmBox(false)
                setDeleteRecord(null)
            }).catch((error) => {
                toastConfig.setToastConfig(error)
            });
        } else {
            axiosInstance().put(`/productbuilder/remove`, selectedRecords.map(d => d._id)).then(() => {
                fetchProductBuilder();
                setShowDeleteConfirmBox(false)
                setDeleteRecord(null)
            }).catch((error) => {
                toastConfig.setToastConfig(error)
            });
        }

    }

    const frameworkComponents = {
        nameRenderer: NameRenderer,
        createdByRenderer: CreatedByRenderer,
        updatedByRenderer: UpdatedByRenderer,
        actionsRenderer: ActionsRenderer
    };

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const showConfirmBox = (row) => {
        if (row) {
            setShowDeleteConfirmBox(true);
            if (row) {
                setDeleteRecord({ id: row.id, name: row.name });
            }
        } else {
            setShowDeleteConfirmBox(true);
        }
    };

    return (<Layout>
        <Grid container className="headerbox">
            <Grid item md={12} sm={12} xs={12}>
                <CustomBreadCrumbs routes={[{ title: routes.productBuilder.title }]} />
            </Grid>
        </Grid>
        <CustomContainer>
            <div className="header-panel">
                <Grid container>
                    <Grid item xs={6} className="d-flex align-items-center gap-1">
                        <GiAbstract055 /> <span className="listingHeader">{routes.productBuilder.title}</span>
                    </Grid>
                    <Grid xs={6} container justify="flex-end">
                        <Button onClick={() => setIsCreate(true)} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
                        <Button
                            className="ml-2"
                            // className={styles.action_submit_btn}
                            variant="outlined"
                            color="default"
                            size="small"
                            onClick={openActions}
                            aria-controls="action-menu"
                            disabled={selectedRecords.length > 0 ? false : true}
                        >
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

                    </Grid>
                </Grid>
            </div>

            <CustomAgGrid columns={columns} dataRows={dataRows} frameworkComponents={frameworkComponents} setGridApi={setGridApi}
                dispatch={dispatch} rowCount={rowCount} limit={limit} pageSizes={pageSizes} page={page} allowSelection={true} actionWidth={100}
                isClientSideGrid={true} />

            {showDeleteConfirmBox &&
                <ConfirmationDialog
                    open={showDeleteConfirmBox}
                    message={`Are you sure you want to delete ${deleteRecord ? deleteRecord.name : "selected product(s)"}?`}
                    onClose={() => setShowDeleteConfirmBox(false)}
                    onOk={handleDelete}
                    okBtnLoading={okButtonLoading}
                />
            }
            {isCreate && <CreateNewDialog handleClose={() => setIsCreate(false)} />}
        </CustomContainer>
    </Layout>
    );
}

export default ProductBuilder;
