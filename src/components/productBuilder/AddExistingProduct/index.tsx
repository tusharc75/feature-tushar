import React, { useRef, useState, useEffect, Fragment, useContext, useCallback, useReducer } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { Formik, Form, Field } from "formik";
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog'
import axiosInstance from '../../../axios/axiosInstance'
import { getObjKeys, gridLoadingTimeout, isObjectEmpty, product, simplifyValues, yupSchema } from '../../../constants/helpers';
import CustomButton from '../../Helpers/CustomButton'
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton'
import CustomAgGrid, { reducer, intialState } from "../../../components/AgGridComponents/CustomAgGrid";
import { sortBy } from 'lodash';
import moment from "moment";
import NoDataCell from "../../../components/Helpers/NoDataCell";
import SearchBox from '../../Helpers/SearchBox'
import { CustomDialogTransition } from "../../../constants/helpers";
import { CommonRenderer } from "../../AgGridComponents/CustomAgGridCellRenderers";

var levalOrderBy = [
    "product",
    "product-custom",
    "product-template",
    "price-template",
    "product-builder-custom",
    "price-builder-custom",
];

const ignoreField = ["qty", "priceTemplate"]

const AddExistingProduct = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { handleClose, addProductInBuilder } = props;
    const [columns, setColumns] = useState(null);
    const [productList, setProductList] = useState([]);
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

    useEffect(() => {
        fetchProduct()
    }, [page, limit, filters, sorting, search]);

    const frameworkComponents = {
        commonRenderer: CommonRenderer,
    };

    const getQueryString = () => {
        let deepFilter = `?page=${page}&limit=${limit}`;

        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];

            Object.keys(filters).forEach(field => {
                updatedFilters.push({
                    field: field,
                    term: filters[field].filter
                })
            });
            deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(updatedFilters)}&filterType=and`
        }

        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`
        }

        if (search) {
            deepFilter = `${deepFilter}&search=${search}`;
        }

        return deepFilter;
    };

    const handleSearch = (e) => {
        dispatch({ type: "search", search: e.target.value });
    };

    const fetchProduct = () => {
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
        }

        const queryString = getQueryString();
        axiosInstance().get(`${product.api}${queryString}`).then(({ data }) => {
            setProductList(data.data);
            data.data = data.data?.map((u, index) => {
                let res = {
                    ...u,
                    id: u._id,
                    srno: index + 1,
                }
                for (let col in res) {
                    if (res[col] && res[col].optionLabel) {
                        res[col] = res[col].optionLabel;
                    }
                }
                return res;
            });
            let column = []
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
                                    let col: any = { }
                                    col.field = fieldName
                                    col.headerName = fieldLabel
                                    col.width = 180
                                    col.show = true
                                    col.cellRenderer = "commonRenderer"
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
                                        let col: any = { }
                                        col.field = fieldName
                                        col.headerName = fieldLabel
                                        col.width = 180
                                        col.show = true
                                        col.cellRenderer = "commonRenderer"
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
                                    let col: any = { }
                                    col.field = fieldName
                                    col.headerName = fieldLabel
                                    col.width = 180
                                    col.show = true
                                    col.cellRenderer = "commonRenderer"
                                    col.leval = ele.leval
                                    column.push(col)
                                }
                            })
                        }
                    }
                    else {
                        if (column.filter((_c) => _c.field === ele.fieldName && _c.headerName === ele.fieldLabel).length === 0) {
                            let col: any = { };
                            col.field = ele.fieldName;
                            col.headerName = ele.fieldLabel;
                            col.width = 180;
                            col.show = true
                            if (ele.fieldName === "entity") {
                                return
                            }
                            col.order = ele.order;
                            col.leval = ele.leval;
                            column.push(col);
                        }
                    }
                })
            });
            column = sortBy(column, function (item: any) {
                return levalOrderBy.indexOf(item.leval)
            });
            setColumns(column);
            dispatch({ type: "initialize", data: data.data, count: data.count });
            setTimeout(() => {
                dispatch({ type: "loading", loading: false });
            }, gridLoadingTimeout);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: "loading", loading: false });
        });
    };

    const handleAdd = () => {
        let rows = productList.filter(
            (val) => selectedRecords.filter((u) => val._id === u._id).length > 0
        );
        rows.forEach((_d) => {
            _d.productId = _d._id
            if (_d.fields) {
                const qtyField = _d.fields.filter((_f) => _f.fieldName === "qty")
                if (qtyField.length) {
                    if (!qtyField[0].isFormula) {
                        _d.qty = 0
                    }
                }
            }
            delete _d.id
            delete _d.brand
            delete _d.createdBy
            delete _d.updatedBy
            delete _d.fields
            for (const [key, value] of Object.entries(_d)) {
                if (typeof value === 'object' && value && value["optionValue"]) {
                    _d[key] = value["optionValue"]
                }
                if (Array.isArray(value) && value.length && value[0].optionValue) {
                    const entity = []
                    value && value.forEach((ele) => {
                        entity.push(ele.optionValue)
                    })
                    _d[key] = entity
                }
            }
        })
        addProductInBuilder(rows)
        handleClose()
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
                    <Grid item xs={12} sm={6}>

                    </Grid>
                    <Grid item xs={12} sm={6} container justify="flex-end">
                        <SearchBox
                            onSearch={handleSearch}
                            searchbox="terms_header_search_bar"
                            width="300px"
                            value={search}
                        />
                        <Box ml={1} mt={1} >
                            <Button size="small" color="primary" onClick={handleAdd} variant="contained" disabled={selectedRecords.length > 0 ? false : true}  >
                                {selectedRecords.length ? "(" + selectedRecords.length + ")  " : ""}
                                Add</Button>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
            {columns ?
                <CustomAgGrid
                    columns={columns}
                    dataRows={dataRows}
                    frameworkComponents={frameworkComponents}
                    setGridApi={setGridApi}
                    dispatch={dispatch}
                    rowCount={rowCount}
                    limit={limit}
                    pageSizes={pageSizes}
                    page={page}
                    allowAction={false}
                    loading={loading}
                />
                : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
        </div>
    </Dialog>
    );
}

export default AddExistingProduct;
