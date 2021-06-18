import React, { useState, useEffect, Fragment, useContext } from "react";
import Grid from '@material-ui/core/Grid';
import Layout from "../../components/Layout";
import Button from '@material-ui/core/Button';
import { useHistory } from "react-router-dom";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import { DataGrid } from "@material-ui/data-grid";
import DataGridCustomToolbar from "../../components/Helpers/DataGridCustomToolbar";
import AddIcon from "@material-ui/icons/Add";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import NoDataCell from "../../components/Helpers/NoDataCell";
import { Link } from 'react-router-dom'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import moment from "moment";
import CustomDataGridNoDataFound from "../../components/Helpers/CustomDataGridNoDataFound";
import { GiAbstract055 } from 'react-icons/gi';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import CustomContainer from "../../components/CustomContainer";
import CreateNewDialog from "./CreateNewDialog";
import EditIcon from '@material-ui/icons/Edit';
import { dateFormat } from "../../constants/helpers"

const KpiDashboard = () => {

    const toastConfig = useContext(CustomToastContext)
    const history = useHistory();
    const [loading, setLoading] = useState(true);
    const [isCreate, setIsCreate] = useState(false);
    const [productBuilder, setProductBuilder] = useState([]);
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)

    useEffect(() => {
        fetchProductBuilder();
    }, []);

    const fetchProductBuilder = () => {
        setLoading(true)
        axiosInstance().get(`/dashboard`).then(({ data: { data } }) => {
            setProductBuilder(data);
            setLoading(false)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const handleDelete = () => {
        axiosInstance().delete(`/dashboard/` + deleteRecord._id).then(() => {
            fetchProductBuilder();
            setShowDeleteConfirmBox(false)
            setDeleteRecord(null)
        }).catch((error) => {
            toastConfig.setToastConfig(error)
        });
    }


    const columns = [
        { field: 'id', headerName: 'id', hide: true },
        {
            field: "name",
            headerName: "Name",
            width: 300,
            renderCell: (params) => (
                <Link className="link" to={`/dashboard/${params.row.id}`} >
                    {params.row.name}
                </Link>
            )
        },
        {
            field: "createdBy",
            headerName: "Created By",
            width: 300,
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
            renderCell: (params) => params?.row && params?.row?.createdBy ? (<h5 className="createBy">
                {params.row.createdBy.user.firstName}
                <span
                    className="createdAtTime badge-date"
                    title={`${params.row.createdBy.user.firstName} • ${moment(
                        params.row.createdBy.date.slice(0, 10)
                    ).format(dateFormat)}`}
                >
                    {moment(params.row.createdBy.date.slice(0, 10)).format(
                        dateFormat
                    )}
                </span>
            </h5>) : <NoDataCell />
        },
        {
            field: "updatedBy",
            headerName: "Updated By",
            width: 300,
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
            renderCell: (params) => params?.row && params?.row?.updatedBy && params?.row?.updatedBy?.user ? (<h5 className="createBy">
                {params.row.updatedBy.user.firstName}
                <span
                    className="updatedAtTime badge-date"
                    title={`${params.row.updatedBy.user.firstName} • ${moment(
                        params.row.updatedBy.date.slice(0, 10)
                    ).format(dateFormat)}`}
                >
                    {moment(params.row.updatedBy.date.slice(0, 10)).format(
                        dateFormat
                    )}
                </span>
            </h5>) : <NoDataCell />
        },
        {
            field: "actions", headerName: "Actions ",
            renderCell: (params) => (
                <Fragment>
                    <Tooltip title="Edit" >
                        <IconButton aria-label="Delete" onClick={() => { history.push('/dashboard-edit/' + params.row._id) }} >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip >

                    <Tooltip title="Delete" >
                        <IconButton aria-label="Delete" onClick={() => { setDeleteRecord(params.row); setShowDeleteConfirmBox(true) }}  >
                            <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                    </Tooltip >

                </Fragment>
            ),
            width: 200,
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
        }
    ];


    return (<Layout>
        <Grid container className="headerbox">
            <Grid item md={12} sm={12} xs={12}>
                <CustomBreadCrumbs routes={[{ title: 'Dashboards' }]} />
            </Grid>
        </Grid>
        <CustomContainer>
            <div className="header-panel">
                <Grid container>
                    <Grid item xs={6} className="d-flex align-items-center gap-1">
                        <GiAbstract055 /> <span className="listingHeader">{'Dashboards'}</span>
                    </Grid>
                    <Grid xs={6} container justify="flex-end">
                        <Button onClick={() => setIsCreate(true)} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
                    </Grid>
                </Grid>
            </div>
            <div className="listing-grid">
                <DataGrid
                    components={{
                        Toolbar: DataGridCustomToolbar,
                        NoRowsOverlay: CustomDataGridNoDataFound,
                    }}
                    loading={loading}
                    rows={productBuilder}
                    disableSelectionOnClick
                    disableMultipleSelection
                    columns={columns}
                    pageSize={25}
                    density="compact"
                />
            </div>
            {showDeleteConfirmBox &&
                <ConfirmationDialog
                    open={showDeleteConfirmBox}
                    message={`Are you sure you want to delete dashboard ${deleteRecord?.name}?`}
                    onClose={() => setShowDeleteConfirmBox(false)}
                    onOk={handleDelete}
                />
            }
            {isCreate && <CreateNewDialog handleClose={() => setIsCreate(false)} />}
        </CustomContainer>
    </Layout>
    );
}

export default KpiDashboard;
