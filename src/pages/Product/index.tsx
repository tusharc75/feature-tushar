import { useState, useEffect, Fragment, useContext } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Layout from "../../components/Layout";
import Button from '@material-ui/core/Button';
import { useHistory } from "react-router-dom";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import { DataGrid, GridOverlay } from "@material-ui/data-grid";
import DataGridCustomToolbar from "../../components/Helpers/DataGridCustomToolbar";
import AddIcon from "@material-ui/icons/Add";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { Link } from 'react-router-dom'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import CreateProduct from "../../components/Product/CreateProduct";
import moment from "moment";
import NoDataCell from "../../components/Helpers/NoDataCell";
import { GiAbstract055 } from 'react-icons/gi';
import CustomDataGridNoDataFound from "../../components/Helpers/CustomDataGridNoDataFound";
import FileCopyIcon from '@material-ui/icons/FileCopy';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'

const Product = () => {
    const toastConfig = useContext(CustomToastContext)
    const history = useHistory();
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState([]);
    const [open, setOpen] = useState(false);
    const [productId, setProductId] = useState(null);
    const [isClone, setIsClone] = useState(false);
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)

    useEffect(() => {
        fetchProduct();
    }, []);

    const fetchProduct = () => {
        setLoading(true)
        axiosInstance().get(`/product`).then(({ data: { data } }) => {
            data = data?.map((u) => ({
                ...u,
                id: u._id,
            }));
            setProduct(data);
            setLoading(false)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const handleDelete = () => {
        setLoading(true)
        axiosInstance().delete(`/product/` + deleteRecord._id).then(() => {
            fetchProduct();
            setShowDeleteConfirmBox(false)
            setDeleteRecord(null)
        }).catch((error) => {
            toastConfig.setToastConfig(error)
        });
    }

    const columns = [
        { field: 'id', headerName: 'id', hide: true },
        {
            field: "productName",
            headerName: "Product Name",
            width: 300,
            renderCell: (params) => (
                <Link className="LeadNameLink" onClick={() => { OpenProduct(params.row.id); setIsClone(false) }}  >
                    {params.row.productName}
                </Link>
            )
        },
        {
            field: "productCategory",
            headerName: "Product Category",
            width: 250,
            renderCell: (params) => (params.row.productCategory?.productCategory)
        },
        {
            field: "createdBy",
            headerName: "Created By",
            width: 200,
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
            renderCell: (params: any) =>
                params?.value && params?.value?.user ? (
                    <h5 className="createBy">
                        {params?.value?.user?.firstName}
                        <span
                            className="createdAtTime badge-date"
                            title={`${params?.value?.user?.firstName} • ${moment(
                                params?.value?.date?.slice(0, 10)
                            ).format("MMM Do, YYYY")}`}
                        >
                            {moment(params?.value?.date?.slice(0, 10)).format("MMM Do, YYYY")}
                        </span>
                    </h5>
                ) : (
                    <NoDataCell />
                ),
        },
        {
            field: "updatedBy",
            headerName: "Updated By",
            width: 200,
            renderCell: (params: any) =>
                params?.value && params?.value?.user ? (
                    <h5 className="updateBy">
                        {params.value.user.firstName}
                        <span
                            className="updatedAtTime badge-date"
                            title={`${params.value.user.firstName} • ${moment(
                                params.value.date.slice(0, 10)
                            ).format("MMM Do, YYYY")}`}
                        >
                            {moment(params.value.date.slice(0, 10)).format("MMM Do, YYYY")}
                        </span>
                    </h5>
                ) : (
                    <NoDataCell />
                )
        },
        {
            field: "description",
            headerName: "Description",
            width: 300,
            renderCell: (params) => (params.row.description)
        },
        {
            field: "actions", headerName: "Actions ",
            renderCell: (params) => (
                <Fragment>
                    <Tooltip title="Clone">
                        <IconButton aria-label="Clone" onClick={() => { OpenProduct(params.row._id); setIsClone(true) }}>
                            <FileCopyIcon fontSize="small" color="primary" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete" >
                        <IconButton aria-label="Delete" onClick={() => { setDeleteRecord(params.row); setShowDeleteConfirmBox(true) }} >
                            <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                    </Tooltip >
                </Fragment>
            ),
            width: 100,
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
        }
    ];

    const OpenProduct = (id) => {
        setProductId(id)
        setOpen(true)
    }

    const handleClose = () => {
        setProductId(null)
        setOpen(false)
        fetchProduct();
    }

    return (<Layout>
        <Grid container direction="row">
            <Grid item xs={12}>
                <CustomBreadCrumbs routes={[{ title: "Product" }]} />
            </Grid>
        </Grid>
        <div className="main-container">
            <div className="header-panel">
                <Grid container>
                    <Grid item xs={6} className="d-flex align-items-center gap-1">
                        <GiAbstract055 className="headerLogo"/> <span className="listingHeader">Products </span>
                    </Grid>
                    <Grid item xs={6} container justify="flex-end">
                        <Button onClick={() => OpenProduct(null)} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
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
                    rows={product}
                    disableSelectionOnClick
                    disableMultipleSelection
                    columns={columns}
                    pageSize={25}
                    density="compact"
                />
            </div>
        </div>
        {open && <CreateProduct isClone={isClone} productId={productId} handleClose={handleClose} />}
        {showDeleteConfirmBox &&
            <ConfirmationDialog
                open={showDeleteConfirmBox}
                message={`Are you sure, you want to delete product ${deleteRecord?.productName} ?`}
                onClose={() => setShowDeleteConfirmBox(false)}
                onOk={handleDelete}
            />
        }
    </Layout>
    );
}

export default Product;
