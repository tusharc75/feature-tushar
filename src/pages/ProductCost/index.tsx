import { useState, useEffect, Fragment, useContext } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Layout from "../../components/Layout";
import Button from '@material-ui/core/Button';
import { useHistory } from "react-router-dom";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import { DataGrid } from "@material-ui/data-grid";
import AddIcon from "@material-ui/icons/Add";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import NoDataCell from "../../components/Helpers/NoDataCell";
import { Link } from 'react-router-dom'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import moment from "moment";
import CustomDataGridNoDataFound from "../../components/Helpers/DataGridHelpers/CustomDataGridNoDataFound";
import { GiAbstract055 } from 'react-icons/gi';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import routes from "../../components/Helpers/Routes";
import CustomDataGridToolbar from "../../components/Helpers/DataGridHelpers/CustomDataGridToolbar";

const ProductCost = () => {

    const toastConfig = useContext(CustomToastContext)
    const history = useHistory();
    const [loading, setLoading] = useState(true);
    const [productCost, setProductCost] = useState([]);
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)

    useEffect(() => {
        fetchProductCost();
    }, []);

    const fetchProductCost = () => {
        setLoading(true)
        axiosInstance().get(`/productcost`).then(({ data: { data } }) => {
            setProductCost(data);
            setLoading(false)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const handleDelete = () => {
        axiosInstance().delete(`/productcost/` + deleteRecord._id).then(() => {
            fetchProductCost();
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
            headerName: "Product Cost",
            width: 300,
            renderCell: (params) => (
                <Link className="link" to={`${routes.productCost.path}/${params.row.id}`} >
                    {params.row.name}
                </Link>
            )
        },
        {
            field: "incoTermsFrom",
            headerName: "Inco Terms From",
            width: 200,
            renderCell: (params) => (params.row.incoTermsFrom)
        },
        {
            field: "incoTermsTo",
            headerName: "Inco Terms To",
            width: 200,
            renderCell: (params) => (params.row.incoTermsTo)
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
                    ).format('MMM Do, YYYY')}`}
                >
                    {moment(params.row.createdBy.date.slice(0, 10)).format(
                        'MMM Do, YYYY'
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
                    ).format('MMM Do, YYYY')}`}
                >
                    {moment(params.row.updatedBy.date.slice(0, 10)).format(
                        'MMM Do, YYYY'
                    )}
                </span>
            </h5>) : <NoDataCell />
        },
        {
            field: "actions", headerName: "Actions ",
            renderCell: (params) => (
                <Fragment>
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

    const CreateNew = () => {
        history.push({ pathname: "/product-cost/0" })
    }

    return (<Layout>
        <Grid container direction="row">
            <Grid item xs={12}>
                <CustomBreadCrumbs routes={[{ title: routes.productCost.title }]} />
            </Grid>
        </Grid>
        <div className="main-container">
            <div className="header-panel">
                <Grid container>
                    <Grid item xs={6} className="d-flex align-items-center gap-1">
                        <GiAbstract055 /> <span className="listingHeader">Product Cost</span>
                    </Grid>
                    <Grid xs={6} container justify="flex-end">
                        <Button onClick={CreateNew} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
                    </Grid>
                </Grid>
            </div>
            <div className="listing-grid">
                <DataGrid
                    components={{
                        Toolbar: CustomDataGridToolbar,
                        NoRowsOverlay: CustomDataGridNoDataFound,
                    }}
                    loading={loading}
                    rows={productCost}
                    disableSelectionOnClick
                    disableMultipleSelection
                    columns={columns}
                    pageSize={25}
                    density="compact"
                />
            </div>
        </div>
        {showDeleteConfirmBox &&
            <ConfirmationDialog
                open={showDeleteConfirmBox}
                message={`Are you sure, you want to delete product cost ${deleteRecord?.name} ?`}
                onClose={() => setShowDeleteConfirmBox(false)}
                onOk={handleDelete}
            />
        }
    </Layout>
    );
}

export default ProductCost;
