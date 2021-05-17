import React, { useRef, useState, useEffect, Fragment, useContext } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { Formik, Form, Field } from "formik";
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog'
import axiosInstance from '../../../axios/axiosInstance'
import { getObjKeys, simplifyValues, yupSchema } from '../../../constants/helpers';
import CustomButton from '../../Helpers/CustomButton'
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton'
import IconButton from '@material-ui/core/IconButton';
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import _ from 'lodash';
import moment from "moment";
import NoDataCell from "../../../components/Helpers/NoDataCell";
import { DataGrid, GridOverlay } from "@material-ui/data-grid";
import DataGridCustomToolbar from "../../../components/Helpers/DataGridCustomToolbar";
import CustomDataGridNoDataFound from "../../../components/Helpers/CustomDataGridNoDataFound";


var levalOrderBy = ["product", "product-custom", "template", "cost", "builder", "builder-custom"]

const AddExistingProduct = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { handleClose, addProductInBuilder } = props;
    const [product, setProduct] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState([]);
    const [loading, setLoading] = useState(true);
    const [columns, setColumns] = useState(null);

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
                            col.width = 200
                            col.leval = ele.leval
                            col.renderCell = (params) => (params.row[ele.fieldName] ?
                                typeof params.row[ele.fieldName] === 'object' ? params.row[ele.fieldName][ele.fieldName] : params.row[ele.fieldName]
                                : <NoDataCell />)
                            column.push(col)
                        }
                    }
                })
            });
            column = _.sortBy(column, function (item: any) {
                return levalOrderBy.indexOf(item.leval)
            });
            setColumns(column);
            setProduct(data);
            setLoading(false)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const handleAdd = () => {
        let rows = product.filter((data) => selectedProduct.includes(data._id))
        rows.forEach((_d) => {
            delete _d.id
            delete _d.brand
            delete _d.createdBy
            delete _d.updatedBy
            delete _d.fields
            _d.productId = _d._id
            _d.productCategory = _d.productCategory._id
            _d.productTemplate = _d.productTemplate._id
        })
        addProductInBuilder(rows)
        handleClose()
    }


    return (<Dialog
        aria-labelledby="customized-dialog-title"
        open={true}
        fullScreen
    >
        <CustomDialogHeader title={"Add Existing Product"} onClose={handleClose} ></CustomDialogHeader>
        <div className="listing-grid p-3">
            <Box mb={2}>
                <Grid container >
                    <Grid item xs={12} sm={6}  >
                    </Grid>
                    <Grid item xs={12} sm={6} container justify="flex-end">
                        <Box ml={1} >
                            <Button color="primary" onClick={handleAdd} variant="contained" disabled={selectedProduct.length > 0 ? false : true}  >
                                {selectedProduct.length ? "(" + selectedProduct.length + ")  " : ""}
                                Add</Button>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
            {columns ?
                <DataGrid
                    checkboxSelection
                    components={{
                        Toolbar: DataGridCustomToolbar,
                        NoRowsOverlay: CustomDataGridNoDataFound,
                    }}
                    loading={loading}
                    onSelectionModelChange={(e) => setSelectedProduct(e.selectionModel)}
                    rows={product}
                    disableSelectionOnClick
                    disableMultipleSelection
                    columns={columns}
                    pageSize={25}
                    density="compact"
                /> : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
        </div>
    </Dialog>
    );
}

export default AddExistingProduct;
