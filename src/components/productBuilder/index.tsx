import React, { useState, useEffect, Fragment, useContext } from "react";
import Box from '@material-ui/core/Box';
import CreateProduct from "../Product/CreateProduct";
import AddExistingProduct from "./AddExistingProduct";
import { DataGrid, GridOverlay } from "@material-ui/data-grid";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import ProductDialog from "./ProductDialog";
import axiosInstance from '../../axios/axiosInstance'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import NoDataCell from "../../components/Helpers/NoDataCell";
import { Link } from 'react-router-dom'
import { ExpandMore } from "@material-ui/icons";
import { Menu, MenuItem } from "@material-ui/core";
import { AddField } from '../FormBuilder/AddField';
import ConfirmationDialog from '../Helpers/ConfirmationDialog'
import CustomDataGridNoDataFound from "../../components/Helpers/CustomDataGridNoDataFound";
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
var _ = require('lodash');

const useStyles = makeStyles((theme) => ({
    alignButtons: {
        top: "16px",
        left: "36%",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        justifyContent: "center",
        position: "absolute"
    }
}));

var levalOrderBy = ["product", "product-custom", "template", "cost", "builder", "builder-custom"]

const ProductBuilder = (props) => {

    const { productBuilderId,
        isAddNewProduct, setIsAddNewProduct,
        isAddExistingProduct, setIsAddExistingProduct,
        refreshProducts, Editable, stage } = props;

    const toastConfig = useContext(CustomToastContext)

    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState([]);
    const [columns, setColumns] = useState(null);
    const [productData, setProductData] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState([]);
    const [isAddField, setIsAddField] = useState(false);
    const [addFieldData, setaddFieldData] = useState({ section: [], fields: [] });
    const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false)
    const [deleteRecord, setDeleteRecord] = useState(null)

    useEffect(() => {
        fetchProduct(productBuilderId);
    }, [productBuilderId]);

    let ActionsColoum: any = {
        field: "actions", headerName: "Actions",
        renderCell: (params) => (
            <Fragment>
                <Tooltip title="Edit" >
                    <IconButton aria-label="Edit" onClick={() => { setProductData(params.row) }}  >
                        <EditIcon fontSize="small" color="primary" />
                    </IconButton>
                </Tooltip >
                <Tooltip title="Delete" >
                    <IconButton aria-label="Delete" onClick={() => { setDeleteRecord(params.row); setShowDeleteConfirmBox(true) }}   >
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


    const fetchProduct = (id) => {
        setLoading(true)
        axiosInstance().get(`/productbuilder/getproduct/` + id).then(({ data: { data } }) => {
            data = data.data?.map((u) => ({
                ...u,
                id: u._id,
            }));
            refreshProducts(data)
            setColumns(null);
            let column = [{ field: 'id', headerName: 'id', hide: true }]
            data.forEach((row) => {
                let _fields = row.fields;
                if (stage) {
                    if (stage === "product") {
                        _fields = row.fields.filter((t) => t.leval === "product" || t.leval === "product-custom")
                    }
                }
                _fields.forEach((ele) => {
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
                                        col.renderCell = (params) => (params.row[fieldName] || params.row[fieldName] === 0 ? params.row[fieldName] : <NoDataCell />)
                                        col.width = 180
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
                                    col.renderCell = (params) => (params.row[fieldName] || params.row[fieldName] === 0 ? params.row[fieldName] : <NoDataCell />)
                                    col.width = 180
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
                                    Editable ?
                                        (<Link className="link" onClick={() => { setProductData(params.row) }}   >
                                            {params.row.productName}
                                        </Link>) : (<>{params.row.productName}</>)
                                )
                            }
                            else {
                                col.renderCell = (params) => (params.row[ele.fieldName] || params.row[ele.fieldName] === 0 ?
                                    typeof params.row[ele.fieldName] === 'object' ? params.row[ele.fieldName]["optionLabel"] : params.row[ele.fieldName]
                                    : <NoDataCell />)
                            }
                            col.order = ele.order
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
            if (Editable) {
                column.push(ActionsColoum)
            }
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
            fetchProduct(productBuilderId)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }

    const handleSaveProduct = (row) => {
        let data: any = {}
        data.product = row
        data._id = productBuilderId
        setLoading(true)
        axiosInstance().put(`/productbuilder/updateProduct`, data).then(({ data: { data } }) => {
            setLoading(false)
            setProductData(null)
            fetchProduct(productBuilderId);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }

    const handleDelete = () => {
        let ids = []
        if (deleteRecord) {
            ids.push(deleteRecord._id)
        }
        else {
            ids = selectedProduct;
        }
        let data: any = {}
        data.productBuilderId = productBuilderId
        data._ids = ids
        axiosInstance().post(`/productbuilder/deleteproduct`, data).then(({ data: { data } }) => {
            setLoading(false)
            setShowDeleteConfirmBox(false)
            setDeleteRecord(null)
            setSelectedProduct([])
            setAnchorEl(null)
            fetchProduct(productBuilderId)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const handleOpenAddField = () => {
        const rows: any = product.filter((data) => selectedProduct.includes(data._id))
        let section: any = []
        let fields: any = []
        section = _.uniq(_.map(rows[0].fields, 'sectionName'));
        rows[0].fields.forEach(_field => {
            let fid = { ..._field }
            if (fid.type !== "currencyAmount" && (fid.type === "converter" || fid.isConverter === true)) {
                fid.displayUnits && fid.displayUnits.forEach(_unit => {
                    fields.push({ ...fid, fieldLabel: fid.fieldLabel + " " + _unit, fieldName: fid.fieldName + "_" + _unit.toLowerCase() })
                })
            }
            else if (fid.type === "currencyAmount") {
                fid.displayCurrency && fid.displayCurrency.forEach(_currency => {
                    if (fid.isConverter) {
                        fid.displayUnits && fid.displayUnits.forEach(_unit => {
                            fields.push({ ...fid, fieldLabel: fid.fieldLabel + " " + _unit, fieldName: fid.fieldName + "_" + _currency.toLowerCase() + "_" + _unit.toLowerCase() })
                        })
                    }
                    else {
                        fields.push({ ...fid, fieldLabel: fid.fieldLabel + " " + _currency, fieldName: fid.fieldName + "_" + _currency.toLowerCase() })
                    }
                })
            }
            else {
                fields.push(fid)
            }
        })
        setaddFieldData({ section: section, fields: fields })
        setIsAddField(true)
        setAnchorEl(null);
    }

    const handleCloseAddField = () => {
        setIsAddField(false)
    }

    const handleAddField = (field) => {
        let data: any = {}
        data.productBuilderId = productBuilderId
        data._ids = selectedProduct
        data.field = field
        data.field.leval = "builder-custom"
        axiosInstance().post(`/productbuilder/addField`, data).then(({ data: { data } }) => {
            setLoading(false)
            fetchProduct(productBuilderId)
            setIsAddField(false)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }

    return (<Box p={1} pt={0}>
        <Grid container>
            <Grid item xs={6} className="d-flex align-items-center gap-1">
            </Grid>
            {Editable &&
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
                        <MenuItem onClick={() => setShowDeleteConfirmBox(true)}>Delete</MenuItem>
                        <MenuItem onClick={handleOpenAddField}>Add Field</MenuItem>
                    </Menu>
                </Grid>
            }
        </Grid>
        <Box height={500} mt={1}>
            {columns &&
                <DataGrid
                    checkboxSelection={Editable}
                    components={{
                        NoRowsOverlay: CustomDataGridNoDataFound,
                    }}
                    onSelectionModelChange={(e) => setSelectedProduct(e.selectionModel)}
                    loading={loading}
                    rows={product}
                    disableSelectionOnClick
                    disableMultipleSelection
                    columns={columns}
                    pageSize={25}
                    density="compact"
                />
            }
        </Box>
        {isAddNewProduct && <CreateProduct isClone={false} productId={null} handleClose={() => setIsAddNewProduct(false)}
            isAddInBuilder={true} addProductInBuilder={addProductInBuilder} openFrom="builder"
        />}
        {isAddExistingProduct && <AddExistingProduct addProductInBuilder={addProductInBuilder} handleClose={() => setIsAddExistingProduct(false)} />}
        {productData && <ProductDialog productData={productData} handleSaveProduct={handleSaveProduct} handleClose={() => setProductData(null)} stage={stage} />}
        {isAddField && <AddField refrence="builder" section={addFieldData.section}
            fieldData={null} handleClose={handleCloseAddField} handleAddField={handleAddField} fields={addFieldData.fields} />
        }
        {showDeleteConfirmBox &&
            <ConfirmationDialog
                open={showDeleteConfirmBox}
                message={`Are you sure, you want to delete product ?`}
                onClose={() => setShowDeleteConfirmBox(false)}
                onOk={handleDelete}
            />
        }
    </Box >
    );
}

export default ProductBuilder;
