import { useState, useEffect, Fragment, useContext } from "react";
import Box from '@material-ui/core/Box';
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
import { Link } from 'react-router-dom'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import CreateProduct from "../../components/Product/CreateProduct";
import moment from "moment";
import NoDataCell from "../../components/Helpers/NoDataCell";


const Product = () => {

    const toastConfig = useContext(CustomToastContext)
    const history = useHistory();
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState([]);
    const [open, setOpen] = useState(false);
    const [productId, setProductId] = useState(null);

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

    const handleDelete = (id) => {
        setLoading(true)
        axiosInstance().delete(`/product/` + id).then(() => {
            fetchProduct();
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
                <Link className="LeadNameLink" onClick={() => OpenProduct(params.row.id)}  >
                    {params.row.productName}
                </Link>
            )
        },
        {
            field: "productCategory",
            headerName: "Product Category",
            width: 300,
            renderCell: (params) => (params.row.productCategory?.productCategory)
        },
        {
            field: "createdBy",
            headerName: "Created By",
            width: 300,
            renderCell: (params) => params?.row && params?.row?.createdBy ? (<h5 className="createBy">
                {params.row.createdBy.user.firstName}
                <span
                    className="createdAtTime"
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
            renderCell: (params) => params?.row && params?.row?.updatedBy ? (<h5 className="createBy">
                {params.row.updatedBy.user.firstName}
                <span
                    className="updatedAtTime"
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
            field: "description",
            headerName: "Description",
            width: 300,
            renderCell: (params) => (params.row.description)
        },
        {
            field: "actions", headerName: "Actions ",
            renderCell: (params) => (
                <Fragment>
                    <Tooltip title="Delete" >
                        <IconButton aria-label="Delete" onClick={() => handleDelete(params.row.id)} >
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
        <Box mt={1} p={2} pt={1} pl={1} bgcolor="white" >
            <Box mb={2} mt={1}>
                <Grid container>
                    <Grid xs={12} container justify="flex-end">
                        <Button onClick={() => OpenProduct(null)} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
                    </Grid>
                </Grid>
            </Box>
            <Box height={window.innerHeight - 200}>
                <DataGrid
                    components={{
                        Toolbar: DataGridCustomToolbar,
                    }}
                    loading={loading}
                    rows={product}
                    disableSelectionOnClick
                    disableMultipleSelection
                    columns={columns}
                    pageSize={25}
                    density="compact"
                />
            </Box>
            {open && <CreateProduct productId={productId} handleClose={handleClose} />}
        </Box>
    </Layout>
    );
}

export default Product;
