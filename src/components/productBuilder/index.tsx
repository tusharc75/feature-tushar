import React, { useState, useEffect, Fragment, useContext } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CreateProduct from "../Product/CreateProduct";
import AddExistingProduct from "./AddExistingProduct";
import { DataGrid, GridOverlay } from "@material-ui/data-grid";
import CustomDataGridNoDataFound from "../Helpers/DataGridHelpers/CustomDataGridNoDataFound";
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
import { ExpandMore } from "@material-ui/icons";
import { Menu, MenuItem } from "@material-ui/core";
var _ = require('lodash');


var levalOrderBy = ["product", "product-custom", "template", "cost", "builder", "builder-custom"]

const ProductBuilder = (props) => {

    const { productBuilderId } = props;

    const toastConfig = useContext(CustomToastContext)
    const [isAddNewProduct, setIsAddNewProduct] = useState(false);
    const [isAddExistingProduct, setIsAddExistingProduct] = useState(false);
    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState([]);
    const [columns, setColumns] = useState(null);
    const [productData, setProductData] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState([]);

    const [newVersion, setNewVersion] = useState(false);
    const [versionNumber, setVersionNumber] = useState(0);

    useEffect(() => {
        fetchProduct();
    }, [productBuilderId]);

    // useEffect(() => {
    //     fetchVersionDetail();
    // }, []);

    const fetchVersionDetail = () => {
        axiosInstance().get(`/quote-builder/checkQuoteforBuilder/` + productBuilderId).then(({ data }) => {
            setNewVersion(data.newVersion);
            setVersionNumber(data.version);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };


    let ActionsColoum: any = {
        field: "actions",
        headerName: "Actions",
        renderCell: (params) => (
            <Fragment>
                <Tooltip title="Edit" >
                    <IconButton aria-label="Edit" onClick={() => { setProductData(params.row) }}  >
                        <EditIcon fontSize="small" color="primary" />
                    </IconButton>
                </Tooltip >
                <Tooltip title="Delete" >
                    <IconButton aria-label="Delete" onClick={() => { removeProductInBuilder([params.row._id]) }}  >
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

    let SrNoColoum: any = {
        field: "srno",
        headerName: "Sr No ",
        width: 30,
        disableColumnMenu: true,
        sortable: false,
        filterable: false,
    }

    const fetchProduct = () => {
        setLoading(true)
        axiosInstance().get(`/productbuilder/getproduct/` + productBuilderId).then(({ data: { data } }) => {
            data = data.data?.map((u, index) => ({
                ...u,
                id: u._id,
                srno: index + 1
            }));
            setColumns(null);
            let column = [{ field: 'id', headerName: 'id', hide: true }]
            data.forEach((row) => {
                row.fields.forEach((ele) => {
                    if (ele.type === "converter" || ele.type === "currencyAmount" || ele.isConverter === true) {
                        if (ele.type !== "currencyAmount" && (ele.type === "converter" || ele.isConverter === true)) {
                            ele.displayUnits.forEach((_unit) => {
                                let fieldName = ele.fieldName + "_" + _unit.toLowerCase()
                                let fieldLabel = ele.fieldLabel + " " + _unit
                                if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                                    let col: any = {}
                                    col.field = fieldName
                                    col.headerName = fieldLabel
                                    col.width = 180
                                    col.renderCell = (params) => (params.row[fieldName] || params.row[fieldName] === 0 ? params.row[fieldName] : <NoDataCell />)
                                    col.order = ele.order
                                    col.leval = ele.leval
                                    column.push(col)
                                }
                            })
                        }
                        else if (ele.type === "currencyAmount" && (ele.type === "converter" || ele.isConverter === true)) {
                            ele.displayUnits.forEach((_unit) => {
                                ele.displayCurrency.forEach((_currency) => {
                                    let fieldName = ele.fieldName + "_" + _currency.toLowerCase() + "_" + _unit.toLowerCase()
                                    let fieldLabel = ele.fieldLabel + " " + _unit + "/" + _currency
                                    if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                                        let col: any = {}
                                        col.field = fieldName
                                        col.headerName = fieldLabel
                                        col.width = 180
                                        col.renderCell = (params) => (params.row[fieldName] || params.row[fieldName] === 0 ? params.row[fieldName] : <NoDataCell />)
                                        col.order = ele.order
                                        col.leval = ele.leval
                                        column.push(col)
                                    }
                                })
                            })
                        }
                        else if (ele.type === "currencyAmount") {
                            ele.displayCurrency.forEach((_currency) => {
                                let fieldName = ele.fieldName + "_" + _currency.toLowerCase()
                                let fieldLabel = ele.fieldLabel + " " + _currency
                                if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                                    let col: any = {}
                                    col.field = fieldName
                                    col.headerName = fieldLabel
                                    col.width = 180
                                    col.renderCell = (params) => (params.row[fieldName] || params.row[fieldName] === 0 ? params.row[fieldName] : <NoDataCell />)
                                    col.order = ele.order
                                    col.leval = ele.leval
                                    column.push(col)
                                }
                            })
                        }
                    }
                    else {
                        if (column.filter((_c) => _c.field === ele.fieldName && _c.headerName === ele.fieldLabel).length === 0) {
                            let col: any = {}
                            col.field = ele.fieldName
                            col.headerName = ele.fieldLabel
                            col.width = 180
                            if (ele.fieldName === "productName") {
                                col.renderCell = (params) => (
                                    <Link className="link" onClick={() => { console.log(params); setProductData(params.row) }}   >
                                        {params.row.productName}
                                    </Link>
                                )
                            }
                            else {
                                col.renderCell = (params) => (params.row[ele.fieldName] || params.row[ele.fieldName] === 0 ?
                                    typeof params.row[ele.fieldName] === 'object' ? params.row[ele.fieldName]["optionLabel"] : params.row[ele.fieldName]
                                    : <NoDataCell />)
                            }
                            col.order = ele.order
                            //col.editable = true
                            col.leval = ele.leval
                            column.push(col)
                        }
                    }
                })
            });
            column = _.orderBy(column, 'order', 'asc');
            column = _.sortBy(column, function (item) {
                return levalOrderBy.indexOf(item.leval)
            });
            column.unshift(SrNoColoum)
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
            fetchProduct();
            fetchVersionDetail();
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }

    const removeProductInBuilder = (ids) => {
        setLoading(true)
        let data: any = {}
        data.productBuilderId = productBuilderId
        data._ids = ids
        axiosInstance().post(`/productbuilder/deleteproduct`, data).then(({ data: { data } }) => {
            setLoading(false)
            fetchProduct()
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }

    const handelDeleteProducts = () => {
        removeProductInBuilder(selectedProduct)
        closeActions()
        setSelectedProduct([])
    }

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    // const onEditCellChangeCommitted = (row) => {
    //     console.log(row)
    //     let data = [...product]
    //     data.forEach((_product) => {
    //         if (_product.id === row.id) {
    //             _product[row.field] = row.props.value
    //             _product["test"] = row.props.value * 5
    //         }
    //     })
    //     setProduct(data)
    //     console.log(product)
    // }

    return (<Box p={1}>
        <Box>
            <Grid container>
                <Grid item xs={6} className="d-flex align-items-center gap-1">
                    <Button variant="contained" size="small" color="primary" onClick={() => { setIsAddNewProduct(true); }}>New</Button>
                    <Button className="ml-2" variant="contained" size="small" color="primary" onClick={() => { setIsAddExistingProduct(true); }}>Add Existing</Button>
                </Grid>
                <Grid xs={6} container justify="flex-end">
                    <Button
                        variant="outlined"
                        color="default"
                        size="small"
                        className="float-right"
                        onClick={openActions}
                        disabled={selectedProduct.length ? false : true}
                        aria-controls="action-menu"
                    >Actions <ExpandMore />
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
                        onClose={closeActions}
                    >
                        <MenuItem onClick={handelDeleteProducts}>Delete</MenuItem>
                    </Menu>
                </Grid>
            </Grid>
            <Box mt={2} height={500}>
                {columns &&
                    <DataGrid
                        checkboxSelection
                        components={{
                            NoRowsOverlay: CustomDataGridNoDataFound,
                        }}
                        onSelectionModelChange={(e) => setSelectedProduct(e.selectionModel)}
                        loading={loading}
                        rows={product}
                        disableSelectionOnClick
                        disableMultipleSelection
                        //onEditCellChangeCommitted={onEditCellChangeCommitted}
                        columns={columns}
                        pageSize={25}
                        density="compact"
                    />}
            </Box>
        </Box>
        <Box>
            <Quote productBuilderId={productBuilderId}
                newVersion={newVersion}
                version={versionNumber} />
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
