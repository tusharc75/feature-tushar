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
import { productCategoryPage } from '../../routes/ProductCategory'

import { Link } from 'react-router-dom'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";


const ProductCategory = () => {

    const toastConfig = useContext(CustomToastContext)
    const history = useHistory();
    const [loading, setLoading] = useState(true);
    const [productCategory, setProductCategory] = useState([]);

    useEffect(() => {
        fetchProductCategory();
    }, []);

    const fetchProductCategory = () => {
        setLoading(true)

        axiosInstance().get(`/productcategory`).then(({ data: { data } }) => {
            setProductCategory(data);
            setLoading(false)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });


        // await GetProductCategory()
        //     .then(({ data }) => {
        //         setProductCategory(data);
        //         setLoading(false)
        //     })
        //     .catch((err) => {
        //     });
    };

    const handleDelete = (id) => {
        setLoading(true)

        axiosInstance().delete(`/productcategory/` + id).then(() => {
            fetchProductCategory();
        }).catch((error) => {
            toastConfig.setToastConfig(error)
        });

    }


    const columns = [
        { field: 'id', headerName: 'id', hide: true },
        {
            field: "name",
            headerName: "Product Category",
            width: 300,
            renderCell: (params) => (
                <Link className="LeadNameLink" to={`${productCategoryPage.path}/${params.row.id}`} >
                    {params.row.name}
                </Link>
            )
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

    const CreateNew = () => {
        history.push({ pathname: "/product-category/0" })
    }

    return (<Layout>
        <Grid container direction="row">
            <Grid item xs={12}>
                <CustomBreadCrumbs routes={[{ title: "Product Category" }]} />
            </Grid>
        </Grid>
        <Box mt={1} p={2} pt={1} pl={1} bgcolor="white" >
            <Box mb={2} mt={1}>
                <Grid container>
                    <Grid xs={12} container justify="flex-end">
                        <Button onClick={CreateNew} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
                    </Grid>
                </Grid>
            </Box>
            <Box height={window.innerHeight - 200}>
                <DataGrid
                    components={{
                        Toolbar: DataGridCustomToolbar,
                    }}
                    loading={loading}
                    rows={productCategory}
                    disableSelectionOnClick
                    disableMultipleSelection
                    columns={columns}
                    pageSize={25}
                    density="compact"
                />
            </Box>
        </Box>
    </Layout>
    );
}

export default ProductCategory;
