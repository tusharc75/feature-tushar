import { useState, useEffect, useContext, useReducer } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog'
import axiosInstance from '../../../axios/axiosInstance'
import { dateTimeFormat, getLocalStorageArrayData, gridLoadingTimeout, isObjectEmpty, product, removeLocalStorage } from '../../../constants/helpers';
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import CommonSkeleton from '../../Helpers/CommonSkeleton'
import CustomAgGrid, { reducer, intialState } from "../../AgGridComponents/CustomAgGrid";
import { sortBy } from 'lodash';
import NoDataCell from "../../Helpers/NoDataCell";
import { CustomDialogTransition } from "../../../constants/helpers";
import { Link } from "react-router-dom";
import routes from "../../Helpers/Routes";
import { Box, Chip, IconButton, Menu, MenuItem, Typography } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import TextField from "@material-ui/core/TextField";
import useColumns, { getStaticFields, getFrameworkComponents } from "../../../constants/useColumns"
import { prepareDataForGrid } from "../../../constants/helpers";
import { CommonRenderer, DateTimeRenderer } from "src/components/AgGridComponents/CustomAgGridCellRenderers";
import DeleteButton from "src/components/Helpers/DeleteButton";
import Loader from "src/components/Loader";
import CustomAgGridEditable from "src/components/AgGridComponents/CustomAgGridEditable";
import moment from "moment";



const displayColumns = ["qty", "productName", "productDescription", "unit", "responseDate", "status"]
let levalOrderBy = [
    "product",
    "product-custom",
    "product-template",
    "price-template",
    "product-builder-custom",
    "price-builder-custom",
];
const ProductGridSupplierAskPrice = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { productData, handleAdd, handleReject } = props;
    const renderedFrom = "quoteSupplierPrice" + productData?._id;
    const localStorageSelectedRecords = `${renderedFrom}_selected`;
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search,
        filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

    const [columns, setColumns] = useState(null);
    const [frameWorkComponent, setFrameWorkComponent] = useState(null)

    useEffect(() => {
        fetchProduct()
    }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);

    const fetchProduct = () => {
        dispatch({ type: "loading", loading: true });

        if (gridApi) {
            gridApi.setRowData([]);
        }
        let rows = productData?.products.map((item, index) => {
            let res: any = {
                ...prepareDataForGrid(item),
                totalCost: item.totalCost || item.costPrice,
                supplierContact: item?.supplierContact?.optionLabel ? item?.supplierContact?.optionLabel : "",
                status: productData?.status
            };
            res.hideSelection = item.status !== "Submit" ? true : false
            return res;
        });
        let columns = []
        let rendererNames = [];

        GenrateColoum(productData?.fields, columns, rendererNames, productData?.requiredFields);

        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
        tempFrameworkComponent = {
            commonRenderer: CommonRenderer,
            dateTimeRenderer: DateTimeRenderer,
            ...tempFrameworkComponent,
        }
        setFrameWorkComponent({ ...tempFrameworkComponent })
        columns = sortBy([...columns], function (item: any) {
            return levalOrderBy.indexOf(item.leval)
        });
        setColumns([...columns])

        dispatch({ type: "initialize", data: rows, count: rows.length });
        setTimeout(() => { dispatch({ type: "loading", loading: false }); }, gridLoadingTimeout);
    };

    const GenrateColoum = (fields, column, rendererNames, requiredFields) => {
        let _fields = fields;

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
                            col.show = displayColumns?.includes(ele.fieldName) || requiredFields?.includes(ele.fieldName) ? true : false
                            col.disabled = false
                            col.leval = ele.leval
                            col.cellRenderer = "commonRenderer";
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
                                col.show = displayColumns?.includes(ele.fieldName) || requiredFields?.includes(ele.fieldName) ? true : false
                                col.disabled = false
                                col.leval = ele.leval
                                col.cellRenderer = "commonRenderer";
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
                            col.show = displayColumns?.includes(ele.fieldName) || requiredFields?.includes(ele.fieldName) ? true : false
                            col.disabled = false
                            col.leval = ele.leval
                            col.cellRenderer = "commonRenderer";
                            column.push(col)
                        }
                    })
                }
            }
            else {
                if (column.filter((_c) => _c.field === ele.fieldName && _c.headerName === ele.fieldLabel).length === 0) {
                    let col: any = {}
                    if (ele.type === "decimal" || ele.type === "percent" || ele.type === "singleLine" || ele.type === "multiLine" || ele.type === "multiSelect" || ele.type === "dropDown") {
                        col.field = ele.fieldName
                        col.headerName = ele.fieldLabel
                        col.width = 180
                        col.show = displayColumns?.includes(ele.fieldName) || requiredFields?.includes(ele.fieldName) ? true : false
                        col.disabled = false
                        col.leval = ele.leval
                        col.cellRenderer = "commonRenderer";
                        column.push(col)
                    }

                }
            }
        })
    }

    return (
        <>
                <Box padding={2} style={{ border: "1px solid #D4D6D7", borderRadius: 4 }}>
                    <Grid container >
                        <Grid item xs={12} sm={3} md={3} container justify="flex-start">
                            {productData?.supplierContact?.optionLabel &&
                                <Grid item xs={12} sm={12} md={12}>
                                    <Typography variant="subtitle2">
                                        {`Supplier Contact : ${productData?.supplierContact?.optionLabel}`}
                                    </Typography>
                                </Grid>}
                        </Grid>
                        <Grid item xs={12} sm={3} md={3} container justify="flex-start">
                            {productData?.requestDate &&
                                <Grid item xs={12} sm={12} md={12}>
                                    <Typography variant="subtitle2">
                                        {`Request Date : ${moment(productData?.requestDate)?.format(dateTimeFormat)}`}
                                    </Typography>
                                </Grid>}
                            {productData?.responseDate &&
                                <Grid item xs={12} sm={12} md={12}>
                                    <Typography variant="subtitle2">
                                        {`Response Date : ${moment(productData?.responseDate)?.format(dateTimeFormat)}`}
                                    </Typography>
                                </Grid>}
                        </Grid>
                        {productData?.status === "Submit" && <Grid item xs={12} sm={6} md={6} container justify="flex-end">
                            <Box ml={1} mt={1} >
                                <Button size="small"
                                    color="primary"
                                    onClick={() => { handleAdd(productData?._id) }}
                                    variant="contained"
                                >
                                    Apply</Button>
                            </Box>
                            <Box ml={1} mt={1} >
                                <DeleteButton
                                    id="detailDeleteButton"
                                    text={'Reject'}
                                    onClick={() => { handleReject(productData?._id) }}
                                />
                            </Box>
                        </Grid>}
                    </Grid>
                    <Box marginTop={1} />
                    {columns && frameWorkComponent ?
                        <CustomAgGridEditable
                            columns={columns}
                            dataRows={dataRows}
                            frameworkComponents={frameWorkComponent}
                            setGridApi={setGridApi}
                            dispatch={dispatch}
                            rowCount={rowCount}
                            limit={limit}
                            pageSizes={pageSizes}
                            page={page}
                            allowAction={false}
                            allowSelection={false}
                            loading={loading}
                            renderedFrom={renderedFrom}
                            showOnlyShowFilteredRecordSwitch={false}
                            className={"supplier-price-edit-grid"}
                            onCellValueChanged={() => { }} />
                        : <Loader style={{ minHeight: 300 }} text="Loading..." />}
                </Box>
        </>
    );
}

export default ProductGridSupplierAskPrice;
