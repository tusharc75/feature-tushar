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
import EditIcon from '@material-ui/icons/Edit';
import { dateFormat } from "../../constants/helpers"

const DOARequest = () => {

    const toastConfig = useContext(CustomToastContext)
    const history = useHistory();
    const [loading, setLoading] = useState(true);
    const [isCreate, setIsCreate] = useState(false);
    const [productBuilder, setProductBuilder] = useState([]);
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)
    const [replied, setReplied] = useState(false);

    useEffect(() => {
        fetchProductBuilder();
    }, []);

    const fetchProductBuilder = () => {
        setLoading(true)
        axiosInstance().get(`/doa-request`).then(({ data: { data } }) => {
            setProductBuilder(data);
            setLoading(false)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };



    const columns = [
        {
            field: "name",
            headerName: "Name",
            width: 300,
            renderCell: (params) => (
                <Link className="link" to={`/doa-request/${params.row.id}`} >
                    {params.row.id}
                </Link>
            )
        },
        {
            field: "Quoted By",
            headerName: "QuotedBy",
            width: 200,
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <>
                    {params.row.QuotedBy.firstName}
                </>
            )
        },
        {
            field: "RequestedBy",
            headerName: "Requested By",
            width: 300,
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
            renderCell: (params) => params?.row && params?.row?.RequestedBy ? (<h5 className="createBy">
                {params.row.RequestedBy.firstName}
                <span
                    className="updatedAtTime badge-date"
                    title={`${params.row.RequestedBy.firstName} • ${moment(
                        params.row.RequestedBy.date.slice(0, 10)
                    ).format(dateFormat)}`}
                >
                    {moment(params.row.RequestedBy.date.slice(0, 10)).format(
                        dateFormat
                    )}
                </span>
            </h5>) : <NoDataCell />
        },
        {
            field: "status",
            headerName: "Status",
            width: 200,
            renderCell: (params) => (
                <>
                    {params.row.status}
                </>
            )
        }
    ];


    return (<Layout>
        <Grid container className="headerbox">
            <Grid item md={12} sm={12} xs={12}>
                <CustomBreadCrumbs routes={[{ title: 'DOA Requests' }]} />
            </Grid>
        </Grid>
        <CustomContainer>
            <div className="header-panel">
                <Grid container>
                    <Grid item xs={6} className="d-flex align-items-center gap-1">
                        <GiAbstract055 /> <span className="listingHeader">{'DOA Requests'}</span>
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
        </CustomContainer>
    </Layout>
    );
}

export default DOARequest;