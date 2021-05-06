import React, { useState, useEffect, Fragment, useContext } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CreateProduct from "../Product/CreateProduct";
import AddExistingProduct from "./AddExistingProduct";
import { DataGrid, GridOverlay } from "@material-ui/data-grid";
import DataGridCustomToolbar from "../../components/Helpers/DataGridCustomToolbar";
import CustomDataGridNoDataFound from "../../components/Helpers/CustomDataGridNoDataFound";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import ProductDialog from "./ProductDialog";
import axiosInstance from '../../axios/axiosInstance'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import NoDataCell from "../../components/Helpers/NoDataCell";
import { Link } from 'react-router-dom'
import Quote from "./Quote";
var _ = require('lodash');


var levalOrderBy = ["product", "category", "cost", "builder"]

const ProductBuilder = (props) => {

    const { productBuilderId } = props;

    const toastConfig = useContext(CustomToastContext)
    const [isAddNewProduct, setIsAddNewProduct] = useState(false);
    const [isAddExistingProduct, setIsAddExistingProduct] = useState(false);
    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState([]);
    const [columns, setColumns] = useState(null);
    const [productData, setProductData] = useState(null);

    useEffect(() => {
        fetchProduct();
    }, []);


    let ActionsColoum: any = {
        field: "actions", headerName: "Actions ",
        renderCell: (params) => (
            <Fragment>
                <Tooltip title="Edit" >
                    <IconButton aria-label="Edit" onClick={() => { setProductData(params.row) }}  >
                        <EditIcon fontSize="small" color="primary" />
                    </IconButton>
                </Tooltip >
                <Tooltip title="Delete" >
                    <IconButton aria-label="Delete" onClick={() => { removeProductInBuilder(params.row._id) }}  >
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

    const fetchProduct = () => {
        setLoading(true)
        axiosInstance().get(`/productbuilder/getproduct/` + productBuilderId).then(({ data: { data } }) => {
            data = data.data?.map((u) => ({
                ...u,
                id: u._id,
            }));
            setColumns(null);
            let column = [{ field: 'id', headerName: 'id', hide: true }]
            data.forEach((row) => {
                row.fields.forEach((ele) => {
                    if (ele.type === "converter") {
                        ele.displayUnits.forEach((_unit) => {
                            if (column.filter((_c) => _c.field === ele.fieldName + _unit.toLowerCase() && _c.headerName === ele.fieldLabel + " " + _unit).length === 0) {
                                let col: any = {}
                                col.field = ele.fieldName + _unit.toLowerCase()
                                col.headerName = ele.fieldLabel + " " + _unit
                                col.width = 180
                                col.leval = ele.leval
                                column.push(col)
                            }
                        })
                    }
                    else {
                        if (column.filter((_c) => _c.field === ele.fieldName && _c.headerName === ele.fieldLabel).length === 0) {
                            let col: any = {}
                            col.field = ele.fieldName
                            col.headerName = ele.fieldLabel
                            col.width = 180
                            if (ele.fieldName === "productName") {
                                col.renderCell = (params) => (
                                    <Link className="link" onClick={() => { setProductData(params.row) }}   >
                                        {params.row.productName}
                                    </Link>
                                )
                            }
                            else {
                                col.renderCell = (params) => (params.row[ele.fieldName] ?
                                    typeof params.row[ele.fieldName] === 'object' ? params.row[ele.fieldName][ele.fieldName] : params.row[ele.fieldName]
                                    : <NoDataCell />)
                            }
                            col.leval = ele.leval
                            column.push(col)
                        }
                    }
                })
            });
            column = _.sortBy(column, function (item) {
                return levalOrderBy.indexOf(item.leval)
            });
            column.push(ActionsColoum)
            setColumns(column);
            setProduct(data);
            setLoading(false)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const addProductInBuilder = (rows) => {
        let data: any = {}
        data.product = rows
        data._id = productBuilderId
        setLoading(true)
        axiosInstance().post(`/productbuilder/addproduct`, data).then(({ data: { data } }) => {
            setLoading(false)
            fetchProduct()
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
        // let data = [...product];
        // rows.map((_r) => data.push({ ..._r, id: (parseInt((Math.random() * 100000).toString())) }));
        // setProduct(data)
    }

    const handleSaveProduct = (row) => {
        let data: any = {}
        data.product = row
        data._id = productBuilderId
        setLoading(true)
        axiosInstance().put(`/productbuilder/updateProduct`, data).then(({ data: { data } }) => {
            setLoading(false)
            setProductData(null)
            fetchProduct()
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }

    const removeProductInBuilder = (_id) => {
        setLoading(true)
        let data: any = {}
        data.productBuilderId = productBuilderId
        data._id = _id
        axiosInstance().post(`/productbuilder/deleteproduct`, data).then(({ data: { data } }) => {
            setLoading(false)
            fetchProduct()
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }

    return (<Box p={1}>
        <Box>
            <Button variant="contained" size="small" color="primary" onClick={() => { setIsAddNewProduct(true); }}>New</Button>
            <Button className="ml-2" variant="contained" size="small" color="primary" onClick={() => { setIsAddExistingProduct(true); }}>Add Existing</Button>
            <Box mt={2} height={500}>
                {columns &&
                    <DataGrid
                        checkboxSelection
                        components={{
                            NoRowsOverlay: CustomDataGridNoDataFound,
                        }}
                        loading={loading}
                        rows={product}
                        disableSelectionOnClick
                        disableMultipleSelection
                        columns={columns}
                        pageSize={25}
                        density="compact"
                    />}
            </Box>
        </Box>
        <Box>
            <Quote productBuilderId={productBuilderId} />
        </Box>
        {isAddNewProduct && <CreateProduct isClone={false} productId={null} handleClose={() => setIsAddNewProduct(false)}
            isAddInBuilder={true} addProductInBuilder={addProductInBuilder}
        />}
        {isAddExistingProduct && <AddExistingProduct addProductInBuilder={addProductInBuilder} handleClose={() => setIsAddExistingProduct(false)} />}
        {productData && <ProductDialog productData={productData} handleSaveProduct={handleSaveProduct} handleClose={() => setProductData(null)} />}
    </Box>
    );
}

export default ProductBuilder;
