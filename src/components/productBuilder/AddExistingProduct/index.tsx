import React, { useRef, useState, useEffect, Fragment, useContext, useCallback } from "react";
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
import { sortBy } from 'lodash';
import moment from "moment";
import NoDataCell from "../../../components/Helpers/NoDataCell";
import { DataGrid, GridOverlay } from "@material-ui/data-grid";
import CustomDataGridNoDataFound from "../../Helpers/DataGridHelpers/CustomDataGridNoDataFound";
import CustomDataGridToolbar from "../../Helpers/DataGridHelpers/CustomDataGridToolbar";
import { getSearchQuery } from '../../../services/util';
import SearchBox from '../../Helpers/SearchBox'
import { CustomDialogTransition } from "../../../constants/helpers";

var levalOrderBy = ["product", "product-custom", "template", "cost", "builder", "builder-custom"]
const ignoreField = ["qty"]

const AddExistingProduct = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { handleClose, addProductInBuilder } = props;
    const [product, setProduct] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState([]);
    const [loading, setLoading] = useState(true);
    const [columns, setColumns] = useState(null);
    const [searchVal, setSearchVal] = useState("");
    const [query, setQuery] = useState({ page: 0, limit: 25 });
    const [rowCount, setRowCount] = useState(0);


    useEffect(() => {
        fetchProduct();
    }, [query, searchVal]);

    const fetchProduct = () => {
        let searchParams = searchVal
            ? { ...query, search: searchVal }
            : { ...query };
        let api = getSearchQuery("/product", searchParams);
        setLoading(true)
        axiosInstance().get(api).then(({ data }) => {
            data.data = data.data?.map((u) => ({
                ...u,
                id: u._id,
            }));
            let column = [{ field: 'id', headerName: 'id', hide: true }]
            data.data.forEach((row) => {
                row.fields.forEach((ele) => {
                    if (ignoreField.includes(ele.fieldName)) {
                    }
                    else if (ele.type === "converter" || ele.type === "currencyAmount" || ele.isConverter === true) {
                        if (ele.type !== "currencyAmount" && (ele.type === "converter" || ele.isConverter === true)) {
                            ele.displayUnits.forEach((_unit) => {
                                let fieldName = ele.fieldName + "_" + _unit.toLowerCase()
                                let fieldLabel = ele.fieldLabel + " " + _unit
                                if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
                                    let col: any = {}
                                    col.field = fieldName
                                    col.headerName = fieldLabel
                                    col.width = 180
                                    col.renderCell = (params) => (params.row[fieldName] ? params.row[fieldName] : <NoDataCell />)
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
                                        col.renderCell = (params) => (params.row[fieldName] ? params.row[fieldName] : <NoDataCell />)
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
                                    col.renderCell = (params) => (params.row[fieldName] ? params.row[fieldName] : <NoDataCell />)
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
                                typeof params.row[ele.fieldName] === 'object' ? params.row[ele.fieldName]["optionLabel"] : params.row[ele.fieldName]
                                : <NoDataCell />)
                            column.push(col)
                        }
                    }
                })
            });
            column = sortBy(column, function (item: any) {
                return levalOrderBy.indexOf(item.leval)
            });
            setColumns(column);
            setProduct(data.data);
            setRowCount(data.count);
            setLoading(false)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const handleAdd = () => {
        let rows = product.filter((data) => selectedProduct.includes(data._id))
        rows.forEach((_d) => {
            _d.productId = _d._id
            _d.qty = 0
            delete _d.id
            delete _d.brand
            delete _d.createdBy
            delete _d.updatedBy
            delete _d.fields
            for (const [key, value] of Object.entries(_d)) {
                if (typeof value === 'object') {
                    _d[key] = value["optionValue"]
                }
            }
        })
        addProductInBuilder(rows)
        handleClose()
    }

    const handleSearch = (e) => {
        if (query.page !== 1) {
            setQuery((prevState) => ({ ...prevState, page: 0 }));
        }
        setSearchVal(e.target.value);
    };

    const onFilterChange = useCallback((params) => {
        if (params.filterModel.items[0].value) {
            setQuery((prevState) => ({
                ...prevState,
                [params.filterModel.items[0].columnField]:
                    params.filterModel.items[0].value,
            }));
        } else {
            setQuery({ page: 0, limit: 25 });
        }
    }, []);

    const handlePage = (params) => {
        if (query.page !== params.page) {
            setQuery((prevState) => ({ ...prevState, page: params.page }));
        }
    };

    const handlePageSize = (params) => {
        if (params.pageSize !== query.limit) {
            setQuery({ page: 0, limit: params.pageSize });
        }
    };

    const handleSortModelChange = (params) => {
        if (params?.sortModel && params.sortModel.length > 0) {
            let temp = { ...params.sortModel[0] };
            setQuery((prevState) => ({
                ...prevState,
                page: 0,
                sortBy: temp.field,
                orderBy: temp.sort,
            }));
        }
    }

    return (<Dialog
        fullScreen={true}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
    >
        <CustomDialogHeader title={"Add Existing Product"} onClose={handleClose} ></CustomDialogHeader>
        <div className="listing-grid p-3">
            <Box mb={2}>
                <Grid container >
                    <Grid item xs={12} sm={6}  >
                    </Grid>
                    <Grid item xs={12} sm={6} container justify="flex-end">
                        <SearchBox
                            onSearch={handleSearch}
                            searchbox="terms_header_search_bar"
                            width="300px"
                            value={searchVal}
                        />
                        <Box ml={1} >
                            <Button size="small" color="primary" onClick={handleAdd} variant="contained" disabled={selectedProduct.length > 0 ? false : true}  >
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
                        Toolbar: CustomDataGridToolbar,
                        NoRowsOverlay: CustomDataGridNoDataFound,
                    }}
                    scrollbarSize={20}
                    loading={loading}
                    onSelectionModelChange={(e) => setSelectedProduct(e.selectionModel)}
                    rows={loading ? [] : product}
                    disableSelectionOnClick
                    disableMultipleSelection
                    columns={columns}
                    pageSize={query.limit}
                    rowCount={rowCount}
                    page={query.page}
                    paginationMode="server"
                    pagination
                    onPageChange={handlePage}
                    onPageSizeChange={handlePageSize}
                    onSortModelChange={handleSortModelChange}
                    density="compact"
                    onFilterModelChange={onFilterChange}
                /> : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
        </div>
    </Dialog>
    );
}

export default AddExistingProduct;
